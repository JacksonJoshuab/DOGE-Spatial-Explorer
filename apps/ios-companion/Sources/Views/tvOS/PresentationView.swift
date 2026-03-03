// PresentationView.swift
// DOGE Spatial Editor — tvOS Companion
// Large-screen presentation and monitoring view for Apple TV

import SwiftUI

// MARK: - tvOS Presentation View

struct PresentationView: View {
    @StateObject private var presenter = PresentationManager()
    @State private var showingSessionPicker = false
    
    var body: some View {
        ZStack {
            // Background
            Color.black.ignoresSafeArea()
            
            if let session = presenter.activeSession {
                // Active session view
                VStack(spacing: 0) {
                    // Top bar
                    HStack {
                        // Session info
                        HStack(spacing: 12) {
                            Circle()
                                .fill(.green)
                                .frame(width: 12, height: 12)
                            VStack(alignment: .leading) {
                                Text(session.name)
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                                Text("\(session.participantCount) participants · \(session.duration)")
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                            }
                        }
                        
                        Spacer()
                        
                        // Security badge
                        HStack(spacing: 6) {
                            Image(systemName: "lock.shield.fill")
                            Text("E2EE")
                                .fontWeight(.semibold)
                        }
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.green.opacity(0.2))
                        .foregroundStyle(.green)
                        .clipShape(Capsule())
                        
                        // View mode toggle
                        HStack(spacing: 4) {
                            ForEach(PresentationMode.allCases, id: \.self) { mode in
                                Button {
                                    presenter.presentationMode = mode
                                } label: {
                                    Image(systemName: mode.iconName)
                                        .font(.caption)
                                        .padding(8)
                                        .background(presenter.presentationMode == mode ? .blue : .gray.opacity(0.3))
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 40)
                    .padding(.vertical, 16)
                    
                    // Main content area
                    switch presenter.presentationMode {
                    case .sceneView:
                        ScenePreviewPanel(session: session)
                    case .participants:
                        ParticipantGridPanel(participants: presenter.participants)
                    case .metrics:
                        MetricsDashboardPanel(metrics: presenter.metrics)
                    case .timeline:
                        TimelinePanel(events: presenter.events)
                    }
                    
                    // Bottom status bar
                    HStack {
                        // OSI security indicators
                        HStack(spacing: 8) {
                            ForEach(1...7, id: \.self) { layer in
                                VStack(spacing: 2) {
                                    Circle()
                                        .fill(.green)
                                        .frame(width: 6, height: 6)
                                    Text("L\(layer)")
                                        .font(.system(size: 8))
                                        .foregroundStyle(.gray)
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.white.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        Spacer()
                        
                        // Performance stats
                        HStack(spacing: 16) {
                            StatPill(label: "FPS", value: "60")
                            StatPill(label: "Latency", value: "12ms")
                            StatPill(label: "Bandwidth", value: "2.4 Mbps")
                        }
                        
                        Spacer()
                        
                        // Connected devices
                        HStack(spacing: 8) {
                            Image(systemName: "eye.fill").foregroundStyle(.blue)
                            Image(systemName: "headphones").foregroundStyle(.cyan)
                            Image(systemName: "ipad").foregroundStyle(.purple)
                            Image(systemName: "cube.fill").foregroundStyle(.orange)
                        }
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.white.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .padding(.horizontal, 40)
                    .padding(.vertical, 12)
                    .background(.black.opacity(0.5))
                }
            } else {
                // No active session
                VStack(spacing: 20) {
                    Image(systemName: "rectangle.connected.to.line.below")
                        .font(.system(size: 60))
                        .foregroundStyle(.gray)
                    
                    Text("DOGE Spatial Editor")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                    
                    Text("Connect to a spatial editing session to begin presenting")
                        .font(.title3)
                        .foregroundStyle(.gray)
                    
                    Button {
                        showingSessionPicker = true
                    } label: {
                        Label("Browse Sessions", systemImage: "magnifyingglass")
                            .font(.title3)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
    }
}

// MARK: - Presentation Modes

enum PresentationMode: String, CaseIterable {
    case sceneView, participants, metrics, timeline
    
    var iconName: String {
        switch self {
        case .sceneView: return "cube.fill"
        case .participants: return "person.2.fill"
        case .metrics: return "chart.bar.fill"
        case .timeline: return "clock.fill"
        }
    }
}

// MARK: - Scene Preview Panel

struct ScenePreviewPanel: View {
    let session: PresentationSession
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Simulated 3D viewport
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: [Color(white: 0.08), Color(white: 0.12)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .overlay(
                        // Grid lines
                        Canvas { context, size in
                            let gridSpacing: CGFloat = 40
                            let center = CGPoint(x: size.width / 2, y: size.height / 2)
                            
                            for i in stride(from: 0, to: size.width, by: gridSpacing) {
                                var path = Path()
                                path.move(to: CGPoint(x: i, y: 0))
                                path.addLine(to: CGPoint(x: i, y: size.height))
                                context.stroke(path, with: .color(.white.opacity(0.03)), lineWidth: 1)
                            }
                            for i in stride(from: 0, to: size.height, by: gridSpacing) {
                                var path = Path()
                                path.move(to: CGPoint(x: 0, y: i))
                                path.addLine(to: CGPoint(x: size.width, y: i))
                                context.stroke(path, with: .color(.white.opacity(0.03)), lineWidth: 1)
                            }
                            
                            // Center crosshair
                            var xAxis = Path()
                            xAxis.move(to: CGPoint(x: center.x - 50, y: center.y))
                            xAxis.addLine(to: CGPoint(x: center.x + 50, y: center.y))
                            context.stroke(xAxis, with: .color(.red.opacity(0.5)), lineWidth: 1)
                            
                            var yAxis = Path()
                            yAxis.move(to: CGPoint(x: center.x, y: center.y - 50))
                            yAxis.addLine(to: CGPoint(x: center.x, y: center.y + 50))
                            context.stroke(yAxis, with: .color(.green.opacity(0.5)), lineWidth: 1)
                        }
                    )
                    .overlay(
                        // Scene info overlay
                        VStack {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Scene: \(session.name)")
                                        .font(.caption)
                                        .foregroundStyle(.gray)
                                    Text("Entities: 247 · Triangles: 1.2M")
                                        .font(.caption2)
                                        .foregroundStyle(.gray.opacity(0.6))
                                }
                                Spacer()
                                Text("LIVE PREVIEW")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(.red.opacity(0.3))
                                    .foregroundStyle(.red)
                                    .clipShape(Capsule())
                            }
                            .padding()
                            Spacer()
                        }
                    )
                
                // Simulated 3D content placeholder
                VStack {
                    Image(systemName: "cube.transparent.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.blue.opacity(0.4))
                    Text("3D Scene Stream")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
            }
            .padding(.horizontal, 40)
        }
    }
}

// MARK: - Participant Grid Panel

struct ParticipantGridPanel: View {
    let participants: [PresentationParticipant]
    
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible()),
        ], spacing: 16) {
            ForEach(participants) { p in
                VStack(spacing: 8) {
                    // Avatar
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(white: 0.15))
                            .aspectRatio(16/9, contentMode: .fit)
                        
                        Circle()
                            .fill(Color(hex: p.color))
                            .frame(width: 48, height: 48)
                            .overlay(
                                Text(String(p.name.prefix(1)))
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                            )
                        
                        // Status indicators
                        VStack {
                            HStack {
                                Spacer()
                                if p.isMuted {
                                    Image(systemName: "mic.slash.fill")
                                        .font(.caption2)
                                        .foregroundStyle(.red)
                                        .padding(4)
                                        .background(.black.opacity(0.5))
                                        .clipShape(Circle())
                                }
                            }
                            Spacer()
                            HStack {
                                Image(systemName: p.platformIcon)
                                    .font(.caption2)
                                    .foregroundStyle(.gray)
                                    .padding(4)
                                    .background(.black.opacity(0.5))
                                    .clipShape(RoundedRectangle(cornerRadius: 4))
                                Spacer()
                                if let editing = p.editingNode {
                                    Text(editing)
                                        .font(.caption2)
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color(hex: p.color).opacity(0.7))
                                        .clipShape(Capsule())
                                }
                            }
                        }
                        .padding(8)
                    }
                    
                    Text(p.name)
                        .font(.caption)
                        .foregroundStyle(.white)
                    Text(p.role)
                        .font(.caption2)
                        .foregroundStyle(.gray)
                }
            }
        }
        .padding(.horizontal, 40)
    }
}

// MARK: - Metrics Dashboard Panel

struct MetricsDashboardPanel: View {
    let metrics: PresentationMetrics
    
