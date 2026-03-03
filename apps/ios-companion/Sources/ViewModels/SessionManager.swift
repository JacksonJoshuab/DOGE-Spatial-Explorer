// SessionManager.swift
// DOGE Spatial Explorer — Companion Session Manager
//
// Manages connections to active spatial editing sessions,
// tracks device status, and provides remote control capabilities.

import Foundation
import Observation

@Observable
final class SessionManager {

    // MARK: - State

    var activeSessions: [SpatialSession] = []
    var connectedDevices: [ConnectedDevice] = []
    var recentActivity: [ActivityItem] = []

    var totalCollaborators: Int { activeSessions.reduce(0) { $0 + $1.collaboratorCount } }
    var visionOSCount: Int { connectedDevices.filter { $0.platform == .visionOS }.count }
    var metaCount: Int { connectedDevices.filter { $0.platform == .metaQuest }.count }
    var webCount: Int { connectedDevices.filter { $0.platform == .web }.count }

    // MARK: - Initialization

    init() {
        // Load demo data for development
        loadDemoData()
    }

    // MARK: - Public API

    func refresh() async {
        // In production, fetch from cloud API
        try? await Task.sleep(for: .seconds(1))
    }

    func startSession(documentID: UUID, platform: DevicePlatform) async throws {
        let session = SpatialSession(
            id: UUID(),
            documentID: documentID,
            documentName: "New Session",
            platform: platform,
            isActive: true,
            collaboratorCount: 1,
            startedAt: Date()
        )
        activeSessions.append(session)
    }

    func endSession(_ sessionID: UUID) {
        activeSessions.removeAll { $0.id == sessionID }
    }

    func sendRemoteCommand(_ command: RemoteCommand, to deviceID: UUID) async throws {
        // Send command via cloud WebSocket
        let activity = ActivityItem(
            id: UUID(),
            icon: "arrow.right.circle",
            message: "Sent \(command.rawValue) to device",
            color: .blue,
            timestamp: Date()
        )
        recentActivity.insert(activity, at: 0)
    }

    // MARK: - Demo Data

    private func loadDemoData() {
        activeSessions = [
            SpatialSession(
                id: UUID(), documentID: UUID(),
                documentName: "Z-Pinch Plasma Simulation",
                platform: .visionOS, isActive: true,
                collaboratorCount: 3, startedAt: Date().addingTimeInterval(-3600)
            ),
            SpatialSession(
                id: UUID(), documentID: UUID(),
                documentName: "City Infrastructure Model",
                platform: .metaQuest, isActive: true,
                collaboratorCount: 2, startedAt: Date().addingTimeInterval(-1800)
            ),
        ]

        connectedDevices = [
            ConnectedDevice(id: UUID(), name: "Vision Pro (Office)", platform: .visionOS, status: .online),
            ConnectedDevice(id: UUID(), name: "Quest 3 (Lab)", platform: .metaQuest, status: .online),
            ConnectedDevice(id: UUID(), name: "iPad Pro 13\"", platform: .iPadOS, status: .online),
            ConnectedDevice(id: UUID(), name: "Apple TV 4K", platform: .tvOS, status: .idle),
            ConnectedDevice(id: UUID(), name: "Blender Workstation", platform: .desktop, status: .online),
        ]

        recentActivity = [
            ActivityItem(id: UUID(), icon: "person.badge.plus", message: "Alex joined Z-Pinch session", color: .green, timestamp: Date().addingTimeInterval(-120)),
            ActivityItem(id: UUID(), icon: "cube.fill", message: "New model imported: plasma_column.usdz", color: .blue, timestamp: Date().addingTimeInterval(-300)),
            ActivityItem(id: UUID(), icon: "lock.fill", message: "Privacy zone created in City model", color: .purple, timestamp: Date().addingTimeInterval(-600)),
            ActivityItem(id: UUID(), icon: "arrow.triangle.2.circlepath", message: "Cloud sync completed", color: .green, timestamp: Date().addingTimeInterval(-900)),
            ActivityItem(id: UUID(), icon: "exclamationmark.triangle", message: "High latency detected on Quest 3", color: .orange, timestamp: Date().addingTimeInterval(-1200)),
        ]
    }
}

// MARK: - Models

struct SpatialSession: Identifiable {
    let id: UUID
    let documentID: UUID
    let documentName: String
    let platform: DevicePlatform
    var isActive: Bool
    var collaboratorCount: Int
    let startedAt: Date
}

struct ConnectedDevice: Identifiable {
    let id: UUID
    let name: String
    let platform: DevicePlatform
    var status: DeviceStatus
}

struct ActivityItem: Identifiable {
    let id: UUID
    let icon: String
    let message: String
    let color: SwiftUI.Color
    let timestamp: Date
}

enum DevicePlatform: String, CaseIterable {
    case visionOS, metaQuest, iPadOS, tvOS, desktop, web

    var displayName: String {
        switch self {
        case .visionOS: return "Vision Pro"
        case .metaQuest: return "Meta Quest"
        case .iPadOS: return "iPad"
        case .tvOS: return "Apple TV"
        case .desktop: return "Desktop"
        case .web: return "Web"
        }
    }

    var systemImage: String {
        switch self {
        case .visionOS: return "visionpro"
        case .metaQuest: return "headphones"
        case .iPadOS: return "ipad"
        case .tvOS: return "appletv"
        case .desktop: return "desktopcomputer"
        case .web: return "globe"
        }
    }

    var color: SwiftUI.Color {
        switch self {
        case .visionOS: return .blue
        case .metaQuest: return .cyan
        case .iPadOS: return .purple
        case .tvOS: return .indigo
        case .desktop: return .gray
        case .web: return .orange
        }
    }
}

enum DeviceStatus: String {
    case online = "Online"
    case idle = "Idle"
    case offline = "Offline"
}

enum RemoteCommand: String {
    case screenshot, startRecording, stopRecording
    case resetView, togglePassthrough, togglePrivacyZones
    case syncNow, exportScene
}
