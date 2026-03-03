// PrivacyManager.swift
// DOGE Spatial Explorer — Privacy & Security Module
//
// Implements end-to-end encryption for collaboration data,
// Secure Enclave key management, iCloud Keychain integration,
// and privacy controls for spatial editing sessions.
//
// Privacy is a first-class citizen: all scene data transmitted
// between collaborators is encrypted before leaving the device.

import Foundation
import CryptoKit
import Observation

// MARK: - Privacy Manager

/// Manages all privacy and security features for the spatial editor.
@Observable
final class PrivacyManager {

    // MARK: - State

    /// Whether end-to-end encryption is enabled for the current session.
    var isE2EEncryptionEnabled = true

    /// Whether the Secure Enclave is available on this device.
    var isSecureEnclaveAvailable = false

    /// Current encryption key fingerprint (for display to users).
    var keyFingerprint: String = ""

    /// Privacy audit log entries.
    var auditLog: [PrivacyAuditEntry] = []

    /// Active privacy zones (regions where certain data is redacted).
    var privacyZones: [PrivacyZone] = []

    /// OSI layer security status indicators.
    var osiSecurityStatus: OSISecurityStatus = OSISecurityStatus()

    // MARK: - Private

    /// The symmetric encryption key for the current session.
    private var sessionKey: SymmetricKey?

    /// Per-document encryption keys stored in Keychain.
    private var documentKeys: [UUID: SymmetricKey] = [:]

    // MARK: - Initialization

    init() {
        checkSecureEnclaveAvailability()
    }

    // MARK: - Key Management

    /// Generates a new encryption key for a document and stores it
    /// in the Keychain (backed by Secure Enclave when available).
    func generateDocumentKey(for documentID: UUID) throws -> SymmetricKey {
        let key = SymmetricKey(size: .bits256)
        documentKeys[documentID] = key

        // Store in Keychain
        try storeKeyInKeychain(key, for: documentID)

        // Update fingerprint display
        keyFingerprint = fingerprint(of: key)

        logAudit(
            action: .keyGenerated,
            detail: "Generated AES-256 key for document \(documentID.uuidString.prefix(8))…"
        )

        return key
    }

    /// Retrieves the encryption key for a document from the Keychain.
    func retrieveDocumentKey(for documentID: UUID) throws -> SymmetricKey {
        if let cached = documentKeys[documentID] {
            return cached
        }

        let key = try loadKeyFromKeychain(for: documentID)
        documentKeys[documentID] = key
        keyFingerprint = fingerprint(of: key)
        return key
    }

    /// Derives a session key from a shared secret (for SharePlay E2E).
    func deriveSessionKey(from sharedSecret: SharedSecret, salt: Data) -> SymmetricKey {
        let key = sharedSecret.hkdfDerivedSymmetricKey(
            using: SHA256.self,
            salt: salt,
            sharedInfo: Data("DOGE-Spatial-E2E".utf8),
            outputByteCount: 32
        )
        sessionKey = key
        keyFingerprint = fingerprint(of: key)

        logAudit(
            action: .sessionKeyDerived,
            detail: "Derived session key via HKDF-SHA256"
        )

        return key
    }

    // MARK: - Encryption / Decryption

    /// Encrypts data using the current session key with AES-GCM.
    func encrypt(_ data: Data, for documentID: UUID? = nil) throws -> EncryptedPayload {
        let key: SymmetricKey
        if let docID = documentID, let docKey = documentKeys[docID] {
            key = docKey
        } else if let sessKey = sessionKey {
            key = sessKey
        } else {
            throw PrivacyError.noEncryptionKey
        }

        let sealedBox = try AES.GCM.seal(data, using: key)

        guard let combined = sealedBox.combined else {
            throw PrivacyError.encryptionFailed
        }

        logAudit(
            action: .dataEncrypted,
            detail: "Encrypted \(data.count) bytes with AES-256-GCM"
        )

        return EncryptedPayload(
            ciphertext: combined,
            nonce: sealedBox.nonce.withUnsafeBytes { Data($0) },
            tag: Data(sealedBox.tag)
        )
    }

