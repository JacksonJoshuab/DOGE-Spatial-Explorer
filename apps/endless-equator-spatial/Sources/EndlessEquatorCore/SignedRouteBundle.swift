import CryptoKit
import Foundation

public struct TrustedRouteSigner: Codable, Hashable, Sendable, Identifiable {
    public let keyID: String
    public let displayName: String
    public let publicKeyBase64: String
    public let enabled: Bool
    public let validFrom: Date?
    public let validUntil: Date?

    public var id: String { keyID }

    public init(
        keyID: String,
        displayName: String,
        publicKeyBase64: String,
        enabled: Bool = true,
        validFrom: Date? = nil,
        validUntil: Date? = nil
    ) {
        self.keyID = keyID
        self.displayName = displayName
        self.publicKeyBase64 = publicKeyBase64
        self.enabled = enabled
        self.validFrom = validFrom
        self.validUntil = validUntil
    }
}

public struct SignedRouteBundleEnvelope: Codable, Hashable, Sendable {
    public let formatVersion: String
    public let keyID: String
    public let manifestJSON: Data
    public let gpx: Data
    public let signature: Data
    public let createdAt: Date

    public init(
        formatVersion: String = "1.0",
        keyID: String,
        manifestJSON: Data,
        gpx: Data,
        signature: Data,
        createdAt: Date
    ) {
        self.formatVersion = formatVersion
        self.keyID = keyID
        self.manifestJSON = manifestJSON
        self.gpx = gpx
        self.signature = signature
        self.createdAt = createdAt
    }
}

public struct OperationalRouteManifest: Codable, Hashable, Sendable {
    public enum Status: String, Codable, Sendable {
        case planningOnly
        case operationalCandidate
        case suspended
        case retired
    }

    public struct Verifier: Codable, Hashable, Sendable {
        public let name: String
        public let organization: String
        public let role: String
        public let contactEvidenceRef: String
    }

    public struct OfficialSource: Codable, Hashable, Sendable {
        public let label: String
        public let authority: String
        public let url: String?
        public let checkedAt: Date
        public let evidenceRef: String
    }

    public struct Permit: Codable, Hashable, Sendable {
        public enum Status: String, Codable, Sendable {
            case approved
            case notRequired
            case pending
            case denied
        }

        public let permitType: String
        public let authority: String
        public let status: Status
        public let validFrom: Date?
        public let validUntil: Date?
        public let evidenceRef: String
    }

    public struct Segment: Codable, Hashable, Sendable {
        public enum Status: String, Codable, Sendable {
            case open
            case conditional
            case closed
            case unknown
        }

        public enum AccessBasis: String, Codable, Sendable {
            case officialNotice
            case authorizedLocalGuide
            case siteInspection
            case landownerPermission
            case combined
        }

        public struct Bailout: Codable, Hashable, Sendable {
            public let available: Bool
            public let description: String
            public let coordinate: GeoCoordinate?
        }

        public struct ProtectedArea: Codable, Hashable, Sendable {
            public let insideOrAdjacent: Bool
            public let authority: String?
            public let permitEvidenceRef: String?
        }

        public struct LandownerPermission: Codable, Hashable, Sendable {
            public enum Status: String, Codable, Sendable {
                case approved
                case notRequired
                case pending
                case denied
                case unknown
            }

            public let required: Bool
            public let status: Status
            public let evidenceRef: String?
        }

        public let id: String
        public let from: String
        public let to: String
        public let highwayRefs: [String]?
        public let status: Status
        public let surface: String
        public let accessBasis: AccessBasis
        public let conditions: [String]?
        public let checkedAt: Date
        public let evidenceRef: String
        public let supportVehicleAccess: Bool
        public let bailout: Bailout
        public let protectedArea: ProtectedArea
        public let landownerPermission: LandownerPermission
        public let hazards: [String]
        public let notes: String?
    }

    public struct GoNoGo: Codable, Hashable, Sendable {
        public enum Decision: String, Codable, Sendable {
            case go = "GO"
            case noGo = "NO_GO"
            case conditionalGo = "CONDITIONAL_GO"
        }

        public let decision: Decision
        public let decidedBy: String
        public let decidedAt: Date
        public let conditions: [String]?
        public let evidenceRef: String
    }

