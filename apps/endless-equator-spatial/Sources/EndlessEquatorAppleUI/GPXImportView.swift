import EndlessEquatorCore
import SwiftUI
import UniformTypeIdentifiers

public struct GPXImportView: View {
    @Bindable private var model: ExpeditionModel
    @Environment(\.dismiss) private var dismiss
    @State private var verifier = ""
    @State private var routeName = "Verified Ecuador route"
    @State private var accessChecked = false
    @State private var weatherChecked = false
    @State private var riderAcknowledged = false
    @State private var showingImporter = false
    @State private var errorMessage: String?

    public init(model: ExpeditionModel) { self.model = model }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Verification manifest") {
                    TextField("Route name", text: $routeName)
                    TextField("Named local verifier / guide", text: $verifier)
                    Toggle("Access and closures checked now", isOn: $accessChecked)
                    Toggle("Weather checked now", isOn: $weatherChecked)
                    Toggle("Rider acknowledges this exact route", isOn: $riderAcknowledged)
                }
                Section("Operational boundary") {
                    Text("Importing a GPX does not prove access. Operational guidance unlocks only when every verification field is complete. Protected-area and private-road rules still control.")
                }
                Button("Choose GPX file") { showingImporter = true }
                    .disabled(!canImport)
            }
            .navigationTitle("Import verified GPX")
            .toolbar { Button("Cancel") { dismiss() } }
            .fileImporter(
                isPresented: $showingImporter,
                allowedContentTypes: [UTType(filenameExtension: "gpx") ?? .xml, .xml],
                allowsMultipleSelection: false
            ) { result in
                do {
                    guard let url = try result.get().first else { return }
                    let scoped = url.startAccessingSecurityScopedResource()
                    defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                    let data = try Data(contentsOf: url)
                    let now = Date()
                    let verification = RouteVerification(
                        state: .verified,
                        verifiedBy: verifier,
                        verifiedAt: now,
                        accessCheckedAt: accessChecked ? now : nil,
                        weatherCheckedAt: weatherChecked ? now : nil,
                        riderAcknowledged: riderAcknowledged,
                        note: "Imported from GPX after explicit operator verification."
                    )
                    let plan = try GPXImporter().importRoute(data: data, name: routeName, verification: verification)
                    model.routeEngine.replacePlan(plan)
                    dismiss()
                } catch {
                    errorMessage = error.localizedDescription
                }
            }
            .alert("GPX import failed", isPresented: Binding(
                get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } }
            )) { Button("OK", role: .cancel) {} } message: { Text(errorMessage ?? "") }
        }
    }

    private var canImport: Bool {
        !verifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !routeName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        accessChecked && weatherChecked && riderAcknowledged
    }
}
