// SceneGraph.swift
// DOGE Spatial Explorer — Scene Graph Data Model
//
// A thread-safe, Codable scene graph that represents the entire
// spatial editing workspace. Designed for real-time synchronization
// via SharePlay and the cloud backend.

import Foundation
import simd
import RealityKit

// MARK: - Scene Document

/// A complete spatial editing document, containing the scene graph,
/// metadata, and collaboration state.
struct SpatialDocument: Codable, Identifiable, Sendable {
    let id: UUID
    var name: String
    var description: String
    var createdAt: Date
    var modifiedAt: Date
    var createdBy: String
    var version: Int

    /// The root node of the scene graph.
    var rootNode: SceneNode

    /// Privacy level for this document.
    var privacyLevel: PrivacyLevel

    /// Collaborator permissions.
    var collaborators: [Collaborator]

    /// Tags for organization.
    var tags: [String]

    /// USD/USDZ asset references.
    var assetManifest: [AssetReference]

    init(
        name: String,
        description: String = "",
        createdBy: String = "Anonymous",
        privacyLevel: PrivacyLevel = .private
    ) {
        self.id = UUID()
        self.name = name
        self.description = description
        self.createdAt = Date()
        self.modifiedAt = Date()
        self.createdBy = createdBy
        self.version = 1
        self.rootNode = SceneNode(name: "Root", type: .group)
        self.privacyLevel = privacyLevel
        self.collaborators = []
        self.tags = []
        self.assetManifest = []
    }
}

// MARK: - Scene Node

/// A single node in the scene graph hierarchy.
/// Each node can contain child nodes and has a transform, visibility,
/// and optional geometry/material data.
struct SceneNode: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    var name: String
    var type: NodeType
    var transform: SpatialTransform
    var isVisible: Bool
    var isLocked: Bool
    var children: [SceneNode]

    /// Optional geometry data for mesh nodes.
    var geometry: GeometryDescriptor?

    /// Optional material data.
    var material: MaterialDescriptor?

    /// Optional light data.
    var light: LightDescriptor?

    /// The user currently editing this node (for collaboration lock).
    var lockedBy: String?

    /// Annotations attached to this node.
    var annotations: [Annotation]

    init(
        name: String,
        type: NodeType,
        transform: SpatialTransform = .identity,
        isVisible: Bool = true,
        isLocked: Bool = false,
        children: [SceneNode] = []
    ) {
        self.id = UUID()
        self.name = name
        self.type = type
        self.transform = transform
        self.isVisible = isVisible
        self.isLocked = isLocked
        self.children = children
        self.geometry = nil
        self.material = nil
        self.light = nil
        self.lockedBy = nil
        self.annotations = []
    }
}

// MARK: - Node Types

enum NodeType: String, Codable, CaseIterable, Sendable {
    case group = "Group"
    case mesh = "Mesh"
    case light = "Light"
    case camera = "Camera"
    case anchor = "Anchor"
    case particle = "Particle System"
    case audio = "Spatial Audio"
    case portal = "Portal"
    case volume = "Volume"
    case text3D = "3D Text"
    case reference = "Asset Reference"
    case iotSensor = "IoT Sensor"
    case spatialVideo = "Spatial Video"
    case gaussianSplat = "Gaussian Splat"
}

// MARK: - Spatial Transform

/// A Codable wrapper around a 3D transform (position, rotation, scale).
struct SpatialTransform: Codable, Hashable, Sendable {
    var positionX: Float
    var positionY: Float
    var positionZ: Float

    var rotationX: Float
    var rotationY: Float
    var rotationZ: Float
    var rotationW: Float

    var scaleX: Float
    var scaleY: Float
    var scaleZ: Float

    static let identity = SpatialTransform(
        positionX: 0, positionY: 0, positionZ: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0, rotationW: 1,
        scaleX: 1, scaleY: 1, scaleZ: 1
    )

