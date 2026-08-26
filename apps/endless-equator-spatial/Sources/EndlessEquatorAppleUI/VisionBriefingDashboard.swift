#if os(visionOS)
import EndlessEquatorCore
import SwiftUI

public struct VisionBriefingDashboard: View {
    @Bindable private var model: ExpeditionModel
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @State private var immersiveOpen = false
    @State private var showPairing = false

    public init(model: ExpeditionModel) { self.model = model }

    public var body: some View {
        NavigationSplitView {
            List(model.areas, selection: $model.selectedAreaID) { area in
                Label(area.name, systemImage: area.category.systemImage).tag(area.id)
            }
            .navigationTitle("Endless Equator")
        } detail: {
            VStack(spacing: 20) {
                if let area = model.selectedArea {
                    AreaDetailView(area: area, webBaseURL: model.webBaseURL)
                }
                TimelineView(.periodic(from: .now, by: 5)) { _ in
                    if let instruction = model.syncedManeuverInstruction {
                        GroupBox("Fresh synced rider maneuver") {
                            Text(instruction).font(.title3.bold())
                        }
                    } else if model.peerSync.latestPacket != nil {
                        GroupBox("Synced rider state unavailable") {
                            Label(
                                "The latest packet is stale or belongs to a different route. No maneuver is displayed.",
                                systemImage: "clock.badge.exclamationmark"
                            )
                            .foregroundStyle(.orange)
                        }
                    }
                }
                Toggle("I am seated or standing still in a safe briefing area", isOn: $model.stationaryOverrideAcknowledged)
                    .toggleStyle(.switch)
                    .padding(.horizontal)
                HStack {
                    Label("Spatial room: \(model.routeEngine.motionSafetyState.rawValue)", systemImage: "figure.stand")
                    Button(immersiveOpen ? "Close route room" : "Open stationary route room") {
                        Task {
                            if immersiveOpen {
                                await dismissImmersiveSpace()
                                immersiveOpen = false
                            } else if model.routeEngine.motionSafetyState.permitsSpatialRouteRoom {
                                let result = await openImmersiveSpace(id: "endless-equator-route")
                                immersiveOpen = result == .opened
                            } else {
                                model.alertMessage = "The mixed-reality route room is locked until the device reports a safe, fresh stationary state."
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    Button("Pair companion") { showPairing = true }
                        .buttonStyle(.bordered)
                }
                .padding()
            }
        }
        .task { model.beginLocationUpdates() }
        .sheet(isPresented: $showPairing) { PeerPairingView(service: model.peerSync) }
        .alert("Spatial briefing notice", isPresented: Binding(
            get: { model.alertMessage != nil },
            set: { if !$0 { model.alertMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.alertMessage ?? "")
        }
    }
}
#endif
