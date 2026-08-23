import EndlessEquatorCore
import Foundation
import SwiftUI

public struct RideNavigationView: View {
    @Bindable private var model: ExpeditionModel
    @State private var showVerification = false
    @State private var showGPXImport = false
    @State private var showPairing = false

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
                        model.speakCurrentTurn()
                    } label: { Label("Speak turn", systemImage: "speaker.wave.2") }
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
                Label(model.routeEngine.snapshot.mode == .operational ? "VERIFIED ROUTE" : "PLANNING PREVIEW",
                      systemImage: model.routeEngine.snapshot.mode == .operational ? "checkmark.shield" : "lock.trianglebadge.exclamationmark")
                    .font(.caption.bold())
                Spacer()
                if let distance = model.routeEngine.snapshot.distanceToManeuverMeters {
                    Text(Measurement(value: distance, unit: UnitLength.meters).formatted(.measurement(width: .abbreviated, usage: .road)))
                        .monospacedDigit()
                }
            }
            Text(model.routeEngine.activeManeuver?.instruction ?? "Load a route")
                .font(.title2.bold())
                .minimumScaleFactor(0.7)
            if model.routeEngine.snapshot.isOffRoute {
                Label("Off route — stop safely and contact support. Do not improvise a trail.", systemImage: "exclamationmark.triangle.fill")
                    .foregroundStyle(.red)
            }
            HStack {
                Button(model.routeEngine.isRunning ? "Stop guidance" : "Start verified guidance") {
                    if model.routeEngine.isRunning { model.routeEngine.stop() }
                    else {
                        do { try model.routeEngine.start() }
                        catch { model.alertMessage = error.localizedDescription }
                    }
                }
                .buttonStyle(.borderedProminent)
                Button("Area") { }
                    .buttonStyle(.bordered)
            }
        }
        .padding(18)
        .endlessEquatorGlassCard(cornerRadius: 24)
    }
}
