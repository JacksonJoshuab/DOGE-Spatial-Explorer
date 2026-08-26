import EndlessEquatorCore
import Foundation
import SwiftUI

public struct RideNavigationView: View {
    @Bindable private var model: ExpeditionModel
    @State private var showVerification = false
    @State private var showGPXImport = false
    @State private var showPairing = false
    @State private var showSupport = false

    public init(model: ExpeditionModel) { self.model = model }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                NavigationMapView(
                    route: model.routeEngine.plan,
                    areas: model.areas,
                    selectedAreaID: model.selectedAreaID,
                    onSelectArea: { model.selectedAreaID = $0 }
                )
                turnCard
                    .padding()
            }
            .navigationTitle("Endless Equator")
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button("Import GPX") { showGPXImport = true }
                    Button("Verify") { showVerification = true }
                    Button("Pair") { showPairing = true }
                    Button {
                        showSupport = true
                    } label: {
                        Label("Emergency and support", systemImage: "cross.case.fill")
                    }
                    Button {
                        model.speakCurrentTurn()
                    } label: {
                        Label("Speak turn", systemImage: "speaker.wave.2")
                    }
                }
            }
            .sheet(isPresented: $showVerification) {
                RouteVerificationView(route: model.routeEngine.plan)
            }
            .sheet(isPresented: $showGPXImport) {
                GPXImportView(model: model)
            }
            .sheet(isPresented: $showPairing) {
                PeerPairingView(service: model.peerSync)
            }
            .sheet(isPresented: $showSupport) {
                EmergencySupportView(model: model)
            }
            .task {
                if !ProcessInfo.processInfo.arguments.contains("--ui-testing") {
                    model.beginLocationUpdates()
                }
            }
            .alert("Expedition notice", isPresented: Binding(
                get: { model.alertMessage != nil },
                set: { if !$0 { model.alertMessage = nil } }
            )) { Button("OK", role: .cancel) {} } message: { Text(model.alertMessage ?? "") }
        }
    }

    private var turnCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(
                    model.routeEngine.snapshot.mode == .operational ? "VERIFIED ROUTE" : "PLANNING PREVIEW",
                    systemImage: model.routeEngine.snapshot.mode == .operational
                        ? "checkmark.shield"
                        : "lock.trianglebadge.exclamationmark"
                )
                .font(.caption.bold())
                Spacer()
                if let distance = model.routeEngine.snapshot.distanceToManeuverMeters {
                    Text(
                        Measurement(value: distance, unit: UnitLength.meters)
                            .formatted(.measurement(width: .abbreviated, usage: .road))
                    )
                    .monospacedDigit()
                }
            }
            Text(model.routeEngine.activeManeuver?.instruction ?? "Load a route")
                .font(.title2.bold())
                .minimumScaleFactor(0.7)
            if model.routeEngine.snapshot.isOffRoute {
                Label(
                    "Off route — stop safely and contact support. Do not improvise a trail.",
                    systemImage: "exclamationmark.triangle.fill"
                )
                .foregroundStyle(.red)
                Button("Open emergency and support card") { showSupport = true }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
            }
            HStack {
                Button(model.routeEngine.isRunning ? "Stop guidance" : "Start verified guidance") {
                    if model.routeEngine.isRunning {
                        model.routeEngine.stop()
                        model.voiceGuidance.stop()
                    } else {
                        do { try model.routeEngine.start() }
                        catch { model.alertMessage = error.localizedDescription }
                    }
                }
                .buttonStyle(.borderedProminent)
                Button("Emergency / support") { showSupport = true }
                    .buttonStyle(.bordered)
            }
        }
        .padding(18)
        .endlessEquatorGlassCard(cornerRadius: 24)
    }
}

private struct EmergencySupportView: View {
    @Bindable var model: ExpeditionModel
    @Environment(\.dismiss) private var dismiss

    private var locationSummary: String {
        guard let location = model.locationService.latestLocation else {
            return "Endless Equator support check-in. Current device location is unavailable. Route: \(model.routeEngine.plan.name)."
        }
        return String(
            format: "Endless Equator support check-in. Route: %@. Position: %.6f, %.6f. Location timestamp: %@.",
            model.routeEngine.plan.name,
            location.coordinate.latitude,
            location.coordinate.longitude,
            location.timestamp.formatted(date: .numeric, time: .standard)
        )
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Immediate actions") {
                    Label("Stop in a safe place and move clear of traffic or terrain exposure.", systemImage: "stop.circle.fill")
                    Label("Use the expedition's configured satellite or phone emergency channel when urgent help is needed.", systemImage: "antenna.radiowaves.left.and.right")
                    Text("This app does not replace local emergency services, a guide, medical direction, or the expedition communications plan.")
                        .font(.caption)
                }
                Section("Current device position") {
                    if let location = model.locationService.latestLocation {
                        LabeledContent(
                            "Coordinates",
                            value: String(format: "%.6f, %.6f", location.coordinate.latitude, location.coordinate.longitude)
                        )
                        LabeledContent(
                            "Age",
                            value: "\(Int(max(0, Date().timeIntervalSince(location.timestamp)))) seconds"
                        )
                        LabeledContent(
                            "Accuracy",
                            value: "±\(Int(max(0, location.horizontalAccuracy))) m"
                        )
                    } else {
                        Label("No current location fix", systemImage: "location.slash")
                            .foregroundStyle(.orange)
                    }
                    ShareLink(item: locationSummary) {
                        Label("Share support check-in", systemImage: "square.and.arrow.up")
                    }
                }
                Section("Paired support") {
                    LabeledContent("Connected devices", value: "\(model.peerSync.connectedPeers.count)")
                    Button("Send paired support check-in") {
                        model.sendSupportCheckIn()
                    }
                    .disabled(model.peerSync.connectedPeers.isEmpty)
                    if model.peerSync.connectedPeers.isEmpty {
                        Text("No nearby support device is connected. Use the separately briefed communications plan.")
                            .font(.caption)
                    }
                }
                Section("Navigation state") {
                    LabeledContent("Route", value: model.routeEngine.plan.name)
                    LabeledContent("Mode", value: model.routeEngine.snapshot.mode.rawValue)
                    LabeledContent(
                        "Maneuver",
                        value: model.routeEngine.activeManeuver?.instruction ?? "Unavailable"
                    )
                    LabeledContent(
                        "Off route",
                        value: model.routeEngine.snapshot.isOffRoute ? "Yes" : "No"
                    )
                }
            }
            .navigationTitle("Emergency & Support")
            .toolbar { Button("Done") { dismiss() } }
        }
    }
}
