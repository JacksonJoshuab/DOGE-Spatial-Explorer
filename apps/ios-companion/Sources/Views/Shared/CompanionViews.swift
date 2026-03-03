// CompanionViews.swift
// DOGE Spatial Explorer — Companion Sub-Views
//
// All secondary views for the iPadOS/tvOS companion app:
// Session list, project browser, asset browser, collaborator list,
// performance monitor, security overview, device manager, and settings.

import SwiftUI

// MARK: - Session List View

struct SessionListView: View {
    @Environment(SessionManager.self) private var sessionManager

    var body: some View {
        List {
            Section("Active Sessions") {
                ForEach(sessionManager.activeSessions) { session in
                    SessionRow(session: session)
                }
            }
        }
        .navigationTitle("Sessions")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("New Session", systemImage: "plus") {
                    // Start new session
                }
            }
        }
    }
}

struct SessionRow: View {
    let session: SpatialSession

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(session.documentName)
                    .font(.headline)
                HStack(spacing: 8) {
                    Label(session.platform.displayName, systemImage: session.platform.systemImage)
                        .font(.caption)
                        .foregroundStyle(session.platform.color)
                    Text("\(session.collaboratorCount) collaborators")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing) {
                Circle()
                    .fill(session.isActive ? .green : .gray)
                    .frame(width: 10, height: 10)
                Text(session.startedAt, style: .relative)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Project List View

struct ProjectListView: View {
    @Environment(CompanionCloudService.self) private var cloudService
    @State private var projects: [ProjectInfo] = []

    var body: some View {
        List {
            ForEach(projects) { project in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(project.name)
                            .font(.headline)
                        Spacer()
                        Label(project.privacyLevel, systemImage: privacyIcon(project.privacyLevel))
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(.ultraThinMaterial, in: Capsule())
                    }
                    Text(project.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    HStack(spacing: 16) {
                        Label("\(project.nodeCount) nodes", systemImage: "cube")
                        Label("\(project.collaboratorCount) collaborators", systemImage: "person.2")
                        Text(project.modifiedAt, style: .relative)
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Projects")
        .task {
            projects = (try? await cloudService.listProjects()) ?? []
        }
    }

    private func privacyIcon(_ level: String) -> String {
        switch level {
        case "private": return "lock.fill"
        case "team": return "person.2.fill"
        case "organization": return "building.2.fill"
        case "public": return "globe"
        default: return "lock"
        }
    }
}

// MARK: - Asset Browser View

struct AssetBrowserView: View {
    @Environment(CompanionCloudService.self) private var cloudService
    @State private var assets: [AssetInfo] = []
    @State private var showingUploadSheet = false

    var body: some View {
        List {
            ForEach(assets) { asset in
                HStack {
                    Image(systemName: asset.type.systemImage)
                        .font(.title2)
                        .foregroundStyle(.blue)
                        .frame(width: 40)
                    VStack(alignment: .leading) {
                        Text(asset.name)
                            .font(.body)
                        HStack {
                            Text(asset.formattedSize)
                            Text("·")
                            Text(asset.modifiedAt, style: .relative)
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button("Download", systemImage: "arrow.down.circle") {
                        // Download asset
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Assets")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Upload", systemImage: "arrow.up.circle") {
                    showingUploadSheet = true
                }
            }
        }
        .task {
            assets = (try? await cloudService.listAssets(for: UUID())) ?? []
        }
    }
}

// MARK: - Collaborator List View

struct CollaboratorListView: View {
    @Environment(SessionManager.self) private var sessionManager

    var body: some View {
        List {
            Section("Online") {
                ForEach(sessionManager.connectedDevices.filter { $0.status == .online }) { device in
                    DeviceRow(device: device)
                }
            }
            Section("Idle") {
                ForEach(sessionManager.connectedDevices.filter { $0.status == .idle }) { device in
                    DeviceRow(device: device)
                }
            }
        }
        .navigationTitle("Collaborators")
    }
}

struct DeviceRow: View {
    let device: ConnectedDevice

    var body: some View {
        HStack {
            Image(systemName: device.platform.systemImage)
                .font(.title2)
                .foregroundStyle(device.platform.color)
                .frame(width: 40)
            VStack(alignment: .leading) {
                Text(device.name)
                    .font(.body)
                Text(device.platform.displayName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(device.status.rawValue)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    device.status == .online ? Color.green.opacity(0.2) : Color.gray.opacity(0.2),
                    in: Capsule()
                )
                .foregroundStyle(device.status == .online ? .green : .secondary)
        }
    }
}

// MARK: - Performance Monitor View

struct PerformanceMonitorView: View {
    @Environment(CompanionCloudService.self) private var cloudService

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 300))], spacing: 16) {
                MetricCard(title: "Cloud Latency", value: "\(Int(cloudService.latencyMs))ms", icon: "network", color: .blue)
                MetricCard(title: "Sync Rate", value: "\(cloudService.syncRate)/s", icon: "arrow.triangle.2.circlepath", color: .green)
                MetricCard(title: "Bandwidth", value: cloudService.bandwidthUsage, icon: "antenna.radiowaves.left.and.right", color: .purple)
                MetricCard(title: "Active Connections", value: "5", icon: "link", color: .orange)
            }
            .padding()
        }
        .navigationTitle("Performance")
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.system(size: 36, weight: .bold, design: .rounded))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Security Overview View

struct SecurityOverviewView: View {
    var body: some View {
        List {
            Section("Encryption Status") {
                HStack {
                    Label("End-to-End Encryption", systemImage: "lock.fill")
                    Spacer()
                    Text("Active").foregroundStyle(.green)
                }
                HStack {
                    Label("Secure Enclave", systemImage: "cpu")
                    Spacer()
                    Text("Available").foregroundStyle(.green)
                }
                HStack {
                    Label("Key Rotation", systemImage: "key.fill")
                    Spacer()
                    Text("Last: 2h ago").foregroundStyle(.secondary)
                }
            }

            Section("OSI Layer Security") {
                ForEach(["Application", "Presentation", "Session", "Transport", "Network", "Data Link", "Physical"], id: \.self) { layer in
                    HStack {
                        Text(layer)
                        Spacer()
                        Text("Secure")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.2), in: Capsule())
                            .foregroundStyle(.green)
                    }
                }
            }

            Section("Privacy Zones") {
                HStack {
                    Label("Active Zones", systemImage: "shield.fill")
                    Spacer()
                    Text("3")
                }
                HStack {
                    Label("Audit Log Entries", systemImage: "doc.text")
                    Spacer()
                    Text("1,247")
                }
            }
        }
        .navigationTitle("Security")
    }
}

// MARK: - Device Manager View

struct DeviceManagerView: View {
    @Environment(SessionManager.self) private var sessionManager

    var body: some View {
        List {
            ForEach(sessionManager.connectedDevices) { device in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: device.platform.systemImage)
                            .font(.title)
                            .foregroundStyle(device.platform.color)
                        VStack(alignment: .leading) {
                            Text(device.name)
                                .font(.headline)
                            Text(device.platform.displayName)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(device.status.rawValue)
                            .foregroundStyle(device.status == .online ? .green : .secondary)
                    }

                    HStack(spacing: 8) {
                        Button("Screenshot", systemImage: "camera") {
                            // Remote screenshot
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)

                        Button("Sync", systemImage: "arrow.triangle.2.circlepath") {
                            // Force sync
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)

                        Button("Reset View", systemImage: "arrow.counterclockwise") {
                            // Reset view
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Devices")
    }
}

// MARK: - Cloud Settings View

struct CloudSettingsView: View {
    @Environment(CompanionCloudService.self) private var cloudService

    var body: some View {
        List {
            Section("Connection") {
                HStack {
                    Label("Status", systemImage: "cloud")
                    Spacer()
                    Text(cloudService.isConnected ? "Connected" : "Disconnected")
                        .foregroundStyle(cloudService.isConnected ? .green : .red)
                }
                if let lastSync = cloudService.lastSyncTime {
                    HStack {
                        Label("Last Sync", systemImage: "clock")
                        Spacer()
                        Text(lastSync, style: .relative)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section("Server") {
                LabeledContent("Endpoint", value: "api.doge-spatial.example.com")
                LabeledContent("Protocol", value: "WebSocket + REST")
                LabeledContent("TLS", value: "1.3")
            }

            Section("Storage") {
                LabeledContent("Used", value: "2.4 GB")
                LabeledContent("Available", value: "47.6 GB")
                LabeledContent("Plan", value: "Team Pro")
            }
        }
        .navigationTitle("Cloud Settings")
    }
}

// MARK: - Preferences View

struct PreferencesView: View {
    @State private var autoSync = true
    @State private var notifications = true
    @State private var hapticFeedback = true
    @State private var darkMode = true

    var body: some View {
        List {
            Section("Sync") {
                Toggle("Auto-Sync", isOn: $autoSync)
                Toggle("Push Notifications", isOn: $notifications)
            }

            Section("Interface") {
                Toggle("Haptic Feedback", isOn: $hapticFeedback)
                Toggle("Dark Mode", isOn: $darkMode)
            }

            Section("About") {
                LabeledContent("Version", value: "1.0.0")
                LabeledContent("Build", value: "2026.03.02")
                LabeledContent("Platform", value: platformName)
            }
        }
        .navigationTitle("Preferences")
    }

    private var platformName: String {
        #if os(iOS)
        return "iPadOS"
        #elseif os(tvOS)
        return "tvOS"
        #else
        return "Unknown"
        #endif
    }
}

// MARK: - Notification Service

@Observable
final class NotificationService {
    var isPermissionGranted = false

    func requestPermissions() async {
        // In production, request UNUserNotificationCenter permissions
        isPermissionGranted = true
    }
}
