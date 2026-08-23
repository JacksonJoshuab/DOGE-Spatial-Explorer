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
                        VStack(spacing: 8) {
                            TextField("Ask the guide", text: $guideQuestion)
                            Button("Ask consent-forward AI guide") {
                                Task { await model.askGuide(guideQuestion) }
                            }
                            .buttonStyle(.borderedProminent)
                            if let response = model.lastGuideResponse {
                                Text(response.shortCard).font(.callout)
                                ForEach(response.warnings, id: \.self) { Label($0, systemImage: "exclamationmark.triangle") }
                            }
                        }
                        .padding()
                        .glassEffect(.regular, in: .rect(cornerRadius: 20))
                        .padding()
                    }
            } else {
                ContentUnavailableView("Select an area", systemImage: "mappin.and.ellipse")
            }
        }
        .sheet(isPresented: $showGPXImport) { GPXImportView(model: model) }
        .sheet(isPresented: $showPairing) { PeerPairingView(service: model.peerSync) }
    }
}
