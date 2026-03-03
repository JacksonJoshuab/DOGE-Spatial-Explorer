/**
 * DOGE Spatial Editor — Cross-Platform Protocol Definitions
 * 
 * This file defines the shared protocol used across all platforms:
 * - visionOS / RealityKit (Swift)
 * - Meta Quest / Horizon (Kotlin)
 * - iPadOS / tvOS (Swift)
 * - Blender Plugin (Python)
 * - Web Dashboard (TypeScript)
 * - Cloud Backend (TypeScript)
 * 
 * All platforms MUST implement these interfaces for interoperability.
 */

// ─── Protocol Version ────────────────────────────────────────────────────────

export const PROTOCOL_VERSION = "2.0.0";
export const MIN_COMPATIBLE_VERSION = "1.5.0";

// ─── Platform Identifiers ────────────────────────────────────────────────────

export type Platform = 
  | "visionos"
  | "meta_quest"
  | "meta_horizon"
  | "ipados"
  | "tvos"
  | "blender"
  | "web"
  | "cloud";

export type DeviceType =
  | "apple_vision_pro"
  | "apple_vision_pro_2"
  | "meta_quest_2"
  | "meta_quest_3"
  | "meta_quest_pro"
  | "ipad_pro"
  | "ipad_air"
  | "apple_tv_4k"
  | "desktop_pc"
  | "desktop_mac"
  | "cloud_instance";

// ─── Coordinate Systems ──────────────────────────────────────────────────────

export type CoordinateSystem = "y_up_right" | "z_up_right";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

/**
 * Coordinate system conversion utilities.
 * Blender uses Z-up; all other platforms use Y-up.
 */
export const CoordinateConversion = {
  zUpToYUp(v: Vector3): Vector3 {
    return { x: v.x, y: v.z, z: -v.y };
  },
  yUpToZUp(v: Vector3): Vector3 {
    return { x: v.x, y: -v.z, z: v.y };
  },
  convertTransform(t: Transform, from: CoordinateSystem, to: CoordinateSystem): Transform {
    if (from === to) return t;
    if (from === "z_up_right" && to === "y_up_right") {
      return {
        position: CoordinateConversion.zUpToYUp(t.position),
        rotation: t.rotation, // Quaternion conversion handled separately
        scale: { x: t.scale.x, y: t.scale.z, z: t.scale.y },
      };
    }
    return {
      position: CoordinateConversion.yUpToZUp(t.position),
      rotation: t.rotation,
      scale: { x: t.scale.x, y: t.scale.z, z: t.scale.y },
    };
  },
};

// ─── Scene Graph Protocol ────────────────────────────────────────────────────

export type NodeType =
  | "mesh"
  | "group"
  | "light"
  | "camera"
  | "audio_source"
  | "particle_system"
  | "volume"
  | "curve"
  | "text"
  | "skeleton"
  | "privacy_zone"
  | "anchor"
  | "portal";

