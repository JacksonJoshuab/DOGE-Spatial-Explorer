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

    public init(id: String, title: String, body: String) {
        self.id = id
        self.title = title
        self.body = body
    }
}

public struct SeasonalWeather: Codable, Hashable, Sendable {
    public let september: String
    public let october: String

    public init(september: String, october: String) {
        self.september = september
        self.october = october
    }
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

    public init(
        id: String,
        slug: String,
        name: String,
        category: AreaCategory,
        coordinate: GeoCoordinate,
        altitudeMeters: Int?,
        highwayRefs: [String],
        summary: String,
        safetyNotes: [String],
        filmingNotes: [String],
        tags: [String],
        verificationState: VerificationState,
        verificationNote: String,
        seasonalWeather: SeasonalWeather,
        sections: [AreaSection]
    ) {
        self.id = id
        self.slug = slug
        self.name = name
        self.category = category
        self.coordinate = coordinate
        self.altitudeMeters = altitudeMeters
        self.highwayRefs = highwayRefs
        self.summary = summary
        self.safetyNotes = safetyNotes
        self.filmingNotes = filmingNotes
        self.tags = tags
        self.verificationState = verificationState
        self.verificationNote = verificationNote
        self.seasonalWeather = seasonalWeather
        self.sections = sections
    }
}

public struct RoutePoint: Codable, Hashable, Sendable, Identifiable {
    public let id: String
    public let coordinate: GeoCoordinate
    public let elevationMeters: Double?

    public init(id: String, coordinate: GeoCoordinate, elevationMeters: Double?) {
        self.id = id
        self.coordinate = coordinate
        self.elevationMeters = elevationMeters
    }
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

    public init(
        id: String,
        sequence: Int,
        coordinate: GeoCoordinate,
        instruction: String,
        roadReference: String?,
        kind: ManeuverKind,
        areaID: String?
    ) {
        self.id = id
        self.sequence = sequence
        self.coordinate = coordinate
        self.instruction = instruction
        self.roadReference = roadReference
        self.kind = kind
        self.areaID = areaID
    }
}

public struct RouteVerification: Codable, Hashable, Sendable {
    public let state: VerificationState
    public let verifiedBy: String?
    public let verifiedAt: Date?
    public let accessCheckedAt: Date?
    public let weatherCheckedAt: Date?
    public let riderAcknowledged: Bool
    public let note: String
    public let expiresAt: Date?

    public init(
        state: VerificationState,
        verifiedBy: String?,
        verifiedAt: Date?,
        accessCheckedAt: Date?,
        weatherCheckedAt: Date?,
        riderAcknowledged: Bool,
        note: String,
        expiresAt: Date? = nil
    ) {
        self.state = state
        self.verifiedBy = verifiedBy
        self.verifiedAt = verifiedAt
        self.accessCheckedAt = accessCheckedAt
        self.weatherCheckedAt = weatherCheckedAt
        self.riderAcknowledged = riderAcknowledged
        self.note = note
        self.expiresAt = expiresAt
    }

    public var permitsOperationalGuidance: Bool {
        permitsOperationalGuidance(at: .now)
    }

