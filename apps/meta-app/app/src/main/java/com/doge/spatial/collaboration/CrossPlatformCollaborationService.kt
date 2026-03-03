// CrossPlatformCollaborationService.kt
// DOGE Spatial Explorer — Cross-Platform Collaboration
//
// Enables real-time collaboration between Meta Quest and Apple Vision Pro
// users through the shared cloud WebSocket backend.
// Handles operation translation between platform-specific formats.

package com.doge.spatial.collaboration

import android.util.Log
import com.doge.spatial.models.*
import com.doge.spatial.network.CloudSyncClient
import com.doge.spatial.services.MetaSceneManager
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.serialization.*
import kotlinx.serialization.json.Json

/**
 * Manages cross-platform collaboration between Meta Quest and
 * Apple Vision Pro users.
 *
 * The service translates between platform-specific coordinate systems
 * and operation formats to ensure seamless collaboration.
 */
class CrossPlatformCollaborationService(
    private val cloudSync: CloudSyncClient,
    private val sceneManager: MetaSceneManager
) {
    companion object {
        private const val TAG = "CrossPlatformCollab"
    }

    // ── State ───────────────────────────────────────────────────────────

    private val _participants = MutableStateFlow<List<RemoteParticipant>>(emptyList())
    val participants: StateFlow<List<RemoteParticipant>> = _participants.asStateFlow()

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Starts listening for remote collaboration operations.
     */
    fun startListening(onOperation: (SyncOperation) -> Unit) {
        scope.launch {
            cloudSync.incomingOperations.collect { operation ->
                withContext(Dispatchers.Main) {
                    // Translate coordinate system if needed
                    val translated = translateOperation(operation)
                    onOperation(translated)
                }
            }
        }

        // Listen for participant updates
        scope.launch {
            cloudSync.participantUpdates.collect { update ->
                handleParticipantUpdate(update)
            }
        }

        _connectionStatus.value = ConnectionStatus.CONNECTED
        Log.i(TAG, "Cross-platform collaboration listening started")
    }

    /**
     * Broadcasts a local operation to all remote participants.
     */
    suspend fun broadcastOperation(operation: SyncOperation) {
        // Add platform metadata
        val enriched = operation.copy(
            metadata = OperationMetadata(
                platform = "meta_horizon",
                deviceModel = "Quest 3",
                sdkVersion = "0.7.0",
                coordinateSystem = "right_handed_y_up"
            )
        )
        cloudSync.sendOperation(enriched)
    }

    /**
     * Sends a cursor position update to remote participants.
     */
    suspend fun sendCursorUpdate(position: Vector3, rotation: Quaternion) {
        val operation = SyncOperation(
            type = SyncOperationType.CURSOR_UPDATE,
            documentId = sceneManager.activeDocumentId,
            payload = json.encodeToString(CursorPayload.serializer(), CursorPayload(
                userId = sceneManager.localUserId,
                position = listOf(position.x, position.y, position.z),
                rotation = listOf(rotation.x, rotation.y, rotation.z, rotation.w),
                selectedNodeIds = sceneManager.selectedNodeIds.toList()
            ))
        )
        broadcastOperation(operation)
    }

    /**
     * Updates a remote collaborator's cursor visualization.
     */
    fun updateRemoteCursor(operation: SyncOperation) {
        try {
            val payload = json.decodeFromString(CursorPayload.serializer(), operation.payload)
            val participant = _participants.value.find { it.userId == payload.userId }
            if (participant != null) {
                val updated = participant.copy(
                    cursorPosition = Vector3(payload.position[0], payload.position[1], payload.position[2]),
                    selectedNodeIds = payload.selectedNodeIds.toSet(),
                    lastActiveAt = System.currentTimeMillis()
                )
                _participants.value = _participants.value.map {
                    if (it.userId == payload.userId) updated else it
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update remote cursor: ${e.message}")
        }
    }

    fun disconnect() {
        scope.cancel()
        _connectionStatus.value = ConnectionStatus.DISCONNECTED
    }

    // ── Private ─────────────────────────────────────────────────────────

    /**
     * Translates operations between platform coordinate systems.
     *
     * Apple visionOS uses a right-handed coordinate system with Y-up.
     * Meta Horizon OS also uses right-handed Y-up, so translation is
     * primarily about scale normalization and unit conversion.
     */
    private fun translateOperation(operation: SyncOperation): SyncOperation {
        val metadata = operation.metadata ?: return operation

        return when (metadata.coordinateSystem) {
            "right_handed_y_up" -> {
                // Same coordinate system — no translation needed
                operation
            }
            "left_handed_y_up" -> {
                // Mirror Z axis for left-handed systems (e.g., Unity)
                translateLeftToRightHanded(operation)
            }
            else -> operation
        }
    }

    private fun translateLeftToRightHanded(operation: SyncOperation): SyncOperation {
        // In a left-to-right handed conversion, we negate the Z component
        // of positions and adjust rotation accordingly.
        return operation // Simplified — full implementation would transform payload
    }

    private fun handleParticipantUpdate(update: ParticipantUpdate) {
        when (update.action) {
            "joined" -> {
                val participant = RemoteParticipant(
                    userId = update.userId,
                    displayName = update.displayName,
                    platform = update.platform,
                    avatarColor = update.avatarColor,
                    isOnline = true,
                    lastActiveAt = System.currentTimeMillis()
                )
                _participants.value = _participants.value + participant
                Log.i(TAG, "${update.displayName} joined from ${update.platform}")
            }
            "left" -> {
                _participants.value = _participants.value.filter { it.userId != update.userId }
                Log.i(TAG, "${update.displayName} left")
            }
            "updated" -> {
                _participants.value = _participants.value.map {
                    if (it.userId == update.userId) it.copy(
                        displayName = update.displayName,
                        isOnline = true,
                        lastActiveAt = System.currentTimeMillis()
                    ) else it
                }
            }
        }
    }
}

// MARK: - Data Types

@Serializable
data class RemoteParticipant(
    val userId: String,
    val displayName: String,
    val platform: String, // "visionos", "meta_horizon", "web"
    val avatarColor: String = "#4A90D9",
    val isOnline: Boolean = true,
    val lastActiveAt: Long = 0,
    val cursorPosition: Vector3? = null,
    val selectedNodeIds: Set<String> = emptySet()
)

@Serializable
data class CursorPayload(
    val userId: String,
    val position: List<Float>,
    val rotation: List<Float>,
    val selectedNodeIds: List<String> = emptyList()
)

@Serializable
data class ParticipantUpdate(
    val action: String, // "joined", "left", "updated"
    val userId: String,
    val displayName: String,
    val platform: String,
    val avatarColor: String = "#4A90D9"
)

@Serializable
data class OperationMetadata(
    val platform: String,
    val deviceModel: String,
    val sdkVersion: String,
    val coordinateSystem: String
)

enum class ConnectionStatus {
    DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING, ERROR
}

// Placeholder types for Meta Spatial SDK vectors
@Serializable
data class Vector3(val x: Float = 0f, val y: Float = 0f, val z: Float = 0f) {
    operator fun times(scalar: Float) = Vector3(x * scalar, y * scalar, z * scalar)
}

@Serializable
data class Quaternion(val x: Float = 0f, val y: Float = 0f, val z: Float = 0f, val w: Float = 1f)

@Serializable
data class Color(val r: Float, val g: Float, val b: Float, val a: Float = 1f) {
    companion object {
        val RED = Color(1f, 0f, 0f)
        val GREEN = Color(0f, 1f, 0f)
        val BLUE = Color(0f, 0f, 1f)
        val WHITE = Color(1f, 1f, 1f)
    }
}
