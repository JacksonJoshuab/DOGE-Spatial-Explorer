// ContentView.swift
// DOGE Spatial Explorer — Main Window View
//
// The primary 2D window interface for the spatial editor.
// Provides project management, scene hierarchy, properties inspector,
// and controls for opening the volumetric preview and immersive space.

import SwiftUI
import RealityKit

struct ContentView: View {

    @Environment(AppModel.self) private var appModel
    @Environment(CollaborationManager.self) private var collaboration
    @Environment(PrivacyManager.self) private var privacy
    @Environment(SceneGraphManager.self) private var sceneManager
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow

    @State private var showingNewProjectSheet = false
    @State private var showingCollaborationSheet = false
    @State private var showingPrivacySettings = false
    @State private var showingAssetBrowser = false
    @State private var searchText = ""

    var body: some View {
        NavigationSplitView {
            // ── Sidebar: Scene Hierarchy ────────────────────────────────
            sidebarContent
        } detail: {
            // ── Detail: Main Editor Area ────────────────────────────────
            detailContent
        }
        .navigationTitle("DOGE Spatial Editor")
        .toolbar {
            toolbarContent
        }
        .sheet(isPresented: $showingNewProjectSheet) {
            NewProjectSheet()
        }
        .sheet(isPresented: $showingCollaborationSheet) {
            CollaborationSheet()
        }
        .sheet(isPresented: $showingPrivacySettings) {
            PrivacySettingsSheet()
        }
    }

    // MARK: - Sidebar

    @ViewBuilder
    private var sidebarContent: some View {
        VStack(spacing: 0) {
            // Project header
            if let doc = sceneManager.activeDocument {
                projectHeader(doc)
            }

            // Scene hierarchy tree
            List(selection: Binding(
                get: { sceneManager.selectedNodeIDs.first },
                set: { id in
                    if let id { sceneManager.selectNode(id) }
                    else { sceneManager.clearSelection() }
                }
            )) {
                if let doc = sceneManager.activeDocument {
                    SceneHierarchySection(node: doc.rootNode)
                }
            }
            .listStyle(.sidebar)
            .searchable(text: $searchText, prompt: "Search nodes…")

            Divider()

            // Quick-add primitives
            quickAddBar
        }
    }

