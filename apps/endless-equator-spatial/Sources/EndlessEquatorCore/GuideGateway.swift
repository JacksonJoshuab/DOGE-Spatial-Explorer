import Foundation

public actor GuideGateway {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession? = nil) {
        self.baseURL = baseURL
        if let session {
            self.session = session
        } else {
            let configuration = URLSessionConfiguration.ephemeral
            configuration.timeoutIntervalForRequest = 15
            configuration.timeoutIntervalForResource = 20
            configuration.waitsForConnectivity = false
            self.session = URLSession(configuration: configuration)
        }
    }

    public func ask(_ guideRequest: GuideRequest) async throws -> GuideResponse {
        let url = baseURL.appending(path: "api/guide")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(guideRequest)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw GuideGatewayError.invalidResponse
        }
        return try JSONDecoder().decode(GuideResponse.self, from: data)
    }
}

public enum GuideGatewayError: LocalizedError {
    case invalidResponse

    public var errorDescription: String? { "The expedition guide service did not return a valid response." }
}
