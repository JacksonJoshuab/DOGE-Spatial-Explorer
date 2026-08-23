import CoreLocation
import EndlessEquatorCore
import Foundation
import Observation

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

    public var selectedAreaID: String?
    public var latestWeather: WeatherSummary?
    public var lastGuideResponse: GuideResponse?
    public var alertMessage: String?
    public var webBaseURL: URL
    public var stationaryOverrideAcknowledged = false

    @ObservationIgnored private var lastSyncAt = Date.distantPast

    public init(webBaseURL: URL? = nil) throws {
        let configuredURL: URL = {
            if let webBaseURL { return webBaseURL }
            if let value = Bundle.main.object(forInfoDictionaryKey: "EndlessEquatorServerURL") as? String,
               let url = URL(string: value) { return url }
            return URL(string: "http://localhost:8787")!
        }()
        areas = try ExpeditionCatalog.loadAreas()
        routeEngine = RouteEngine(plan: try ExpeditionCatalog.loadSeedRoute())
        locationService = ExpeditionLocationService()
        voiceGuidance = VoiceGuidanceService()
        weatherService = AreaWeatherService()
        peerSync = PeerSyncService(displayName: "Expedition device")
        turnHaptics = TurnHapticsService()
        guideGateway = GuideGateway(baseURL: configuredURL)
        self.webBaseURL = configuredURL
        selectedAreaID = areas.first?.id

        locationService.onLocation = { [weak self] location in
            guard let self else { return }
            let priorIndex = self.routeEngine.snapshot.activeManeuverIndex
            self.routeEngine.ingest(location: location, stationaryOverrideAcknowledged: self.stationaryOverrideAcknowledged)
            let currentIndex = self.routeEngine.snapshot.activeManeuverIndex
            if self.routeEngine.isRunning, currentIndex != priorIndex,
               let instruction = self.routeEngine.activeManeuver?.instruction {
                self.turnHaptics.turnAdvanced()
                self.voiceGuidance.speak(instruction, localeIdentifier: "en-US")
            }
            if Date().timeIntervalSince(self.lastSyncAt) >= 1 {
                self.lastSyncAt = Date()
                let packet = NavigationSyncPacket(
                    routeID: self.routeEngine.plan.id,
                    maneuverIndex: currentIndex,
                    maneuverInstruction: self.routeEngine.activeManeuver?.instruction,
                    roadReference: self.routeEngine.activeManeuver?.roadReference,
                    activeManeuverCoordinate: self.routeEngine.activeManeuver?.coordinate,
                    speedMetersPerSecond: self.routeEngine.snapshot.currentSpeedMetersPerSecond,
                    motionSafetyState: self.routeEngine.motionSafetyState,
                    selectedAreaID: self.selectedAreaID,
                    weather: self.latestWeather,
                    generatedAt: .now
                )
                try? self.peerSync.send(packet)
            }
        }
    }

    public var selectedArea: AreaOfInterest? {
        areas.first { $0.id == selectedAreaID }
    }

    public var syncedManeuverInstruction: String? {
        peerSync.latestPacket?.maneuverInstruction
    }

    public func beginLocationUpdates() {
        peerSync.start()
        locationService.requestAuthorizationAndStart()
    }

    public func speakCurrentTurn() {
        guard let instruction = routeEngine.activeManeuver?.instruction else { return }
        voiceGuidance.speak(instruction, localeIdentifier: "en-US")
    }

    public func refreshWeather() async {
        guard let area = selectedArea else { return }
        do { latestWeather = try await weatherService.currentWeather(at: area.coordinate) }
        catch { alertMessage = error.localizedDescription }
    }

    public func askGuide(_ question: String, locale: String = "en-US") async {
        guard let area = selectedArea else { return }
        let request = GuideRequest(
            areaID: area.id,
            locale: locale,
            currentManeuver: routeEngine.activeManeuver?.instruction,
            weatherSummary: latestWeather.map { "\($0.condition), \(Int($0.temperatureCelsius))°C" },
            coarseContext: "Area verification: \(area.verificationState.rawValue)",
            question: question
        )
        do { lastGuideResponse = try await guideGateway.ask(request) }
        catch { alertMessage = error.localizedDescription }
    }
}
