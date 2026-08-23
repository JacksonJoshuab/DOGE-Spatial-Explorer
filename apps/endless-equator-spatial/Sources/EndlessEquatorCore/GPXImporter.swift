import Foundation
#if canImport(FoundationXML)
import FoundationXML
#endif

public enum GPXImportError: LocalizedError {
    case noTrackPoints
    case parserFailure(String)

    public var errorDescription: String? {
        switch self {
        case .noTrackPoints: return "The GPX file does not contain track points."
        case .parserFailure(let message): return "GPX parsing failed: \(message)"
        }
    }
}

public final class GPXImporter: NSObject, XMLParserDelegate, @unchecked Sendable {
    private var coordinates: [GeoCoordinate] = []
    private var elevations: [Double?] = []
    private var currentElevationText = ""
    private var insideElevation = false
    private var parseError: Error?

    public func importRoute(
        data: Data,
        name: String,
        verification: RouteVerification
    ) throws -> RoutePlan {
        coordinates.removeAll(keepingCapacity: true)
        elevations.removeAll(keepingCapacity: true)
        parseError = nil

        let parser = XMLParser(data: data)
        parser.delegate = self
        guard parser.parse() else {
            throw GPXImportError.parserFailure(parseError?.localizedDescription ?? parser.parserError?.localizedDescription ?? "Unknown error")
        }
        guard coordinates.count >= 2 else { throw GPXImportError.noTrackPoints }

        let points = coordinates.enumerated().map { index, coordinate in
            RoutePoint(id: "gpx-\(index)", coordinate: coordinate, elevationMeters: elevations.indices.contains(index) ? elevations[index] : nil)
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
        if elementName == "trkpt",
           let latText = attributeDict["lat"], let lonText = attributeDict["lon"],
           let lat = Double(latText), let lon = Double(lonText) {
            coordinates.append(GeoCoordinate(latitude: lat, longitude: lon))
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
            if !elevations.isEmpty {
                elevations[elevations.count - 1] = Double(currentElevationText.trimmingCharacters(in: .whitespacesAndNewlines))
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
                instruction: "Depart on the verified GPX track.", roadReference: nil,
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
                instruction: signed < 0 ? "Turn left to remain on the verified track." : "Turn right to remain on the verified track.",
                roadReference: nil, kind: kind, areaID: nil
            ))
            lastManeuverPoint = current
        }
        result.append(RouteManeuver(
            id: "arrive", sequence: result.count, coordinate: points.last!.coordinate,
            instruction: "Arrive at the verified route endpoint.", roadReference: nil,
            kind: .arrive, areaID: nil
        ))
        return result
    }
}
