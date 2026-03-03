// RemoteControlView.swift
// DOGE Spatial Editor — iPadOS Companion
// Remote control interface for managing spatial editing sessions from iPad

import SwiftUI

// MARK: - Remote Control View

struct RemoteControlView: View {
    @StateObject private var controller = RemoteControlManager()
    @State private var selectedDevice: ConnectedDevice?
    @State private var showDevicePicker = false
    
    var body: some View {
        NavigationSplitView {
            // Device list sidebar
            List(selection: $selectedDevice) {
                Section("Connected Devices") {
                    ForEach(controller.devices) { device in
                        DeviceRow(device: device)
                            .tag(device)
                    }
                }
                
                Section("Session Controls") {
                    NavigationLink {
                        SessionMonitorView(controller: controller)
                    } label: {
                        Label("Live Sessions", systemImage: "video.fill")
                    }
                    
                    NavigationLink {
                        AssetBrowserView()
                    } label: {
                        Label("Asset Library", systemImage: "cube.fill")
                    }
                    
                    NavigationLink {
                        SecurityDashboardView()
                    } label: {
                        Label("Security Status", systemImage: "lock.shield.fill")
                    }
                }
            }
            .navigationTitle("Remote Control")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showDevicePicker = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
        } detail: {
            if let device = selectedDevice {
                DeviceControlPanel(device: device, controller: controller)
            } else {
                ContentUnavailableView(
                    "Select a Device",
                    systemImage: "rectangle.connected.to.line.below",
                    description: Text("Choose a connected device to control")
                )
            }
        }
    }
}

// MARK: - Device Row

