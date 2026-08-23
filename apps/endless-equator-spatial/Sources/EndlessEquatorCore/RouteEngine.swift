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

    public func stop() { isRunning = false }

    public func ingest(location: CLLocation, stationaryOverrideAcknowledged: Bool = false) {
        motionSafetyState = MotionSafetyGate.evaluate(
            speedMetersPerSecond: location.speed >= 0 ? location.speed : nil,
            horizontalAccuracyMeters: location.horizontalAccuracy,
            stationaryOverrideAcknowledged: stationaryOverrideAcknowledged
        )
        guard let maneuver = activeManeuver else { return }
        let here = GeoCoordinate(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude)
        let distance = GeoMath.distanceMeters(from: here, to: maneuver.coordinate)
        var nextIndex = snapshot.activeManeuverIndex
        if isRunning, distance <= 45, nextIndex < plan.maneuvers.count - 1 { nextIndex += 1 }
        let offRouteDistance = nearestRouteDistance(from: here)
        let remaining = remainingDistance(from: here, maneuverIndex: nextIndex)
        snapshot = NavigationSnapshot(
            mode: plan.verification.permitsOperationalGuidance ? .operational : .planningPreview,
            activeManeuverIndex: nextIndex,
            distanceToManeuverMeters: distance,
            remainingRouteMeters: remaining,
            isOffRoute: offRouteDistance > 150,
            currentSpeedMetersPerSecond: location.speed >= 0 ? location.speed : nil,
            lastLocationAt: location.timestamp
        )
    }

    private func nearestRouteDistance(from coordinate: GeoCoordinate) -> Double {
        plan.points.lazy.map { GeoMath.distanceMeters(from: coordinate, to: $0.coordinate) }.min() ?? .infinity
    }

    private func remainingDistance(from coordinate: GeoCoordinate, maneuverIndex: Int) -> Double {
        guard plan.maneuvers.indices.contains(maneuverIndex) else { return 0 }
        let current = plan.maneuvers[maneuverIndex].coordinate
        let distanceToNext = GeoMath.distanceMeters(from: coordinate, to: current)
        let remainingManeuvers = plan.maneuvers.dropFirst(maneuverIndex)
        let between = zip(remainingManeuvers, remainingManeuvers.dropFirst()).reduce(0.0) { partial, pair in
            partial + GeoMath.distanceMeters(from: pair.0.coordinate, to: pair.1.coordinate)
        }
        return distanceToNext + between
    }
}

public enum RouteEngineError: LocalizedError {
    case routeNotOperational

    public var errorDescription: String? {
        "Operational guidance is locked until the route, access, weather and rider acknowledgement are verified."
    }
}
