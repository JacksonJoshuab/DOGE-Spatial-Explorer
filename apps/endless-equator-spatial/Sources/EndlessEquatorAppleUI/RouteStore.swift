import EndlessEquatorCore
import Foundation

public enum RouteStore {
    private static let maximumStoredBytes = 20_000_000
    private static let fileName = "last-planning-route.json"

    public static func loadPlanningRoute() throws -> RoutePlan? {
        let url = try storageURL()
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        let values = try url.resourceValues(forKeys: [.fileSizeKey])
        guard (values.fileSize ?? 0) <= maximumStoredBytes else {
            try? FileManager.default.removeItem(at: url)
            return nil
        }
        let data = try Data(contentsOf: url, options: .mappedIfSafe)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let plan = try decoder.decode(RoutePlan.self, from: data)
        return planningSafe(plan)
    }

    public static func savePlanningRoute(_ plan: RoutePlan) throws {
        let safePlan = planningSafe(plan)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        let data = try encoder.encode(safePlan)
        guard data.count <= maximumStoredBytes else {
            throw RouteStoreError.routeTooLarge
        }
        let url = try storageURL()
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        try data.write(to: url, options: [.atomic, .completeFileProtection])
    }

    public static func clear() throws {
        let url = try storageURL()
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }

    private static func planningSafe(_ plan: RoutePlan) -> RoutePlan {
        let verification = RouteVerification(
            state: .planningOnly,
            verifiedBy: nil,
            verifiedAt: nil,
            accessCheckedAt: nil,
            weatherCheckedAt: nil,
            riderAcknowledged: false,
            note: "Restored local route geometry. Operational authority is never persisted and must be re-established from a current signed route bundle."
        )
        return RoutePlan(
            id: plan.id,
            name: plan.name,
            version: plan.version,
            points: plan.points,
            maneuvers: plan.maneuvers,
            verification: verification,
            optionalCoastExtensionAreaIDs: plan.optionalCoastExtensionAreaIDs
        )
    }

    private static func storageURL() throws -> URL {
        guard let applicationSupport = FileManager.default.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first else {
            throw RouteStoreError.storageUnavailable
        }
        return applicationSupport
            .appending(path: "EndlessEquator", directoryHint: .isDirectory)
            .appending(path: fileName, directoryHint: .notDirectory)
    }
}

public enum RouteStoreError: LocalizedError {
    case storageUnavailable
    case routeTooLarge

    public var errorDescription: String? {
        switch self {
        case .storageUnavailable:
            "Local route storage is unavailable."
        case .routeTooLarge:
            "The planning route is too large to store safely."
        }
    }
}
