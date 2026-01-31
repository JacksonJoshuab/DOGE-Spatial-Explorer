import {
  PlatformType,
  PrivacySettings,
  SecurityConfig,
  SpatialObject,
  SpatialPose,
  AIProcessingMode
} from './types';
import { 
  PlatformAdapter,
  ApplePlatformAdapter,
  MicrosoftPlatformAdapter,
  MetaPlatformAdapter,
  ManusPlatformAdapter
} from './platform/PlatformAdapter';
import {
  AIManager,
  OnDeviceAIProcessor,
  EdgeAIProcessor,
  OpenAIProcessor,
  AIInferenceRequest
} from './ai/AIProcessor';
import {
  EncryptionService,
  PrivacyManager,
  SecureChannel
} from './security/SecurityServices';
import {
  SpatialRenderingEngine,
  SpatialAudioEngine,
  RenderConfig
} from './rendering/SpatialRenderer';

/**
 * Configuration for DOGE Spatial Explorer
 */
export interface DOGEConfig {
  platform: PlatformType;
  privacy: PrivacySettings;
  security: SecurityConfig;
  rendering: RenderConfig;
  ai: {
    enableOnDevice: boolean;
    enableEdge: boolean;
    edgeEndpoint?: string;
    enableOpenAI: boolean;
    openAIKey?: string;
  };
}

/**
 * Main DOGE Spatial Explorer class
 * Cross-platform spatial computing framework with AI, privacy, and security
 */
export class DOGESpatialExplorer {
  private platformAdapter: PlatformAdapter;
  private renderingEngine: SpatialRenderingEngine;
  private audioEngine: SpatialAudioEngine;
  private aiManager: AIManager;
  private encryptionService: EncryptionService;
  private privacyManager: PrivacyManager;
  private secureChannel: SecureChannel;
  private isInitialized: boolean = false;

  constructor(private config: DOGEConfig) {
    // Initialize platform adapter
    this.platformAdapter = this.createPlatformAdapter();
    
    // Initialize security services
    this.encryptionService = new EncryptionService(config.security);
    this.privacyManager = new PrivacyManager(
      this.encryptionService,
      config.privacy
    );
    this.secureChannel = new SecureChannel(config.security);

    // Initialize rendering engines
    this.renderingEngine = new SpatialRenderingEngine(config.rendering);
    this.audioEngine = new SpatialAudioEngine();

    // Initialize AI manager
    this.aiManager = new AIManager(config.privacy);
  }

