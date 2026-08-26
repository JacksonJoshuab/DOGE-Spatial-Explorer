import EndlessEquatorCore
import SwiftUI
import UniformTypeIdentifiers

public struct GPXImportView: View {
    @Bindable private var model: ExpeditionModel
    @Environment(\.dismiss) private var dismiss
    @State private var routeName = "Ecuador planning route"
    @State private var understandsPlanningOnly = false
    @State private var showingImporter = false
    @State private var errorMessage: String?

    public init(model: ExpeditionModel) { self.model = model }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Planning route") {
                    TextField("Route name", text: $routeName)
                    Toggle(
                        "I understand this file cannot unlock operational guidance",
                        isOn: $understandsPlanningOnly
                    )
                }
                Section("Operational boundary") {
                    Label(
                        "A GPX file is geometry, not access authorization.",
                        systemImage: "lock.shield"
                    )
                    Text(
                        "This importer rejects invalid coordinates, oversized files, excessive point counts, and multiple track segments. It always installs the route as planning-only. Operational mode requires a separately validated signed route bundle whose GPX hash, access evidence, weather check, expiry, and rider acknowledgement all match."
                    )
                }
                Button("Choose planning GPX file") { showingImporter = true }
                    .disabled(!canImport)
            }
            .navigationTitle("Import planning GPX")
            .toolbar { Button("Cancel") { dismiss() } }
            .fileImporter(
                isPresented: $showingImporter,
                allowedContentTypes: [UTType(filenameExtension: "gpx") ?? .xml, .xml],
                allowsMultipleSelection: false
            ) { result in
                Task {
                    do {
                        guard let url = try result.get().first else { return }
                        let scoped = url.startAccessingSecurityScopedResource()
                        defer { if scoped { url.stopAccessingSecurityScopedResource() } }

                        let fileSize = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                        guard fileSize <= GPXImporter.maximumInputBytes else {
                            throw GPXImportError.inputTooLarge(maximumBytes: GPXImporter.maximumInputBytes)
                        }

                        let data = try await Task.detached(priority: .userInitiated) {
                            try Data(contentsOf: url, options: .mappedIfSafe)
                        }.value
                        let name = routeName.trimmingCharacters(in: .whitespacesAndNewlines)
                        let verification = RouteVerification(
                            state: .planningOnly,
                            verifiedBy: nil,
                            verifiedAt: nil,
                            accessCheckedAt: nil,
                            weatherCheckedAt: nil,
                            riderAcknowledged: false,
                            note: "Unsigned GPX import. Operational guidance remains locked until a matching signed route bundle is validated."
                        )
                        let plan = try await Task.detached(priority: .userInitiated) {
                            try GPXImporter().importRoute(
                                data: data,
                                name: name,
                                verification: verification
                            )
                        }.value
                        model.installImportedPlan(plan)
                        dismiss()
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                }
            }
            .alert("GPX import failed", isPresented: Binding(
                get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } }
            )) { Button("OK", role: .cancel) {} } message: { Text(errorMessage ?? "") }
        }
    }

    private var canImport: Bool {
        !routeName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        understandsPlanningOnly
    }
}