    private func projectHeader(_ doc: SpatialDocument) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(doc.name)
                .font(.headline)
            HStack(spacing: 8) {
                Label(doc.privacyLevel.rawValue, systemImage: privacyIcon(doc.privacyLevel))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("v\(doc.version)")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            if collaboration.isSharePlayActive {
                HStack(spacing: 4) {
                    Circle()
                        .fill(.green)
                        .frame(width: 6, height: 6)
                    Text("\(collaboration.participants.count) collaborators")
                        .font(.caption2)
                        .foregroundStyle(.green)
                }
            }
        }
        .padding()
    }

    private var quickAddBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                QuickAddButton(icon: "cube", label: "Box") {
                    sceneManager.addBox()
                }
                QuickAddButton(icon: "circle", label: "Sphere") {
                    sceneManager.addSphere()
                }
                QuickAddButton(icon: "light.max", label: "Light") {
                    sceneManager.addLight()
                }
                QuickAddButton(icon: "text.bubble", label: "Text") {
                    // Add 3D text
                }
                QuickAddButton(icon: "sensor", label: "IoT") {
                    sceneManager.addIoTSensor(
                        name: "New Sensor",
                        sensorID: "WL-NEW-001",
                        at: .zero
                    )
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Detail Content

    @ViewBuilder
    private var detailContent: some View {
        if sceneManager.activeDocument != nil {
            HSplitView {
                // 3D Viewport placeholder (in window mode, shows a 2D preview)
                viewportArea

                // Properties inspector
                if !sceneManager.selectedNodeIDs.isEmpty {
                    PropertiesInspector()
                        .frame(minWidth: 280, maxWidth: 320)
                }
            }
        } else {
            welcomeView
        }
    }

    private var viewportArea: some View {
        ZStack {
            // Dark background matching the reference image style
            Color.black

            // Render stats overlay (matching reference image)
            VStack {
                HStack {
                    Spacer()
                    renderStatsOverlay
                }
                Spacer()
            }
            .padding()

            // Center: Open immersive space button
            if !appModel.isImmersiveSpaceOpen {
                VStack(spacing: 16) {
                    Image(systemName: "visionpro")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                    Text("Open Spatial Editor")
                        .font(.title3)
                    HStack(spacing: 12) {
                        Button("Volumetric Preview") {
                            openWindow(id: "spatial-preview")
                            appModel.isPreviewVolumeOpen = true
                        }
                        .buttonStyle(.bordered)

                        Button("Immersive Space") {
                            Task {
                                await openImmersiveSpace(id: "spatial-editor")
                                appModel.isImmersiveSpaceOpen = true
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
            }

            // Editing mode toolbar at bottom
            VStack {
                Spacer()
                editingModeToolbar
            }
            .padding()
        }
    }

    private var renderStatsOverlay: some View {
        VStack(alignment: .trailing, spacing: 4) {
            statsRow("Render Quality", value: sceneManager.entityCount > 0 ? "High" : "—")
            statsRow("View Mode", value: "Lit")
            statsRow("Entities", value: "\(sceneManager.entityCount)")
            statsRow("Triangles", value: formatNumber(sceneManager.triangleCount))
            if sceneManager.hasUnsavedChanges {
                HStack(spacing: 4) {
                    Circle().fill(.orange).frame(width: 6, height: 6)
                    Text("Unsaved Changes")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
    }

    private func statsRow(_ label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.caption2.monospaced())
                .foregroundStyle(.primary)
        }
    }

    private var editingModeToolbar: some View {
        HStack(spacing: 4) {
            ForEach(EditingMode.allCases) { mode in
                Button {
                    appModel.editingMode = mode
                } label: {
                    Image(systemName: mode.systemImage)
                        .frame(width: 32, height: 32)
                }
                .buttonStyle(.plain)
                .background(
                    appModel.editingMode == mode
                        ? Color.accentColor.opacity(0.2)
                        : Color.clear,
                    in: RoundedRectangle(cornerRadius: 6)
                )
                .help(mode.rawValue)
            }
        }
        .padding(8)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    private var welcomeView: some View {
        VStack(spacing: 24) {
            Image(systemName: "cube.transparent")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)

            Text("DOGE Spatial Explorer")
                .font(.largeTitle)

            Text("Create or open a spatial editing project to get started.")
                .foregroundStyle(.secondary)

            HStack(spacing: 16) {
                Button("New Project") {
                    showingNewProjectSheet = true
                }
                .buttonStyle(.borderedProminent)

                Button("Open Project") {
                    // Open file picker
                }
                .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItemGroup(placement: .primaryAction) {
            // Collaboration button
            Button {
                showingCollaborationSheet = true
            } label: {
                Label("Collaborate", systemImage: "person.2")
            }
            .badge(collaboration.participants.count > 1 ? collaboration.participants.count : 0)

            // Privacy settings
            Button {
                showingPrivacySettings = true
            } label: {
                Label("Privacy", systemImage: privacy.isE2EEncryptionEnabled ? "lock.fill" : "lock.open")
            }

            // Cloud sync status
            Button {
                // Toggle cloud connection
            } label: {
                Label(
                    appModel.isCloudConnected ? "Cloud Connected" : "Cloud Offline",
                    systemImage: appModel.isCloudConnected ? "cloud.fill" : "cloud"
                )
            }

            // Undo / Redo
            Button {
                sceneManager.undo()
            } label: {
                Label("Undo", systemImage: "arrow.uturn.backward")
            }
            .disabled(!sceneManager.canUndo)

            Button {
                sceneManager.redo()
            } label: {
                Label("Redo", systemImage: "arrow.uturn.forward")
            }
            .disabled(!sceneManager.canRedo)
        }
    }

    // MARK: - Helpers

    private func privacyIcon(_ level: PrivacyLevel) -> String {
        switch level {
        case .private: return "lock.fill"
        case .team: return "person.2.fill"
        case .organization: return "building.2.fill"
        case .public: return "globe"
        }
    }

    private func formatNumber(_ n: Int) -> String {
        if n >= 1_000_000 { return String(format: "%.1fM", Double(n) / 1_000_000) }
        if n >= 1_000 { return String(format: "%.1fK", Double(n) / 1_000) }
        return "\(n)"
    }
}

// MARK: - Quick Add Button

struct QuickAddButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title3)
                Text(label)
                    .font(.caption2)
            }
            .frame(width: 56, height: 56)
        }
        .buttonStyle(.bordered)
    }
}

// MARK: - Scene Hierarchy Section

struct SceneHierarchySection: View {
    let node: SceneNode

    var body: some View {
        if node.children.isEmpty {
            Label(node.name, systemImage: iconForNodeType(node.type))
                .tag(node.id)
        } else {
            DisclosureGroup {
                ForEach(node.children) { child in
                    SceneHierarchySection(node: child)
                }
            } label: {
                Label(node.name, systemImage: iconForNodeType(node.type))
                    .tag(node.id)
            }
        }
    }

    private func iconForNodeType(_ type: NodeType) -> String {
        switch type {
        case .group: return "folder"
        case .mesh: return "cube"
        case .light: return "light.max"
        case .camera: return "camera"
        case .anchor: return "mappin"
        case .particle: return "sparkles"
        case .audio: return "speaker.wave.3"
        case .portal: return "door.left.hand.open"
        case .volume: return "cube.transparent"
        case .text3D: return "textformat.abc"
        case .reference: return "link"
        case .iotSensor: return "sensor"
        case .spatialVideo: return "video"
        case .gaussianSplat: return "cloud"
        }
    }
}

// MARK: - Placeholder Sheets

struct NewProjectSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SceneGraphManager.self) private var sceneManager

    @State private var projectName = ""
    @State private var projectDescription = ""
    @State private var privacyLevel: PrivacyLevel = .private

    var body: some View {
        NavigationStack {
            Form {
                Section("Project Details") {
                    TextField("Project Name", text: $projectName)
                    TextField("Description", text: $projectDescription, axis: .vertical)
                        .lineLimit(3...6)
                }
                Section("Privacy") {
                    Picker("Privacy Level", selection: $privacyLevel) {
                        ForEach([PrivacyLevel.private, .team, .organization, .public], id: \.self) { level in
                            Text(level.rawValue).tag(level)
                        }
                    }
                    Text(privacyLevel.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("New Spatial Project")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        sceneManager.createNewDocument(
                            name: projectName,
                            createdBy: "Current User",
                            privacy: privacyLevel
                        )
                        dismiss()
                    }
                    .disabled(projectName.isEmpty)
                }
            }
        }
        .frame(minWidth: 400, minHeight: 350)
    }
}