    var position: SIMD3<Float> {
        get { SIMD3(positionX, positionY, positionZ) }
        set {
            positionX = newValue.x
            positionY = newValue.y
            positionZ = newValue.z
        }
    }

    var scale: SIMD3<Float> {
        get { SIMD3(scaleX, scaleY, scaleZ) }
        set {
            scaleX = newValue.x
            scaleY = newValue.y
            scaleZ = newValue.z
        }
    }

    var rotation: simd_quatf {
        get { simd_quatf(ix: rotationX, iy: rotationY, iz: rotationZ, r: rotationW) }
        set {
            rotationX = newValue.imag.x
            rotationY = newValue.imag.y
            rotationZ = newValue.imag.z
            rotationW = newValue.real
        }
    }
}

// MARK: - Geometry Descriptor

struct GeometryDescriptor: Codable, Hashable, Sendable {
    var primitiveType: PrimitiveType?
    var meshResourceURL: String?
    var vertexCount: Int?
    var triangleCount: Int?
    var boundingBoxMin: [Float]?
    var boundingBoxMax: [Float]?

    /// For voxel-based editing (Z-Pinch plasma column style).
    var voxelResolution: [Int]?
    var voxelDataURL: String?
}

enum PrimitiveType: String, Codable, Sendable {
    case box, sphere, cylinder, cone, torus, plane, capsule, custom
}

// MARK: - Material Descriptor

struct MaterialDescriptor: Codable, Hashable, Sendable {
    var type: MaterialType
    var baseColorHex: String?
    var baseColorTextureURL: String?
    var normalMapURL: String?
    var roughness: Float?
    var metallic: Float?
    var emissiveColorHex: String?
    var emissiveIntensity: Float?
    var opacity: Float?
    var shaderGraphURL: String?
}

enum MaterialType: String, Codable, Sendable {
    case physically_based
    case unlit
    case occlusion
    case shader_graph
    case custom_metal
}

// MARK: - Light Descriptor

struct LightDescriptor: Codable, Hashable, Sendable {
    var lightType: LightType
    var colorHex: String
    var intensity: Float
    var attenuationRadius: Float?
    var innerConeAngle: Float?
    var outerConeAngle: Float?
    var castsShadow: Bool
}

enum LightType: String, Codable, Sendable {
    case directional, point, spot, area, image_based
}

// MARK: - Annotation

struct Annotation: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    var text: String
    var author: String
    var createdAt: Date
    var position: SpatialTransform
    var color: String
    var isResolved: Bool
}

// MARK: - Asset Reference

struct AssetReference: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    var name: String
    var fileType: AssetFileType
    var localPath: String?
    var cloudURL: String?
    var fileSizeBytes: Int64?
    var checksum: String?
}

enum AssetFileType: String, Codable, Sendable {
    case usdz, usd, usda, usdc
    case obj, fbx, gltf, glb
    case png, jpg, exr, hdr
    case mp4, mov
    case reality
}

// MARK: - Privacy Level

enum PrivacyLevel: String, Codable, Sendable {
    case `private` = "Private"
    case team = "Team Only"
    case organization = "Organization"
    case `public` = "Public (Read-Only)"

    var description: String {
        switch self {
        case .private: return "Only you can view and edit."
        case .team: return "Team members with explicit access can collaborate."
        case .organization: return "Anyone in your organization can view; editors can edit."
        case .public: return "Anyone with the link can view (read-only)."
        }
    }
}

// MARK: - Collaborator

struct Collaborator: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    var userID: String
    var displayName: String
    var role: CollaboratorRole
    var isOnline: Bool
    var lastActiveAt: Date
    var avatarURL: String?
    var cursorPosition: SpatialTransform?
}

enum CollaboratorRole: String, Codable, Sendable {
    case owner = "Owner"
    case editor = "Editor"
    case viewer = "Viewer"
    case commenter = "Commenter"
}