    var body: some View {
        HStack(spacing: 16) {
            // Render performance
            MetricCard(title: "Render", items: [
                ("FPS", "\(metrics.fps)"),
                ("Frame Time", String(format: "%.1fms", metrics.frameTime)),
                ("Draw Calls", "\(metrics.drawCalls)"),
                ("Triangles", "\(metrics.triangleCount / 1000)K"),
            ])
            
            // Network
            MetricCard(title: "Network", items: [
                ("Latency", "\(metrics.latencyMs)ms"),
                ("Bandwidth", String(format: "%.1f Mbps", metrics.bandwidthMbps)),
                ("Ops/sec", "\(metrics.operationsPerSecond)"),
                ("Sync Status", metrics.syncStatus),
            ])
            
            // Collaboration
            MetricCard(title: "Collaboration", items: [
                ("Participants", "\(metrics.participantCount)"),
                ("Active Editors", "\(metrics.activeEditors)"),
                ("Operations", "\(metrics.totalOperations)"),
                ("Conflicts", "\(metrics.conflictsResolved)"),
            ])
            
            // Security
            MetricCard(title: "Security", items: [
                ("Encryption", metrics.encryptionType),
                ("Key Rotation", metrics.lastKeyRotation),
                ("Auth Status", "Verified"),
                ("OSI Stack", "All Green"),
            ])
        }
        .padding(.horizontal, 40)
    }
}

struct MetricCard: View {
    let title: String
    let items: [(String, String)]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.white)
            
