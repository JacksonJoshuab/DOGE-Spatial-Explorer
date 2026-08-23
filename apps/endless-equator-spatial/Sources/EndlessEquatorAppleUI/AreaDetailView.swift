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
                GroupBox("September") { Text(area.seasonalWeather.september).frame(maxWidth: .infinity, alignment: .leading) }
                GroupBox("October") { Text(area.seasonalWeather.october).frame(maxWidth: .infinity, alignment: .leading) }
                GroupBox("Safety") {
                    ForEach(area.safetyNotes, id: \.self) { Label($0, systemImage: "exclamationmark.shield") }
                }
                ForEach(area.sections) { section in
                    GroupBox(section.title) { Text(section.body).frame(maxWidth: .infinity, alignment: .leading) }
                }
                AreaWebEnvironment(baseURL: webBaseURL, slug: area.slug)
                    .frame(minHeight: 520)
                    .clipShape(.rect(cornerRadius: 18))
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
            Label(state.rawValue, systemImage: state == .verified ? "checkmark.seal.fill" : "exclamationmark.triangle.fill")
                .font(.caption.bold())
            Text(note).font(.caption)
        }
        .padding(12)
        .background(state == .verified ? Color.green.opacity(0.16) : Color.orange.opacity(0.18), in: .rect(cornerRadius: 12))
    }
}

public struct AreaWebEnvironment: UIViewRepresentable {
    public let baseURL: URL
    public let slug: String

    public init(baseURL: URL, slug: String) {
        self.baseURL = baseURL
        self.slug = slug
    }

    public func makeCoordinator() -> Coordinator { Coordinator(allowedHost: baseURL.host) }

    public func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        return webView
    }

    public func updateUIView(_ webView: WKWebView, context: Context) {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "area", value: slug)]
        guard let url = components?.url, webView.url != url else { return }
        webView.load(URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 15))
    }

    public final class Coordinator: NSObject, WKNavigationDelegate {
        private let allowedHost: String?
        init(allowedHost: String?) { self.allowedHost = allowedHost }

        public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard let host = navigationAction.request.url?.host else { return .cancel }
            return host == allowedHost ? .allow : .cancel
        }
    }
}
