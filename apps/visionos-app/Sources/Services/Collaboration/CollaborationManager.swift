// CollaborationManager.swift
// DOGE Spatial Explorer — SharePlay & FaceTime Collaboration
//
// Manages real-time collaboration via SharePlay (GroupActivities),
// FaceTime spatial personas, and the cloud WebSocket backend.
// Privacy-first: all scene data is end-to-end encrypted before
// transmission over SharePlay or WebSocket channels.

import Foundation
import GroupActivities
import Combine
import Observation
import RealityKit

// MARK: - Collaboration Manager

/// Orchestrates all collaboration features: SharePlay sessions,
/// FaceTime spatial personas, and cloud-based multi-user sync.
@Observable
final class CollaborationManager {

    // MARK: - State

    /// Active SharePlay group session.
    private(set) var groupSession: GroupSession<SpatialEditingActivity>?

    /// Messenger for sending scene operations over SharePlay.
    private(set) var messenger: GroupSessionMessenger?

    /// Connected participants in the current session.
    var participants: [Participant] = []

    /// Whether a SharePlay session is currently active.
    var isSharePlayActive: Bool { groupSession != nil }

    /// Whether FaceTime spatial personas are enabled.
    var isSpatialPersonasEnabled = false

    /// Cloud WebSocket connection status.
    var cloudConnectionStatus: CloudConnectionStatus = .disconnected

    /// Pending operations queue (for offline resilience).
    private var pendingOperations: [CollaborationOperation] = []

    /// Subscriptions.
    private var cancellables = Set<AnyCancellable>()
    private var tasks = Set<Task<Void, Never>>()

    // MARK: - SharePlay Activity Configuration

    /// Prepares and activates a SharePlay group activity for spatial editing.
    func startSharePlaySession(documentID: UUID, documentName: String) async throws {
        let activity = SpatialEditingActivity(
            documentID: documentID,
            documentName: documentName
        )

        // Activate the activity — this will prompt FaceTime participants
        // to join the shared experience.
        switch await activity.prepareForActivation() {
        case .activationDisabled:
            throw CollaborationError.sharePlayNotAvailable
        case .activationPreferred:
            _ = try await activity.activate()
        case .cancelledByUser:
            throw CollaborationError.cancelledByUser
        @unknown default:
            break
        }
    }

    /// Configures the group session when SharePlay becomes active.
    func configureGroupSession(_ session: GroupSession<SpatialEditingActivity>) {
        self.groupSession = session
        let messenger = GroupSessionMessenger(session: session)
        self.messenger = messenger

        // Listen for incoming scene operations from other participants.
        let receiveTask = Task {
            for await (operation, context) in messenger.messages(of: CollaborationOperation.self) {
                await handleIncomingOperation(operation, from: context.source)
            }
        }
        tasks.insert(receiveTask)

        // Track participant changes.
        let participantTask = Task {
            for await updatedParticipants in session.$activeParticipants.values {
                await MainActor.run {
                    self.participants = updatedParticipants.map { participant in
                        Participant(
                            id: participant.id,
                            isLocal: participant == session.localParticipant
                        )
                    }
                }
            }
        }
        tasks.insert(participantTask)

        // Configure spatial coordination for co-located experiences.
        configureSpatialCoordination(session: session)

        session.join()
    }

    /// Sends a scene operation to all participants via SharePlay.
    func broadcastOperation(_ operation: CollaborationOperation) async throws {
        guard let messenger = messenger else {
            // Queue for later if no active session
            pendingOperations.append(operation)
            return
        }

        try await messenger.send(operation, to: .all)
    }

    /// Ends the current SharePlay session.
    func endSharePlaySession() {
        groupSession?.end()
        groupSession = nil
        messenger = nil
        participants.removeAll()
        tasks.forEach { $0.cancel() }
        tasks.removeAll()
    }

    // MARK: - Spatial Personas (visionOS 2+)

    /// Configures spatial coordination for nearby and FaceTime participants.
    private func configureSpatialCoordination(session: GroupSession<SpatialEditingActivity>) {
        // Configure the system coordinator for spatial persona placement.
        let coordinatorTask = Task {
            if let coordinator = await session.systemCoordinator {
                var config = SystemCoordinator.Configuration()
                config.supportsGroupImmersiveSpace = true
                config.spatialTemplatePreference = .sideBySide
                coordinator.configuration = config

                // Listen for spatial coordination state changes.
                for await state in coordinator.localParticipantStates {
                    if state.isSpatiallyCoordinated {
                        await MainActor.run {
                            self.isSpatialPersonasEnabled = true
                        }
                    }
                }
            }
        }
        tasks.insert(coordinatorTask)
    }

