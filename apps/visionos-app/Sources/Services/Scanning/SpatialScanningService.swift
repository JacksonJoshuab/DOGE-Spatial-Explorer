// SpatialScanningService.swift
// DOGE Spatial Editor — visionOS
// LiDAR scanning, room mapping, and spatial anchor management

import ARKit
import RealityKit
import Combine

// MARK: - Spatial Scanning Service

@MainActor
class SpatialScanningService: ObservableObject {
    
    // MARK: - Published State
    
    @Published var isScanning = false
    @Published var scanProgress: Float = 0
    @Published var meshAnchors: [MeshAnchor] = []
    @Published var planeAnchors: [PlaneAnchor] = []
    @Published var spatialAnchors: [SpatialAnchorData] = []
    @Published var roomLayout: RoomLayoutData?
    @Published var scanQuality: ScanQuality = .low
    
    // MARK: - Private Properties
    
    private var session: ARKitSession?
    private var sceneReconstruction: SceneReconstructionProvider?
    private var planeDetection: PlaneDetectionProvider?
    private var worldTracking: WorldTrackingProvider?
    
    // MARK: - Start Scanning
    
    func startScanning() async throws {
        let session = ARKitSession()
        
        // Check capabilities
        guard SceneReconstructionProvider.isSupported else {
            throw ScanningError.notSupported
        }
        
        let sceneReconstruction = SceneReconstructionProvider(modes: [.classification])
        let planeDetection = PlaneDetectionProvider(alignments: [.horizontal, .vertical])
        let worldTracking = WorldTrackingProvider()
        
        try await session.run([sceneReconstruction, planeDetection, worldTracking])
        
        self.session = session
        self.sceneReconstruction = sceneReconstruction
        self.planeDetection = planeDetection
        self.worldTracking = worldTracking
        self.isScanning = true
        
        // Process mesh updates
        Task { await processMeshUpdates() }
        Task { await processPlaneUpdates() }
    }
    
    // MARK: - Process Mesh Updates
    
    private func processMeshUpdates() async {
        guard let provider = sceneReconstruction else { return }
        
        for await update in provider.anchorUpdates {
            switch update.event {
            case .added:
                meshAnchors.append(update.anchor)
            case .updated:
                if let index = meshAnchors.firstIndex(where: { $0.id == update.anchor.id }) {
                    meshAnchors[index] = update.anchor
                }
            case .removed:
                meshAnchors.removeAll { $0.id == update.anchor.id }
            @unknown default:
                break
            }
            
            updateScanProgress()
        }
    }
    
    // MARK: - Process Plane Updates
    
    private func processPlaneUpdates() async {
        guard let provider = planeDetection else { return }
        
        for await update in provider.anchorUpdates {
            switch update.event {
            case .added:
                planeAnchors.append(update.anchor)
            case .updated:
                if let index = planeAnchors.firstIndex(where: { $0.id == update.anchor.id }) {
                    planeAnchors[index] = update.anchor
                }
            case .removed:
                planeAnchors.removeAll { $0.id == update.anchor.id }
            @unknown default:
                break
            }
            
            updateRoomLayout()
        }
    }
    
    // MARK: - Spatial Anchors
    
    func addSpatialAnchor(at position: SIMD3<Float>, name: String, metadata: [String: String] = [:]) async throws -> SpatialAnchorData {
        guard let worldTracking = worldTracking else {
            throw ScanningError.notInitialized
        }
        
        var transform = matrix_identity_float4x4
        transform.columns.3 = SIMD4<Float>(position.x, position.y, position.z, 1)
        
        let worldAnchor = WorldAnchor(originFromAnchorTransform: transform)
        try await worldTracking.addAnchor(worldAnchor)
        
        let anchorData = SpatialAnchorData(
            id: worldAnchor.id.uuidString,
            name: name,
            position: position,
            metadata: metadata,
            createdAt: Date(),
            isPersisted: true
        )
        
        spatialAnchors.append(anchorData)
        return anchorData
    }
    
    func removeSpatialAnchor(id: String) async throws {
        guard let worldTracking = worldTracking else {
            throw ScanningError.notInitialized
        }
        
        if let uuid = UUID(uuidString: id) {
            let anchor = WorldAnchor(originFromAnchorTransform: matrix_identity_float4x4)
            try await worldTracking.removeAnchor(anchor)
        }
        
        spatialAnchors.removeAll { $0.id == id }
    }
    
    // MARK: - Export
    
    func exportMeshAsUSDZ() async throws -> URL {
        // Generate USDZ from mesh anchors
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("scan_\(Date().timeIntervalSince1970)")
            .appendingPathExtension("usdz")
        
        // Build mesh from anchors
        let meshDescriptor = buildMeshDescriptor()
        
        // Create RealityKit mesh and export
        let meshResource = try MeshResource.generate(from: [meshDescriptor])
        let entity = ModelEntity(mesh: meshResource)
        
        try await entity.exportAsUSDZ(to: tempURL)
        
        return tempURL
    }
    
