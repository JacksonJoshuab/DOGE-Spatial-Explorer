#if os(visionOS)
import EndlessEquatorCore
import RealityKit
import SwiftUI

public struct StationarySpatialRouteView: View {
    @Bindable private var model: ExpeditionModel

    public init(model: ExpeditionModel) { self.model = model }

    public var body: some View {
        if model.routeEngine.motionSafetyState.permitsSpatialRouteRoom {
            RealityView { content in
                content.add(makeRouteEntity(route: model.routeEngine.plan, areas: model.areas))
            } update: { content in
                content.entities.first?.isEnabled = model.routeEngine.motionSafetyState.permitsSpatialRouteRoom
            }
            .overlay(alignment: .top) {
                Text("STATIONARY BRIEFING — NOT A RIDING HUD")
                    .font(.headline)
                    .padding()
                    .endlessEquatorGlassCapsule()
            }
        } else {
            ContentUnavailableView(
                "Spatial route room locked",
                systemImage: "figure.seated.side",
                description: Text("Stop in a safe place and use iPhone/iPad for active navigation.")
            )
        }
    }

    private func makeRouteEntity(route: RoutePlan, areas: [AreaOfInterest]) -> Entity {
        let root = Entity()
        root.name = "endless-equator-route"
        guard let origin = route.points.first?.coordinate else { return root }
        let positions = route.points.map { point in project(point.coordinate, origin: origin) }

        for (index, position) in positions.enumerated() {
            let marker = ModelEntity(
                mesh: .generateSphere(radius: index == 0 ? 0.025 : 0.014),
                materials: [SimpleMaterial(color: index == 0 ? .orange : .cyan, isMetallic: false)]
            )
            marker.position = position
            root.addChild(marker)
        }
        for (start, end) in zip(positions, positions.dropFirst()) {
            let delta = end - start
            let length = simd_length(delta)
            let segment = ModelEntity(
                mesh: .generateBox(size: [0.012, 0.012, max(length, 0.001)]),
                materials: [SimpleMaterial(color: .orange, isMetallic: false)]
            )
            segment.position = (start + end) / 2
            segment.look(at: end, from: segment.position, relativeTo: root)
            root.addChild(segment)
        }
        return root
    }

    private func project(_ coordinate: GeoCoordinate, origin: GeoCoordinate) -> SIMD3<Float> {
        let lonScale = cos(origin.latitude * .pi / 180)
        let x = Float((coordinate.longitude - origin.longitude) * lonScale * 0.55)
        let z = Float(-(coordinate.latitude - origin.latitude) * 0.55)
        return [x, 0, z]
    }
}
#endif
