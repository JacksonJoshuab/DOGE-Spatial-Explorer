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
                    LabeledContent("Operational now", value: route.verification.permitsOperationalGuidance ? "Yes" : "No")
                    if let expiresAt = route.verification.expiresAt {
                        LabeledContent(
                            "Expires",
                            value: expiresAt.formatted(date: .abbreviated, time: .shortened)
                        )
                    }
                    Text(route.verification.note)
                }
                Section("Required before riding") {
                    requirement("Named verifier", met: !(route.verification.verifiedBy?.isEmpty ?? true))
                    requirement("Route verification timestamp", met: route.verification.verifiedAt != nil)
                    requirement(
                        "Access check within 72 hours",
                        met: isFresh(route.verification.accessCheckedAt, maximumAge: 72 * 60 * 60)
                    )
                    requirement(
                        "Weather check within 24 hours",
                        met: isFresh(route.verification.weatherCheckedAt, maximumAge: 24 * 60 * 60)
                    )
                    requirement(
                        "Explicit unexpired validity window",
                        met: route.verification.expiresAt.map { $0 > Date() } ?? false
                    )
                    requirement("Rider acknowledgement", met: route.verification.riderAcknowledged)
                }
                Section("Planning-route warning") {
                    Text("The bundled Ecuador line and unsigned GPX imports are planning geometry. They cannot be promoted to operational by tapping a button; operational guidance requires a current, matching, cryptographically signed route bundle and field authority still overrides it.")
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

    private func isFresh(_ date: Date?, maximumAge: TimeInterval) -> Bool {
        guard let date else { return false }
        let age = Date().timeIntervalSince(date)
        return age >= -5 * 60 && age <= maximumAge
    }
}