struct CollaborationSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CollaborationManager.self) private var collaboration

    var body: some View {
        NavigationStack {
            List {
                Section("SharePlay") {
                    if collaboration.isSharePlayActive {
                        Label("Session Active", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        ForEach(collaboration.participants) { participant in
                            Label(
                                participant.displayName,
                                systemImage: participant.isLocal ? "person.fill" : "person"
                            )
                        }
                        Button("End Session", role: .destructive) {
                            collaboration.endSharePlaySession()
                        }
                    } else {
                        Text("Start a FaceTime call and invite collaborators to join the spatial editing session via SharePlay.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Button("Start SharePlay Session") {
                            // Start SharePlay
                        }
                    }
                }

                Section("Cloud Collaboration") {
                    Label(
                        collaboration.cloudConnectionStatus.rawValue,
                        systemImage: collaboration.cloudConnectionStatus == .connected ? "cloud.fill" : "cloud"
                    )
                    Button("Connect to Cloud") {
                        Task {
                            await collaboration.connectToCloud(
                                serverURL: URL(string: "https://api.doge-spatial.example.com")!,
                                authToken: "token",
                                documentID: UUID()
                            )
                        }
                    }
                }
            }
            .navigationTitle("Collaboration")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .frame(minWidth: 400, minHeight: 400)
    }
}

struct PrivacySettingsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(PrivacyManager.self) private var privacy

    var body: some View {
        NavigationStack {
            List {
                Section("Encryption") {
                    Toggle("End-to-End Encryption", isOn: Binding(
                        get: { privacy.isE2EEncryptionEnabled },
                        set: { privacy.isE2EEncryptionEnabled = $0 }
                    ))
                    if !privacy.keyFingerprint.isEmpty {
                        LabeledContent("Key Fingerprint") {
                            Text(privacy.keyFingerprint)
                                .font(.caption.monospaced())
                        }
                    }
                    LabeledContent("Secure Enclave") {
                        Text(privacy.isSecureEnclaveAvailable ? "Available" : "Unavailable")
                            .foregroundStyle(privacy.isSecureEnclaveAvailable ? .green : .red)
                    }
                }

                Section("OSI Security Status") {
                    ForEach(OSILayer.allCases, id: \.self) { layer in
                        HStack {
                            Text(layer.rawValue)
                                .font(.caption)
                            Spacer()
                            statusBadge(for: layer)
                        }
                    }
                }

                Section("Privacy Zones") {
                    Text("\(privacy.privacyZones.count) active zones")
                    Button("Create Privacy Zone") {
                        _ = privacy.createPrivacyZone(
                            name: "Restricted Area",
                            center: .zero,
                            radius: 5.0,
                            clearanceLevel: .confidential,
                            redactedTypes: [.sensorData, .personalInfo]
                        )
                    }
                }

                Section("Audit Log") {
                    Text("\(privacy.auditLog.count) entries")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Privacy & Security")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .frame(minWidth: 400, minHeight: 500)
    }

    @ViewBuilder
    private func statusBadge(for layer: OSILayer) -> some View {
        let status: SecurityLayerStatus = {
            switch layer {
            case .physical: return privacy.osiSecurityStatus.physical
            case .dataLink: return privacy.osiSecurityStatus.dataLink
            case .network: return privacy.osiSecurityStatus.network
            case .transport: return privacy.osiSecurityStatus.transport
            case .session: return privacy.osiSecurityStatus.session
            case .presentation: return privacy.osiSecurityStatus.presentation
            case .application: return privacy.osiSecurityStatus.application
            }
        }()

        Text(status.rawValue)
            .font(.caption2)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                statusColor(status).opacity(0.2),
                in: Capsule()
            )
            .foregroundStyle(statusColor(status))
    }

    private func statusColor(_ status: SecurityLayerStatus) -> Color {
        switch status {
        case .secure: return .green
        case .warning: return .orange
        case .compromised: return .red
        case .unknown: return .gray
        }
    }
}

struct PropertiesInspector: View {
    @Environment(SceneGraphManager.self) private var sceneManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Properties")
                    .font(.headline)
                    .padding(.horizontal)

                if let nodeID = sceneManager.selectedNodeIDs.first,
                   let doc = sceneManager.activeDocument,
                   let node = findNode(id: nodeID, in: doc.rootNode) {
                    nodeProperties(node)
                } else {
                    Text("Select a node to view its properties.")
                        .foregroundStyle(.secondary)
                        .padding()
                }
            }
            .padding(.vertical)
        }
    }

    @ViewBuilder
    private func nodeProperties(_ node: SceneNode) -> some View {
        GroupBox("Transform") {
            VStack(spacing: 8) {
                transformRow("Position", x: node.transform.positionX, y: node.transform.positionY, z: node.transform.positionZ)
                transformRow("Rotation", x: node.transform.rotationX, y: node.transform.rotationY, z: node.transform.rotationZ)
                transformRow("Scale", x: node.transform.scaleX, y: node.transform.scaleY, z: node.transform.scaleZ)
            }
        }
        .padding(.horizontal)

        if let material = node.material {
            GroupBox("Material") {
                VStack(alignment: .leading, spacing: 4) {
                    LabeledContent("Type", value: material.type.rawValue)
                    if let color = material.baseColorHex {
                        LabeledContent("Color", value: color)
                    }
                    if let roughness = material.roughness {
                        LabeledContent("Roughness", value: String(format: "%.2f", roughness))
                    }
                    if let metallic = material.metallic {
                        LabeledContent("Metallic", value: String(format: "%.2f", metallic))
                    }
                }
            }
            .padding(.horizontal)
        }

        if !node.annotations.isEmpty {
            GroupBox("Annotations (\(node.annotations.count))") {
                ForEach(node.annotations) { annotation in
                    VStack(alignment: .leading) {
                        Text(annotation.text)
                            .font(.caption)
                        Text("— \(annotation.author)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private func transformRow(_ label: String, x: Float, y: Float, z: Float) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .frame(width: 60, alignment: .leading)
            Text(String(format: "X: %.3f", x))
                .font(.caption.monospaced())
            Text(String(format: "Y: %.3f", y))
                .font(.caption.monospaced())
            Text(String(format: "Z: %.3f", z))
                .font(.caption.monospaced())
        }
    }

    private func findNode(id: UUID, in node: SceneNode) -> SceneNode? {
        if node.id == id { return node }
        for child in node.children {
            if let found = findNode(id: id, in: child) { return found }
        }
        return nil
    }
}