    public let routeID: String
    public let routeVersion: String
    public let routeName: String?
    public let gpxFileName: String
    public let gpxSHA256: String
    public let status: Status
    public let verifiedBy: Verifier
    public let verifiedAt: Date
    public let accessCheckedAt: Date
    public let weatherCheckedAt: Date
    public let expiresAt: Date
    public let riderAcknowledgedAt: Date
    public let officialSources: [OfficialSource]?
    public let permits: [Permit]?
    public let segments: [Segment]
    public let goNoGo: GoNoGo
}

public struct SignedRouteBundleVerificationResult: Sendable {
    public let routePlan: RoutePlan
    public let manifest: OperationalRouteManifest
    public let signer: TrustedRouteSigner
    public let bundleSHA256: String
    public let verifiedAt: Date

    public init(
        routePlan: RoutePlan,
        manifest: OperationalRouteManifest,
        signer: TrustedRouteSigner,
        bundleSHA256: String,
        verifiedAt: Date
    ) {
        self.routePlan = routePlan
        self.manifest = manifest
        self.signer = signer
        self.bundleSHA256 = bundleSHA256
        self.verifiedAt = verifiedAt
    }
}

public struct SignedRouteBundleVerifier: Sendable {
    public static let maximumBundleBytes = 25_000_000
    public static let maximumManifestBytes = 1_000_000
    public static let maximumGPXBytes = 20_000_000
    public static let formatVersion = "1.0"

    private static let domain = Data("com.gonzosocialclub.endlessequator.routebundle.v1\0".utf8)
    public let trustedSigners: [TrustedRouteSigner]

    public init(trustedSigners: [TrustedRouteSigner]) {
        self.trustedSigners = trustedSigners
    }

    public static func bundled() throws -> SignedRouteBundleVerifier {
        SignedRouteBundleVerifier(trustedSigners: try loadBundledTrustedSigners())
    }

    public static func loadBundledTrustedSigners() throws -> [TrustedRouteSigner] {
        guard let url = Bundle.module.url(
            forResource: "trusted-route-signers",
            withExtension: "json"
        ) else {
            throw SignedRouteBundleError.trustedSignerCatalogMissing
        }
        let data = try Data(contentsOf: url)
        let decoder = makeDecoder()
        return try decoder.decode([TrustedRouteSigner].self, from: data)
    }

    public func verify(
        bundleData: Data,
        localAcknowledgedAt: Date?,
        now: Date = .now
    ) throws -> SignedRouteBundleVerificationResult {
        guard bundleData.count <= Self.maximumBundleBytes else {
            throw SignedRouteBundleError.bundleTooLarge
        }
        guard let localAcknowledgedAt else {
            throw SignedRouteBundleError.localAcknowledgementRequired
        }

        let decoder = Self.makeDecoder()
        let envelope: SignedRouteBundleEnvelope
        do {
            envelope = try decoder.decode(SignedRouteBundleEnvelope.self, from: bundleData)
        } catch {
            throw SignedRouteBundleError.invalidEnvelope(error.localizedDescription)
        }

        guard envelope.formatVersion == Self.formatVersion else {
            throw SignedRouteBundleError.unsupportedFormat(envelope.formatVersion)
        }
        guard envelope.manifestJSON.count <= Self.maximumManifestBytes else {
            throw SignedRouteBundleError.manifestTooLarge
        }
        guard envelope.gpx.count <= Self.maximumGPXBytes else {
            throw SignedRouteBundleError.gpxTooLarge
        }
        guard envelope.signature.count == 64 else {
            throw SignedRouteBundleError.invalidSignature
        }

        guard let signer = trustedSigners.first(where: { $0.keyID == envelope.keyID }) else {
            throw SignedRouteBundleError.unknownSigner(envelope.keyID)
        }
        try validate(signer: signer, now: now)

        guard let publicKeyData = Data(base64Encoded: signer.publicKeyBase64),
              publicKeyData.count == 32 else {
            throw SignedRouteBundleError.invalidTrustedKey(signer.keyID)
        }
        let publicKey: Curve25519.Signing.PublicKey
        do {
            publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: publicKeyData)
        } catch {
            throw SignedRouteBundleError.invalidTrustedKey(signer.keyID)
        }

        let payload = Self.signaturePayload(
            manifestJSON: envelope.manifestJSON,
            gpx: envelope.gpx
        )
        guard publicKey.isValidSignature(envelope.signature, for: payload) else {
            throw SignedRouteBundleError.invalidSignature
        }

        let manifest: OperationalRouteManifest
        do {
            manifest = try decoder.decode(
                OperationalRouteManifest.self,
                from: envelope.manifestJSON
            )
        } catch {
            throw SignedRouteBundleError.invalidManifest(error.localizedDescription)
        }
        try validate(
            manifest: manifest,
            gpx: envelope.gpx,
            localAcknowledgedAt: localAcknowledgedAt,
            now: now
        )

