// FaceTimeStudioView.swift
// DOGE Spatial Editor — visionOS
// FaceTime Live Editing Studio with SharePlay integration

import SwiftUI
import RealityKit
import GroupActivities
import AVFoundation

// MARK: - FaceTime Studio View

struct FaceTimeStudioView: View {
    @StateObject private var studioManager = FaceTimeStudioManager()
    @State private var showParticipantList = false
    @State private var showPrivacySettings = false
    @State private var selectedTool: EditingTool = .move
    
    var body: some View {
        ZStack {
            // Main spatial canvas
            RealityView { content in
                // Set up the immersive editing environment
                let anchor = AnchorEntity(.head)
                anchor.position = [0, 0, -2]
                
                // Add spatial editing grid
                let gridMesh = MeshResource.generatePlane(width: 10, depth: 10)
                var gridMaterial = UnlitMaterial()
                gridMaterial.color = .init(tint: .white.withAlphaComponent(0.05))
                let gridEntity = ModelEntity(mesh: gridMesh, materials: [gridMaterial])
                gridEntity.position = [0, -1, 0]
                anchor.addChild(gridEntity)
                
                content.add(anchor)
            } update: { content in
                // Update scene based on collaboration state
            }
            .gesture(
                DragGesture()
                    .targetedToAnyEntity()
                    .onChanged { value in
                        studioManager.handleDrag(value)
                    }
                    .onEnded { value in
                        studioManager.handleDragEnd(value)
                    }
            )
            
            // Floating UI panels
            VStack {
                // Top bar — session info
                HStack {
                    // Session status
                    HStack(spacing: 8) {
                        Circle()
                            .fill(studioManager.isLive ? .green : .red)
                            .frame(width: 8, height: 8)
                        Text(studioManager.sessionName)
                            .font(.headline)
                        Text("LIVE")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(.green.opacity(0.2))
                            .clipShape(Capsule())
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .glassBackgroundEffect()
                    
                    Spacer()
                    
                    // Privacy indicator
                    Button {
                        showPrivacySettings.toggle()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "lock.shield.fill")
                            Text("E2EE")
                                .font(.caption)
                                .fontWeight(.semibold)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.green.opacity(0.15))
                        .clipShape(Capsule())
                    }
                    
                    // Participant count
                    Button {
                        showParticipantList.toggle()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "person.2.fill")
                            Text("\(studioManager.participants.count)")
                                .fontWeight(.bold)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .glassBackgroundEffect()
                    }
                }
                .padding()
                
                Spacer()
                
                // Bottom toolbar
                HStack(spacing: 16) {
                    // Editing tools
                    ForEach(EditingTool.allCases, id: \.self) { tool in
                        Button {
                            selectedTool = tool
                        } label: {
                            VStack(spacing: 4) {
                                Image(systemName: tool.iconName)
                                    .font(.title3)
                                Text(tool.displayName)
                                    .font(.caption2)
                            }
                            .frame(width: 60, height: 60)
                            .background(selectedTool == tool ? .blue.opacity(0.3) : .clear)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    
                    Divider()
                        .frame(height: 40)
                    
                    // FaceTime controls
                    Button {
                        studioManager.toggleMicrophone()
                    } label: {
                        Image(systemName: studioManager.isMicMuted ? "mic.slash.fill" : "mic.fill")
                            .font(.title3)
                            .frame(width: 44, height: 44)
                            .background(studioManager.isMicMuted ? .red.opacity(0.3) : .clear)
                            .clipShape(Circle())
                    }
                    
                    Button {
                        studioManager.toggleSpatialAudio()
                    } label: {
                        Image(systemName: studioManager.isSpatialAudioOn ? "speaker.wave.3.fill" : "speaker.slash.fill")
                            .font(.title3)
                            .frame(width: 44, height: 44)
                            .background(!studioManager.isSpatialAudioOn ? .red.opacity(0.3) : .clear)
                            .clipShape(Circle())
                    }
                    
                    Button {
                        studioManager.togglePersona()
                    } label: {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.title3)
                            .frame(width: 44, height: 44)
                            .background(studioManager.isPersonaVisible ? .blue.opacity(0.3) : .clear)
                            .clipShape(Circle())
                    }
                    
                    Divider()
                        .frame(height: 40)
                    
                    // End session
                    Button {
                        studioManager.endSession()
                    } label: {
                        Image(systemName: "phone.down.fill")
                            .font(.title3)
                            .frame(width: 60, height: 44)
                            .background(.red)
                            .foregroundStyle(.white)
                            .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .glassBackgroundEffect()
            }
            
            // Participant list overlay
            if showParticipantList {
                ParticipantListOverlay(
                    participants: studioManager.participants,
                    onDismiss: { showParticipantList = false }
                )
                .transition(.move(edge: .trailing))
            }
            
            // Privacy settings overlay
            if showPrivacySettings {
                PrivacySettingsOverlay(
                    privacyLevel: $studioManager.privacyLevel,
                    onDismiss: { showPrivacySettings = false }
                )
                .transition(.move(edge: .trailing))
            }
        }
    }
}

// MARK: - Editing Tools

enum EditingTool: String, CaseIterable {
    case move, rotate, scale, sculpt, paint, measure, annotate, ai
    
