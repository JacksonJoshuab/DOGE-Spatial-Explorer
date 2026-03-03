// SceneGraphManager.swift
// DOGE Spatial Explorer — Scene Graph Manager
//
// Manages the active scene document, entity creation, selection,
// undo/redo, and synchronization with the collaboration layer.

import Foundation
import RealityKit
import Observation
import Combine

/// Manages the scene graph and bridges between the data model
/// and the RealityKit entity hierarchy.
@Observable
final class SceneGraphManager {

    // MARK: - Published State

    /// The active spatial document being edited.
    var activeDocument: SpatialDocument?

    /// Currently selected node IDs.
    var selectedNodeIDs: Set<UUID> = []

    /// The RealityKit root entity that mirrors the scene graph.
    var rootEntity: Entity = Entity()

    /// Undo stack for scene operations.
    private(set) var undoStack: [SceneOperation] = []

    /// Redo stack for scene operations.
    private(set) var redoStack: [SceneOperation] = []

    /// Whether there are unsaved changes.
    var hasUnsavedChanges: Bool = false

    /// Scene statistics.
    var entityCount: Int = 0
    var triangleCount: Int = 0
    var vramUsageMB: Double = 0.0

    // MARK: - Private

    private var entityMap: [UUID: Entity] = [:]
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Document Lifecycle

    /// Creates a new empty spatial document.
    func createNewDocument(name: String, createdBy: String, privacy: PrivacyLevel = .private) {
        let doc = SpatialDocument(
            name: name,
            createdBy: createdBy,
            privacyLevel: privacy
        )
        activeDocument = doc
        rebuildEntityHierarchy()
        undoStack.removeAll()
        redoStack.removeAll()
        hasUnsavedChanges = false
    }

    /// Loads a document from serialized data.
    func loadDocument(from data: Data) throws {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let doc = try decoder.decode(SpatialDocument.self, from: data)
        activeDocument = doc
        rebuildEntityHierarchy()
        undoStack.removeAll()
        redoStack.removeAll()
        hasUnsavedChanges = false
    }

