import CoreLocation
import Foundation
import Observation

@MainActor
@Observable
public final class RouteEngine {
    public private(set) var plan: RoutePlan
    public private(set) var snapshot: NavigationSnapshot
    public private(set) var isRunning = false
    public private(set) var motionSafetyState: MotionSafetyState = .unavailable

    @ObservationIgnored private var lastAlongRouteMeters: Double?

    public init(plan: RoutePlan) {
        self.plan = plan
        self.snapshot = NavigationSnapshot(
            mode: .planningPreview,
            activeManeuverIndex: 0,
            distanceToManeuverMeters: nil,
            remainingRouteMeters: GeoMath.routeLengthMeters(plan.points),
            isOffRoute: false,
            currentSpeedMetersPerSecond: nil,
            lastLocationAt: nil
        )
    }

    public var activeManeuver: RouteManeuver? {
        guard plan.maneuvers.indices.contains(snapshot.activeManeuverIndex) else { return nil }
        return plan.maneuvers[snapshot.activeManeuverIndex]
    }

    public func replacePlan(_ newPlan: RoutePlan) {
        plan = newPlan
        isRunning = false
        lastAlongRouteMeters = nil
        snapshot = NavigationSnapshot(
            mode: newPlan.verification.permitsOperationalGuidance ? .operational : .planningPreview,
            activeManeuverIndex: 0,
            distanceToManeuverMeters: nil,
            remainingRouteMeters: GeoMath.routeLengthMeters(newPlan.points),
            isOffRoute: false,
            currentSpeedMetersPerSecond: nil,
            lastLocationAt: nil
        )
    }

    public func start() throws {
        guard plan.verification.permitsOperationalGuidance else {
            throw RouteEngineError.routeNotOperational
        }
        isRunning = true
        lastAlongRouteMeters = nil
        snapshot = NavigationSnapshot(
            mode: .operational,
            activeManeuverIndex: snapshot.activeManeuverIndex,
            distanceToManeuverMeters: snapshot.distanceToManeuverMeters,
            remainingRouteMeters: snapshot.remainingRouteMeters,
            isOffRoute: snapshot.isOffRoute,
            currentSpeedMetersPerSecond: snapshot.currentSpeedMetersPerSecond,
            lastLocationAt: snapshot.lastLocationAt
        )
    }

    public func stop() {
        isRunning = false
        lastAlongRouteMeters = nil
    }

    public func ingest(location: CLLocation, stationaryOverrideAcknowledged: Bool = false) {
        let locationAge = Date().timeIntervalSince(location.timestamp)
        motionSafetyState = MotionSafetyGate.evaluate(
            speedMetersPerSecond: location.speed >= 0 ? location.speed : nil,
            horizontalAccuracyMeters: location.horizontalAccuracy,
            locationAgeSeconds: locationAge,
            stationaryOverrideAcknowledged: stationaryOverrideAcknowledged
        )

        let verificationIsCurrent = plan.verification.permitsOperationalGuidance
        if isRunning, !verificationIsCurrent {
            stop()
        }

        guard !plan.maneuvers.isEmpty else { return }
        let here = GeoCoordinate(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude)
        let minimumAlong = isRunning ? lastAlongRouteMeters.map { max(0, $0 - 30) } : nil
        let projection = GeoMath.project(here, onto: plan.points, minimumAlongRouteMeters: minimumAlong)
        let projectedAlong = projection?.alongRouteMeters ?? lastAlongRouteMeters ?? 0
        let monotonicAlong = isRunning ? max(lastAlongRouteMeters ?? projectedAlong, projectedAlong) : projectedAlong
        if isRunning { lastAlongRouteMeters = monotonicAlong }

        var nextIndex = snapshot.activeManeuverIndex
        if isRunning {
            nextIndex = advancedManeuverIndex(
                from: nextIndex,
                currentCoordinate: here,
                alongRouteMeters: monotonicAlong
            )
        }

        let nextDistance: Double? = plan.maneuvers.indices.contains(nextIndex)
            ? GeoMath.distanceMeters(from: here, to: plan.maneuvers[nextIndex].coordinate)
            : nil
        let routeLength = GeoMath.routeLengthMeters(plan.points)
        let remaining = max(0, routeLength - monotonicAlong)
        let offRouteDistance = projection?.distanceMeters ?? .infinity

        snapshot = NavigationSnapshot(
            mode: verificationIsCurrent ? .operational : .planningPreview,
            activeManeuverIndex: nextIndex,
            distanceToManeuverMeters: nextDistance,
            remainingRouteMeters: remaining,
            isOffRoute: offRouteDistance > 150,
            currentSpeedMetersPerSecond: location.speed >= 0 ? location.speed : nil,
            lastLocationAt: location.timestamp
        )
    }

    private func advancedManeuverIndex(
        from initialIndex: Int,
        currentCoordinate: GeoCoordinate,
        alongRouteMeters: Double
    ) -> Int {
        var index = min(max(0, initialIndex), plan.maneuvers.count - 1)
        while index < plan.maneuvers.count - 1 {
            let maneuver = plan.maneuvers[index]
            let distance = GeoMath.distanceMeters(from: currentCoordinate, to: maneuver.coordinate)
            let maneuverAlong = GeoMath.project(maneuver.coordinate, onto: plan.points)?.alongRouteMeters
            let hasPassed = maneuverAlong.map { alongRouteMeters > $0 + 35 } ?? false
            guard distance <= 45 || hasPassed else { break }
            index += 1
        }
        return index
    }
}

public enum RouteEngineError: LocalizedError {
    case routeNotOperational

    public var errorDescription: String? {
        "Operational guidance is locked until a signed route bundle, access, weather, explicit expiry and rider acknowledgement are verified."
    }
}
