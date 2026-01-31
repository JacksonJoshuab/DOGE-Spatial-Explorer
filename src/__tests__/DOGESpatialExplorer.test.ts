import { DOGESpatialExplorer, createDOGESpatialExplorer, PlatformType } from '../index';

describe('DOGESpatialExplorer', () => {
  let explorer: DOGESpatialExplorer;

  beforeEach(() => {
    explorer = createDOGESpatialExplorer(PlatformType.WEB, {
      privacy: {
        encryptData: false,
        anonymizeData: false,
        localProcessingOnly: true,
        dataRetentionDays: 1
      },
      security: {
        enableEncryption: false,
        encryptionAlgorithm: 'AES-256',
        enableSecureChannel: false,
        certificatePinning: false
      },
      rendering: {
        width: 800,
        height: 600,
        antialias: false,
        enableVR: false,
        enableAR: false
      },
      ai: {
        enableOnDevice: true,
        enableEdge: false,
        enableOpenAI: false
      }
    });
  });

  afterEach(async () => {
    if (explorer) {
      await explorer.shutdown();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(explorer.initialize()).resolves.not.toThrow();
    });

    it('should get platform capabilities', async () => {
      await explorer.initialize();
      const capabilities = explorer.getPlatformCapabilities();
      expect(capabilities).toBeDefined();
      expect(capabilities).toHaveProperty('hasAR');
      expect(capabilities).toHaveProperty('hasVR');
    });
  });

  describe('spatial objects', () => {
    beforeEach(async () => {
      await explorer.initialize();
    });

    it('should add spatial object', () => {
      const objectId = explorer.addSpatialObject({
        id: 'test-cube',
        type: 'cube',
        pose: {
          position: { x: 0, y: 1, z: -2 },
          orientation: { x: 0, y: 0, z: 0, w: 1 }
        },
        scale: { x: 1, y: 1, z: 1 },
        metadata: {}
      });

      expect(objectId).toBe('test-cube');
    });

    it('should remove spatial object', () => {
      const objectId = explorer.addSpatialObject({
        id: 'test-cube',
        type: 'cube',
        pose: {
          position: { x: 0, y: 0, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 }
        },
        scale: { x: 1, y: 1, z: 1 },
        metadata: {}
      });

      expect(() => explorer.removeSpatialObject(objectId)).not.toThrow();
    });

    it('should update object pose', () => {
      const objectId = explorer.addSpatialObject({
        id: 'test-cube',
        type: 'cube',
        pose: {
          position: { x: 0, y: 0, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 }
        },
        scale: { x: 1, y: 1, z: 1 },
        metadata: {}
      });

      expect(() => explorer.updateObjectPose(objectId, {
        position: { x: 1, y: 1, z: 1 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      })).not.toThrow();
    });
  });

  describe('device pose', () => {
    beforeEach(async () => {
      await explorer.initialize();
    });

    it('should get device pose', async () => {
      const pose = await explorer.getDevicePose();
      expect(pose).toBeDefined();
      expect(pose).toHaveProperty('position');
      expect(pose).toHaveProperty('orientation');
      expect(pose.position).toHaveProperty('x');
      expect(pose.position).toHaveProperty('y');
      expect(pose.position).toHaveProperty('z');
    });

    it('should update viewer pose', async () => {
      await expect(explorer.updateViewerPose()).resolves.not.toThrow();
    });
  });

  describe('rendering', () => {
    beforeEach(async () => {
      await explorer.initialize();
    });

    it('should get rendering stats', () => {
      const stats = explorer.getRenderingStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('objectCount');
      expect(stats).toHaveProperty('triangleCount');
    });
  });

  describe('shutdown', () => {
    it('should shutdown successfully', async () => {
      await explorer.initialize();
      await expect(explorer.shutdown()).resolves.not.toThrow();
    });
  });
});