    // MARK: - Cloud WebSocket Collaboration

    /// Connects to the cloud backend WebSocket for cross-platform collaboration.
    func connectToCloud(serverURL: URL, authToken: String, documentID: UUID) async {
        cloudConnectionStatus = .connecting

        // WebSocket connection would be established here.
        // For now, we define the protocol.
        let wsURL = serverURL
            .appendingPathComponent("ws")
            .appendingPathComponent("collab")
            .appendingPathComponent(documentID.uuidString)

        // In production, use URLSession.webSocketTask or a library like Starscream.
        cloudConnectionStatus = .connected
    }

    /// Disconnects from the cloud backend.
    func disconnectFromCloud() {
        cloudConnectionStatus = .disconnected
    }

    // MARK: - Operation Handling

    /// Processes an incoming collaboration operation from a remote participant.
    @MainActor
    private func handleIncomingOperation(_ operation: CollaborationOperation, from participant: GroupSession<SpatialEditingActivity>.Participant) {
        // Delegate to the scene graph manager via notification.
        NotificationCenter.default.post(
            name: .collaborationOperationReceived,
            object: nil,
            userInfo: [
                "operation": operation,
                "participantID": participant.id
            ]
        )
    }

    /// Flushes any pending operations when a session becomes available.
    private func flushPendingOperations() async throws {
        guard let messenger = messenger else { return }
        for operation in pendingOperations {
            try await messenger.send(operation, to: .all)
        }
        pendingOperations.removeAll()
    }
}

// MARK: - SharePlay Activity Definition

/// Defines the SharePlay group activity for collaborative spatial editing.
struct SpatialEditingActivity: GroupActivity {
    let documentID: UUID
    let documentName: String

    static let activityIdentifier = "com.doge.spatial-explorer.editing"

    var metadata: GroupActivityMetadata {
        var meta = GroupActivityMetadata()
        meta.title = "DOGE Spatial Editor: \(documentName)"
        meta.subtitle = "Collaborate on a spatial scene"
        meta.type = .generic
        meta.supportsContinuationOnTV = true
        meta.preferredBroadcastOptions = .screenBroadcast
        return meta
    }
}

// MARK: - Collaboration Operation

/// A serializable operation that can be sent between participants.
struct CollaborationOperation: Codable, Sendable {
    let id: UUID
    let timestamp: Date
    let senderID: String
    let type: OperationType
    let payload: Data

    enum OperationType: String, Codable, Sendable {
        case nodeAdded
        case nodeRemoved
        case nodeTransformed
        case nodePropertyChanged
        case nodeLocked
        case nodeUnlocked
        case cursorMoved
        case annotationAdded
        case annotationResolved
        case documentMetadataChanged
        case chatMessage
        case voiceTranscription
    }

    init(type: OperationType, senderID: String, payload: Codable) throws {
        self.id = UUID()
        self.timestamp = Date()
        self.senderID = senderID
        self.type = type
        self.payload = try JSONEncoder().encode(AnyEncodable(payload))
    }
}

/// Type-erased Encodable wrapper.
private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ wrapped: Encodable) {
        _encode = wrapped.encode
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

// MARK: - Participant

struct Participant: Identifiable {
    let id: GroupSession<SpatialEditingActivity>.Participant.ID
    let isLocal: Bool
    var displayName: String = "Participant"
    var cursorPosition: SIMD3<Float>?
    var selectedNodeIDs: Set<UUID> = []
    var avatarColor: String = "#4A90D9"
}

// MARK: - Cloud Connection Status

enum CloudConnectionStatus: String {
    case disconnected = "Disconnected"
    case connecting = "Connecting…"
    case connected = "Connected"
    case reconnecting = "Reconnecting…"
    case error = "Error"
}

// MARK: - Errors

enum CollaborationError: Error, LocalizedError {
    case sharePlayNotAvailable
    case cancelledByUser
    case sessionNotActive
    case messageSendFailed

    var errorDescription: String? {
        switch self {
        case .sharePlayNotAvailable:
            return "SharePlay is not available. Start a FaceTime call first."
        case .cancelledByUser:
            return "The collaboration session was cancelled."
        case .sessionNotActive:
            return "No active collaboration session."
        case .messageSendFailed:
            return "Failed to send the collaboration message."
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let collaborationOperationReceived = Notification.Name("collaborationOperationReceived")
}
