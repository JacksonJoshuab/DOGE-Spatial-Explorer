import EndlessEquatorCore
import SwiftUI

public struct RouteVerificationView: View {
    public let route: RoutePlan
    @Environment(\.dismiss) private var dismiss

    public init(route: RoutePlan) { self.route = route }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Route status") {
                    LabeledContent("State", value: route.verification.state.rawValue)
                    LabeledContent("Operational", value: route.verification.permitsOperationalGuidance ? "Yes" : "No")
                    Text(route.verification.note)
                }
                Section("Required before riding") {
                    requirement("Named verifier", met: !(route.verification.verifiedBy?.isEmpty ?? true))
                    requirement("Route verification timestamp", met: route.verification.verifiedAt != nil)
                    requirement("Access/closure check", met: route.verification.accessCheckedAt != nil)
                    requirement("Weather check", met: route.verification.weatherCheckedAt != nil)
                    requirement("Rider acknowledgement", met: route.verification.riderAcknowledged)
                }
                Section("Seed route warning") {
                    Text("The bundled Ecuador line is a high-level planning preview. It cannot be promoted to operational merely by tapping a button; import a current verified GPX/manifest.")
                }
            }
            .navigationTitle("Route verification")
            .toolbar { Button("Done") { dismiss() } }
        }
    }

    private func requirement(_ title: String, met: Bool) -> some View {
        Label(title, systemImage: met ? "checkmark.circle.fill" : "xmark.circle.fill")
            .foregroundStyle(met ? .green : .orange)
    }
}
