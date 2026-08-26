import EndlessEquatorCore
import Foundation

public enum OperationalRouteStore {
    private static let fileName = "signed-operational-route.plist"
    private static let maximumStoredBytes = 30_000_000

    private struct Record: Codable {
        let bundleData: Data
        let localAcknowledgedAt: Date
        let installedAt: Date
    }

    public static func load(
        verifier: SignedRouteBundleVerifier,
        now: Date = .now
    ) throws -> SignedRouteBundleVerificationResult? {
        let url = try storageURL()
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        let values = try url.resourceValues(forKeys: [.fileSizeKey])
        guard (values.fileSize ?? 0) <= maximumStoredBytes else {
            throw OperationalRouteStoreError.storedBundleTooLarge
        }
        let data = try Data(contentsOf: url, options: .mappedIfSafe)
        let decoder = PropertyListDecoder()
        let record = try decoder.decode(Record.self, from: data)
        return try verifier.verify(
            bundleData: record.bundleData,
            localAcknowledgedAt: record.localAcknowledgedAt,
            now: now
        )
    }

    public static func save(
        bundleData: Data,
        localAcknowledgedAt: Date,
        installedAt: Date = .now
    ) throws {
        guard bundleData.count <= SignedRouteBundleVerifier.maximumBundleBytes else {
            throw OperationalRouteStoreError.storedBundleTooLarge
        }
        let record = Record(
            bundleData: bundleData,
            localAcknowledgedAt: localAcknowledgedAt,
            installedAt: installedAt
        )
        let encoder = PropertyListEncoder()
        encoder.outputFormat = .binary
        let data = try encoder.encode(record)
        guard data.count <= maximumStoredBytes else {
            throw OperationalRouteStoreError.storedBundleTooLarge
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

    private static func storageURL() throws -> URL {
        guard let applicationSupport = FileManager.default.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first else {
            throw OperationalRouteStoreError.storageUnavailable
        }
        return applicationSupport
            .appending(path: "EndlessEquator", directoryHint: .isDirectory)
            .appending(path: fileName, directoryHint: .notDirectory)
    }
}

public enum OperationalRouteStoreError: LocalizedError {
    case storageUnavailable
    case storedBundleTooLarge

    public var errorDescription: String? {
        switch self {
        case .storageUnavailable: "Signed route storage is unavailable."
        case .storedBundleTooLarge: "The stored signed route bundle exceeds the safety limit."
        }
    }
}
