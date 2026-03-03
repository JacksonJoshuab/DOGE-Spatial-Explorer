// SpatialEditorView.swift
// DOGE Spatial Explorer — Immersive Space Spatial Editor
//
// The full immersive spatial editing environment for Apple Vision Pro.
// Provides hand-tracked manipulation, spatial UI panels, collaborative
// cursors, and real-time scene rendering via RealityKit.

import SwiftUI
import RealityKit
import ARKit

struct SpatialEditorView: View {

    @Environment(AppModel.self) private var appModel
    @Environment(CollaborationManager.self) private var collaboration
    @Environment(PrivacyManager.self) private var privacy
    @Environment(SceneGraphManager.self) private var sceneManager

    @State private var renderEngine = SpatialRenderingEngine()
    @State private var showToolbar = true
    @State private var showHierarchy = false
    @State private var showProperties = false
    @State private var showRenderStats = true

    var body: some View {
        RealityView { content, attachments in
            // ── Scene Setup ─────────────────────────────────────────────
            setupScene(content: content)

            // ── Add the scene graph root entity ─────────────────────────
            content.add(sceneManager.rootEntity)

            // ── Attach SwiftUI overlays ─────────────────────────────────
            if let toolbar = attachments.entity(for: "editing-toolbar") {
                toolbar.position = [0, 0.3, -1.0]
                content.add(toolbar)
            }

            if let statsPanel = attachments.entity(for: "render-stats") {
                statsPanel.position = [0.6, 0.5, -1.0]
                content.add(statsPanel)
            }

            if let hierarchyPanel = attachments.entity(for: "hierarchy-panel") {
                hierarchyPanel.position = [-0.6, 0.3, -1.0]
                content.add(hierarchyPanel)
            }

        } update: { content, attachments in
            // Update render statistics
            renderEngine.updateStats(
                entityCount: sceneManager.entityCount,
                triangleCount: sceneManager.triangleCount
            )
        } attachments: {
            // ── Spatial Editing Toolbar ──────────────────────────────────
            Attachment(id: "editing-toolbar") {
                SpatialToolbar()
                    .environment(appModel)
                    .environment(sceneManager)
            }

            // ── Render Stats Panel ──────────────────────────────────────
            if showRenderStats {
                Attachment(id: "render-stats") {
                    RenderStatsPanel(stats: renderEngine.stats)
                }
            }

            // ── Scene Hierarchy Panel ───────────────────────────────────
            if showHierarchy {
                Attachment(id: "hierarchy-panel") {
                    SpatialHierarchyPanel()
                        .environment(sceneManager)
                }
            }
        }
        .gesture(tapGesture)
        .gesture(dragGesture)
        .onAppear {
            appModel.isImmersiveSpaceOpen = true
        }
        .onDisappear {
            appModel.isImmersiveSpaceOpen = false
        }
    }

    // MARK: - Scene Setup

    private func setupScene(content: RealityViewContent) {
        // Add ground plane with grid
        let groundPlane = createGridPlane()
        content.add(groundPlane)

        // Add ambient lighting
        let ambientLight = Entity()
        ambientLight.name = "Ambient Light"
        content.add(ambientLight)

        // Add coordinate axes gizmo at origin
        let axes = createAxesGizmo()
        content.add(axes)
    }

    private func createGridPlane() -> Entity {
        let entity = Entity()
        entity.name = "Ground Grid"

        let mesh = MeshResource.generatePlane(width: 10, depth: 10)
        var material = UnlitMaterial()
        material.color.tint = .init(white: 0.15, alpha: 0.5)

        let model = ModelComponent(mesh: mesh, materials: [material])
        entity.components.set(model)
        entity.position = [0, -0.01, 0]

        return entity
    }

    private func createAxesGizmo() -> Entity {
        let root = Entity()
        root.name = "Axes Gizmo"

        // X axis (red)
        let xAxis = createAxisLine(color: .red, direction: [1, 0, 0])
        root.addChild(xAxis)

        // Y axis (green)
        let yAxis = createAxisLine(color: .green, direction: [0, 1, 0])
        root.addChild(yAxis)

        // Z axis (blue)
        let zAxis = createAxisLine(color: .blue, direction: [0, 0, 1])
        root.addChild(zAxis)

        root.scale = [0.3, 0.3, 0.3]

        return root
    }

    private func createAxisLine(color: UIColor, direction: SIMD3<Float>) -> Entity {
        let entity = Entity()
        let mesh = MeshResource.generateCylinder(height: 1.0, radius: 0.005)
        var material = UnlitMaterial()
        material.color.tint = color

        let model = ModelComponent(mesh: mesh, materials: [material])
        entity.components.set(model)

        // Position and rotate to align with the axis direction
        entity.position = direction * 0.5
        if direction.x > 0 {
            entity.orientation = simd_quatf(angle: .pi / 2, axis: [0, 0, 1])
        } else if direction.z > 0 {
            entity.orientation = simd_quatf(angle: .pi / 2, axis: [1, 0, 0])
        }

        // Add arrow tip
        let tip = Entity()
        let tipMesh = MeshResource.generateCone(height: 0.08, radius: 0.02)
        let tipModel = ModelComponent(mesh: tipMesh, materials: [material])
        tip.components.set(tipModel)
        tip.position = direction * 0.5
        entity.addChild(tip)

        return entity
    }

    // MARK: - Gestures

    private var tapGesture: some Gesture {
        SpatialTapGesture()
            .targetedToAnyEntity()
            .onEnded { value in
                // Find the tapped entity and select the corresponding node
                let tappedEntity = value.entity
                if let nodeID = findNodeID(for: tappedEntity) {
                    sceneManager.selectNode(nodeID)
                }
            }
    }