export interface SceneNode {
  id: string;
  name: string;
  type: NodeType;
  transform: Transform;
  parentId: string | null;
  childIds: string[];
  visible: boolean;
  locked: boolean;
  lockedBy: string | null;
  materials: string[];
  metadata: Record<string, unknown>;
  privacyZoneId: string | null;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface SceneDocument {
  id: string;
  name: string;
  version: number;
  protocolVersion: string;
  coordinateSystem: CoordinateSystem;
  rootNodeId: string;
  nodes: Record<string, SceneNode>;
  materials: Record<string, MaterialDefinition>;
  environment: EnvironmentSettings;
  privacyZones: Record<string, PrivacyZone>;
  metadata: DocumentMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentMetadata {
  author: string;
  description: string;
  tags: string[];
  thumbnail: string | null;
  fileSize: number;
  polyCount: number;
  textureMemory: number;
}

// ─── Material Protocol ───────────────────────────────────────────────────────

export interface MaterialDefinition {
  id: string;
  name: string;
  type: "pbr" | "unlit" | "custom";
  pbr?: PBRMaterial;
  unlit?: UnlitMaterial;
  textures: Record<string, TextureReference>;
}

export interface PBRMaterial {
  baseColor: [number, number, number, number];
  metallic: number;
  roughness: number;
  normalScale: number;
  emissiveColor: [number, number, number];
  emissiveStrength: number;
  opacity: number;
  ior: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export interface UnlitMaterial {
  color: [number, number, number, number];
  opacity: number;
}

export interface TextureReference {
  id: string;
  url: string;
  type: "base_color" | "normal" | "metallic_roughness" | "emissive" | "occlusion" | "height";
  resolution: [number, number];
  format: "png" | "jpg" | "webp" | "ktx2" | "exr" | "hdr";
}

// ─── Environment Protocol ────────────────────────────────────────────────────

export interface EnvironmentSettings {
  skybox: SkyboxSettings | null;
  ambientLight: AmbientLightSettings;
  fog: FogSettings | null;
  postProcessing: PostProcessingSettings;
}

export interface SkyboxSettings {
  type: "color" | "hdri" | "procedural";
  color?: [number, number, number];
  hdriUrl?: string;
  intensity: number;
  rotation: number;
}

export interface AmbientLightSettings {
  color: [number, number, number];
  intensity: number;
}

export interface FogSettings {
  type: "linear" | "exponential";
  color: [number, number, number];
  density: number;
  start: number;
  end: number;
}

export interface PostProcessingSettings {
  bloom: boolean;
  bloomIntensity: number;
  ssao: boolean;
  ssaoRadius: number;
  toneMappingExposure: number;
}

// ─── Collaboration Protocol ──────────────────────────────────────────────────

export type OperationType =
  | "node_create"
  | "node_delete"
  | "node_update"
  | "transform_update"
  | "material_update"
  | "visibility_toggle"
  | "lock_acquire"
  | "lock_release"
  | "privacy_zone_create"
  | "privacy_zone_update"
  | "privacy_zone_delete"
  | "cursor_update"
  | "selection_update"
  | "undo"
  | "redo"
  | "snapshot";

export interface Operation {
  id: string;
  type: OperationType;
  documentId: string;
  nodeId: string | null;
  authorId: string;
  authorPlatform: Platform;
  timestamp: number;
  payload: Record<string, unknown>;
  parentOperationId: string | null;
  vectorClock: Record<string, number>;
}

export interface OperationBatch {
  operations: Operation[];
  batchId: string;
  authorId: string;
  timestamp: number;
}

// ─── CRDT Types ──────────────────────────────────────────────────────────────

export interface CRDTState {
  documentId: string;
  vectorClock: Record<string, number>;
  lamportTimestamp: number;
  operationLog: Operation[];
  tombstones: Set<string>;
}

export interface ConflictResolution {
  operationA: Operation;
  operationB: Operation;
  resolution: "accept_a" | "accept_b" | "merge" | "reject_both";
  mergedPayload?: Record<string, unknown>;
}

// ─── Session Protocol ────────────────────────────────────────────────────────

export type SessionState = "waiting" | "active" | "paused" | "ended";

export interface CollaborationSession {
  id: string;
  documentId: string;
  name: string;
  state: SessionState;
  hostId: string;
  hostPlatform: Platform;
  participants: SessionParticipant[];
  maxParticipants: number;
  encryption: EncryptionConfig;
  createdAt: number;
  updatedAt: number;
}

export interface SessionParticipant {
  userId: string;
  displayName: string;
  platform: Platform;
  deviceType: DeviceType;
  role: "host" | "editor" | "viewer";
  color: string;
  cursorPosition: Vector3 | null;
  selectedNodes: string[];
  isActive: boolean;
  isMuted: boolean;
  joinedAt: number;
  lastActiveAt: number;
}

// ─── Privacy Protocol ────────────────────────────────────────────────────────

export type PrivacyLevel = "public" | "team" | "private" | "classified";

export interface PrivacyZone {
  id: string;
  name: string;
  level: PrivacyLevel;
  center: Vector3;
  radius: number;
  shape: "sphere" | "box" | "custom";
  allowedUserIds: string[];
  allowedRoles: string[];
  encryptionRequired: boolean;
  auditLog: boolean;
  createdBy: string;
  createdAt: number;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: "AES-256-GCM" | "ChaCha20-Poly1305";
  keyExchange: "ECDH-P256" | "X25519";
  keyRotationIntervalMs: number;
  useSecureEnclave: boolean;
}

// ─── Security / OSI Stack Protocol ───────────────────────────────────────────

export interface OSISecurityStatus {
  layer1_physical: SecurityLayerStatus;
  layer2_dataLink: SecurityLayerStatus;
  layer3_network: SecurityLayerStatus;
  layer4_transport: SecurityLayerStatus;
  layer5_session: SecurityLayerStatus;
  layer6_presentation: SecurityLayerStatus;
  layer7_application: SecurityLayerStatus;
}

export interface SecurityLayerStatus {
  layer: number;
  name: string;
  protocol: string;
  status: "secure" | "degraded" | "insecure" | "unknown";
  details: string;
  lastVerified: number;
}

// ─── WebSocket Message Protocol ──────────────────────────────────────────────

export type WSMessageType =
  | "join_session"
  | "leave_session"
  | "operation"
  | "operation_batch"
  | "cursor_update"
  | "participant_update"
  | "session_state_change"
  | "lock_request"
  | "lock_response"
  | "sync_request"
  | "sync_response"
  | "heartbeat"
  | "error"
  | "device_command"
  | "device_status";

export interface WSMessage {
  type: WSMessageType;
  sessionId: string;
  senderId: string;
  senderPlatform: Platform;
  timestamp: number;
  payload: Record<string, unknown>;
  encrypted: boolean;
  signature?: string;
}

export interface WSJoinPayload {
  userId: string;
  displayName: string;
  platform: Platform;
  deviceType: DeviceType;
  protocolVersion: string;
  capabilities: PlatformCapabilities;
}

export interface WSOperationPayload {
  operation: Operation;
}

export interface WSCursorPayload {
  position: Vector3;
  selectedNodes: string[];
  activeNode: string | null;
  color: string;
}

export interface WSSyncRequestPayload {
  lastKnownVersion: number;
  vectorClock: Record<string, number>;
}

export interface WSSyncResponsePayload {
  document: SceneDocument;
  missedOperations: Operation[];
  currentVersion: number;
}

// ─── Platform Capabilities ───────────────────────────────────────────────────

export interface PlatformCapabilities {
  handTracking: boolean;
  eyeTracking: boolean;
  spatialAudio: boolean;
  lidar: boolean;
  passthrough: boolean;
  sharePlay: boolean;
  gaussianSplat: boolean;
  volumetricRendering: boolean;
  metalSupport: boolean;
  vulkanSupport: boolean;
  maxTextureSize: number;
  maxPolyCount: number;
  coordinateSystem: CoordinateSystem;
}

export const PLATFORM_CAPABILITIES: Record<string, PlatformCapabilities> = {
  apple_vision_pro: {
    handTracking: true,
    eyeTracking: true,
    spatialAudio: true,
    lidar: true,
    passthrough: true,
    sharePlay: true,
    gaussianSplat: true,
    volumetricRendering: true,
    metalSupport: true,
    vulkanSupport: false,
    maxTextureSize: 8192,
    maxPolyCount: 5000000,
    coordinateSystem: "y_up_right",
  },
  meta_quest_3: {
    handTracking: true,
    eyeTracking: true,
    spatialAudio: true,
    lidar: false,
    passthrough: true,
    sharePlay: false,
    gaussianSplat: true,
    volumetricRendering: false,
    metalSupport: false,
    vulkanSupport: true,
    maxTextureSize: 4096,
    maxPolyCount: 2000000,
    coordinateSystem: "y_up_right",
  },
  ipad_pro: {
    handTracking: false,
    eyeTracking: false,
    spatialAudio: true,
    lidar: true,
    passthrough: false,
    sharePlay: true,
    gaussianSplat: true,
    volumetricRendering: false,
    metalSupport: true,
    vulkanSupport: false,
    maxTextureSize: 8192,
    maxPolyCount: 10000000,
    coordinateSystem: "y_up_right",
  },
  desktop_blender: {
    handTracking: false,
    eyeTracking: false,
    spatialAudio: false,
    lidar: false,
    passthrough: false,
    sharePlay: false,
    gaussianSplat: true,
    volumetricRendering: true,
    metalSupport: false,
    vulkanSupport: true,
    maxTextureSize: 16384,
    maxPolyCount: 100000000,
    coordinateSystem: "z_up_right",
  },
};

// ─── Device Management Protocol ──────────────────────────────────────────────

export interface DeviceRegistration {
  deviceId: string;
  deviceType: DeviceType;
  platform: Platform;
  name: string;
  model: string;
  osVersion: string;
  appVersion: string;
  capabilities: PlatformCapabilities;
  pushToken?: string;
}

export interface DeviceStatus {
  deviceId: string;
  isOnline: boolean;
  batteryLevel: number | null;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  fps: number;
  temperature: number | null;
  activeDocumentId: string | null;
  activeSessionId: string | null;
  entityCount: number;
  renderTimeMs: number;
  lastHeartbeat: number;
}

export type DeviceCommand =
  | "start_session"
  | "pause_session"
  | "end_session"
  | "reload_scene"
  | "capture_screenshot"
  | "start_recording"
  | "stop_recording"
  | "export_scene"
  | "force_sync"
  | "update_settings";

export interface DeviceCommandMessage {
  commandId: string;
  targetDeviceId: string;
  command: DeviceCommand;
  payload: Record<string, unknown>;
  issuedBy: string;
  issuedAt: number;
}

// ─── AI Service Protocol ─────────────────────────────────────────────────────

export type AIServiceType =
  | "text_to_3d"
  | "text_to_texture"
  | "image_to_3d"
  | "audio_to_scene"
  | "text_to_scene"
  | "rf_to_spatial"
  | "rag_assistant";

export interface AIRequest {
  id: string;
  type: AIServiceType;
  prompt?: string;
  imageData?: string;
  audioData?: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
  requestedAt: number;
}

export interface AIResponse {
  requestId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: {
    modelUrl?: string;
    textureUrl?: string;
    sceneData?: Record<string, unknown>;
    spatialData?: Record<string, unknown>;
  };
  error?: string;
  completedAt?: number;
}

// ─── Asset Protocol ──────────────────────────────────────────────────────────

export type AssetFormat =
  | "usdz"
  | "usdc"
  | "glb"
  | "gltf"
  | "fbx"
  | "obj"
  | "hdr"
  | "exr"
  | "png"
  | "jpg"
  | "ktx2"
  | "mp3"
  | "wav"
  | "mp4";

export interface AssetManifest {
  id: string;
  name: string;
  format: AssetFormat;
  url: string;
  size: number;
  hash: string;
  hashAlgorithm: "sha256";
  metadata: {
    polyCount?: number;
    textureCount?: number;
    animationCount?: number;
    dimensions?: BoundingBox;
  };
  uploadedBy: string;
  uploadedAt: number;
  tags: string[];
}

// ─── Notification Protocol ───────────────────────────────────────────────────

export type NotificationType =
  | "session_invite"
  | "session_started"
  | "session_ended"
  | "participant_joined"
  | "participant_left"
  | "edit_conflict"
  | "privacy_zone_breach"
  | "export_complete"
  | "ai_generation_complete"
  | "device_offline"
  | "security_alert";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "critical";
  targetUserId: string;
  targetDeviceId?: string;
  data: Record<string, unknown>;
  createdAt: number;
  readAt?: number;
}