    var iconName: String {
        switch self {
        case .move: return "arrow.up.and.down.and.arrow.left.and.right"
        case .rotate: return "arrow.triangle.2.circlepath"
        case .scale: return "arrow.up.left.and.arrow.down.right"
        case .sculpt: return "wand.and.stars"
        case .paint: return "paintbrush.fill"
        case .measure: return "ruler.fill"
        case .annotate: return "pencil.tip.crop.circle"
        case .ai: return "brain"
        }
    }
    
    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Participant List Overlay

struct ParticipantListOverlay: View {
    let participants: [StudioParticipant]
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Participants")
                    .font(.headline)
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                }
            }
            
            ForEach(participants) { participant in
                HStack(spacing: 12) {
                    // Avatar
                    Circle()
                        .fill(Color(hex: participant.color))
                        .frame(width: 32, height: 32)
                        .overlay(
                            Text(String(participant.name.prefix(1)))
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                        )
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(participant.name)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        HStack(spacing: 4) {
                            Image(systemName: participant.platformIcon)
                                .font(.caption2)
                            Text(participant.platform)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    // Status indicators
                    if participant.isMuted {
                        Image(systemName: "mic.slash.fill")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                    
                    if let editingNode = participant.editingNode {
                        Text(editingNode)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: participant.color).opacity(0.2))
                            .clipShape(Capsule())
                    }
                    
                    // Role badge
                    Text(participant.role.rawValue)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .textCase(.uppercase)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(participant.role == .host ? .yellow.opacity(0.2) : .blue.opacity(0.2))
                        .clipShape(Capsule())
                }
                .padding(.vertical, 4)
            }
        }
        .padding(20)
        .frame(width: 360)
        .glassBackgroundEffect()
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Privacy Settings Overlay