struct DeviceRow: View {
    let device: ConnectedDevice
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: device.platformIcon)
                .font(.title3)
                .foregroundStyle(device.isOnline ? .blue : .secondary)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(device.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(device.model)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Circle()
                    .fill(device.isOnline ? .green : .red)
                    .frame(width: 8, height: 8)
                
                if let battery = device.batteryLevel {
                    HStack(spacing: 2) {
                        Image(systemName: batteryIcon(level: battery))
                            .font(.caption2)
                        Text("\(battery)%")
                            .font(.caption2)
                    }
                    .foregroundStyle(battery < 20 ? .red : .secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func batteryIcon(level: Int) -> String {
        switch level {
        case 0..<25: return "battery.25"
        case 25..<50: return "battery.50"
        case 50..<75: return "battery.75"
        default: return "battery.100"
        }
    }
}

// MARK: - Device Control Panel

struct DeviceControlPanel: View {
    let device: ConnectedDevice
    @ObservedObject var controller: RemoteControlManager
    @State private var showingConfirmation = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Device header
                HStack(spacing: 16) {
                    Image(systemName: device.platformIcon)
                        .font(.largeTitle)
                        .foregroundStyle(.blue)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(device.name)
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("\(device.model) · \(device.osVersion)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    StatusBadge(isOnline: device.isOnline)
                }
                .padding()
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Quick actions
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                ], spacing: 12) {
                    QuickActionButton(icon: "arrow.clockwise", label: "Sync", color: .blue) {
                        controller.forceSync(device: device)
                    }
                    QuickActionButton(icon: "camera.fill", label: "Screenshot", color: .purple) {
                        controller.captureScreenshot(device: device)
                    }
                    QuickActionButton(icon: "record.circle", label: "Record", color: .red) {
                        controller.toggleRecording(device: device)
                    }
                    QuickActionButton(icon: "square.and.arrow.up", label: "Export", color: .green) {
                        controller.exportScene(device: device)
                    }
                }
                
                // Performance metrics
                GroupBox("Performance") {
                    VStack(spacing: 12) {
                        MetricRow(label: "CPU", value: device.cpuUsage, maxValue: 100, unit: "%", color: .blue)
                        MetricRow(label: "GPU", value: device.gpuUsage, maxValue: 100, unit: "%", color: .purple)
                        MetricRow(label: "Memory", value: Float(device.memoryUsed), maxValue: Float(device.memoryTotal), unit: "GB", color: .green)
                        MetricRow(label: "FPS", value: device.fps, maxValue: 120, unit: "", color: .orange)
                        
                        if let temp = device.temperature {
                            MetricRow(label: "Temp", value: temp, maxValue: 80, unit: "°C", color: .red)
                        }
                    }
                }
                
                // Scene info
                GroupBox("Active Scene") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Document")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(device.activeDocument ?? "None")
                                .fontWeight(.medium)
                        }
                        HStack {
                            Text("Entities")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(device.entityCount)")
                                .fontWeight(.medium)
                        }
                        HStack {
                            Text("Render Time")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(String(format: "%.1f ms", device.renderTime))
                                .fontWeight(.medium)
                        }
                        HStack {
                            Text("Collaborators")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(device.collaboratorCount)")
                                .fontWeight(.medium)
                        }
                    }
                    .font(.subheadline)
                }
                
                // Remote commands
                GroupBox("Remote Commands") {
                    VStack(spacing: 8) {
                        CommandButton(icon: "play.fill", label: "Start Session", color: .green) {
                            controller.sendCommand(to: device, command: .startSession)
                        }
                        CommandButton(icon: "pause.fill", label: "Pause Session", color: .orange) {
                            controller.sendCommand(to: device, command: .pauseSession)
                        }
                        CommandButton(icon: "arrow.triangle.2.circlepath", label: "Reload Scene", color: .blue) {
                            controller.sendCommand(to: device, command: .reloadScene)
                        }
                        CommandButton(icon: "xmark.circle.fill", label: "End Session", color: .red) {
                            showingConfirmation = true
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle(device.name)
        .alert("End Session?", isPresented: $showingConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("End Session", role: .destructive) {
                controller.sendCommand(to: device, command: .endSession)
            }
        } message: {
            Text("This will end the active editing session on \(device.name). All unsaved changes will be preserved in the cloud.")
        }
    }
}

// MARK: - Session Monitor View

struct SessionMonitorView: View {
    @ObservedObject var controller: RemoteControlManager
    
    var body: some View {
        List {
            ForEach(controller.activeSessions) { session in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Circle()
                            .fill(session.isLive ? .green : .orange)
                            .frame(width: 8, height: 8)
                        Text(session.name)
                            .font(.headline)
                        Spacer()
                        Text(session.isLive ? "LIVE" : "PAUSED")
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(session.isLive ? .green.opacity(0.15) : .orange.opacity(0.15))
                            .clipShape(Capsule())
                    }
                    
                    HStack(spacing: 16) {
                        Label("\(session.participantCount)", systemImage: "person.2.fill")
                        Label(session.encryption, systemImage: "lock.fill")
                        Label(session.duration, systemImage: "clock.fill")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    
                    // Participant avatars
                    HStack(spacing: -8) {
                        ForEach(session.participantNames.prefix(5), id: \.self) { name in
                            Circle()
                                .fill(.blue.gradient)
                                .frame(width: 28, height: 28)
                                .overlay(
                                    Text(String(name.prefix(1)))
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                )
                                .overlay(
                                    Circle().stroke(.white, lineWidth: 2)
                                )
                        }
                        if session.participantNames.count > 5 {
                            Circle()
                                .fill(.gray)
                                .frame(width: 28, height: 28)
                                .overlay(
                                    Text("+\(session.participantNames.count - 5)")
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                )
                                .overlay(
                                    Circle().stroke(.white, lineWidth: 2)
                                )
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Live Sessions")
    }
}

// MARK: - Asset Browser View

struct AssetBrowserView: View {
    @State private var searchText = ""
    @State private var selectedCategory = "All"
    
    let categories = ["All", "USDZ", "GLB", "FBX", "HDR", "Textures"]
    
    var body: some View {
        VStack {
            // Category filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(categories, id: \.self) { cat in
                        Button {
                            selectedCategory = cat
                        } label: {
                            Text(cat)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(selectedCategory == cat ? .blue : .gray.opacity(0.15))
                                .foregroundStyle(selectedCategory == cat ? .white : .primary)
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            List {
                ForEach(0..<10) { i in
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.blue.opacity(0.1))
                            .frame(width: 48, height: 48)
                            .overlay(
                                Image(systemName: "cube.fill")
                                    .foregroundStyle(.blue)
                            )
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Asset_\(i + 1).usdz")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("2.4 MB · Modified 2h ago")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        
                        Spacer()
                        
                        Button {
                            // Send to device
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
            }
        }
        .navigationTitle("Asset Library")
        .searchable(text: $searchText)
    }
}

// MARK: - Security Dashboard View

struct SecurityDashboardView: View {
    var body: some View {
        List {
            Section("Encryption Status") {
                HStack {
                    Image(systemName: "lock.shield.fill")
                        .foregroundStyle(.green)
                    Text("End-to-End Encryption")
                    Spacer()
                    Text("Active")
                        .foregroundStyle(.green)
                        .fontWeight(.semibold)
                }
                
                HStack {
                    Image(systemName: "key.fill")
                        .foregroundStyle(.blue)
                    Text("Secure Enclave")
                    Spacer()
                    Text("Verified")
                        .foregroundStyle(.green)
                        .fontWeight(.semibold)
                }
            }
            
            Section("OSI Security Stack") {
                ForEach(osiLayers, id: \.layer) { layer in
                    HStack {
                        Text("L\(layer.layer)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(.secondary)
                            .frame(width: 24)
                        Text(layer.name)
                            .font(.subheadline)
                        Spacer()
                        Text(layer.protocol)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Circle()
                            .fill(.green)
                            .frame(width: 8, height: 8)
                    }
                }
            }
            
            Section("Connected Devices") {
                HStack {
                    Text("Vision Pro")
                    Spacer()
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundStyle(.green)
                }
                HStack {
                    Text("Quest 3")
                    Spacer()
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundStyle(.green)
                }
                HStack {
                    Text("Blender Workstation")
                    Spacer()
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundStyle(.green)
                }
            }
        }
        .navigationTitle("Security Status")
    }
    
    private var osiLayers: [(layer: Int, name: String, protocol: String)] {
        [
            (7, "Application", "TLS 1.3 + E2EE"),
            (6, "Presentation", "AES-256-GCM"),
            (5, "Session", "JWT + SharePlay"),
            (4, "Transport", "TLS 1.3"),
            (3, "Network", "IPsec / WireGuard"),
            (2, "Data Link", "WPA3"),
            (1, "Physical", "Secure Enclave"),
        ]
    }
}

// MARK: - Helper Views

struct StatusBadge: View {
    let isOnline: Bool
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(isOnline ? .green : .red)
                .frame(width: 6, height: 6)
            Text(isOnline ? "Online" : "Offline")
                .font(.caption)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(isOnline ? .green.opacity(0.1) : .red.opacity(0.1))
        .clipShape(Capsule())
    }
}

struct QuickActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title3)
                Text(label)
                    .font(.caption2)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color.opacity(0.1))
            .foregroundStyle(color)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct MetricRow: View {
    let label: String
    let value: Float
    let maxValue: Float
    let unit: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(width: 50, alignment: .leading)
            
            ProgressView(value: Double(value), total: Double(maxValue))
                .tint(value / maxValue > 0.9 ? .red : color)
            
            Text("\(String(format: "%.0f", value))\(unit)")
                .font(.subheadline)
                .fontWeight(.medium)
                .frame(width: 50, alignment: .trailing)
        }
    }
}

struct CommandButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(label)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
        }
    }
}

