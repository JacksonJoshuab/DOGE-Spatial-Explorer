// CloudSyncService.swift
// DOGE Spatial Explorer — Cloud Synchronization Service
//
// Manages WebSocket connections to the cloud backend for
// real-time scene synchronization across all platforms.
// Supports offline-first with conflict resolution.

import Foundation
import Observation
import Combine

// MARK: - Cloud Sync Service

/// Handles real-time synchronization between the local scene graph
/// and the cloud backend via WebSocket and REST APIs.
@Observable
final class CloudSyncService {

    // MARK: - Configuration

    struct Config {
        var baseURL: URL
        var wsURL: URL
        var authToken: String
        var reconnectInterval: TimeInterval = 5.0
        var maxReconnectAttempts: Int = 10
        var syncBatchSize: Int = 50
    }

    // MARK: - State

    var connectionState: ConnectionState = .disconnected
    var lastSyncTimestamp: Date?
    var pendingOperationsCount: Int = 0
    var latencyMs: Double = 0

    // MARK: - Private

    private var config: Config?
    private var webSocketTask: URLSessionWebSocketTask?
    private var reconnectAttempts = 0
    private var pendingOperations: [SyncOperation] = []
    private var heartbeatTimer: Timer?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // MARK: - Connection

    /// Connects to the cloud backend.
    func connect(config: Config) async throws {
        self.config = config
        connectionState = .connecting

        let session = URLSession(configuration: .default)
        var request = URLRequest(url: config.wsURL)
        request.setValue("Bearer \(config.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("doge-spatial-v1", forHTTPHeaderField: "Sec-WebSocket-Protocol")

        webSocketTask = session.webSocketTask(with: request)
        webSocketTask?.resume()

        connectionState = .connected
        reconnectAttempts = 0

        // Start receiving messages
        Task { await receiveMessages() }

        // Start heartbeat
        startHeartbeat()

        // Flush any pending operations
        await flushPendingOperations()
    }

    /// Disconnects from the cloud backend.
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        connectionState = .disconnected
    }

    // MARK: - Sending

    /// Sends a sync operation to the cloud backend.
    func send(_ operation: SyncOperation) async throws {
        guard connectionState == .connected, let ws = webSocketTask else {
            // Queue for later
            pendingOperations.append(operation)
            pendingOperationsCount = pendingOperations.count
            return
        }

        let data = try encoder.encode(operation)
        let message = URLSessionWebSocketTask.Message.data(data)
        try await ws.send(message)
    }

    /// Sends a batch of operations.
    func sendBatch(_ operations: [SyncOperation]) async throws {
        let batch = SyncBatch(operations: operations, timestamp: Date())
        let data = try encoder.encode(batch)
        let message = URLSessionWebSocketTask.Message.data(data)
        try await webSocketTask?.send(message)
    }

    // MARK: - REST API

    /// Fetches the full document state from the server.
    func fetchDocument(id: UUID) async throws -> SpatialDocument {
        guard let config = config else {
            throw SyncError.notConfigured
        }

        let url = config.baseURL
            .appendingPathComponent("api")
            .appendingPathComponent("documents")
            .appendingPathComponent(id.uuidString)

        var request = URLRequest(url: url)
        request.setValue("Bearer \(config.authToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw SyncError.serverError
        }

        return try decoder.decode(SpatialDocument.self, from: data)
    }

    /// Uploads an asset to the cloud storage.
    func uploadAsset(data: Data, fileName: String, mimeType: String) async throws -> URL {
        guard let config = config else {
            throw SyncError.notConfigured
        }

        let url = config.baseURL
            .appendingPathComponent("api")
            .appendingPathComponent("assets")
            .appendingPathComponent("upload")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(config.authToken)", forHTTPHeaderField: "Authorization")
        request.setValue(mimeType, forHTTPHeaderField: "Content-Type")
        request.setValue(fileName, forHTTPHeaderField: "X-File-Name")
        request.httpBody = data

        let (responseData, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw SyncError.uploadFailed
        }

        let result = try decoder.decode(UploadResponse.self, from: responseData)
        return URL(string: result.url)!
    }