struct PrivacySettingsOverlay: View {
    @Binding var privacyLevel: PrivacyLevel
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Privacy & Security")
                    .font(.headline)
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                }
            }
            
            // Privacy level selector
            VStack(alignment: .leading, spacing: 8) {
                Text("Privacy Level")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                ForEach(PrivacyLevel.allCases, id: \.self) { level in
                    Button {
                        privacyLevel = level
                    } label: {
                        HStack {
                            Image(systemName: level.iconName)
                            VStack(alignment: .leading) {
                                Text(level.displayName)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(level.description)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if privacyLevel == level {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.blue)
                            }
                        }
                        .padding(10)
                        .background(privacyLevel == level ? .blue.opacity(0.1) : .clear)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            
            Divider()
            
            // Security status
            VStack(alignment: .leading, spacing: 8) {
                Text("OSI Security Stack")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                ForEach(OSILayer.allLayers, id: \.name) { layer in
                    HStack {
                        Text(layer.layerNumber)
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(.secondary)
                            .frame(width: 24)
                        Text(layer.name)
                            .font(.caption)
                        Spacer()
                        Text(layer.protocol)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Circle()
                            .fill(.green)
                            .frame(width: 6, height: 6)
                    }
                }
            }
            
            // Secure Enclave status
            HStack {
                Image(systemName: "lock.shield.fill")
                    .foregroundStyle(.green)
                VStack(alignment: .leading) {
                    Text("Secure Enclave Active")
                        .font(.caption)
                        .fontWeight(.semibold)
                    Text("All keys stored in hardware-backed secure enclave")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(10)
            .background(.green.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .padding(20)
        .frame(width: 380)
        .glassBackgroundEffect()
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Supporting Types

enum PrivacyLevel: String, CaseIterable {
    case `private`, team, organization
    
    var displayName: String {
        switch self {
        case .private: return "Private"
        case .team: return "Team Only"
        case .organization: return "Organization"
        }
    }
    
    var description: String {
        switch self {
        case .private: return "Only you can see and edit. Fully encrypted."
        case .team: return "Invited team members can collaborate."
        case .organization: return "Anyone in your org can view. Editors must be invited."
        }
    }
    
    var iconName: String {
        switch self {
        case .private: return "lock.fill"
        case .team: return "person.2.fill"
        case .organization: return "building.2.fill"
        }
    }
}

struct OSILayer {
    let layerNumber: String
    let name: String
    let `protocol`: String
    
    static let allLayers: [OSILayer] = [
        OSILayer(layerNumber: "L7", name: "Application", protocol: "TLS 1.3 + E2EE"),
        OSILayer(layerNumber: "L6", name: "Presentation", protocol: "AES-256-GCM"),
        OSILayer(layerNumber: "L5", name: "Session", protocol: "JWT + SharePlay"),
        OSILayer(layerNumber: "L4", name: "Transport", protocol: "TLS 1.3"),
        OSILayer(layerNumber: "L3", name: "Network", protocol: "IPsec / WireGuard"),
        OSILayer(layerNumber: "L2", name: "Data Link", protocol: "802.11ax WPA3"),
        OSILayer(layerNumber: "L1", name: "Physical", protocol: "Secure Enclave"),
    ]
}

struct StudioParticipant: Identifiable {
    let id: String
    let name: String
    let platform: String
    let platformIcon: String
    let role: ParticipantRole
    let color: String
    let isMuted: Bool
    let editingNode: String?
    
    enum ParticipantRole: String {
        case host, editor, viewer
    }
}

// MARK: - FaceTime Studio Manager

@MainActor
class FaceTimeStudioManager: ObservableObject {
    @Published var sessionName = "Z-Pinch Plasma Simulation"
    @Published var isLive = true
    @Published var isMicMuted = false
    @Published var isSpatialAudioOn = true
    @Published var isPersonaVisible = true
    @Published var privacyLevel: PrivacyLevel = .team
    
    @Published var participants: [StudioParticipant] = [
        StudioParticipant(id: "p1", name: "You", platform: "visionOS", platformIcon: "eye.fill", role: .host, color: "#4A90D9", isMuted: false, editingNode: nil),
        StudioParticipant(id: "p2", name: "Alex", platform: "visionOS", platformIcon: "eye.fill", role: .editor, color: "#E74C3C", isMuted: false, editingNode: "Plasma Column"),
        StudioParticipant(id: "p3", name: "Jordan", platform: "Meta Quest", platformIcon: "headphones", role: .editor, color: "#2ECC71", isMuted: true, editingNode: "Sensor Array"),
        StudioParticipant(id: "p4", name: "Sam", platform: "Blender", platformIcon: "cube.fill", role: .editor, color: "#F39C12", isMuted: false, editingNode: nil),
        StudioParticipant(id: "p5", name: "Taylor", platform: "iPadOS", platformIcon: "ipad", role: .viewer, color: "#9B59B6", isMuted: true, editingNode: nil),
    ]
    
    func toggleMicrophone() {
        isMicMuted.toggle()
    }
    
    func toggleSpatialAudio() {
        isSpatialAudioOn.toggle()
    }
    
    func togglePersona() {
        isPersonaVisible.toggle()
    }
    
    func endSession() {
        isLive = false
    }
    
    func handleDrag(_ value: EntityTargetValue<DragGesture.Value>) {
        // Handle spatial drag gesture for entity manipulation
        guard let entity = value.entity as? ModelEntity else { return }
        let translation = value.convert(value.translation3D, from: .local, to: .scene)
        entity.position += translation
    }
    
    func handleDragEnd(_ value: EntityTargetValue<DragGesture.Value>) {
        // Broadcast final position to collaborators
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
