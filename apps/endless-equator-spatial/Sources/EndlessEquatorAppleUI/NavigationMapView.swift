import CoreLocation
import EndlessEquatorCore
import MapKit
import SwiftUI

public struct NavigationMapView: View {
    public let route: RoutePlan
    public let areas: [AreaOfInterest]
    public let selectedAreaID: String?
    public let onSelectArea: (String) -> Void

    @State private var camera: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: -0.8, longitude: -78.6),
            span: MKCoordinateSpan(latitudeDelta: 3.2, longitudeDelta: 3.2)
        )
    )

    public init(route: RoutePlan, areas: [AreaOfInterest], selectedAreaID: String?, onSelectArea: @escaping (String) -> Void) {
        self.route = route
        self.areas = areas
        self.selectedAreaID = selectedAreaID
        self.onSelectArea = onSelectArea
    }

    public var body: some View {
        Map(
            position: $camera,
            interactionModes: [.pan, .zoom, .rotate],
            selection: Binding(
                get: { selectedAreaID },
                set: { if let id = $0 { onSelectArea(id) } }
            )
        ) {
            UserAnnotation()
            MapPolyline(coordinates: route.points.map { $0.coordinate.clCoordinate })
                .stroke(.orange, style: StrokeStyle(lineWidth: 6, lineCap: .round, lineJoin: .round))
            ForEach(areas) { area in
                Marker(area.name, systemImage: area.category.systemImage, coordinate: area.coordinate.clCoordinate)
                    .tint(area.id == selectedAreaID ? .yellow : .blue)
                    .tag(area.id)
            }
        }
        .mapStyle(.standard(elevation: .realistic, pointsOfInterest: .excludingAll))
        .mapControls {
            MapCompass()
            MapScaleView()
            MapUserLocationButton()
        }
        .onMapCameraChange(frequency: .onEnd) { _ in }
        .accessibilityLabel("Endless Equator route map")
    }
}

private extension GeoCoordinate {
    var clCoordinate: CLLocationCoordinate2D { .init(latitude: latitude, longitude: longitude) }
}

public extension AreaCategory {
    var systemImage: String {
        switch self {
        case .launch: "flag.checkered"
        case .volcano: "mountain.2"
        case .hotSprings: "humidity"
        case .jungle: "leaf"
        case .waterfall: "water.waves"
        case .crater: "circle.dashed"
        case .ruins: "building.columns"
        case .surf: "figure.surfing"
        case .community: "person.3"
        case .rotary: "hands.sparkles"
        case .lodging: "bed.double"
        case .motorcycleRental: "motorcycle"
        case .spatialCapture: "vision.pro"
        case .fuel: "fuelpump"
        case .medical: "cross.case"
        case .support: "wrench.and.screwdriver"
        }
    }
}