    public func permitsOperationalGuidance(at now: Date) -> Bool {
        guard state == .verified,
              !(verifiedBy?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true),
              let verifiedAt,
              let accessCheckedAt,
              let weatherCheckedAt,
              let expiresAt,
              riderAcknowledged else {
            return false
        }

        let futureTolerance: TimeInterval = 5 * 60
        let accessAge = now.timeIntervalSince(accessCheckedAt)
        let weatherAge = now.timeIntervalSince(weatherCheckedAt)
        let verificationLead = verifiedAt.timeIntervalSince(now)
        let expiryLead = expiresAt.timeIntervalSince(now)

        return verificationLead <= futureTolerance &&
            accessAge >= -futureTolerance && accessAge <= 72 * 60 * 60 &&
            weatherAge >= -futureTolerance && weatherAge <= 24 * 60 * 60 &&
            expiryLead > 0 &&
            expiresAt >= verifiedAt
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

    public init(
        id: String,
        name: String,
        version: String,
        points: [RoutePoint],
        maneuvers: [RouteManeuver],
        verification: RouteVerification,
        optionalCoastExtensionAreaIDs: [String]
    ) {
        self.id = id
        self.name = name
        self.version = version
        self.points = points
        self.maneuvers = maneuvers
        self.verification = verification
        self.optionalCoastExtensionAreaIDs = optionalCoastExtensionAreaIDs
    }
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

    public init(
        mode: NavigationMode,
        activeManeuverIndex: Int,
        distanceToManeuverMeters: Double?,
        remainingRouteMeters: Double?,
        isOffRoute: Bool,
        currentSpeedMetersPerSecond: Double?,
        lastLocationAt: Date?
    ) {
        self.mode = mode
        self.activeManeuverIndex = activeManeuverIndex
        self.distanceToManeuverMeters = distanceToManeuverMeters
        self.remainingRouteMeters = remainingRouteMeters
        self.isOffRoute = isOffRoute
        self.currentSpeedMetersPerSecond = currentSpeedMetersPerSecond
        self.lastLocationAt = lastLocationAt
    }
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

    public init(
        areaID: String,
        locale: String,
        currentManeuver: String?,
        weatherSummary: String?,
        coarseContext: String?,
        question: String
    ) {
        self.areaID = areaID
        self.locale = locale
        self.currentManeuver = currentManeuver
        self.weatherSummary = weatherSummary
        self.coarseContext = coarseContext
        self.question = question
    }
}

public struct GuideResponse: Codable, Hashable, Sendable {
    public let spokenLine: String
    public let shortCard: String
    public let facts: [String]
    public let warnings: [String]
    public let questionsToVerify: [String]
    public let sourceLabels: [String]

    public init(
        spokenLine: String,
        shortCard: String,
        facts: [String],
        warnings: [String],
        questionsToVerify: [String],
        sourceLabels: [String]
    ) {
        self.spokenLine = spokenLine
        self.shortCard = shortCard
        self.facts = facts
        self.warnings = warnings
        self.questionsToVerify = questionsToVerify
        self.sourceLabels = sourceLabels
    }
}

public struct WeatherSummary: Codable, Hashable, Sendable {
    public let temperatureCelsius: Double
    public let apparentTemperatureCelsius: Double
    public let condition: String
    public let precipitationChance: Double
    public let windKPH: Double
    public let observedAt: Date

    public init(
        temperatureCelsius: Double,
        apparentTemperatureCelsius: Double,
        condition: String,
        precipitationChance: Double,
        windKPH: Double,
        observedAt: Date
    ) {
        self.temperatureCelsius = temperatureCelsius
        self.apparentTemperatureCelsius = apparentTemperatureCelsius
        self.condition = condition
        self.precipitationChance = precipitationChance
        self.windKPH = windKPH
        self.observedAt = observedAt
    }
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

    public init(
        routeID: String,
        maneuverIndex: Int,
        maneuverInstruction: String?,
        roadReference: String?,
        activeManeuverCoordinate: GeoCoordinate?,
        speedMetersPerSecond: Double?,
        motionSafetyState: MotionSafetyState,
        selectedAreaID: String?,
        weather: WeatherSummary?,
        generatedAt: Date
    ) {
        self.routeID = routeID
        self.maneuverIndex = maneuverIndex
        self.maneuverInstruction = maneuverInstruction
        self.roadReference = roadReference
        self.activeManeuverCoordinate = activeManeuverCoordinate
        self.speedMetersPerSecond = speedMetersPerSecond
        self.motionSafetyState = motionSafetyState
        self.selectedAreaID = selectedAreaID
        self.weather = weather
        self.generatedAt = generatedAt
    }
}
