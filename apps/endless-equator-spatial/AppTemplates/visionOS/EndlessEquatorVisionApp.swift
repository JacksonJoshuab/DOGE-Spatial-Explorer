import EndlessEquatorAppleUI
import SwiftUI

@main
struct EndlessEquatorVisionApp: App {
    @State private var model: ExpeditionModel?
    @State private var startupError: String?

    var body: some Scene {
        WindowGroup {
            Group {
                if let model {
                    VisionBriefingDashboard(model: model)
                } else if let startupError {
                    ContentUnavailableView(
                        "Could not load expedition",
                        systemImage: "exclamationmark.triangle",
                        description: Text(startupError)
                    )
                } else {
                    ProgressView("Loading expedition…")
                }
            }
            .task {
                guard model == nil, startupError == nil else { return }
                do {
                    model = try ExpeditionModel()
                } catch {
                    startupError = error.localizedDescription
                }
            }
        }
        .defaultSize(width: 1200, height: 900)

        ImmersiveSpace(id: "endless-equator-route") {
            if let model {
                StationarySpatialRouteView(model: model)
            } else {
                ContentUnavailableView(
                    "Route room unavailable",
                    systemImage: "lock.trianglebadge.exclamationmark",
                    description: Text(startupError ?? "The expedition model has not loaded.")
                )
            }
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
    }
}
