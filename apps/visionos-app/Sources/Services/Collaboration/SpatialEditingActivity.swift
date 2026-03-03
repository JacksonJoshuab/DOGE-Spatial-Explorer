// SpatialEditingActivity.swift
// DOGE Spatial Editor — visionOS
// SharePlay Group Activity for collaborative spatial editing

import GroupActivities
import Foundation
import Combine

// MARK: - Spatial Editing Group Activity

struct SpatialEditingActivity: GroupActivity {
    
    // Activity metadata
    static let activityIdentifier = "com.doge.spatial-editor.collaborative-editing"
    
    var metadata: GroupActivityMetadata {
        var meta = GroupActivityMetadata()
        meta.title = NSLocalizedString("Spatial Editing Session", comment: "")
        meta.subtitle = NSLocalizedString("Collaborate on 3D scenes in real-time", comment: "")
        meta.type = .generic
        meta.previewImage = nil // Set to app icon in production
        meta.supportsContinuationOnTV = true
        return meta
    }
    
    // Session configuration
    let documentId: String
    let documentName: String
    let privacyLevel: String
    let hostId: String
}

// MARK: - Editing Operation Message

struct EditingOperation: Codable, Sendable {
    let id: String
    let type: OperationType
    let nodeId: String
    let authorId: String
    let authorName: String
    let timestamp: TimeInterval
    let payload: OperationPayload
    
    enum OperationType: String, Codable {
        case transformUpdate
        case materialUpdate
        case nodeCreate
        case nodeDelete
        case nodeReparent
        case visibilityToggle
        case lockToggle
        case annotationAdd
        case annotationRemove
        case privacyZoneCreate
        case privacyZoneUpdate
        case cursorUpdate
        case selectionUpdate
        case undoRedo
    }
    
    struct OperationPayload: Codable {
        // Transform
        var position: [Float]?
        var rotation: [Float]?
        var scale: [Float]?
        
        // Material
        var color: String?
        var roughness: Float?
        var metallic: Float?
        var textureUrl: String?
        
        // Node creation
        var nodeType: String?
        var nodeName: String?
        var parentId: String?
        var meshData: Data?
        
        // Annotation
        var annotationText: String?
        var annotationPosition: [Float]?
        
        // Privacy zone
        var privacyZoneId: String?
        var privacyZoneRadius: Float?
        var privacyZoneAllowedUsers: [String]?
        
        // Cursor / selection
        var cursorPosition: [Float]?
        var selectedNodeIds: [String]?
        
        // General
        var boolValue: Bool?
        var stringValue: String?
    }
}

// MARK: - Participant State Message

struct ParticipantState: Codable, Sendable {
    let participantId: String
    let name: String
    let platform: String
    let role: String
    let color: String
    let cursorPosition: [Float]?
    let selectedNodeId: String?
    let editingNodeId: String?
    let isMuted: Bool
    let isVideoOn: Bool
    let isSpatialAudioOn: Bool
    let isHandRaised: Bool
    let timestamp: TimeInterval
}

// MARK: - SharePlay Session Manager

@MainActor
class SharePlaySessionManager: ObservableObject {
    
    // MARK: - Published State
    
    @Published var isSessionActive = false
    @Published var participants: [ParticipantState] = []
    @Published var pendingOperations: [EditingOperation] = []
    @Published var operationCount: Int = 0
    
    // MARK: - Private Properties
    
    private var groupSession: GroupSession<SpatialEditingActivity>?
    private var messenger: GroupSessionMessenger?
    private var journal: GroupSessionJournal?
    private var cancellables = Set<AnyCancellable>()
    private var tasks = Set<Task<Void, Never>>()
    
    // MARK: - Start Activity
    
    func startActivity(documentId: String, documentName: String, privacyLevel: String) async {
        let activity = SpatialEditingActivity(
            documentId: documentId,
            documentName: documentName,
            privacyLevel: privacyLevel,
            hostId: UUID().uuidString
        )
        
        // Request activation
        switch await activity.prepareForActivation() {
        case .activationDisabled:
            // SharePlay not available, fall back to cloud sync
            break
        case .activationPreferred:
            do {
                _ = try await activity.activate()
            } catch {
                print("Failed to activate SharePlay: \(error)")
            }
        case .cancelled:
            break
        @unknown default:
            break
        }
    }
    
    // MARK: - Configure Session
    
    func configureSession(_ session: GroupSession<SpatialEditingActivity>) {
        self.groupSession = session
        
        let messenger = GroupSessionMessenger(session: session)
        self.messenger = messenger
        
        // Listen for incoming editing operations
        let operationTask = Task {
            for await (operation, _) in messenger.messages(of: EditingOperation.self) {
                await handleIncomingOperation(operation)
            }
        }
        tasks.insert(operationTask)
        
        // Listen for participant state updates
        let stateTask = Task {
            for await (state, _) in messenger.messages(of: ParticipantState.self) {
                await handleParticipantState(state)
            }
        }
        tasks.insert(stateTask)
        
        // Monitor session state
        session.$state
            .sink { [weak self] state in
                switch state {
                case .joined:
                    self?.isSessionActive = true
                case .invalidated:
                    self?.isSessionActive = false
                    self?.cleanup()
                default:
                    break
                }
            }
            .store(in: &cancellables)
        
        // Monitor active participants
        session.$activeParticipants
            .sink { [weak self] activeParticipants in
                // Update participant list
                print("Active participants: \(activeParticipants.count)")
            }
            .store(in: &cancellables)
        
        // Join the session
        session.join()
    }
    
    // MARK: - Send Operations
    
    func sendOperation(_ operation: EditingOperation) async {
        guard let messenger = messenger else { return }
        
        do {
            try await messenger.send(operation)
            operationCount += 1
        } catch {
            print("Failed to send operation: \(error)")
            pendingOperations.append(operation)
        }
    }
    
    func sendParticipantState(_ state: ParticipantState) async {
        guard let messenger = messenger else { return }
        
        do {
            try await messenger.send(state, to: .all)
        } catch {
            print("Failed to send participant state: \(error)")
        }
    }
    
    // MARK: - Handle Incoming
    
    private func handleIncomingOperation(_ operation: EditingOperation) async {
        operationCount += 1
        
        // Apply the operation to the local scene graph
        // This would integrate with SceneGraphManager
        NotificationCenter.default.post(
            name: .spatialEditingOperationReceived,
            object: nil,
            userInfo: ["operation": operation]
        )
    }
    
    private func handleParticipantState(_ state: ParticipantState) async {
        if let index = participants.firstIndex(where: { $0.participantId == state.participantId }) {
            participants[index] = state
        } else {
            participants.append(state)
        }
    }
    
    // MARK: - Cleanup
    
    private func cleanup() {
        tasks.forEach { $0.cancel() }
        tasks.removeAll()
        cancellables.removeAll()
        groupSession = nil
        messenger = nil
        participants.removeAll()
    }
    
    func endSession() {
        groupSession?.end()
        cleanup()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let spatialEditingOperationReceived = Notification.Name("spatialEditingOperationReceived")
    static let spatialEditingSessionStarted = Notification.Name("spatialEditingSessionStarted")
    static let spatialEditingSessionEnded = Notification.Name("spatialEditingSessionEnded")
}
