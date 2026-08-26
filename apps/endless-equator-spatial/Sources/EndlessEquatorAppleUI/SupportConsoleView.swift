import EndlessEquatorCore
import SwiftUI

public struct SupportConsoleView: View {
    @Bindable private var model: ExpeditionModel
    @State private var guideQuestion = "What should the support crew verify here?"
    @State private var showGPXImport = false
    @State private var showPairing = false

    public init(model: ExpeditionModel) { self.model = model }

    public var body: some View {
        NavigationSplitView {
            List(selection: $model.selectedAreaID) {
                Section("Route") {
                    Label(model.routeEngine.plan.name, systemImage: "map")
                    Label(model.routeEngine.plan.verification.state.rawValue, systemImage: "checkmark.shield")
                }
                Section("Rider sync") {
                    TimelineView(.periodic(from: .now, by: 5)) { context in
                        if let packet = model.syncedPacket {
                            RiderPacketSummary(packet: packet, now: context.date)
                        } else if let packet = model.peerSync.latestPacket {
                            VStack(alignment: .leading, spacing: 5) {
                                Label(
                                    packet.routeID == model.routeEngine.plan.id
                                        ? "Rider data stale"
                                        : "Rider is using a different route",
                                    systemImage: "clock.badge.exclamationmark"
                                )
                                .foregroundStyle(.orange)
                                Text("No maneuver is displayed until a fresh packet matches this support console's route.")
                                    .font(.caption2)
                            }
                        } else {
                            Label("No rider packet received", systemImage: "antenna.radiowaves.left.and.right.slash")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                Section("Areas of interest") {
                    ForEach(model.areas) { area in
                        Label(area.name, systemImage: area.category.systemImage).tag(area.id)
                    }
                }
            }
            .navigationTitle("Support Console")
            .toolbar {
                Button("Import GPX") { showGPXImport = true }
                Button("Pair devices") { showPairing = true }
            }
        } content: {
            NavigationMapView(
                route: model.routeEngine.plan,
                areas: model.areas,
                selectedAreaID: model.selectedAreaID,
                onSelectArea: { model.selectedAreaID = $0 }
            )
        } detail: {
            if let area = model.selectedArea {
                AreaDetailView(area: area, webBaseURL: model.webBaseURL)
                    .safeAreaInset(edge: .bottom) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                TextField("Ask the guide", text: $guideQuestion)
                                Button("Refresh weather") {
                                    Task { await model.refreshWeather() }
                                }
                            }
                            Button("Ask consent-forward AI guide") {
                                Task { await model.askGuide(guideQuestion) }
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(guideQuestion.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                            if let weather = model.latestWeather {
                                Label(
                                    "\(weather.condition), \(Int(weather.temperatureCelsius))°C · observed \(weather.observedAt.formatted(date: .omitted, time: .shortened))",
                                    systemImage: "cloud.sun"
                                )
                                .font(.caption)
                            }

                            if let response = model.selectedAreaGuideResponse {
                                ForEach(response.warnings, id: \.self) {
                                    Label($0, systemImage: "exclamationmark.triangle.fill")
                                        .foregroundStyle(.orange)
                                }
                                Text(response.shortCard).font(.callout)
                            }
                        }
                        .padding()
                        .endlessEquatorGlassCard(cornerRadius: 20)
                        .padding()
                    }
            } else {
                ContentUnavailableView("Select an area", systemImage: "mappin.and.ellipse")
            }
        }
        .sheet(isPresented: $showGPXImport) { GPXImportView(model: model) }
        .sheet(isPresented: $showPairing) { PeerPairingView(service: model.peerSync) }
        .alert("Support console notice", isPresented: Binding(
            get: { model.alertMessage != nil },
            set: { if !$0 { model.alertMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.alertMessage ?? "")
        }
    }
}

private struct RiderPacketSummary: View {
    let packet: NavigationSyncPacket
    let now: Date

    private var ageSeconds: TimeInterval {
        max(0, now.timeIntervalSince(packet.generatedAt))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Label("Rider data current", systemImage: "checkmark.circle")
                .foregroundStyle(.green)
            if let instruction = packet.maneuverInstruction {
                Text(instruction).font(.caption.bold())
            }
            HStack {
                if let speed = packet.speedMetersPerSecond {
                    Text("\(Int(speed * 3.6)) km/h")
                }
                Text(packet.motionSafetyState.rawValue)
                Text("\(Int(ageSeconds))s ago")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            if let weather = packet.weather {
                Text("Rider weather: \(weather.condition), \(Int(weather.temperatureCelsius))°C")
                    .font(.caption2)
            }
        }
    }
}
