import CoreLocation
import EndlessEquatorCore
import Foundation
import Observation
#if os(iOS)
import UIKit
#endif

@MainActor
@Observable
public final class ExpeditionModel {
    public let areas: [AreaOfInterest]
    public let routeEngine: RouteEngine
    public let locationService: ExpeditionLocationService
    public let voiceGuidance: VoiceGuidanceService
    public let weatherService: AreaWeatherService
    public let peerSync: PeerSyncService
    public let turnHaptics: TurnHapticsService
    public let guideGateway: GuideGateway

    public var selectedAreaID: String? {
        didSet {
            guard selectedAreaID != oldValue else { return }
            lastGuideResponse = nil
            guideResponseAreaID = nil
            latestWeather = nil
            alertMessage = nil
            guard !suppressLiveServices else { return }
            Task { [weak self] in await self?.refreshWeather() }
        }
    }
    public private(set) var latestWeather: WeatherSummary?
    public private(set) var lastGuideResponse: GuideResponse?
    public private(set) var guideResponseAreaID: String?
    public var alertMessage: String?
    public var webBaseURL: URL
    public var stationaryOverrideAcknowledged = false

    @ObservationIgnored private var lastSyncAt = Date.distantPast
    @ObservationIgnored private let suppressLiveServices: Bool

    public init(webBaseURL: URL? = nil) throws {
        suppressLiveServices = ProcessInfo.processInfo.arguments.contains("--ui-testing")
        let configuredURL: URL = {
            if let webBaseURL { return webBaseURL }
            if let value = Bundle.main.object(forInfoDictionaryKey: "EndlessEquatorServerURL") as? String,
               let url = URL(string: value) { return url }
            return URL(string: "http://localhost:8787")!
        }()
        areas = try ExpeditionCatalog.loadAreas()
        let seedRoute = try ExpeditionCatalog.loadSeedRoute()
        routeEngine = RouteEngine(plan: (try? RouteStore.loadPlanningRoute()) ?? seedRoute)
        locationService = ExpeditionLocationService()
        voiceGuidance = VoiceGuidanceService()
        weatherService = AreaWeatherService()
        peerSync = PeerSyncService(displayName: Self.peerDisplayName())
        turnHaptics = TurnHapticsService()
        guideGateway = GuideGateway(baseURL: configuredURL)
        self.webBaseURL = configuredURL
        selectedAreaID = areas.first?.id

        locationService.onLocation = { [weak self] location in
            guard let self else { return }
            let priorIndex = self.routeEngine.snapshot.activeManeuverIndex
            let wasOffRoute = self.routeEngine.snapshot.isOffRoute
            self.routeEngine.ingest(
                location: location,
                stationaryOverrideAcknowledged: self.stationaryOverrideAcknowledged
            )
            let currentIndex = self.routeEngine.snapshot.activeManeuverIndex

            if self.routeEngine.isRunning,
               !wasOffRoute,
               self.routeEngine.snapshot.isOffRoute {
                self.turnHaptics.offRouteWarning()
            }
            if self.routeEngine.isRunning,
               currentIndex != priorIndex,
               let instruction = self.routeEngine.activeManeuver?.instruction {
                self.turnHaptics.turnAdvanced()
                self.voiceGuidance.speak(instruction, localeIdentifier: "en-US")
            }
            if Date().timeIntervalSince(self.lastSyncAt) >= 1 {
                self.lastSyncAt = Date()
                try? self.peerSync.send(self.makeSyncPacket(generatedAt: .now))
            }
        }
    }

    public var selectedArea: AreaOfInterest? {
        areas.first { $0.id == selectedAreaID }
    }

    public var selectedAreaGuideResponse: GuideResponse? {
        guard guideResponseAreaID == selectedAreaID else { return nil }
        return lastGuideResponse
    }

    public var syncedPacket: NavigationSyncPacket? {
        guard let packet = peerSync.latestPacket,
              packet.routeID == routeEngine.plan.id else {
            return nil
        }
        let age = Date().timeIntervalSince(packet.generatedAt)
        guard age >= -5, age <= 10 else { return nil }
        return packet
    }

    public var syncedManeuverInstruction: String? {
        syncedPacket?.maneuverInstruction
    }