        let verification = RouteVerification(
            state: .verified,
            verifiedBy: "\(manifest.verifiedBy.name) — \(manifest.verifiedBy.organization)",
            verifiedAt: manifest.verifiedAt,
            accessCheckedAt: manifest.accessCheckedAt,
            weatherCheckedAt: manifest.weatherCheckedAt,
            riderAcknowledged: true,
            note: "Ed25519 bundle signed by \(signer.displayName) [\(signer.keyID)]; go/no-go \(manifest.goNoGo.decision.rawValue). Posted and on-site authority still overrides this bundle.",
            expiresAt: manifest.expiresAt
        )
        guard verification.permitsOperationalGuidance(at: now) else {
            throw SignedRouteBundleError.verificationNotCurrent
        }

        let imported: RoutePlan
        do {
            imported = try GPXImporter().importRoute(
                data: envelope.gpx,
                name: manifest.routeName ?? manifest.routeID,
                verification: verification
            )
        } catch {
            throw SignedRouteBundleError.invalidGPX(error.localizedDescription)
        }
        let routePlan = RoutePlan(
            id: manifest.routeID,
            name: manifest.routeName ?? manifest.routeID,
            version: manifest.routeVersion,
            points: imported.points,
            maneuvers: imported.maneuvers,
            verification: verification,
            optionalCoastExtensionAreaIDs: []
        )

