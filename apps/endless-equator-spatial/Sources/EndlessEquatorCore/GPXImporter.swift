import Foundation
#if canImport(FoundationXML)
import FoundationXML
#endif

public enum GPXImportError: LocalizedError {
    case noTrackPoints
    case parserFailure(String)
    case inputTooLarge(maximumBytes: Int)
    case tooManyTrackPoints(maximum: Int)
    case multipleTrackSegments
    case invalidCoordinate(latitude: String, longitude: String)

    public var errorDescription: String? {
        switch self {
        case .noTrackPoints:
            "The GPX file does not contain at least two track points."
        case .parserFailure(let message):
            "GPX parsing failed: \(message)"
        case .inputTooLarge(let maximumBytes):
            "The GPX file exceeds the \(maximumBytes / 1_000_000) MB safety limit."
        case .tooManyTrackPoints(let maximum):
            "The GPX file exceeds the \(maximum) track-point safety limit."
        case .multipleTrackSegments:
            "This GPX contains multiple track segments. Resolve recording gaps into one explicitly verified continuous track before importing it."
        case .invalidCoordinate(let latitude, let longitude):
            "The GPX contains an invalid coordinate (latitude \(latitude), longitude \(longitude))."
        }
    }
}

public final class GPXImporter: NSObject, XMLParserDelegate, @unchecked Sendable {
    public static let maximumInputBytes = 5_000_000
    public static let maximumTrackPoints = 100_000

    private var coordinates: [GeoCoordinate] = []
    private var elevations: [Double?] = []
    private var currentElevationText = ""
    private var insideElevation = false
    private var parseError: Error?
    private var importError: GPXImportError?
    private var trackSegmentCount = 0

    public func importRoute(
        data: Data,
        name: String,
        verification: RouteVerification
    ) throws -> RoutePlan {
        guard data.count <= Self.maximumInputBytes else {
            throw GPXImportError.inputTooLarge(maximumBytes: Self.maximumInputBytes)
        }

        coordinates.removeAll(keepingCapacity: true)
        elevations.removeAll(keepingCapacity: true)
        currentElevationText = ""
        insideElevation = false
        parseError = nil
        importError = nil
        trackSegmentCount = 0

        let parser = XMLParser(data: data)
        parser.delegate = self
        parser.shouldResolveExternalEntities = false
        let parsed = parser.parse()
        if let importError { throw importError }
        guard parsed else {
            throw GPXImportError.parserFailure(
                parseError?.localizedDescription ?? parser.parserError?.localizedDescription ?? "Unknown error"
            )
        }
        guard coordinates.count >= 2 else { throw GPXImportError.noTrackPoints }

        let points = coordinates.enumerated().map { index, coordinate in
            RoutePoint(
                id: "gpx-\(index)",
                coordinate: coordinate,
                elevationMeters: elevations.indices.contains(index) ? elevations[index] : nil
            )
        }
        let maneuvers = makeManeuvers(points: points)
        return RoutePlan(
            id: UUID().uuidString,
            name: name,
            version: ISO8601DateFormatter().string(from: Date()),
            points: points,
            maneuvers: maneuvers,
            verification: verification,
            optionalCoastExtensionAreaIDs: []
        )
    }

    public func parser(
        _ parser: XMLParser,
        didStartElement elementName: String,
        namespaceURI: String?,
        qualifiedName qName: String?,
        attributes attributeDict: [String: String] = [:]
    ) {
        if elementName == "trkseg" {
            trackSegmentCount += 1
            if trackSegmentCount > 1 {
                importError = .multipleTrackSegments
                parser.abortParsing()
            }
            return
        }

        if elementName == "trkpt" {
            guard trackSegmentCount == 1,
                  let latText = attributeDict["lat"],
                  let lonText = attributeDict["lon"],
                  let latitude = Double(latText),
                  let longitude = Double(lonText),
                  latitude.isFinite,
                  longitude.isFinite,
                  (-90...90).contains(latitude),
                  (-180...180).contains(longitude) else {
                importError = .invalidCoordinate(
                    latitude: attributeDict["lat"] ?? "missing",
                    longitude: attributeDict["lon"] ?? "missing"
                )
                parser.abortParsing()
                return
            }
            guard coordinates.count < Self.maximumTrackPoints else {
                importError = .tooManyTrackPoints(maximum: Self.maximumTrackPoints)
                parser.abortParsing()
                return
            }
            coordinates.append(GeoCoordinate(latitude: latitude, longitude: longitude))
            elevations.append(nil)
        } else if elementName == "ele" {
            insideElevation = true
            currentElevationText = ""
        }
    }

    public func parser(_ parser: XMLParser, foundCharacters string: String) {
        if insideElevation { currentElevationText += string }
    }

    public func parser(
        _ parser: XMLParser,
        didEndElement elementName: String,
        namespaceURI: String?,
        qualifiedName qName: String?
    ) {
        if elementName == "ele" {
            insideElevation = false
            if !elevations.isEmpty,
               let elevation = Double(currentElevationText.trimmingCharacters(in: .whitespacesAndNewlines)),
               elevation.isFinite {
                elevations[elevations.count - 1] = elevation
            }
        }
    }

    public func parser(_ parser: XMLParser, parseErrorOccurred parseError: Error) {
        self.parseError = parseError
    }

    private func makeManeuvers(points: [RoutePoint]) -> [RouteManeuver] {
        var result: [RouteManeuver] = [
            RouteManeuver(
                id: "depart", sequence: 0, coordinate: points[0].coordinate,
                instruction: "Depart on the imported planning track.", roadReference: nil,
                kind: .depart, areaID: nil
            )
        ]
        var lastManeuverPoint = points[0]
        for index in 1..<(points.count - 1) {
            let before = points[index - 1]
            let current = points[index]
            let after = points[index + 1]
            let distanceSinceLast = GeoMath.distanceMeters(from: lastManeuverPoint.coordinate, to: current.coordinate)
            guard distanceSinceLast >= 75 else { continue }
            let incoming = GeoMath.bearingDegrees(from: before.coordinate, to: current.coordinate)
            let outgoing = GeoMath.bearingDegrees(from: current.coordinate, to: after.coordinate)
            let delta = GeoMath.smallestHeadingDelta(incoming, outgoing)
            guard delta >= 32 else { continue }
            let signed = ((outgoing - incoming + 540).truncatingRemainder(dividingBy: 360)) - 180
            let kind: ManeuverKind = signed < 0 ? .turnLeft : .turnRight
            result.append(RouteManeuver(
                id: "turn-\(index)", sequence: result.count,
                coordinate: current.coordinate,
                instruction: signed < 0
                    ? "Turn left to remain on the imported planning track."
                    : "Turn right to remain on the imported planning track.",
                roadReference: nil, kind: kind, areaID: nil
            ))
            lastManeuverPoint = current
        }
        result.append(RouteManeuver(
            id: "arrive", sequence: result.count, coordinate: points.last!.coordinate,
            instruction: "Arrive at the imported planning-route endpoint.", roadReference: nil,
            kind: .arrive, areaID: nil
        ))
        return result
    }
}