    public func beginLocationUpdates() {
        guard !suppressLiveServices else { return }
        peerSync.start()
        locationService.requestAuthorizationAndStart()
        Task { await refreshWeather() }
    }

    public func installImportedPlan(_ plan: RoutePlan) {
        routeEngine.replacePlan(plan)
        do {
            try RouteStore.savePlanningRoute(plan)
        } catch {
            alertMessage = "The route is available for this session but could not be stored: \(error.localizedDescription)"
        }
    }

    public func sendSupportCheckIn() {
        guard !peerSync.connectedPeers.isEmpty else {
            alertMessage = "No paired support device is connected. Stop safely and use the expedition's configured satellite or phone channel."
            return
        }
        do {
            try peerSync.send(makeSyncPacket(generatedAt: .now))
            alertMessage = "Current route, maneuver, motion state and weather context were sent to paired support."
        } catch {
            alertMessage = "The paired support check-in failed: \(error.localizedDescription)"
        }
    }

    public func speakCurrentTurn() {
        guard let instruction = routeEngine.activeManeuver?.instruction else { return }
        voiceGuidance.speak(instruction, localeIdentifier: "en-US")
    }

    public func refreshWeather() async {
        guard !suppressLiveServices, let area = selectedArea else { return }
        let requestedAreaID = area.id
        do {
            let weather = try await weatherService.currentWeather(at: area.coordinate)
            guard selectedAreaID == requestedAreaID else { return }
            latestWeather = weather
        } catch {
            guard selectedAreaID == requestedAreaID else { return }
            latestWeather = nil
            alertMessage = error.localizedDescription
        }
    }

    public func askGuide(_ question: String, locale: String = "en-US") async {
        guard let area = selectedArea else { return }
        let requestedAreaID = area.id
        lastGuideResponse = nil
        guideResponseAreaID = nil
        alertMessage = nil

        let verifiedManeuver: String? = routeEngine.isRunning &&
            routeEngine.plan.verification.permitsOperationalGuidance
            ? routeEngine.activeManeuver?.instruction
            : nil
        let request = GuideRequest(
            areaID: area.id,
            locale: locale,
            currentManeuver: verifiedManeuver,
            weatherSummary: latestWeather.map { "\($0.condition), \(Int($0.temperatureCelsius))°C" },
            coarseContext: "Area verification: \(area.verificationState.rawValue)",
            question: question
        )
        do {
            let response = try await guideGateway.ask(request)
            guard selectedAreaID == requestedAreaID else { return }
            lastGuideResponse = response
            guideResponseAreaID = requestedAreaID
        } catch {
            guard selectedAreaID == requestedAreaID else { return }
            lastGuideResponse = nil
            guideResponseAreaID = nil
            alertMessage = error.localizedDescription
        }
    }

    private func makeSyncPacket(generatedAt: Date) -> NavigationSyncPacket {
        NavigationSyncPacket(
            routeID: routeEngine.plan.id,
            maneuverIndex: routeEngine.snapshot.activeManeuverIndex,
            maneuverInstruction: routeEngine.activeManeuver?.instruction,
            roadReference: routeEngine.activeManeuver?.roadReference,
            activeManeuverCoordinate: routeEngine.activeManeuver?.coordinate,
            speedMetersPerSecond: routeEngine.snapshot.currentSpeedMetersPerSecond,
            motionSafetyState: routeEngine.motionSafetyState,
            selectedAreaID: selectedAreaID,
            weather: latestWeather,
            generatedAt: generatedAt
        )
    }

    private static func peerDisplayName() -> String {
        let defaults = UserDefaults.standard
        let key = "EndlessEquatorPeerSuffix"
        let suffix: String
        if let stored = defaults.string(forKey: key), stored.count == 6 {
            suffix = stored
        } else {
            suffix = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(6)).uppercased()
            defaults.set(suffix, forKey: key)
        }

        #if os(visionOS)
        let role = "Vision"
        #elseif os(iOS)
        let role = UIDevice.current.userInterfaceIdiom == .pad ? "Support" : "Rider"
        #else
        let role = "Device"
        #endif
        return "EQ-\(role)-\(suffix)"
    }
}