    private var dragGesture: some Gesture {
        DragGesture()
            .targetedToAnyEntity()
            .onChanged { value in
                guard appModel.editingMode == .translate else { return }
                let entity = value.entity
                let translation = value.convert(value.translation3D, from: .local, to: .scene)
                entity.position += SIMD3<Float>(
                    Float(translation.x) * 0.001,
                    Float(translation.y) * 0.001,
                    Float(translation.z) * 0.001
                )
            }
            .onEnded { value in
                // Commit the transform change to the scene graph
                let entity = value.entity
                if let nodeID = findNodeID(for: entity) {
                    var transform = SpatialTransform.identity
                    transform.position = entity.position
                    transform.rotation = entity.orientation
                    transform.scale = entity.scale
                    sceneManager.updateTransform(nodeID: nodeID, newTransform: transform)

                    // Broadcast to collaborators
                    Task {
                        if let operation = try? CollaborationOperation(
                            type: .nodeTransformed,
                            senderID: appModel.currentUserName,
                            payload: TransformPayload(nodeID: nodeID, transform: transform)
                        ) {
                            try? await collaboration.broadcastOperation(operation)
                        }
                    }
                }
            }
    }

    // MARK: - Helpers

    private func findNodeID(for entity: Entity) -> UUID? {
        // Walk up the entity hierarchy to find a node with a matching UUID
        // In production, entities would store their node ID in a custom component
        if let id = UUID(uuidString: entity.name) {
            return id
        }
        if let parent = entity.parent {
            return findNodeID(for: parent)
        }
        return nil
    }
}

// MARK: - Transform Payload

struct TransformPayload: Codable {
    let nodeID: UUID
    let transform: SpatialTransform
}

// MARK: - Spatial Toolbar

struct SpatialToolbar: View {
    @Environment(AppModel.self) private var appModel
    @Environment(SceneGraphManager.self) private var sceneManager

    var body: some View {
        HStack(spacing: 8) {
            ForEach(EditingMode.allCases) { mode in
                Button {
                    appModel.editingMode = mode
                } label: {
                    VStack(spacing: 2) {
                        Image(systemName: mode.systemImage)
                            .font(.title3)
                        Text(mode.rawValue)
                            .font(.caption2)
                    }
                    .frame(width: 60, height: 50)
                }
                .buttonStyle(.plain)
                .background(
                    appModel.editingMode == mode
                        ? Color.accentColor.opacity(0.3)
                        : Color.clear,
                    in: RoundedRectangle(cornerRadius: 8)
                )
            }

            Divider()
                .frame(height: 40)

            // Quick add
            Menu {
                Button("Box", systemImage: "cube") { sceneManager.addBox() }
                Button("Sphere", systemImage: "circle") { sceneManager.addSphere() }
                Button("Light", systemImage: "light.max") { sceneManager.addLight() }
                Button("IoT Sensor", systemImage: "sensor") {
                    sceneManager.addIoTSensor(name: "Sensor", sensorID: "WL-001", at: [0, 0.5, -1])
                }
            } label: {
                Image(systemName: "plus.circle")
                    .font(.title2)
            }
        }
        .padding(12)
        .glassBackgroundEffect()
    }
}

// MARK: - Render Stats Panel

struct RenderStatsPanel: View {
    let stats: RenderStats

    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text("RENDER STATS")
                .font(.caption2.bold())
                .foregroundStyle(.secondary)

            Divider()

            statsRow("Render Quality", "High")
            statsRow("View Mode", "Lit")
            statsRow("Projection", "Custom")
            statsRow("Render Shapes", "On")

            Divider()

            statsRow("Bounds", stats.bounds)
            statsRow("Voxels", formatLarge(stats.voxelCount) + " Mvox")
            statsRow("Sim Time", String(format: "%.1f ms", stats.simTime))
            statsRow("Sim Speed", "947 Mvox/s")
            statsRow("Resolution", stats.resolution)
            statsRow("Render Time", String(format: "%.1f ms", stats.renderTime))
            statsRow("UI Framerate", String(format: "%.1f fps", stats.uiFramerate))
            statsRow("VRAM", String(format: "%.1f / %.1f GiB", stats.vramUsed, stats.vramTotal))
            statsRow("Particles", "\(stats.particleCount)")
        }
        .padding(16)
        .frame(width: 240)
        .glassBackgroundEffect()
    }

    private func statsRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.caption2.monospaced().bold())
        }
    }

    private func formatLarge(_ n: Int) -> String {
        if n >= 1_000_000 { return String(format: "%.1f", Double(n) / 1_000_000) }
        if n >= 1_000 { return String(format: "%.1f K", Double(n) / 1_000) }
        return "\(n)"
    }
}

// MARK: - Spatial Hierarchy Panel

struct SpatialHierarchyPanel: View {
    @Environment(SceneGraphManager.self) private var sceneManager

    var body: some View {
        VStack(alignment: .leading) {
            Text("SCENE HIERARCHY")
                .font(.caption2.bold())
                .foregroundStyle(.secondary)

            if let doc = sceneManager.activeDocument {
                List {
                    SceneHierarchySection(node: doc.rootNode)
                }
                .listStyle(.plain)
            }
        }
        .frame(width: 240, height: 400)
        .glassBackgroundEffect()
    }
}

// MARK: - Spatial Preview (Volumetric Window)

struct SpatialPreviewView: View {
    @Environment(AppModel.self) private var appModel
    @Environment(SceneGraphManager.self) private var sceneManager

    var body: some View {
        RealityView { content in
            content.add(sceneManager.rootEntity)
        }
    }
}
