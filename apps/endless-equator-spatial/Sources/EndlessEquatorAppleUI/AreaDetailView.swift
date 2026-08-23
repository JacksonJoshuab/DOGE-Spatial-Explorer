import EndlessEquatorCore
import SwiftUI
import WebKit

public struct AreaDetailView: View {
    public let area: AreaOfInterest
    public let webBaseURL: URL

    public init(area: AreaOfInterest, webBaseURL: URL) {
        self.area = area
        self.webBaseURL = webBaseURL
    }

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Label(area.category.rawValue, systemImage: area.category.systemImage)
                    .font(.headline)
                Text(area.name).font(.largeTitle.bold())
                VerificationBadge(state: area.verificationState, note: area.verificationNote)
                Text(area.summary).font(.title3)
                if !area.highwayRefs.isEmpty {
                    LabeledContent("Highway references", value: area.highwayRefs.joined(separator: " · "))
                }
                if let altitude = area.altitudeMeters {
                    LabeledContent("Elevation", value: "\(altitude) m")
                }
                GroupBox("September") {
                    Text(area.seasonalWeather.september)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                GroupBox("October") {
                    Text(area.seasonalWeather.october)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                GroupBox("Safety") {
                    ForEach(area.safetyNotes, id: \.self) {
                        Label($0, systemImage: "exclamationmark.shield")
                    }
                }
                ForEach(area.sections) { section in
                    GroupBox(section.title) {
                        Text(section.body)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                AreaWebEnvironment(baseURL: webBaseURL, slug: area.slug)
                    .frame(minHeight: 520)
                    .clipShape(.rect(cornerRadius: 18))
                    .accessibilityLabel("Web operations environment for \(area.name)")
            }
            .padding()
        }
        .navigationTitle(area.name)
    }
}

private struct VerificationBadge: View {
    let state: VerificationState
    let note: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(
                state.rawValue,
                systemImage: state == .verified
                    ? "checkmark.seal.fill"
                    : "exclamationmark.triangle.fill"
            )
            .font(.caption.bold())
            Text(note).font(.caption)
        }
        .padding(12)
        .background(
            state == .verified
                ? Color.green.opacity(0.16)
                : Color.orange.opacity(0.18),
            in: .rect(cornerRadius: 12)
        )
    }
}

@MainActor
public struct AreaWebEnvironment: View {
    @State private var page: WebPage
    private let targetURL: URL?

    public init(baseURL: URL, slug: String) {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "area", value: slug)]
        targetURL = components?.url

        var configuration = WebPage.Configuration()
        configuration.websiteDataStore = .default()
        let navigationDecider = SameOriginNavigationDecider(baseURL: baseURL)
        _page = State(
            initialValue: WebPage(
                configuration: configuration,
                navigationDecider: navigationDecider
            )
        )
    }

    public var body: some View {
        WebView(page)
            .task(id: targetURL) {
                guard let targetURL else { return }
                page.load(
                    URLRequest(
                        url: targetURL,
                        cachePolicy: .returnCacheDataElseLoad,
                        timeoutInterval: 15
                    )
                )
            }
    }
}

@MainActor
private final class SameOriginNavigationDecider: WebPage.NavigationDeciding {
    private let allowedScheme: String?
    private let allowedHost: String?
    private let allowedPort: Int?

    init(baseURL: URL) {
        let components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        allowedScheme = components?.scheme?.lowercased()
        allowedHost = components?.host?.lowercased()
        allowedPort = components?.port
    }

    func decidePolicy(
        for action: WebPage.NavigationAction,
        preferences: inout WebPage.NavigationPreferences
    ) async -> WKNavigationActionPolicy {
        isAllowed(action.request.url) ? .allow : .cancel
    }

    func decidePolicy(
        for response: WebPage.NavigationResponse
    ) async -> WKNavigationResponsePolicy {
        guard response.canShowMimeType else { return .cancel }
        return isAllowed(response.response.url) ? .allow : .cancel
    }

    private func isAllowed(_ url: URL?) -> Bool {
        guard let url,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else { return false }

        return components.scheme?.lowercased() == allowedScheme &&
            components.host?.lowercased() == allowedHost &&
            components.port == allowedPort
    }
}