// MARK: - Data Models

struct ConnectedDevice: Identifiable, Hashable {
    let id: String
    let name: String
    let model: String
    let platform: String
    let osVersion: String
    let isOnline: Bool
    let batteryLevel: Int?
    let cpuUsage: Float
    let gpuUsage: Float
    let memoryUsed: Int
    let memoryTotal: Int
    let fps: Float
    let temperature: Float?
    let activeDocument: String?
    let entityCount: Int
    let renderTime: Float
    let collaboratorCount: Int
    
    var platformIcon: String {
        switch platform {
        case "visionOS": return "eye.fill"
        case "metaQuest": return "headphones"
        case "iPadOS": return "ipad"
        case "tvOS": return "appletv.fill"
        case "desktop": return "desktopcomputer"
        case "cloud": return "cloud.fill"
        default: return "display"
        }
    }
    
    static func == (lhs: ConnectedDevice, rhs: ConnectedDevice) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct ActiveSession: Identifiable {
    let id: String
    let name: String
    let isLive: Bool
    let participantCount: Int
    let participantNames: [String]
    let encryption: String
    let duration: String
}

enum RemoteCommand {
    case startSession
    case pauseSession
    case endSession
    case reloadScene
    case captureScreenshot
    case startRecording
    case stopRecording
    case exportScene
}

// MARK: - Remote Control Manager

@MainActor
class RemoteControlManager: ObservableObject {
    @Published var devices: [ConnectedDevice] = [
        ConnectedDevice(id: "d1", name: "Vision Pro (Office)", model: "Apple Vision Pro 2", platform: "visionOS", osVersion: "visionOS 3.0", isOnline: true, batteryLevel: 78, cpuUsage: 34, gpuUsage: 67, memoryUsed: 12, memoryTotal: 16, fps: 90, temperature: 38, activeDocument: "Z-Pinch Plasma", entityCount: 247, renderTime: 10.8, collaboratorCount: 4),
        ConnectedDevice(id: "d2", name: "Quest 3 (Lab)", model: "Meta Quest 3", platform: "metaQuest", osVersion: "v69.0", isOnline: true, batteryLevel: 54, cpuUsage: 45, gpuUsage: 72, memoryUsed: 8, memoryTotal: 12, fps: 72, temperature: 41, activeDocument: "Z-Pinch Plasma", entityCount: 247, renderTime: 12.3, collaboratorCount: 4),
        ConnectedDevice(id: "d3", name: "iPad Pro 13\"", model: "iPad Pro M4", platform: "iPadOS", osVersion: "iPadOS 19.0", isOnline: true, batteryLevel: 92, cpuUsage: 12, gpuUsage: 8, memoryUsed: 6, memoryTotal: 16, fps: 120, temperature: 32, activeDocument: nil, entityCount: 0, renderTime: 0, collaboratorCount: 0),
        ConnectedDevice(id: "d4", name: "Apple TV 4K", model: "Apple TV 4K 3rd Gen", platform: "tvOS", osVersion: "tvOS 19.0", isOnline: true, batteryLevel: nil, cpuUsage: 5, gpuUsage: 3, memoryUsed: 2, memoryTotal: 4, fps: 60, temperature: nil, activeDocument: nil, entityCount: 0, renderTime: 0, collaboratorCount: 0),
    ]
    
    @Published var activeSessions: [ActiveSession] = [
        ActiveSession(id: "s1", name: "Z-Pinch Plasma Simulation", isLive: true, participantCount: 5, participantNames: ["You", "Alex", "Jordan", "Sam", "Taylor"], encryption: "E2EE", duration: "1h 23m"),
        ActiveSession(id: "s2", name: "City Hall 3D Scan", isLive: true, participantCount: 3, participantNames: ["Morgan", "Casey", "Drew"], encryption: "E2EE", duration: "2h 45m"),
    ]
    
    func forceSync(device: ConnectedDevice) {
        // Send sync command via WebSocket
    }
    
    func captureScreenshot(device: ConnectedDevice) {
        // Send screenshot command
    }
    
    func toggleRecording(device: ConnectedDevice) {
        // Toggle recording
    }
    
    func exportScene(device: ConnectedDevice) {
        // Export scene from device
    }
    
    func sendCommand(to device: ConnectedDevice, command: RemoteCommand) {
        // Send remote command via WebSocket
    }
}