            ForEach(items, id: \.0) { item in
                HStack {
                    Text(item.0)
                        .font(.caption)
                        .foregroundStyle(.gray)
                    Spacer()
                    Text(item.1)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(white: 0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Timeline Panel

struct TimelinePanel: View {
    let events: [PresentationEvent]
    
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(events) { event in
                    HStack(alignment: .top, spacing: 16) {
                        // Timeline line
                        VStack(spacing: 0) {
                            Circle()
                                .fill(event.color)
                                .frame(width: 10, height: 10)
                            Rectangle()
                                .fill(.gray.opacity(0.2))
                                .frame(width: 2)
                        }
                        .frame(width: 10)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(event.title)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundStyle(.white)
                                Spacer()
                                Text(event.timestamp)
                                    .font(.caption2)
                                    .foregroundStyle(.gray)
                            }
                            Text(event.description)
                                .font(.caption)
                                .foregroundStyle(.gray)
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
            .padding(.horizontal, 40)
        }
    }
}

// MARK: - Helper Views

struct StatPill: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(.white.opacity(0.05))
        .clipShape(Capsule())
    }
}

// MARK: - Data Models

struct PresentationSession {
    let id: String
    let name: String
    let participantCount: Int
    let duration: String
}

struct PresentationParticipant: Identifiable {
    let id: String
    let name: String
    let platform: String
    let role: String
    let color: String
    let isMuted: Bool
    let editingNode: String?
    
    var platformIcon: String {
        switch platform {
        case "visionOS": return "eye.fill"
        case "metaQuest": return "headphones"
        case "iPadOS": return "ipad"
        case "blender": return "cube.fill"
        default: return "display"
        }
    }
}

struct PresentationMetrics {
    let fps: Int
    let frameTime: Float
    let drawCalls: Int
    let triangleCount: Int
    let latencyMs: Int
    let bandwidthMbps: Float
    let operationsPerSecond: Int
    let syncStatus: String
    let participantCount: Int
    let activeEditors: Int
    let totalOperations: Int
    let conflictsResolved: Int
    let encryptionType: String
    let lastKeyRotation: String
}

struct PresentationEvent: Identifiable {
    let id: String
    let title: String
    let description: String
    let timestamp: String
    let color: Color
}

// MARK: - Presentation Manager

@MainActor
class PresentationManager: ObservableObject {
    @Published var activeSession: PresentationSession? = PresentationSession(
        id: "s1", name: "Z-Pinch Plasma Simulation", participantCount: 5, duration: "1h 23m"
    )
    @Published var presentationMode: PresentationMode = .sceneView
    
    @Published var participants: [PresentationParticipant] = [
        PresentationParticipant(id: "p1", name: "You", platform: "tvOS", role: "Viewer", color: "#4A90D9", isMuted: true, editingNode: nil),
        PresentationParticipant(id: "p2", name: "Alex", platform: "visionOS", role: "Editor", color: "#E74C3C", isMuted: false, editingNode: "Plasma Column"),
        PresentationParticipant(id: "p3", name: "Jordan", platform: "metaQuest", role: "Editor", color: "#2ECC71", isMuted: true, editingNode: "Sensor Array"),
        PresentationParticipant(id: "p4", name: "Sam", platform: "blender", role: "Editor", color: "#F39C12", isMuted: false, editingNode: nil),
        PresentationParticipant(id: "p5", name: "Taylor", platform: "iPadOS", role: "Viewer", color: "#9B59B6", isMuted: true, editingNode: nil),
    ]
    
    @Published var metrics = PresentationMetrics(
        fps: 60, frameTime: 16.7, drawCalls: 342, triangleCount: 1200000,
        latencyMs: 12, bandwidthMbps: 2.4, operationsPerSecond: 45, syncStatus: "Synced",
        participantCount: 5, activeEditors: 3, totalOperations: 1847, conflictsResolved: 12,
        encryptionType: "AES-256-GCM", lastKeyRotation: "2m ago"
    )
    
    @Published var events: [PresentationEvent] = [
        PresentationEvent(id: "e1", title: "Session Started", description: "Host initiated collaborative editing session", timestamp: "10:00 AM", color: .green),
        PresentationEvent(id: "e2", title: "Alex joined", description: "Connected via Vision Pro with SharePlay", timestamp: "10:01 AM", color: .blue),
        PresentationEvent(id: "e3", title: "Jordan joined", description: "Connected via Quest 3 with Horizon bridge", timestamp: "10:02 AM", color: .cyan),
        PresentationEvent(id: "e4", title: "Plasma Column modified", description: "Alex adjusted instability parameters", timestamp: "10:05 AM", color: .orange),
        PresentationEvent(id: "e5", title: "Privacy zone created", description: "Classified region marked by host", timestamp: "10:08 AM", color: .red),
        PresentationEvent(id: "e6", title: "Sam joined", description: "Connected via Blender plugin", timestamp: "10:10 AM", color: .yellow),
        PresentationEvent(id: "e7", title: "Conflict resolved", description: "CRDT auto-merged concurrent edits on Sensor Array", timestamp: "10:15 AM", color: .purple),
    ]
}

// Color hex extension for tvOS
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6: (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (r, g, b) = (0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
}
