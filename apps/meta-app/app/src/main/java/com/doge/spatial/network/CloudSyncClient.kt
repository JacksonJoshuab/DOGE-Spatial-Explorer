// CloudSyncClient.kt
// DOGE Spatial Explorer — Cloud Sync Client for Meta Quest
//
// WebSocket and REST client for real-time synchronization
// with the cloud backend. Supports offline-first with
// operation queuing and automatic reconnection.

package com.doge.spatial.network

import android.util.Log
import com.doge.spatial.models.*
import com.doge.spatial.collaboration.ParticipantUpdate
import io.ktor.client.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString

class CloudSyncClient(
    private val baseUrl: String,
    private val wsUrl: String
) {
    companion object {
        private const val TAG = "CloudSyncClient"
        private const val MAX_RECONNECT_ATTEMPTS = 10
        private const val RECONNECT_DELAY_MS = 5000L
    }

    // ── State ───────────────────────────────────────────────────────────

    private val _incomingOperations = MutableSharedFlow<SyncOperation>(replay = 0)
    val incomingOperations: SharedFlow<SyncOperation> = _incomingOperations.asSharedFlow()

    private val _participantUpdates = MutableSharedFlow<ParticipantUpdate>(replay = 0)
    val participantUpdates: SharedFlow<ParticipantUpdate> = _participantUpdates.asSharedFlow()

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    // ── Private ─────────────────────────────────────────────────────────

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val httpClient = HttpClient(Android) {
        install(ContentNegotiation) {
            json(json)
        }
        install(WebSockets)
    }

    private var webSocketSession: WebSocketSession? = null
    private var authToken: String = ""
    private var documentId: String = ""
    private var reconnectAttempts = 0
    private val pendingOperations = Channel<SyncOperation>(Channel.BUFFERED)
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // ── Connection ──────────────────────────────────────────────────────

    suspend fun connect(authToken: String, documentId: String) {
        this.authToken = authToken
        this.documentId = documentId
        _connectionState.value = ConnectionState.CONNECTING

        try {
            webSocketSession = httpClient.webSocketSession(
                urlString = "$wsUrl/collab/$documentId"
            ) {
                header(HttpHeaders.Authorization, "Bearer $authToken")
                header("Sec-WebSocket-Protocol", "doge-spatial-v1")
            }

            _connectionState.value = ConnectionState.CONNECTED
            reconnectAttempts = 0
            Log.i(TAG, "WebSocket connected to $wsUrl/collab/$documentId")

            // Start receiving messages
            scope.launch { receiveMessages() }

            // Start sending pending operations
            scope.launch { flushPendingOperations() }

            // Start heartbeat
            scope.launch { heartbeat() }

        } catch (e: Exception) {
            Log.e(TAG, "WebSocket connection failed: ${e.message}")
            _connectionState.value = ConnectionState.ERROR
            attemptReconnect()
        }
    }

    fun disconnect() {
        scope.cancel()
        scope.launch {
            webSocketSession?.close(CloseReason(CloseReason.Codes.GOING_AWAY, "User disconnected"))
        }
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    // ── Sending ─────────────────────────────────────────────────────────

    suspend fun sendOperation(operation: SyncOperation) {
        if (_connectionState.value == ConnectionState.CONNECTED) {
            try {
                val message = json.encodeToString(operation)
                webSocketSession?.send(Frame.Text(message))
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send operation: ${e.message}")
                pendingOperations.send(operation)
            }
        } else {
            pendingOperations.send(operation)
        }
    }

    // ── REST API ────────────────────────────────────────────────────────

    suspend fun fetchDocument(id: String): String {
        val response = httpClient.get("$baseUrl/api/documents/$id") {
            header(HttpHeaders.Authorization, "Bearer $authToken")
        }
        return response.bodyAsText()
    }

    suspend fun listDocuments(): List<DocumentSummary> {
        val response = httpClient.get("$baseUrl/api/documents") {
            header(HttpHeaders.Authorization, "Bearer $authToken")
        }
        return json.decodeFromString(response.bodyAsText())
    }

    suspend fun uploadAsset(data: ByteArray, fileName: String, mimeType: String): String {
        val response = httpClient.post("$baseUrl/api/assets/upload") {
            header(HttpHeaders.Authorization, "Bearer $authToken")
            header("X-File-Name", fileName)
            contentType(ContentType.parse(mimeType))
            setBody(data)
        }
        return response.bodyAsText()
    }

    // ── Private ─────────────────────────────────────────────────────────

    private suspend fun receiveMessages() {
        try {
            webSocketSession?.incoming?.consumeAsFlow()?.collect { frame ->
                when (frame) {
                    is Frame.Text -> {
                        val text = frame.readText()
                        handleIncomingMessage(text)
                    }
                    is Frame.Binary -> {
                        // Handle binary messages (e.g., asset data)
                    }
                    else -> {}
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "WebSocket receive error: ${e.message}")
            _connectionState.value = ConnectionState.DISCONNECTED
            attemptReconnect()
        }
    }

    private fun handleIncomingMessage(text: String) {
        try {
            // Try to parse as a sync operation
            val operation = json.decodeFromString<SyncOperation>(text)
            scope.launch {
                _incomingOperations.emit(operation)
            }
        } catch (e: Exception) {
            // Try to parse as a participant update
            try {
                val update = json.decodeFromString<ParticipantUpdate>(text)
                scope.launch {
                    _participantUpdates.emit(update)
                }
            } catch (e2: Exception) {
                Log.w(TAG, "Failed to parse incoming message: ${e2.message}")
            }
        }
    }

    private suspend fun flushPendingOperations() {
        for (operation in pendingOperations) {
            if (_connectionState.value == ConnectionState.CONNECTED) {
                try {
                    val message = json.encodeToString(operation)
                    webSocketSession?.send(Frame.Text(message))
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to flush pending operation: ${e.message}")
                    pendingOperations.send(operation) // Re-queue
                    break
                }
            }
        }
    }

    private suspend fun heartbeat() {
        while (_connectionState.value == ConnectionState.CONNECTED) {
            delay(30_000)
            try {
                val ping = SyncOperation(
                    type = SyncOperationType.HEARTBEAT,
                    documentId = documentId
                )
                val message = json.encodeToString(ping)
                webSocketSession?.send(Frame.Text(message))
            } catch (e: Exception) {
                Log.w(TAG, "Heartbeat failed: ${e.message}")
            }
        }
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            _connectionState.value = ConnectionState.ERROR
            Log.e(TAG, "Max reconnect attempts reached")
            return
        }

        _connectionState.value = ConnectionState.RECONNECTING
        reconnectAttempts++

        scope.launch {
            delay(RECONNECT_DELAY_MS * reconnectAttempts)
            connect(authToken, documentId)
        }
    }
}

enum class ConnectionState {
    DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING, ERROR
}
