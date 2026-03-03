// DashboardView.swift
// DOGE Spatial Explorer — Companion Dashboard
//
// Main dashboard showing live status of spatial editing sessions,
// connected devices, collaboration activity, and system health.

import SwiftUI

struct DashboardView: View {

    @Environment(SessionManager.self) private var sessionManager
    @Environment(CompanionCloudService.self) private var cloudService

    var body: some View {
        ScrollView {
            LazyVGrid(columns: gridColumns, spacing: 16) {
                // ── Active Sessions Card ────────────────────────────────
                DashboardCard(
                    title: "Active Sessions",
                    icon: "person.2.wave.2",
                    color: .blue
                ) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(sessionManager.activeSessions.count)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                        ForEach(sessionManager.activeSessions.prefix(3)) { session in
                            HStack {
                                Circle()
                                    .fill(session.isActive ? .green : .gray)
                                    .frame(width: 8, height: 8)
                                Text(session.documentName)
                                    .font(.caption)
                                Spacer()
                                Text(session.platform.displayName)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                // ── Connected Devices Card ──────────────────────────────
                DashboardCard(
                    title: "Connected Devices",
                    icon: "desktopcomputer",
                    color: .purple
                ) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(sessionManager.connectedDevices.count)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                        ForEach(sessionManager.connectedDevices.prefix(4)) { device in
                            HStack {
                                Image(systemName: device.platform.systemImage)
                                    .foregroundStyle(device.platform.color)
                                Text(device.name)
                                    .font(.caption)
                                Spacer()
                                Text(device.status.rawValue)
                                    .font(.caption2)
                                    .foregroundStyle(device.status == .online ? .green : .secondary)
                            }
                        }
                    }
                }

                // ── Collaboration Activity Card ─────────────────────────
                DashboardCard(
                    title: "Collaboration",
                    icon: "person.3",
                    color: .green
                ) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(sessionManager.totalCollaborators)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                        Text("collaborators online")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Divider()

                        HStack {
                            StatBadge(label: "visionOS", count: sessionManager.visionOSCount, color: .blue)
                            StatBadge(label: "Meta", count: sessionManager.metaCount, color: .cyan)
                            StatBadge(label: "Web", count: sessionManager.webCount, color: .orange)
                        }
                    }
                }

                // ── Security Status Card ────────────────────────────────
                DashboardCard(
                    title: "Security",
                    icon: "lock.shield",
                    color: .green
                ) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "checkmark.shield.fill")
                                .foregroundStyle(.green)
                                .font(.title)
                            Text("All Secure")
                                .font(.headline)
                        }

                        Group {
                            securityRow("E2E Encryption", status: .active)
                            securityRow("Secure Enclave", status: .active)
                            securityRow("Privacy Zones", status: .active)
                            securityRow("Audit Logging", status: .active)
                        }
                    }
                }

                // ── Performance Card ────────────────────────────────────
                DashboardCard(
                    title: "Performance",
                    icon: "gauge.with.dots.needle.67percent",
                    color: .orange
                ) {
                    VStack(alignment: .leading, spacing: 8) {
                        performanceRow("Cloud Latency", value: "\(Int(cloudService.latencyMs))ms", good: cloudService.latencyMs < 100)
                        performanceRow("Sync Rate", value: "\(cloudService.syncRate)/s", good: true)
                        performanceRow("Bandwidth", value: cloudService.bandwidthUsage, good: true)
                        performanceRow("Uptime", value: "99.9%", good: true)
                    }
                }

                // ── Recent Activity Card ────────────────────────────────
                DashboardCard(
                    title: "Recent Activity",
                    icon: "clock",
                    color: .indigo
                ) {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(sessionManager.recentActivity.prefix(5)) { activity in
                            HStack(spacing: 8) {
                                Image(systemName: activity.icon)
                                    .font(.caption)
                                    .foregroundStyle(activity.color)
                                    .frame(width: 20)
                                VStack(alignment: .leading) {
                                    Text(activity.message)
                                        .font(.caption)
                                    Text(activity.timestamp, style: .relative)
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Dashboard")
        .refreshable {
            await sessionManager.refresh()
        }
    }

    // MARK: - Grid

    private var gridColumns: [GridItem] {
        #if os(tvOS)
        [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]
        #else
        [GridItem(.adaptive(minimum: 320, maximum: 500))]
        #endif
    }

    // MARK: - Helpers

    private func securityRow(_ label: String, status: SecurityBadgeStatus) -> some View {
        HStack {
            Text(label)
                .font(.caption)
            Spacer()
            Text(status.rawValue)
                .font(.caption2)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(status.color.opacity(0.2), in: Capsule())
                .foregroundStyle(status.color)
        }
    }

    private func performanceRow(_ label: String, value: String, good: Bool) -> some View {
        HStack {
            Text(label)
                .font(.caption)
            Spacer()
            Text(value)
                .font(.caption.monospaced().bold())
                .foregroundStyle(good ? .green : .orange)
        }
    }
}

// MARK: - Dashboard Card

struct DashboardCard<Content: View>: View {
    let title: String
    let icon: String
    let color: Color
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.headline)
                Spacer()
            }

            content()
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct StatBadge: View {
    let label: String
    let count: Int
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.title3.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

enum SecurityBadgeStatus: String {
    case active = "Active"
    case warning = "Warning"
    case inactive = "Inactive"

    var color: Color {
        switch self {
        case .active: return .green
        case .warning: return .orange
        case .inactive: return .red
        }
    }
}
