import EndlessEquatorAppleUI
import SwiftUI

@main
struct EndlessEquatorVisionApp: App {
    @State private var model: ExpeditionModel?

    var body: some Scene {
        WindowGroup {
            if let model { VisionBriefingDashboard(model: model) }
            else { ProgressView().task { model = try? ExpeditionModel() } }
        }
        .defaultSize(width: 1200, height: 900)

        ImmersiveSpace(id: "endless-equator-route") {
            if let model { StationarySpatialRouteView(model: model) }
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
    }
}