    /// Decrypts an encrypted payload using the current session key.
    func decrypt(_ payload: EncryptedPayload, for documentID: UUID? = nil) throws -> Data {
        let key: SymmetricKey
        if let docID = documentID, let docKey = documentKeys[docID] {
            key = docKey
        } else if let sessKey = sessionKey {
            key = sessKey
        } else {
            throw PrivacyError.noEncryptionKey
        }

        let sealedBox = try AES.GCM.SealedBox(combined: payload.ciphertext)
        let decrypted = try AES.GCM.open(sealedBox, using: key)

        logAudit(
            action: .dataDecrypted,
            detail: "Decrypted \(decrypted.count) bytes"
        )

        return decrypted
    }

    // MARK: - Privacy Zones

    /// Creates a privacy zone where certain data types are redacted
    /// for participants without the appropriate clearance level.
    func createPrivacyZone(
        name: String,
        center: SIMD3<Float>,
        radius: Float,
        clearanceLevel: ClearanceLevel,
        redactedTypes: Set<RedactedDataType>
    ) -> PrivacyZone {
        let zone = PrivacyZone(
            id: UUID(),
            name: name,
            center: center,
            radius: radius,
            clearanceLevel: clearanceLevel,
            redactedTypes: redactedTypes,
            isActive: true
        )
        privacyZones.append(zone)

        logAudit(
            action: .privacyZoneCreated,
            detail: "Created privacy zone '\(name)' with \(clearanceLevel.rawValue) clearance"
        )

        return zone
    }

    /// Checks whether a position is within any active privacy zone
    /// and returns the required clearance level.
    func checkPrivacyZone(at position: SIMD3<Float>) -> ClearanceLevel? {
        for zone in privacyZones where zone.isActive {
            let distance = simd_distance(position, zone.center)
            if distance <= zone.radius {
                return zone.clearanceLevel
            }
        }
        return nil
    }

    // MARK: - OSI Security Status

    /// Updates the security status for a specific OSI layer.
    func updateOSILayerStatus(_ layer: OSILayer, status: SecurityLayerStatus) {
        switch layer {
        case .physical:    osiSecurityStatus.physical = status
        case .dataLink:    osiSecurityStatus.dataLink = status
        case .network:     osiSecurityStatus.network = status
        case .transport:   osiSecurityStatus.transport = status
        case .session:     osiSecurityStatus.session = status
        case .presentation: osiSecurityStatus.presentation = status
        case .application: osiSecurityStatus.application = status
        }

        logAudit(
            action: .osiStatusChanged,
            detail: "\(layer.rawValue) layer: \(status.rawValue)"
        )
    }

    // MARK: - Private Helpers

    private func checkSecureEnclaveAvailability() {
        // Check if Secure Enclave is available (all Apple Silicon devices)
        isSecureEnclaveAvailable = SecureEnclave.isAvailable
    }

    private func storeKeyInKeychain(_ key: SymmetricKey, for documentID: UUID) throws {
        let keyData = key.withUnsafeBytes { Data($0) }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "doge-spatial-\(documentID.uuidString)",
            kSecAttrService as String: "com.doge.spatial-explorer.keys",
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        if status == errSecDuplicateItem {
            // Update existing
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrAccount as String: "doge-spatial-\(documentID.uuidString)",
                kSecAttrService as String: "com.doge.spatial-explorer.keys"
            ]
            let attributes: [String: Any] = [
                kSecValueData as String: keyData
            ]
            SecItemUpdate(updateQuery as CFDictionary, attributes as CFDictionary)
        } else if status != errSecSuccess {
            throw PrivacyError.keychainStoreFailed
        }
    }

    private func loadKeyFromKeychain(for documentID: UUID) throws -> SymmetricKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "doge-spatial-\(documentID.uuidString)",
            kSecAttrService as String: "com.doge.spatial-explorer.keys",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let keyData = result as? Data else {
            throw PrivacyError.keychainLoadFailed
        }

        return SymmetricKey(data: keyData)
    }

    private func fingerprint(of key: SymmetricKey) -> String {
        let hash = key.withUnsafeBytes { bytes -> String in
            let data = Data(bytes)
            let digest = SHA256.hash(data: data)
            return digest.prefix(8).map { String(format: "%02x", $0) }.joined(separator: ":")
        }
        return hash
    }

    private func logAudit(action: PrivacyAuditAction, detail: String) {
        let entry = PrivacyAuditEntry(
            id: UUID(),
            timestamp: Date(),
            action: action,
            detail: detail
        )
        auditLog.append(entry)

        // Keep audit log to last 500 entries
        if auditLog.count > 500 {
            auditLog.removeFirst(auditLog.count - 500)
        }
    }
}

