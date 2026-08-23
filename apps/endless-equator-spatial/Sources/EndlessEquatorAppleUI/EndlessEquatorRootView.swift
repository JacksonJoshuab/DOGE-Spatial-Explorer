import SwiftUI

public struct EndlessEquatorRootView: View {
    @State private var model: ExpeditionModel?
    @State private var startupError: String?

    public init() {}

    public var body: some View {
        Group {
            if let model {
                #if os(visionOS)
                VisionBriefingDashboard(model: model)
                #else
                if UIDevice.current.userInterfaceIdiom == .pad {
                    SupportConsoleView(model: model)
                } else {
                    RideNavigationView(model: model)
                }
                #endif
            } else if let startupError {
                ContentUnavailableView("Could not load expedition", systemImage: "exclamationmark.triangle", description: Text(startupError))
            } else {
                ProgressView("Loading expedition…")
            }
        }
        .task {
            guard model == nil, startupError == nil else { return }
            do { model = try ExpeditionModel() }
            catch { startupError = error.localizedDescription }
        }
    }
}
