import Foundation

public enum GeoMath {
    private static let earthRadiusMeters = 6_371_000.0

    public static func distanceMeters(from a: GeoCoordinate, to b: GeoCoordinate) -> Double {
        let lat1 = a.latitude * .pi / 180
        let lat2 = b.latitude * .pi / 180
        let deltaLat = (b.latitude - a.latitude) * .pi / 180
        let deltaLon = (b.longitude - a.longitude) * .pi / 180
        let h = sin(deltaLat / 2) * sin(deltaLat / 2) +
            cos(lat1) * cos(lat2) * sin(deltaLon / 2) * sin(deltaLon / 2)
        return earthRadiusMeters * 2 * atan2(sqrt(h), sqrt(1 - h))
    }

    public static func bearingDegrees(from a: GeoCoordinate, to b: GeoCoordinate) -> Double {
        let lat1 = a.latitude * .pi / 180
        let lat2 = b.latitude * .pi / 180
        let deltaLon = (b.longitude - a.longitude) * .pi / 180
        let y = sin(deltaLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(deltaLon)
        return (atan2(y, x) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360)
    }

    public static func smallestHeadingDelta(_ a: Double, _ b: Double) -> Double {
        let raw = abs(a - b).truncatingRemainder(dividingBy: 360)
        return min(raw, 360 - raw)
    }

    public static func routeLengthMeters(_ points: [RoutePoint]) -> Double {
        zip(points, points.dropFirst()).reduce(0) { partial, pair in
            partial + distanceMeters(from: pair.0.coordinate, to: pair.1.coordinate)
        }
    }
}

public enum MotionSafetyGate {
    public static func evaluate(
        speedMetersPerSecond: Double?,
        horizontalAccuracyMeters: Double?,
        stationaryOverrideAcknowledged: Bool = false
    ) -> MotionSafetyState {
        guard let accuracy = horizontalAccuracyMeters, accuracy >= 0 else { return .unavailable }
        if let speed = speedMetersPerSecond, speed > 2.5 { return .locked }
        if accuracy > 50 { return .locked }
        if let speed = speedMetersPerSecond, speed <= 0.8, accuracy <= 25 { return .stationary }
        if speedMetersPerSecond == nil, accuracy <= 15, stationaryOverrideAcknowledged { return .stationary }
        return .caution
    }
}