    /// Serializes the active document to JSON data.
    func saveDocument() throws -> Data {
        guard let doc = activeDocument else {
            throw SceneError.noActiveDocument
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(doc)
        hasUnsavedChanges = false
        return data
    }

    // MARK: - Node Operations

    /// Adds a new node to the scene graph under the specified parent.
    @discardableResult
    func addNode(
        _ node: SceneNode,
        parentID: UUID? = nil
    ) -> UUID {
        guard var doc = activeDocument else { return node.id }

        let operation = SceneOperation(
            type: .addNode,
            nodeID: node.id,
            parentID: parentID,
            snapshot: node
        )

        if let parentID = parentID {
            insertNode(node, under: parentID, in: &doc.rootNode)
        } else {
            doc.rootNode.children.append(node)
        }

        activeDocument = doc
        pushUndo(operation)
        createEntity(for: node, parentID: parentID)
        updateStatistics()
        hasUnsavedChanges = true

        return node.id
    }

    /// Removes a node and its children from the scene graph.
    func removeNode(id: UUID) {
        guard var doc = activeDocument else { return }

        if let node = findNode(id: id, in: doc.rootNode) {
            let operation = SceneOperation(
                type: .removeNode,
                nodeID: id,
                parentID: findParentID(of: id, in: doc.rootNode),
                snapshot: node
            )
            pushUndo(operation)
        }

        removeNodeRecursive(id: id, from: &doc.rootNode)
        activeDocument = doc

        // Remove from RealityKit
        if let entity = entityMap[id] {
            entity.removeFromParent()
            entityMap.removeValue(forKey: id)
        }

        selectedNodeIDs.remove(id)
        updateStatistics()
        hasUnsavedChanges = true
    }

    /// Updates the transform of a node.
    func updateTransform(nodeID: UUID, newTransform: SpatialTransform) {
        guard var doc = activeDocument else { return }

        if var node = findNode(id: nodeID, in: doc.rootNode) {
            let oldTransform = node.transform
            let operation = SceneOperation(
                type: .transformNode,
                nodeID: nodeID,
                oldTransform: oldTransform,
                newTransform: newTransform
            )
            pushUndo(operation)

            node.transform = newTransform
            updateNodeInTree(node, in: &doc.rootNode)
            activeDocument = doc

            // Update RealityKit entity
            if let entity = entityMap[nodeID] {
                entity.position = newTransform.position
                entity.orientation = newTransform.rotation
                entity.scale = newTransform.scale
            }

            hasUnsavedChanges = true
        }
    }

    /// Toggles visibility of a node.
    func toggleVisibility(nodeID: UUID) {
        guard var doc = activeDocument else { return }

        if var node = findNode(id: nodeID, in: doc.rootNode) {
            node.isVisible.toggle()
            updateNodeInTree(node, in: &doc.rootNode)
            activeDocument = doc

            if let entity = entityMap[nodeID] {
                entity.isEnabled = node.isVisible
            }

            hasUnsavedChanges = true
        }
    }

    /// Locks or unlocks a node for collaborative editing.
    func toggleLock(nodeID: UUID, lockedBy: String?) {
        guard var doc = activeDocument else { return }

        if var node = findNode(id: nodeID, in: doc.rootNode) {
            node.isLocked = lockedBy != nil
            node.lockedBy = lockedBy
            updateNodeInTree(node, in: &doc.rootNode)
            activeDocument = doc
            hasUnsavedChanges = true
        }
    }

    // MARK: - Selection

    func selectNode(_ id: UUID, additive: Bool = false) {
        if additive {
            if selectedNodeIDs.contains(id) {
                selectedNodeIDs.remove(id)
            } else {
                selectedNodeIDs.insert(id)
            }
        } else {
            selectedNodeIDs = [id]
        }
    }

    func clearSelection() {
        selectedNodeIDs.removeAll()
    }

    // MARK: - Undo / Redo

    func undo() {
        guard let operation = undoStack.popLast() else { return }
        redoStack.append(operation)
        applyInverse(of: operation)
    }

    func redo() {
        guard let operation = redoStack.popLast() else { return }
        undoStack.append(operation)
        applyOperation(operation)
    }

    var canUndo: Bool { !undoStack.isEmpty }
    var canRedo: Bool { !redoStack.isEmpty }

    // MARK: - Primitive Creation Helpers

    func addBox(name: String = "Box", size: Float = 0.1, at position: SIMD3<Float> = .zero) -> UUID {
        var node = SceneNode(name: name, type: .mesh)
        node.transform.position = position
        node.geometry = GeometryDescriptor(primitiveType: .box)
        node.material = MaterialDescriptor(
            type: .physically_based,
            baseColorHex: "#4A90D9",
            roughness: 0.5,
            metallic: 0.0,
            opacity: 1.0
        )
        return addNode(node)
    }

    func addSphere(name: String = "Sphere", radius: Float = 0.05, at position: SIMD3<Float> = .zero) -> UUID {
        var node = SceneNode(name: name, type: .mesh)
        node.transform.position = position
        node.geometry = GeometryDescriptor(primitiveType: .sphere)
        node.material = MaterialDescriptor(
            type: .physically_based,
            baseColorHex: "#D94A4A",
            roughness: 0.3,
            metallic: 0.8,
            opacity: 1.0
        )
        return addNode(node)
    }

    func addLight(name: String = "Point Light", type: LightType = .point, at position: SIMD3<Float> = [0, 1, 0]) -> UUID {
        var node = SceneNode(name: name, type: .light)
        node.transform.position = position
        node.light = LightDescriptor(
            lightType: type,
            colorHex: "#FFFFFF",
            intensity: 1000,
            attenuationRadius: 10,
            castsShadow: true
        )
        return addNode(node)
    }

    func addGaussianSplat(name: String = "Gaussian Splat", url: String, at position: SIMD3<Float> = .zero) -> UUID {
        var node = SceneNode(name: name, type: .gaussianSplat)
        node.transform.position = position
        node.geometry = GeometryDescriptor(meshResourceURL: url)
        return addNode(node)
    }

    func addIoTSensor(name: String, sensorID: String, at position: SIMD3<Float>) -> UUID {
        var node = SceneNode(name: name, type: .iotSensor)
        node.transform.position = position
        node.annotations = [
            Annotation(
                id: UUID(),
                text: "Sensor: \(sensorID)",
                author: "System",
                createdAt: Date(),
                position: .identity,
                color: "#16A34A",
                isResolved: false
            )
        ]
        return addNode(node)
    }

    // MARK: - Private Helpers

    private func rebuildEntityHierarchy() {
        rootEntity.children.removeAll()
        entityMap.removeAll()
        guard let doc = activeDocument else { return }
        buildEntities(from: doc.rootNode, parent: rootEntity)
        updateStatistics()
    }

    private func buildEntities(from node: SceneNode, parent: Entity) {
        let entity = createRealityKitEntity(for: node)
        entity.name = node.name
        entity.position = node.transform.position
        entity.orientation = node.transform.rotation
        entity.scale = node.transform.scale
        entity.isEnabled = node.isVisible
        parent.addChild(entity)
        entityMap[node.id] = entity

        for child in node.children {
            buildEntities(from: child, parent: entity)
        }
    }

    private func createRealityKitEntity(for node: SceneNode) -> Entity {
        switch node.type {
        case .mesh:
            return createMeshEntity(node)
        case .light:
            return createLightEntity(node)
        case .group, .anchor:
            return Entity()
        default:
            return Entity()
        }
    }

    private func createMeshEntity(_ node: SceneNode) -> Entity {
        let entity = Entity()

        // Generate mesh based on primitive type
        if let geometry = node.geometry, let primitiveType = geometry.primitiveType {
            var meshResource: MeshResource?
            switch primitiveType {
            case .box:
                meshResource = .generateBox(size: 0.1)
            case .sphere:
                meshResource = .generateSphere(radius: 0.05)
            case .cylinder:
                meshResource = .generateCylinder(height: 0.1, radius: 0.05)
            case .cone:
                meshResource = .generateCone(height: 0.1, radius: 0.05)
            case .plane:
                meshResource = .generatePlane(width: 0.2, depth: 0.2)
            default:
                break
            }

            if let mesh = meshResource {
                var material = SimpleMaterial()
                if let mat = node.material {
                    material.color.tint = colorFromHex(mat.baseColorHex ?? "#FFFFFF")
                    material.roughness = .float(mat.roughness ?? 0.5)
                    material.metallic = .float(mat.metallic ?? 0.0)
                }
                let modelComponent = ModelComponent(mesh: mesh, materials: [material])
                entity.components.set(modelComponent)

                // Enable spatial interaction
                entity.components.set(InputTargetComponent())
                entity.components.set(CollisionComponent(
                    shapes: [.generateBox(size: [0.1, 0.1, 0.1])]
                ))
            }
        }

        return entity
    }

    private func createLightEntity(_ node: SceneNode) -> Entity {
        // RealityKit light entities are created via components
        let entity = Entity()
        // Light configuration would be applied via PointLightComponent, etc.
        return entity
    }

    private func createEntity(for node: SceneNode, parentID: UUID?) {
        let entity = createRealityKitEntity(for: node)
        entity.name = node.name
        entity.position = node.transform.position
        entity.orientation = node.transform.rotation
        entity.scale = node.transform.scale
        entity.isEnabled = node.isVisible

        if let parentID = parentID, let parentEntity = entityMap[parentID] {
            parentEntity.addChild(entity)
        } else {
            rootEntity.addChild(entity)
        }

        entityMap[node.id] = entity
    }

    private func insertNode(_ node: SceneNode, under parentID: UUID, in root: inout SceneNode) {
        if root.id == parentID {
            root.children.append(node)
            return
        }
        for i in root.children.indices {
            insertNode(node, under: parentID, in: &root.children[i])
        }
    }

    private func removeNodeRecursive(id: UUID, from node: inout SceneNode) {
        node.children.removeAll { $0.id == id }
        for i in node.children.indices {
            removeNodeRecursive(id: id, from: &node.children[i])
        }
    }

    private func findNode(id: UUID, in node: SceneNode) -> SceneNode? {
        if node.id == id { return node }
        for child in node.children {
            if let found = findNode(id: id, in: child) { return found }
        }
        return nil
    }

    private func findParentID(of nodeID: UUID, in node: SceneNode) -> UUID? {
        for child in node.children {
            if child.id == nodeID { return node.id }
            if let found = findParentID(of: nodeID, in: child) { return found }
        }
        return nil
    }

    private func updateNodeInTree(_ updatedNode: SceneNode, in node: inout SceneNode) {
        if node.id == updatedNode.id {
            let children = node.children
            node = updatedNode
            node.children = children
            return
        }
        for i in node.children.indices {
            updateNodeInTree(updatedNode, in: &node.children[i])
        }
    }

    private func pushUndo(_ operation: SceneOperation) {
        undoStack.append(operation)
        redoStack.removeAll()
        // Limit undo stack to 100 operations
        if undoStack.count > 100 {
            undoStack.removeFirst()
        }
    }

    private func applyOperation(_ operation: SceneOperation) {
        // Re-apply the operation (for redo)
        switch operation.type {
        case .addNode:
            if let snapshot = operation.snapshot {
                addNode(snapshot, parentID: operation.parentID)
            }
        case .removeNode:
            removeNode(id: operation.nodeID)
        case .transformNode:
            if let newTransform = operation.newTransform {
                updateTransform(nodeID: operation.nodeID, newTransform: newTransform)
            }
        }
    }

    private func applyInverse(of operation: SceneOperation) {
        switch operation.type {
        case .addNode:
            removeNode(id: operation.nodeID)
        case .removeNode:
            if let snapshot = operation.snapshot {
                addNode(snapshot, parentID: operation.parentID)
            }
        case .transformNode:
            if let oldTransform = operation.oldTransform {
                updateTransform(nodeID: operation.nodeID, newTransform: oldTransform)
            }
        }
    }

    private func updateStatistics() {
        guard let doc = activeDocument else {
            entityCount = 0
            triangleCount = 0
            return
        }
        entityCount = countNodes(in: doc.rootNode)
        triangleCount = countTriangles(in: doc.rootNode)
    }

    private func countNodes(in node: SceneNode) -> Int {
        return 1 + node.children.reduce(0) { $0 + countNodes(in: $1) }
    }

    private func countTriangles(in node: SceneNode) -> Int {
        let selfCount = node.geometry?.triangleCount ?? 0
        return selfCount + node.children.reduce(0) { $0 + countTriangles(in: $1) }
    }

    private func colorFromHex(_ hex: String) -> UIColor {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        return UIColor(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgb & 0x0000FF) / 255.0,
            alpha: 1.0
        )
    }
}

// MARK: - Scene Operation (for Undo/Redo)

struct SceneOperation {
    enum OperationType {
        case addNode
        case removeNode
        case transformNode
    }

    let type: OperationType
    let nodeID: UUID
    var parentID: UUID?
    var snapshot: SceneNode?
    var oldTransform: SpatialTransform?
    var newTransform: SpatialTransform?
}

// MARK: - Errors

enum SceneError: Error, LocalizedError {
    case noActiveDocument
    case nodeNotFound(UUID)
    case nodeLocked(UUID, String)
    case insufficientPermissions

    var errorDescription: String? {
        switch self {
        case .noActiveDocument:
            return "No active document. Create or open a document first."
        case .nodeNotFound(let id):
            return "Node \(id) not found in the scene graph."
        case .nodeLocked(let id, let user):
            return "Node \(id) is locked by \(user)."
        case .insufficientPermissions:
            return "You do not have permission to perform this action."
        }
    }
}