    func exportPointCloud() -> [SIMD3<Float>] {
        var points: [SIMD3<Float>] = []
        
        for anchor in meshAnchors {
            let geometry = anchor.geometry
            let vertices = geometry.vertices
            let transform = anchor.originFromAnchorTransform
            
            for i in 0..<vertices.count {
                let vertex = vertices[i]
                let worldPos = transform * SIMD4<Float>(vertex.x, vertex.y, vertex.z, 1)
                points.append(SIMD3<Float>(worldPos.x, worldPos.y, worldPos.z))
            }
        }
        
        return points
    }
    
    // MARK: - Private Helpers
    
    private func updateScanProgress() {
        // Estimate scan completeness based on mesh coverage
        let totalVertices = meshAnchors.reduce(0) { $0 + $1.geometry.vertices.count }
        let targetVertices = 50000 // Target for a good scan
        scanProgress = min(Float(totalVertices) / Float(targetVertices), 1.0)
        
        if scanProgress < 0.3 {
            scanQuality = .low
        } else if scanProgress < 0.7 {
            scanQuality = .medium
        } else {
            scanQuality = .high
        }
    }
    
    private func updateRoomLayout() {
        let floors = planeAnchors.filter { $0.alignment == .horizontal && $0.classification == .floor }
        let walls = planeAnchors.filter { $0.alignment == .vertical && $0.classification == .wall }
        let ceilings = planeAnchors.filter { $0.alignment == .horizontal && $0.classification == .ceiling }
        
        roomLayout = RoomLayoutData(
            floorCount: floors.count,
            wallCount: walls.count,
            ceilingCount: ceilings.count,
            estimatedArea: estimateFloorArea(floors),
            estimatedHeight: estimateCeilingHeight(floors: floors, ceilings: ceilings)
        )
    }
    
    private func estimateFloorArea(_ floors: [PlaneAnchor]) -> Float {
        return floors.reduce(0) { total, plane in
            let extent = plane.geometry.extent
            return total + extent.width * extent.height
        }
    }
    
    private func estimateCeilingHeight(floors: [PlaneAnchor], ceilings: [PlaneAnchor]) -> Float {
        guard let floor = floors.first, let ceiling = ceilings.first else { return 0 }
        let floorY = floor.originFromAnchorTransform.columns.3.y
        let ceilingY = ceiling.originFromAnchorTransform.columns.3.y
        return abs(ceilingY - floorY)
    }
    
    private func buildMeshDescriptor() -> MeshDescriptor {
        var descriptor = MeshDescriptor(name: "SpatialScan")
        
        var allPositions: [SIMD3<Float>] = []
        var allNormals: [SIMD3<Float>] = []
        var allIndices: [UInt32] = []
        var indexOffset: UInt32 = 0
        
        for anchor in meshAnchors {
            let geometry = anchor.geometry
            let transform = anchor.originFromAnchorTransform
            
            // Transform vertices to world space
            for i in 0..<geometry.vertices.count {
                let vertex = geometry.vertices[i]
                let worldPos = transform * SIMD4<Float>(vertex.x, vertex.y, vertex.z, 1)
                allPositions.append(SIMD3<Float>(worldPos.x, worldPos.y, worldPos.z))
                
                let normal = geometry.normals[i]
                let worldNormal = transform * SIMD4<Float>(normal.x, normal.y, normal.z, 0)
                allNormals.append(SIMD3<Float>(worldNormal.x, worldNormal.y, worldNormal.z))
            }
            
            // Offset indices
            let faces = geometry.faces
            for i in 0..<(faces.count * 3) {
                allIndices.append(UInt32(faces[i]) + indexOffset)
            }
            
            indexOffset += UInt32(geometry.vertices.count)
        }
        
        descriptor.positions = MeshBuffer(allPositions)
        descriptor.normals = MeshBuffer(allNormals)
        descriptor.primitives = .triangles(allIndices)
        
        return descriptor
    }
    
    // MARK: - Stop Scanning
    
    func stopScanning() {
        session?.stop()
        isScanning = false
    }
}

// MARK: - Supporting Types

struct SpatialAnchorData: Identifiable {
    let id: String
    let name: String
    let position: SIMD3<Float>
    let metadata: [String: String]
    let createdAt: Date
    let isPersisted: Bool
}

struct RoomLayoutData {
    let floorCount: Int
    let wallCount: Int
    let ceilingCount: Int
    let estimatedArea: Float  // square meters
    let estimatedHeight: Float  // meters
}

enum ScanQuality: String {
    case low, medium, high
    
    var displayName: String { rawValue.capitalized }
    var color: String {
        switch self {
        case .low: return "#ef4444"
        case .medium: return "#f59e0b"
        case .high: return "#22c55e"
        }
    }
}

enum ScanningError: LocalizedError {
    case notSupported
    case notInitialized
    case exportFailed
    
    var errorDescription: String? {
        switch self {
        case .notSupported: return "Scene reconstruction not supported"
        case .notInitialized: return "Scanning service not initialized"
        case .exportFailed: return "Failed to export mesh data"
        }
    }
}

// MARK: - MeshAnchor Geometry Extensions

extension MeshAnchor.Geometry {
    var vertices: [SIMD3<Float>] {
        let source = self.vertices
        return (0..<source.count).map { i in
            source[i]
        }
    }
    
    var normals: [SIMD3<Float>] {
        let source = self.normals
        return (0..<source.count).map { i in
            source[i]
        }
    }
    
    var faces: MeshAnchor.Geometry.Faces {
        return self.faces
    }
}
