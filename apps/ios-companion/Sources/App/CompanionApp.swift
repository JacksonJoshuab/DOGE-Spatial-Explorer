// CompanionApp.swift
// DOGE Spatial Explorer — iPadOS & tvOS Companion App
//
// Entry point for the companion app that runs on iPad and Apple TV.
// Provides remote management of spatial editing sessions running
// on Apple Vision Pro or Meta Quest devices.

import SwiftUI

@main
struct DOGESpatialCompanionApp: App {

    @State private var sessionManager = SessionManager()
    @State private var cloudService = CompanionCloudService()
    @State private var notificationService = NotificationService()

    var body: some Scene {
        WindowGroup {
            CompanionRootView()
                .environment(sessionManager)
                .environment(cloudService)
                .environment(notificationService)
                .onAppear {
                    Task {
                        await cloudService.connect()
                        await notificationService.requestPermissions()
                    }
                }
        }
        #if os(tvOS)
        .defaultSize(width: 1920, height: 1080)
        #endif

        #if os(iOS)
        // iPad-specific window for asset browser
        WindowGroup(id: "asset-browser") {
            AssetBrowserView()
                .environment(cloudService)
        }
        #endif
    }
}
