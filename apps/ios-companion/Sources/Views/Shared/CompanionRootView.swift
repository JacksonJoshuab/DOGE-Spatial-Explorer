// CompanionRootView.swift
// DOGE Spatial Explorer — Companion Root View
//
// Platform-adaptive root view that provides different layouts
// for iPadOS (sidebar navigation) and tvOS (tab-based navigation).

import SwiftUI

struct CompanionRootView: View {

    @Environment(SessionManager.self) private var sessionManager
    @Environment(CompanionCloudService.self) private var cloudService

    @State private var selectedTab: CompanionTab = .dashboard

    var body: some View {
        #if os(iOS)
        iPadLayout
        #elseif os(tvOS)
        tvOSLayout
        #else
        iPadLayout
        #endif
    }

    // MARK: - iPadOS Layout

    @ViewBuilder
    private var iPadLayout: some View {
        NavigationSplitView {
            List(selection: $selectedTab) {
                Section("Management") {
                    Label("Dashboard", systemImage: "rectangle.3.group")
                        .tag(CompanionTab.dashboard)
                    Label("Sessions", systemImage: "person.2.wave.2")
                        .tag(CompanionTab.sessions)
                    Label("Projects", systemImage: "folder")
                        .tag(CompanionTab.projects)
                    Label("Assets", systemImage: "photo.on.rectangle")
                        .tag(CompanionTab.assets)
                }

                Section("Monitoring") {
                    Label("Collaborators", systemImage: "person.3")
                        .tag(CompanionTab.collaborators)
                    Label("Performance", systemImage: "gauge.with.dots.needle.33percent")
                        .tag(CompanionTab.performance)
                    Label("Security", systemImage: "lock.shield")
                        .tag(CompanionTab.security)
                }

                Section("Settings") {
                    Label("Devices", systemImage: "desktopcomputer")
                        .tag(CompanionTab.devices)
                    Label("Cloud", systemImage: "cloud")
                        .tag(CompanionTab.cloud)
                    Label("Preferences", systemImage: "gear")
                        .tag(CompanionTab.preferences)
                }
            }
            .navigationTitle("DOGE Spatial")
            .listStyle(.sidebar)
        } detail: {
            detailView(for: selectedTab)
        }
    }

    // MARK: - tvOS Layout

    @ViewBuilder
    private var tvOSLayout: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "rectangle.3.group") }
                .tag(CompanionTab.dashboard)

            SessionListView()
                .tabItem { Label("Sessions", systemImage: "person.2.wave.2") }
                .tag(CompanionTab.sessions)

            ProjectListView()
                .tabItem { Label("Projects", systemImage: "folder") }
                .tag(CompanionTab.projects)

            CollaboratorListView()
                .tabItem { Label("Collaborators", systemImage: "person.3") }
                .tag(CompanionTab.collaborators)

            PerformanceMonitorView()
                .tabItem { Label("Performance", systemImage: "gauge.with.dots.needle.33percent") }
                .tag(CompanionTab.performance)

            SecurityOverviewView()
                .tabItem { Label("Security", systemImage: "lock.shield") }
                .tag(CompanionTab.security)
        }
    }

    // MARK: - Detail View Router

    @ViewBuilder
    private func detailView(for tab: CompanionTab) -> some View {
        switch tab {
        case .dashboard: DashboardView()
        case .sessions: SessionListView()
        case .projects: ProjectListView()
        case .assets: AssetBrowserView()
        case .collaborators: CollaboratorListView()
        case .performance: PerformanceMonitorView()
        case .security: SecurityOverviewView()
        case .devices: DeviceManagerView()
        case .cloud: CloudSettingsView()
        case .preferences: PreferencesView()
        }
    }
}

// MARK: - Tab Enum

enum CompanionTab: String, Hashable, CaseIterable {
    case dashboard, sessions, projects, assets
    case collaborators, performance, security
    case devices, cloud, preferences
}
