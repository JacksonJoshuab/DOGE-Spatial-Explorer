import Foundation

public struct RouteProjection: Hashable, Sendable {
    public let distanceMeters: Double
    public let alongRouteMeters: Double
    public let segmentIndex: Int
    public let segmentFraction: Double

    public init(
        distanceMeters: Double,
        alongRouteMeters: Double,
        segmentIndex: Int,
        segmentFraction: Double
    ) {
        self.distanceMeters = distanceMeters
        self.alongRouteMeters = alongRouteMeters
        self.segmentIndex = segmentIndex
        self.segmentFraction = segmentFraction
    }
}

public enum GeoMath {
    private static let earthRadiusMeters = 6_371_000.0

    public static func distanceMeters(from a: GeoCoordinate, to b: GeoCoordinate) -> Double {
        let lat1 = a.latitude * .pi / 180
        let lat2 = b.latitude * .pi / 180
        let deltaLat = (b.latitude - a.latitude) * .pi / 180
        let deltaLon = (b.longitude - a.longitude) * .pi / 180
        let h = sin(deltaLat / 2) * sin(deltaLat / 2) +
            cos(lat1) * cos(lat2) * sin(deltaLon / 2) * sin(deltaLon / 2)
        return earthRadiusMeters * 2 * atan2(sqrt(h), sqrt(max(0, 1 - h)))
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

    /// Projects a coordinate onto the route polyline instead of comparing only
    /// with stored vertices. `minimumAlongRouteMeters` prevents a noisy fix on a
    /// loop or nearby parallel segment from moving progress backwards.
    public static func project(
        _ coordinate: GeoCoordinate,
        onto points: [RoutePoint],
        minimumAlongRouteMeters: Double? = nil
    ) -> RouteProjection? {
        guard let first = points.first else { return nil }
        guard points.count > 1 else {
            return RouteProjection(
                distanceMeters: distanceMeters(from: coordinate, to: first.coordinate),
                alongRouteMeters: 0,
                segmentIndex: 0,
                segmentFraction: 0
            )
        }

        var best: RouteProjection?
        var cumulative = 0.0
        let minimumAlong = max(0, minimumAlongRouteMeters ?? 0)

        for (index, pair) in zip(points, points.dropFirst()).enumerated() {
            let a = pair.0.coordinate
            let b = pair.1.coordinate
            let meanLatitude = ((a.latitude + b.latitude + coordinate.latitude) / 3) * .pi / 180
            let metersPerDegreeLatitude = earthRadiusMeters * .pi / 180
            let metersPerDegreeLongitude = metersPerDegreeLatitude * cos(meanLatitude)

            let bx = (b.longitude - a.longitude) * metersPerDegreeLongitude
            let by = (b.latitude - a.latitude) * metersPerDegreeLatitude
            let px = (coordinate.longitude - a.longitude) * metersPerDegreeLongitude
            let py = (coordinate.latitude - a.latitude) * metersPerDegreeLatitude
            let squaredLength = bx * bx + by * by
            let segmentLength = sqrt(squaredLength)

            guard segmentLength.isFinite, segmentLength > 0.001 else {
                cumulative += max(0, segmentLength)
                continue
            }

            var fraction = max(0, min(1, (px * bx + py * by) / squaredLength))
            let minimumFraction = max(0, min(1, (minimumAlong - cumulative) / segmentLength))
            if cumulative + segmentLength >= minimumAlong {
                fraction = max(fraction, minimumFraction)
            } else {
                cumulative += segmentLength
                continue
            }

            let projectedX = bx * fraction
            let projectedY = by * fraction
            let distance = hypot(px - projectedX, py - projectedY)
            let along = cumulative + segmentLength * fraction
            let candidate = RouteProjection(
                distanceMeters: distance,
                alongRouteMeters: along,
                segmentIndex: index,
                segmentFraction: fraction
            )
            if best == nil || candidate.distanceMeters < best!.distanceMeters {
                best = candidate
            }
            cumulative += segmentLength
        }

        return best
    }
}

public enum MotionSafetyGate {
    public static func evaluate(
        speedMetersPerSecond: Double?,
        horizontalAccuracyMeters: Double?,
        locationAgeSeconds: Double? = 0,
        stationaryOverrideAcknowledged: Bool = false
    ) -> MotionSafetyState {
        guard let age = locationAgeSeconds, age.isFinite else { return .unavailable }
        if age > 5 || age < -1 { return .locked }
        guard let accuracy = horizontalAccuracyMeters, accuracy >= 0 else { return .unavailable }
        if let speed = speedMetersPerSecond, speed > 2.5 { return .locked }
        if accuracy > 50 { return .locked }
        if let speed = speedMetersPerSecond, speed <= 0.8, accuracy <= 25 { return .stationary }
        if speedMetersPerSecond == nil, accuracy <= 15, stationaryOverrideAcknowledged { return .stationary }
        return .caution
    }
}