        return SignedRouteBundleVerificationResult(
            routePlan: routePlan,
            manifest: manifest,
            signer: signer,
            bundleSHA256: Self.sha256Hex(bundleData),
            verifiedAt: now
        )
    }

    public static func signaturePayload(manifestJSON: Data, gpx: Data) -> Data {
        var payload = domain
        appendLength(manifestJSON.count, to: &payload)
        payload.append(manifestJSON)
        appendLength(gpx.count, to: &payload)
        payload.append(gpx)
        return payload
    }

    public static func sha256Hex(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }

    private func validate(signer: TrustedRouteSigner, now: Date) throws {
        guard signer.enabled else {
            throw SignedRouteBundleError.signerDisabled(signer.keyID)
        }
        let tolerance: TimeInterval = 5 * 60
        if let validFrom, validFrom.timeIntervalSince(now) > tolerance {
            throw SignedRouteBundleError.signerNotYetValid(signer.keyID)
        }
        if let validUntil = signer.validUntil, validUntil <= now {
            throw SignedRouteBundleError.signerExpired(signer.keyID)
        }
    }

    private func validate(
        manifest: OperationalRouteManifest,
        gpx: Data,
        localAcknowledgedAt: Date,
        now: Date
    ) throws {
        try requireText(manifest.routeID, field: "routeID")
        try requireText(manifest.routeVersion, field: "routeVersion")
        try requireText(manifest.gpxFileName, field: "gpxFileName")
        guard manifest.gpxFileName.lowercased().hasSuffix(".gpx") else {
            throw SignedRouteBundleError.invalidManifest("gpxFileName must end in .gpx")
        }
        guard manifest.status == .operationalCandidate else {
            throw SignedRouteBundleError.invalidManifest("status must be operationalCandidate")
        }
        guard manifest.gpxSHA256.lowercased() == Self.sha256Hex(gpx) else {
            throw SignedRouteBundleError.gpxHashMismatch
        }

        try requireText(manifest.verifiedBy.name, field: "verifiedBy.name")
        try requireText(manifest.verifiedBy.organization, field: "verifiedBy.organization")
        try requireText(manifest.verifiedBy.role, field: "verifiedBy.role")
        try requireText(
            manifest.verifiedBy.contactEvidenceRef,
            field: "verifiedBy.contactEvidenceRef"
        )

        let tolerance: TimeInterval = 5 * 60
        guard manifest.verifiedAt.timeIntervalSince(now) <= tolerance,
              manifest.accessCheckedAt.timeIntervalSince(now) <= tolerance,
              manifest.weatherCheckedAt.timeIntervalSince(now) <= tolerance,
              manifest.riderAcknowledgedAt.timeIntervalSince(now) <= tolerance,
              localAcknowledgedAt.timeIntervalSince(now) <= tolerance else {
            throw SignedRouteBundleError.futureDatedEvidence
        }
        guard now.timeIntervalSince(manifest.accessCheckedAt) <= 72 * 60 * 60 else {
            throw SignedRouteBundleError.staleAccessCheck
        }
        guard now.timeIntervalSince(manifest.weatherCheckedAt) <= 24 * 60 * 60 else {
            throw SignedRouteBundleError.staleWeatherCheck
        }
        guard manifest.expiresAt > now,
              manifest.expiresAt >= manifest.verifiedAt else {
            throw SignedRouteBundleError.expiredManifest
        }
        guard manifest.riderAcknowledgedAt >= manifest.verifiedAt,
              localAcknowledgedAt >= manifest.verifiedAt else {
            throw SignedRouteBundleError.localAcknowledgementRequired
        }

        guard let sources = manifest.officialSources, !sources.isEmpty else {
            throw SignedRouteBundleError.invalidManifest("officialSources must not be empty")
        }
        for source in sources {
            try requireText(source.label, field: "officialSources.label")
            try requireText(source.authority, field: "officialSources.authority")
            try requireText(source.evidenceRef, field: "officialSources.evidenceRef")
            guard source.checkedAt.timeIntervalSince(now) <= tolerance,
                  now.timeIntervalSince(source.checkedAt) <= 72 * 60 * 60 else {
                throw SignedRouteBundleError.staleOfficialSource
            }
        }

        for permit in manifest.permits ?? [] {
            try requireText(permit.permitType, field: "permits.permitType")
            try requireText(permit.authority, field: "permits.authority")
            try requireText(permit.evidenceRef, field: "permits.evidenceRef")
            guard permit.status == .approved || permit.status == .notRequired else {
                throw SignedRouteBundleError.unapprovedPermit(permit.permitType)
            }
            if let validFrom = permit.validFrom,
               validFrom.timeIntervalSince(now) > tolerance {
                throw SignedRouteBundleError.unapprovedPermit(permit.permitType)
            }
            if let validUntil = permit.validUntil, validUntil <= now {
                throw SignedRouteBundleError.unapprovedPermit(permit.permitType)
            }
        }

        guard !manifest.segments.isEmpty else {
            throw SignedRouteBundleError.invalidManifest("segments must not be empty")
        }
        for segment in manifest.segments {
            try validate(segment: segment, now: now, tolerance: tolerance)
        }

        guard manifest.goNoGo.decision == .go ||
                manifest.goNoGo.decision == .conditionalGo else {
            throw SignedRouteBundleError.noGoDecision
        }
        try requireText(manifest.goNoGo.decidedBy, field: "goNoGo.decidedBy")
        try requireText(manifest.goNoGo.evidenceRef, field: "goNoGo.evidenceRef")
        guard manifest.goNoGo.decidedAt >= manifest.verifiedAt,
              manifest.goNoGo.decidedAt.timeIntervalSince(now) <= tolerance else {
            throw SignedRouteBundleError.invalidManifest("goNoGo.decidedAt is invalid")
        }
        if manifest.goNoGo.decision == .conditionalGo,
           (manifest.goNoGo.conditions ?? []).allSatisfy({
               $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
           }) {
            throw SignedRouteBundleError.invalidManifest(
                "CONDITIONAL_GO requires explicit conditions"
            )
        }
    }

    private func validate(
        segment: OperationalRouteManifest.Segment,
        now: Date,
        tolerance: TimeInterval
    ) throws {
        try requireText(segment.id, field: "segments.id")
        try requireText(segment.from, field: "segments.from")
        try requireText(segment.to, field: "segments.to")
        try requireText(segment.surface, field: "segments.surface")
        try requireText(segment.evidenceRef, field: "segments.evidenceRef")
        guard segment.status == .open || segment.status == .conditional else {
            throw SignedRouteBundleError.closedOrUnknownSegment(segment.id)
        }
        if segment.status == .conditional,
           (segment.conditions ?? []).allSatisfy({
               $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
           }) {
            throw SignedRouteBundleError.invalidManifest(
                "Conditional segment \(segment.id) requires conditions"
            )
        }
        guard segment.checkedAt.timeIntervalSince(now) <= tolerance,
              now.timeIntervalSince(segment.checkedAt) <= 72 * 60 * 60 else {
            throw SignedRouteBundleError.staleSegment(segment.id)
        }
        guard segment.bailout.available else {
            throw SignedRouteBundleError.missingBailout(segment.id)
        }
        try requireText(segment.bailout.description, field: "segments.bailout.description")

        if segment.protectedArea.insideOrAdjacent {
            try requireText(
                segment.protectedArea.authority ?? "",
                field: "segments.protectedArea.authority"
            )
            try requireText(
                segment.protectedArea.permitEvidenceRef ?? "",
                field: "segments.protectedArea.permitEvidenceRef"
            )
        }
        if segment.landownerPermission.required {
            guard segment.landownerPermission.status == .approved else {
                throw SignedRouteBundleError.missingLandownerPermission(segment.id)
            }
            try requireText(
                segment.landownerPermission.evidenceRef ?? "",
                field: "segments.landownerPermission.evidenceRef"
            )
        }
    }

    private static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            let fractional = ISO8601DateFormatter()
            fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = fractional.date(from: value) { return date }
            let standard = ISO8601DateFormatter()
            standard.formatOptions = [.withInternetDateTime]
            if let date = standard.date(from: value) { return date }
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid ISO 8601 date: \(value)"
            )
        }
        return decoder
    }

    private static func appendLength(_ length: Int, to data: inout Data) {
        var bigEndian = UInt64(length).bigEndian
        withUnsafeBytes(of: &bigEndian) { bytes in
            data.append(contentsOf: bytes)
        }
    }

    private func requireText(_ value: String, field: String) throws {
        guard !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw SignedRouteBundleError.invalidManifest("\(field) is required")
        }
    }
}

