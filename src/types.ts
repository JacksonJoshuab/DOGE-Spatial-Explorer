/**
 * Platform types supported by DOGE-Spatial Explorer
 */
export enum PlatformType {
  APPLE_IOS = 'apple_ios',
  APPLE_MACOS = 'apple_macos',
  APPLE_VISIONOS = 'apple_visionos',
  MICROSOFT_WINDOWS = 'microsoft_windows',
  MICROSOFT_HOLOLENS = 'microsoft_hololens',
  META_QUEST = 'meta_quest',
  MANUS_VR = 'manus_vr',
  WEB = 'web'
}

/**
 * AI Processing modes
 */
export enum AIProcessingMode {
  ON_DEVICE = 'on_device',
  EDGE = 'edge',
  CLOUD = 'cloud'
}

/**
 * Spatial coordinate system
 */
export interface SpatialCoordinate {
  x: number;
  y: number;
  z: number;
}

/**
 * Spatial orientation (quaternion)
 */
export interface SpatialOrientation {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Spatial pose (position + orientation)
 */
export interface SpatialPose {
  position: SpatialCoordinate;
  orientation: SpatialOrientation;
}

/**
 * Privacy settings for data handling
 */
export interface PrivacySettings {
  encryptData: boolean;
  anonymizeData: boolean;
  localProcessingOnly: boolean;
  dataRetentionDays: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enableEncryption: boolean;
  encryptionAlgorithm: 'AES-256' | 'ChaCha20';
  enableSecureChannel: boolean;
  certificatePinning: boolean;
}

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  hasAR: boolean;
  hasVR: boolean;
  hasHandTracking: boolean;
  hasEyeTracking: boolean;
  hasSpatialAudio: boolean;
  supportedAIProcessing: AIProcessingMode[];
}

/**
 * Spatial object in the explorer
 */
export interface SpatialObject {
  id: string;
  type: string;
  pose: SpatialPose;
  scale: SpatialCoordinate;
  metadata: Record<string, any>;
}
