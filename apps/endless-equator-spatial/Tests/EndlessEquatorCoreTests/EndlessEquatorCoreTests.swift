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

@Test func sparseRouteMidpointProjectsOntoSegment() {
    let points = [
        RoutePoint(id: "a", coordinate: .init(latitude: 0, longitude: 0), elevationMeters: nil),
        RoutePoint(id: "b", coordinate: .init(latitude: 0, longitude: 0.01), elevationMeters: nil)
    ]
    let projection = GeoMath.project(.init(latitude: 0, longitude: 0.005), onto: points)
    #expect(projection != nil)
    #expect((projection?.distanceMeters ?? .infinity) < 1)
    #expect((projection?.alongRouteMeters ?? 0) > 500)
}

@Test func motionGateLocksMovingOrStaleHeadset() {
    #expect(MotionSafetyGate.evaluate(speedMetersPerSecond: 7, horizontalAccuracyMeters: 8) == .locked)
    #expect(MotionSafetyGate.evaluate(speedMetersPerSecond: 0.2, horizontalAccuracyMeters: 8) == .stationary)
    #expect(MotionSafetyGate.evaluate(speedMetersPerSecond: 0.2, horizontalAccuracyMeters: 8, locationAgeSeconds: 10) == .locked)
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

@Test func gpxImporterRejectsMultipleTrackSegments() {
    let xml = """
    <gpx version="1.1"><trk>
      <trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="0.001"/></trkseg>
      <trkseg><trkpt lat="0" lon="0.010"/><trkpt lat="0" lon="0.011"/></trkseg>
    </trk></gpx>
    """.data(using: .utf8)!
    do {
        _ = try GPXImporter().importRoute(
            data: xml,
            name: "Discontinuous",
            verification: planningVerification()
        )
        Issue.record("A multi-segment GPX was accepted")
    } catch GPXImportError.multipleTrackSegments {
        // Expected.
    } catch {
        Issue.record("Unexpected error: \(error)")
    }
}

@Test func gpxImporterRejectsNonFiniteOrOutOfRangeCoordinates() {
    let xml = """
    <gpx version="1.1"><trk><trkseg>
      <trkpt lat="91" lon="0"/><trkpt lat="0" lon="0.001"/>
    </trkseg></trk></gpx>
    """.data(using: .utf8)!
    do {
        _ = try GPXImporter().importRoute(
            data: xml,
            name: "Invalid",
            verification: planningVerification()
        )
        Issue.record("An invalid coordinate was accepted")
    } catch GPXImportError.invalidCoordinate(_, _) {
        // Expected.
    } catch {
        Issue.record("Unexpected error: \(error)")
    }
}

@MainActor
@Test func navigationAdvancesPastMissedManeuverRadius() throws {
    let coordinates = [0.0, 0.001, 0.002, 0.003].map {
        GeoCoordinate(latitude: 0, longitude: $0)
    }
    let route = RoutePlan(
        id: "progress-test",
        name: "Progress test",
        version: "1",
        points: coordinates.enumerated().map {
            RoutePoint(id: "p\($0.offset)", coordinate: $0.element, elevationMeters: nil)
        },
        maneuvers: coordinates.enumerated().map {
            RouteManeuver(
                id: "m\($0.offset)", sequence: $0.offset, coordinate: $0.element,
                instruction: "Maneuver \($0.offset)", roadReference: nil,
                kind: $0.offset == coordinates.count - 1 ? .arrive : .continueStraight,
                areaID: nil
            )
        },
        verification: RouteVerification(
            state: .verified, verifiedBy: "Test verifier", verifiedAt: .now,
            accessCheckedAt: .now, weatherCheckedAt: .now,
            riderAcknowledged: true, note: "Test only"
        ),
        optionalCoastExtensionAreaIDs: []
    )

    let engine = RouteEngine(plan: route)
    try engine.start()
    engine.ingest(location: CLLocation(
        coordinate: CLLocationCoordinate2D(latitude: 0, longitude: 0.0014),
        altitude: 0,
        horizontalAccuracy: 5,
        verticalAccuracy: 5,
        course: 90,
        speed: 8,
        timestamp: .now
    ))

    #expect(engine.snapshot.activeManeuverIndex == 2)
    #expect(engine.snapshot.isOffRoute == false)
}

private func planningVerification() -> RouteVerification {
    RouteVerification(
        state: .planningOnly,
        verifiedBy: nil,
        verifiedAt: nil,
        accessCheckedAt: nil,
        weatherCheckedAt: nil,
        riderAcknowledged: false,
        note: "Test planning route"
    )
}
