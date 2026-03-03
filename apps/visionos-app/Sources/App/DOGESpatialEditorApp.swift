// DOGESpatialEditorApp.swift
// DOGE Spatial Explorer — visionOS Spatial Editing Studio
//
// A FaceTime-integrated live editing studio with spatial editing,
// privacy, and collaboration as the core focus.
//
// Targets: Apple Vision Pro (visionOS 2+)
// Frameworks: SwiftUI, RealityKit, SharePlay, GroupActivities, ARKit

import SwiftUI
import RealityKit
import GroupActivities

/// The main entry point for the DOGE Spatial Editor on visionOS.
///
/// This app provides three distinct presentation modes:
/// - **Window**: A 2D management dashboard for project browsing and settings.
/// - **Volume**: A bounded 3D viewport for previewing and light editing.
/// - **ImmersiveSpace**: A full spatial editing environment for collaborative work.
@main
struct DOGESpatialEditorApp: App {

    // MARK: - State

    @State private var appModel = AppModel()
    @State private var collaborationManager = CollaborationManager()
    @State private var privacyManager = PrivacyManager()
    @State private var sceneManager = SceneGraphManager()

    // MARK: - Body

    var body: some Scene {

        // ── Window Group: 2D Dashboard ──────────────────────────────────
        WindowGroup {
            ContentView()
                .environment(appModel)
                .environment(collaborationManager)
                .environment(privacyManager)
                .environment(sceneManager)
        }
        .windowStyle(.automatic)
        .defaultSize(width: 1280, height: 960)

        // ── Volume: 3D Preview Viewport ─────────────────────────────────
        WindowGroup(id: "spatial-preview") {
            SpatialPreviewView()
                .environment(appModel)
                .environment(sceneManager)
        }
        .windowStyle(.volumetric)
        .defaultSize(width: 0.8, height: 0.6, depth: 0.8, in: .meters)

        // ── Immersive Space: Full Spatial Editor ────────────────────────
        ImmersiveSpace(id: "spatial-editor") {
            SpatialEditorView()
                .environment(appModel)
                .environment(collaborationManager)
                .environment(privacyManager)
                .environment(sceneManager)
        }
        .immersionStyle(selection: $appModel.immersionStyle, in: .mixed, .progressive, .full)
    }
}

// MARK: - App Model

/// Central application state observable across all scenes.
@Observable
final class AppModel {

    /// Current immersion style for the spatial editor.
    var immersionStyle: ImmersionStyle = .mixed

    /// Whether the immersive space is currently open.
    var isImmersiveSpaceOpen = false

    /// Whether the spatial preview volume is open.
    var isPreviewVolumeOpen = false

    /// Current editing mode.
    var editingMode: EditingMode = .select

    /// Active project identifier.
    var activeProjectID: String?

    /// Current user's display name.
    var currentUserName: String = "Anonymous"

    /// Device performance tier (auto-detected from Apple Silicon generation).
    var performanceTier: PerformanceTier = .standard

    /// Whether the app is connected to the cloud backend.
    var isCloudConnected = false

    /// Active FaceTime / SharePlay session status.
    var collaborationStatus: CollaborationStatus = .disconnected
}

// MARK: - Enums

/// Editing modes available in the spatial editor.
enum EditingMode: String, CaseIterable, Identifiable {
    case select = "Select"
    case translate = "Translate"
    case rotate = "Rotate"
    case scale = "Scale"
    case sculpt = "Sculpt"
    case paint = "Paint"
    case measure = "Measure"
    case annotate = "Annotate"

    var id: String { rawValue }

    var systemImage: String {
        switch self {
        case .select: return "cursorarrow"
        case .translate: return "arrow.up.and.down.and.arrow.left.and.right"
        case .rotate: return "arrow.triangle.2.circlepath"
        case .scale: return "arrow.up.left.and.arrow.down.right"
        case .sculpt: return "wand.and.stars"
        case .paint: return "paintbrush.pointed"
        case .measure: return "ruler"
        case .annotate: return "text.bubble"
        }
    }
}

/// Performance tiers based on Apple Silicon generation.
enum PerformanceTier: String {
    case standard   // M2
    case enhanced   // M3
    case ultra      // M4+

    var maxEntityCount: Int {
        switch self {
        case .standard: return 50_000
        case .enhanced: return 150_000
        case .ultra:    return 500_000
        }
    }

    var maxTextureResolution: Int {
        switch self {
        case .standard: return 4096
        case .enhanced: return 8192
        case .ultra:    return 16384
        }
    }
}

/// Collaboration connection status.
enum CollaborationStatus: String {
    case disconnected = "Disconnected"
    case connecting = "Connecting…"
    case connected = "Connected"
    case sharePlayActive = "SharePlay Active"
    case facetimeLive = "FaceTime Live"
}