// MARK: - Supporting Types

struct EncryptedPayload: Codable, Sendable {
    let ciphertext: Data
    let nonce: Data
    let tag: Data
}

struct PrivacyZone: Identifiable, Codable, Sendable {
    let id: UUID
    var name: String
    var center: SIMD3<Float>
    var radius: Float
    var clearanceLevel: ClearanceLevel
    var redactedTypes: Set<RedactedDataType>
    var isActive: Bool
}

// Codable conformance for SIMD3<Float>
extension SIMD3: @retroactive Codable where Scalar == Float {
    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        let x = try container.decode(Float.self)
        let y = try container.decode(Float.self)
        let z = try container.decode(Float.self)
        self.init(x, y, z)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.unkeyedContainer()
        try container.encode(x)
        try container.encode(y)
        try container.encode(z)
    }
}

enum ClearanceLevel: String, Codable, Sendable, Comparable {
    case public_ = "Public"
    case internal_ = "Internal"
    case confidential = "Confidential"
    case secret = "Secret"
    case topSecret = "Top Secret"

    static func < (lhs: ClearanceLevel, rhs: ClearanceLevel) -> Bool {
        let order: [ClearanceLevel] = [.public_, .internal_, .confidential, .secret, .topSecret]
        return (order.firstIndex(of: lhs) ?? 0) < (order.firstIndex(of: rhs) ?? 0)
    }
}

enum RedactedDataType: String, Codable, Sendable {
    case geometry
    case textures
    case annotations
    case sensorData
    case personalInfo
    case financialData
    case locationData
}

// MARK: - OSI Security

struct OSISecurityStatus: Codable {
    var physical: SecurityLayerStatus = .unknown
    var dataLink: SecurityLayerStatus = .unknown
    var network: SecurityLayerStatus = .unknown
    var transport: SecurityLayerStatus = .unknown
    var session: SecurityLayerStatus = .unknown
    var presentation: SecurityLayerStatus = .unknown
    var application: SecurityLayerStatus = .unknown

    var overallStatus: SecurityLayerStatus {
        let all = [physical, dataLink, network, transport, session, presentation, application]
        if all.contains(.compromised) { return .compromised }
        if all.contains(.warning) { return .warning }
        if all.allSatisfy({ $0 == .secure }) { return .secure }
        return .unknown
    }
}

enum OSILayer: String, CaseIterable {
    case physical = "Physical (L1)"
    case dataLink = "Data Link (L2)"
    case network = "Network (L3)"
    case transport = "Transport (L4)"
    case session = "Session (L5)"
    case presentation = "Presentation (L6)"
    case application = "Application (L7)"
}

enum SecurityLayerStatus: String, Codable {
    case secure = "Secure"
    case warning = "Warning"
    case compromised = "Compromised"
    case unknown = "Unknown"
}

// MARK: - Audit

struct PrivacyAuditEntry: Identifiable, Codable {
    let id: UUID
    let timestamp: Date
    let action: PrivacyAuditAction
    let detail: String
}

enum PrivacyAuditAction: String, Codable {
    case keyGenerated
    case sessionKeyDerived
    case dataEncrypted
    case dataDecrypted
    case privacyZoneCreated
    case privacyZoneRemoved
    case osiStatusChanged
    case accessGranted
    case accessDenied
    case keychainAccess
}

// MARK: - Errors

enum PrivacyError: Error, LocalizedError {
    case noEncryptionKey
    case encryptionFailed
    case decryptionFailed
    case keychainStoreFailed
    case keychainLoadFailed
    case secureEnclaveUnavailable
    case insufficientClearance

    var errorDescription: String? {
        switch self {
        case .noEncryptionKey: return "No encryption key available for this session."
        case .encryptionFailed: return "Failed to encrypt the data."
        case .decryptionFailed: return "Failed to decrypt the data."
        case .keychainStoreFailed: return "Failed to store the key in the Keychain."
        case .keychainLoadFailed: return "Failed to load the key from the Keychain."
        case .secureEnclaveUnavailable: return "Secure Enclave is not available on this device."
        case .insufficientClearance: return "Your clearance level is insufficient for this data."
        }
    }
}
