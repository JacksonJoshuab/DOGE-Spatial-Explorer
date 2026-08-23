import Foundation

public struct GeoCoordinate: Codable, Hashable, Sendable {
    public let latitude: Double
    public let longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

public enum AreaCategory: String, Codable, CaseIterable, Sendable {
    case launch
    case volcano
    case hotSprings
    case jungle
    case waterfall
    case crater
    case ruins
    case surf
    case community
    case rotary
    case lodging
    case motorcycleRental
    case spatialCapture
    case fuel
    case medical
    case support
}

public enum VerificationState: String, Codable, Sendable {
    case verified
    case verifyBeforeUse
    case planningOnly
}

public struct AreaSection: Codable, Hashable, Sendable, Identifiable {
    public let id: String
    public let title: String
    public let body: String
}

public struct SeasonalWeather: Codable, Hashable, Sendable {
    public let september: String
    public let october: String
}

public struct AreaOfInterest: Codable, Hashable, Sendable, Identifiable {
    public let id: String
    public let slug: String
    public let name: String
    public let category: AreaCategory
    public let coordinate: GeoCoordinate
    public let altitudeMeters: Int?
    public let highwayRefs: [String]
    public let summary: String
    public let safetyNotes: [String]
    public let filmingNotes: [String]
    public let tags: [String]
    public let verificationState: VerificationState
    public let verificationNote: String
    public let seasonalWeather: SeasonalWeather
    public let sections: [AreaSection]
}

public struct RoutePoint: Codable, Hashable, Sendable, Identifiable {
    public let id: String
    public let coordinate: GeoCoordinate
    public let elevationMeters: Double?
}

public enum ManeuverKind: String, Codable, Sendable {
    case depart
    case continueStraight
    case slightLeft
    case slightRight
    case turnLeft
    case turnRight
    case merge
    case arrive
    case caution
}

public struct RouteManeuver: Codable, Hashable, Sendable, Identifiable {
    public let id: String
    public let sequence: Int
    public let coordinate: GeoCoordinate
    public let instruction: String
    public let roadReference: String?
    public let kind: ManeuverKind
    public let areaID: String?
}

public struct RouteVerification: Codable, Hashable, Sendable {
    public let state: VerificationState
    public let verifiedBy: String?
    public let verifiedAt: Date?
    public let accessCheckedAt: Date?
    public let weatherCheckedAt: Date?
    public let riderAcknowledged: Bool
    public let note: String

    public var permitsOperationalGuidance: Bool {
        state == .verified &&
        !(verifiedBy?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true) &&
        verifiedAt != nil && accessCheckedAt != nil && weatherCheckedAt != nil &&
        riderAcknowledged
    }
}

public struct RoutePlan: Codable, Hashable, Sendable, Identifiable {
    public let id: String
    public let name: String
    public let version: String
    public let points: [RoutePoint]
    public let maneuvers: [RouteManeuver]
    public let verification: RouteVerification
    public let optionalCoastExtensionAreaIDs: [String]
}

public enum NavigationMode: String, Codable, Sendable {
    case planningPreview
    case operational
}

public struct NavigationSnapshot: Codable, Hashable, Sendable {
    public let mode: NavigationMode
    public let activeManeuverIndex: Int
    public let distanceToManeuverMeters: Double?
    public let remainingRouteMeters: Double?
    public let isOffRoute: Bool
    public let currentSpeedMetersPerSecond: Double?
    public let lastLocationAt: Date?
}

public enum MotionSafetyState: String, Codable, Sendable {
    case stationary
    case caution
    case locked
    case unavailable

    public var permitsSpatialRouteRoom: Bool { self == .stationary }
}

public struct GuideRequest: Codable, Hashable, Sendable {
    public let areaID: String
    public let locale: String
    public let currentManeuver: String?
    public let weatherSummary: String?
    public let coarseContext: String?
    public let question: String
}

public struct GuideResponse: Codable, Hashable, Sendable {
    public let spokenLine: String
    public let shortCard: String
    public let facts: [String]
    public let warnings: [String]
    public let questionsToVerify: [String]
    public let sourceLabels: [String]
}

public struct WeatherSummary: Codable, Hashable, Sendable {
    public let temperatureCelsius: Double
    public let apparentTemperatureCelsius: Double
    public let condition: String
    public let precipitationChance: Double
    public let windKPH: Double
    public let observedAt: Date
}

public struct NavigationSyncPacket: Codable, Hashable, Sendable {
    public let routeID: String
    public let maneuverIndex: Int
    public let maneuverInstruction: String?
    public let roadReference: String?
    public let activeManeuverCoordinate: GeoCoordinate?
    public let speedMetersPerSecond: Double?
    public let motionSafetyState: MotionSafetyState
    public let selectedAreaID: String?
    public let weather: WeatherSummary?
    public let generatedAt: Date
}
