import Foundation
#if canImport(CloudXRKit)
import CloudXRKit
#endif

public enum CloudXRCapability {
    public static let pinnedFrameworkRevision = "5cd43e00e6e038d64b03896b00cad53821030b20"
    public static let minimumRecommendedMbps = 100
    public static let preferredMbps = 200

    public static var isFrameworkLinked: Bool {
        #if canImport(CloudXRKit)
        true
        #else
        false
        #endif
    }

    public static var intendedUse: String {
        "Stationary Vision Pro rendering of high-fidelity terrain, Gaussian splats or digital twins; never required for rider navigation."
    }
}

public struct CloudXRDeploymentSettings: Codable, Hashable, Sendable {
    public let serverHost: String
    public let targetBitrateMbps: Int
    public let requiresPrivateNetwork: Bool

    public init(serverHost: String, targetBitrateMbps: Int = 160, requiresPrivateNetwork: Bool = true) {
        self.serverHost = serverHost
        self.targetBitrateMbps = targetBitrateMbps
        self.requiresPrivateNetwork = requiresPrivateNetwork
    }
}