public enum SignedRouteBundleError: LocalizedError {
    case bundleTooLarge
    case manifestTooLarge
    case gpxTooLarge
    case unsupportedFormat(String)
    case trustedSignerCatalogMissing
    case unknownSigner(String)
    case signerDisabled(String)
    case signerNotYetValid(String)
    case signerExpired(String)
    case invalidTrustedKey(String)
    case invalidEnvelope(String)
    case invalidManifest(String)
    case invalidSignature
    case gpxHashMismatch
    case invalidGPX(String)
    case localAcknowledgementRequired
    case futureDatedEvidence
    case staleAccessCheck
    case staleWeatherCheck
    case staleOfficialSource
    case staleSegment(String)
    case unapprovedPermit(String)
    case closedOrUnknownSegment(String)
    case missingBailout(String)
    case missingLandownerPermission(String)
    case noGoDecision
    case expiredManifest
    case verificationNotCurrent

    public var errorDescription: String? {
        switch self {
        case .bundleTooLarge: "The signed route bundle exceeds the 25 MB safety limit."
        case .manifestTooLarge: "The signed route manifest exceeds the 1 MB safety limit."
        case .gpxTooLarge: "The signed GPX exceeds the 20 MB safety limit."
        case .unsupportedFormat(let value): "Unsupported route-bundle format: \(value)."
        case .trustedSignerCatalogMissing: "The trusted route-signer catalog is missing."
        case .unknownSigner(let keyID): "The route signer \(keyID) is not trusted by this app build."
        case .signerDisabled(let keyID): "The route signer \(keyID) is disabled."
        case .signerNotYetValid(let keyID): "The route signer \(keyID) is not yet valid."
        case .signerExpired(let keyID): "The route signer \(keyID) has expired."
        case .invalidTrustedKey(let keyID): "The trusted public key for \(keyID) is invalid."
        case .invalidEnvelope(let message): "The route-bundle envelope is invalid: \(message)"
        case .invalidManifest(let message): "The operational manifest is invalid: \(message)"
        case .invalidSignature: "The Ed25519 route-bundle signature is invalid."
        case .gpxHashMismatch: "The signed manifest does not match the bundled GPX hash."
        case .invalidGPX(let message): "The signed GPX is invalid: \(message)"
        case .localAcknowledgementRequired: "The current rider must acknowledge this exact signed route after verification."
        case .futureDatedEvidence: "The route bundle contains materially future-dated evidence."
        case .staleAccessCheck: "The access check is older than 72 hours."
        case .staleWeatherCheck: "The weather check is older than 24 hours."
        case .staleOfficialSource: "An official-source check is stale or future-dated."
        case .staleSegment(let id): "Segment \(id) was not checked within 72 hours."
        case .unapprovedPermit(let type): "Permit \(type) is not approved or explicitly not required."
        case .closedOrUnknownSegment(let id): "Segment \(id) is closed or unknown."
        case .missingBailout(let id): "Segment \(id) has no confirmed bailout."
        case .missingLandownerPermission(let id): "Segment \(id) lacks approved landowner permission."
        case .noGoDecision: "The signed go/no-go decision does not authorize departure."
        case .expiredManifest: "The signed route manifest has expired."
        case .verificationNotCurrent: "The native operational-verification gate rejected this route."
        }
    }
}
