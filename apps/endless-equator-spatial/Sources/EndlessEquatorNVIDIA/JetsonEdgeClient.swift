import EndlessEquatorCore
import Foundation

public struct EdgeHazardRequest: Codable, Sendable {
    public let areaID: String
    public let capturedAt: Date
    public let imageJPEG: Data
    public let operatorNote: String?
}

public struct EdgeHazardResult: Codable, Hashable, Sendable {
    public let labels: [String]
    public let confidence: Double
    public let advisory: String
    public let modelVersion: String
}

public actor JetsonEdgeClient {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL) {
        self.baseURL = baseURL
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 8
        configuration.timeoutIntervalForResource = 15
        configuration.waitsForConnectivity = false
        self.session = URLSession(configuration: configuration)
    }

    public func classifySelectedFrame(_ requestValue: EdgeHazardRequest) async throws -> EdgeHazardResult {
        var request = URLRequest(url: baseURL.appending(path: "v1/hazards"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(requestValue)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw JetsonEdgeError.invalidResponse
        }
        return try JSONDecoder().decode(EdgeHazardResult.self, from: data)
    }
}

public enum JetsonEdgeError: LocalizedError {
    case invalidResponse
    public var errorDescription: String? { "The Jetson edge node did not return a valid hazard-analysis result." }
}