  /**
   * Create platform-specific adapter
   */
  private createPlatformAdapter(): PlatformAdapter {
    const { platform, privacy, security } = this.config;

    switch (platform) {
      case PlatformType.APPLE_IOS:
      case PlatformType.APPLE_MACOS:
      case PlatformType.APPLE_VISIONOS:
        return new ApplePlatformAdapter(platform, privacy, security);
      
      case PlatformType.MICROSOFT_WINDOWS:
      case PlatformType.MICROSOFT_HOLOLENS:
        return new MicrosoftPlatformAdapter(platform, privacy, security);
      
      case PlatformType.META_QUEST:
        return new MetaPlatformAdapter(privacy, security);
      
      case PlatformType.MANUS_VR:
        return new ManusPlatformAdapter(privacy, security);
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Initialize the DOGE Spatial Explorer
   */
  async initialize(canvas?: HTMLCanvasElement): Promise<void> {
    console.log('Initializing DOGE Spatial Explorer...');

    // Initialize security
    await this.encryptionService.initialize();

    // Initialize platform
    await this.platformAdapter.initialize();
    const capabilities = this.platformAdapter.getCapabilities();
    console.log('Platform capabilities:', capabilities);

    // Initialize rendering
    await this.renderingEngine.initialize(canvas);
    
    if (capabilities.hasSpatialAudio) {
      await this.audioEngine.initialize();
    }

    // Initialize AI processors based on configuration
    if (this.config.ai.enableOnDevice) {
      const onDeviceProcessor = new OnDeviceAIProcessor();
      await onDeviceProcessor.initialize();
      this.aiManager.registerProcessor(AIProcessingMode.ON_DEVICE, onDeviceProcessor);
    }

    if (this.config.ai.enableEdge && this.config.ai.edgeEndpoint) {
      const edgeProcessor = new EdgeAIProcessor(this.config.ai.edgeEndpoint);
      await edgeProcessor.initialize();
      this.aiManager.registerProcessor(AIProcessingMode.EDGE, edgeProcessor);
    }

    if (this.config.ai.enableOpenAI && this.config.ai.openAIKey) {
      const openAIProcessor = new OpenAIProcessor(this.config.ai.openAIKey);
      await openAIProcessor.initialize();
      this.aiManager.registerProcessor(AIProcessingMode.CLOUD, openAIProcessor);
    }

    await this.aiManager.initialize();

    this.isInitialized = true;
    console.log('DOGE Spatial Explorer initialized successfully');
  }

  /**
   * Add a spatial object to the scene
   */
  addSpatialObject(object: SpatialObject): string {
    if (!this.isInitialized) {
      throw new Error('Explorer not initialized. Call initialize() first.');
    }

    // Store object metadata with privacy settings
    this.privacyManager.storeData(object.id, object.metadata);

    // Add to rendering engine
    return this.renderingEngine.addObject(object);
  }

  /**
   * Remove a spatial object
   */
  removeSpatialObject(objectId: string): void {
    this.renderingEngine.removeObject(objectId);
  }

  /**
   * Update object pose
   */
  updateObjectPose(objectId: string, pose: SpatialPose): void {
    this.renderingEngine.updateObjectPose(objectId, pose);
  }

  /**
   * Get current device pose
   */
  async getDevicePose(): Promise<SpatialPose> {
    return this.platformAdapter.getDevicePose();
  }

  /**
   * Update camera/viewer pose
   */
  async updateViewerPose(): Promise<void> {
    const pose = await this.platformAdapter.getDevicePose();
    this.renderingEngine.updateCameraPose(pose);
    this.audioEngine.updateListenerPose(pose);
  }

  /**
   * Run AI inference
   */
  async runAIInference(request: AIInferenceRequest): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Explorer not initialized. Call initialize() first.');
    }

    return this.aiManager.inference(request);
  }

  /**
   * Start rendering loop
   */
  startRendering(): void {
    this.renderingEngine.startRendering();
  }

  /**
   * Stop rendering
   */
  stopRendering(): void {
    this.renderingEngine.stopRendering();
  }

  /**
   * Get platform capabilities
   */
  getPlatformCapabilities() {
    return this.platformAdapter.getCapabilities();
  }

  /**
   * Get rendering statistics
   */
  getRenderingStats() {
    return this.renderingEngine.getStats();
  }

  /**
   * Establish secure connection to remote service
   */
  async connectSecurely(endpoint: string): Promise<void> {
    await this.secureChannel.connect(endpoint);
  }

  /**
   * Send data securely
   */
  async sendSecurely(data: any): Promise<void> {
    await this.secureChannel.send(data);
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down DOGE Spatial Explorer...');

    this.stopRendering();
    
    await this.renderingEngine.shutdown();
    await this.audioEngine.shutdown();
    await this.aiManager.shutdown();
    await this.platformAdapter.shutdown();
    await this.secureChannel.close();
    
    this.privacyManager.clearAllData();
    
    this.isInitialized = false;
    console.log('DOGE Spatial Explorer shut down successfully');
  }
}

/**
 * Factory function to create DOGE Spatial Explorer with default settings
 */
export function createDOGESpatialExplorer(
  platform: PlatformType,
  options?: Partial<DOGEConfig>
): DOGESpatialExplorer {
  const defaultConfig: DOGEConfig = {
    platform,
    privacy: {
      encryptData: true,
      anonymizeData: true,
      localProcessingOnly: false,
      dataRetentionDays: 30
    },
    security: {
      enableEncryption: true,
      encryptionAlgorithm: 'AES-256',
      enableSecureChannel: true,
      certificatePinning: true
    },
    rendering: {
      width: 1920,
      height: 1080,
      antialias: true,
      enableVR: true,
      enableAR: true
    },
    ai: {
      enableOnDevice: true,
      enableEdge: false,
      enableOpenAI: false
    }
  };

  const config = {
    ...defaultConfig,
    ...options,
    platform
  } as DOGEConfig;

  return new DOGESpatialExplorer(config);
}

// Export all types and classes
export * from './types';
export * from './platform/PlatformAdapter';
export * from './ai/AIProcessor';
export * from './security/SecurityServices';
export * from './rendering/SpatialRenderer';