    /// Lists available documents for the authenticated user.
    func listDocuments() async throws -> [DocumentSummary] {
        guard let config = config else {
            throw SyncError.notConfigured
        }

        let url = config.baseURL
            .appendingPathComponent("api")
            .appendingPathComponent("documents")

        var request = URLRequest(url: url)
        request.setValue("Bearer \(config.authToken)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try decoder.decode([DocumentSummary].self, from: data)
    }

    // MARK: - Private

    private func receiveMessages() async {
        guard let ws = webSocketTask else { return }

        do {
            while connectionState == .connected {
                let message = try await ws.receive()
                switch message {
                case .data(let data):
                    handleIncomingData(data)
                case .string(let text):
                    if let data = text.data(using: .utf8) {
                        handleIncomingData(data)
                    }
                @unknown default:
                    break
                }
            }
        } catch {
            connectionState = .disconnected
            attemptReconnect()
        }
    }

    private func handleIncomingData(_ data: Data) {
        do {
            let operation = try decoder.decode(SyncOperation.self, from: data)
            // Post notification for the scene graph manager to handle
            NotificationCenter.default.post(
                name: .cloudSyncOperationReceived,
                object: nil,
                userInfo: ["operation": operation]
            )
            lastSyncTimestamp = Date()
        } catch {
            print("[CloudSync] Failed to decode incoming message: \(error)")
        }
    }

    private func startHeartbeat() {
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task { [weak self] in
                guard let self = self else { return }
                let ping = SyncOperation(
                    type: .heartbeat,
                    documentID: UUID(),
                    payload: Data()
                )
                try? await self.send(ping)
            }
        }
    }

    private func attemptReconnect() {
        guard let config = config,
              reconnectAttempts < config.maxReconnectAttempts else {
            connectionState = .failed
            return
        }

        connectionState = .reconnecting
        reconnectAttempts += 1

        Task {
            try await Task.sleep(for: .seconds(config.reconnectInterval))
            try await connect(config: config)
        }
    }

    private func flushPendingOperations() async {
        guard !pendingOperations.isEmpty else { return }

        let batch = pendingOperations
        pendingOperations.removeAll()
        pendingOperationsCount = 0

        try? await sendBatch(batch.map { $0 })
    }
}

// MARK: - Supporting Types

enum ConnectionState: String {
    case disconnected, connecting, connected, reconnecting, failed
}

struct SyncOperation: Codable {
    let id: UUID
    let type: SyncOperationType
    let documentID: UUID
    let timestamp: Date
    let payload: Data

    init(type: SyncOperationType, documentID: UUID, payload: Data) {
        self.id = UUID()
        self.type = type
        self.documentID = documentID
        self.timestamp = Date()
        self.payload = payload
    }
}

enum SyncOperationType: String, Codable {
    case nodeAdded
    case nodeRemoved
    case nodeTransformed
    case nodePropertyChanged
    case documentSaved
    case documentMetadataChanged
    case cursorUpdate
    case heartbeat
    case fullSync
}

struct SyncBatch: Codable {
    let operations: [SyncOperation]
    let timestamp: Date
}

struct UploadResponse: Codable {
    let url: String
    let fileSize: Int64
    let checksum: String
}

struct DocumentSummary: Codable, Identifiable {
    let id: UUID
    let name: String
    let modifiedAt: Date
    let collaboratorCount: Int
    let privacyLevel: String
}

enum SyncError: Error, LocalizedError {
    case notConfigured
    case serverError
    case uploadFailed
    case connectionLost

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Cloud sync is not configured."
        case .serverError: return "Server returned an error."
        case .uploadFailed: return "Asset upload failed."
        case .connectionLost: return "Connection to the cloud was lost."
        }
    }
}

extension Notification.Name {
    static let cloudSyncOperationReceived = Notification.Name("cloudSyncOperationReceived")
}
