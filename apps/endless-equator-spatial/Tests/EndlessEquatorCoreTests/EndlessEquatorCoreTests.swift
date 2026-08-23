import CoreLocation
import Testing
@testable import EndlessEquatorCore

@Test func distanceIsReasonable() {
    let pifo = GeoCoordinate(latitude: -0.226, longitude: -78.338)
    let papallacta = GeoCoordinate(latitude: -0.368, longitude: -78.142)
    let distance = GeoMath.distanceMeters(from: pifo, to: papallacta)
    #expect(distance > 20_000)
    #expect(distance < 40_000)
}

@Test func motionGateLocksMovingHeadset() {
    #expect(MotionSafetyGate.evaluate(speedMetersPerSecond: 7, horizontalAccuracyMeters: 8) == .locked)
    #expect(MotionSafetyGate.evaluate(speedMetersPerSecond: 0.2, horizontalAccuracyMeters: 8) == .stationary)
}

@Test func seedRouteIsNotOperational() throws {
    let route = try ExpeditionCatalog.loadSeedRoute()
    #expect(route.verification.permitsOperationalGuidance == false)
}

@Test func gpxImporterBuildsRoute() throws {
    let xml = """
    <gpx version="1.1"><trk><trkseg>
      <trkpt lat="-0.226" lon="-78.338"><ele>2550</ele></trkpt>
      <trkpt lat="-0.230" lon="-78.330"><ele>2580</ele></trkpt>
      <trkpt lat="-0.240" lon="-78.320"><ele>2600</ele></trkpt>
    </trkseg></trk></gpx>
    """.data(using: .utf8)!
    let verification = RouteVerification(
        state: .verified, verifiedBy: "Local guide", verifiedAt: .now,
        accessCheckedAt: .now, weatherCheckedAt: .now,
        riderAcknowledged: true, note: "Test"
    )
    let route = try GPXImporter().importRoute(data: xml, name: "Test", verification: verification)
    #expect(route.points.count == 3)
    #expect(route.verification.permitsOperationalGuidance)
}
