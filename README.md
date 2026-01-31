# DOGE Spatial Explorer

A cross-platform spatial computing framework with integrated AI capabilities, designed for Apple (iOS/macOS/visionOS), Microsoft (Windows/HoloLens), Meta Quest, Manus VR, and OpenAI platforms. Built with privacy and security as core principles.

## Features

### 🌍 Cross-Platform Support
- **Apple Platforms**: iOS (ARKit), macOS, visionOS (spatial computing)
- **Microsoft Platforms**: Windows, HoloLens (Windows Mixed Reality)
- **Meta Quest**: VR/AR experiences with hand tracking
- **Manus VR**: Professional VR glove integration
- **Web**: Browser-based spatial experiences

### 🤖 AI Integration
- **On-Device AI**: TensorFlow Lite, Core ML, ONNX Runtime
- **Edge AI**: Distributed edge computing support
- **OpenAI Integration**: Cloud-based AI processing
- **Privacy-First**: Configurable local-only processing

### 🔒 Privacy & Security
- **End-to-End Encryption**: AES-256 and ChaCha20 support
- **Data Anonymization**: Automatic PII removal
- **Secure Communication**: TLS with certificate pinning
- **Data Retention Policies**: Configurable retention periods
- **Local Processing**: Optional cloud-free operation

### 🎨 Advanced Rendering
- **3D Spatial Rendering**: Three.js-based engine
- **AR/VR Support**: Immersive experiences
- **Spatial Audio**: 3D audio positioning
- **Hand Tracking**: Platform-native hand tracking
- **Eye Tracking**: Supported on compatible devices

## Installation

```bash
npm install doge-spatial-explorer
```

Or with Yarn:

```bash
yarn add doge-spatial-explorer
```

## Quick Start

### Basic Usage

```typescript
import { createDOGESpatialExplorer, PlatformType } from 'doge-spatial-explorer';

// Create explorer for your platform
const explorer = createDOGESpatialExplorer(PlatformType.APPLE_VISIONOS);

// Initialize
await explorer.initialize();

// Add spatial objects
const objectId = explorer.addSpatialObject({
  id: 'cube-1',
  type: 'cube',
  pose: {
    position: { x: 0, y: 1, z: -2 },
    orientation: { x: 0, y: 0, z: 0, w: 1 }
  },
  scale: { x: 1, y: 1, z: 1 },
  metadata: { color: 'blue' }
});

// Start rendering
explorer.startRendering();

// Update viewer pose from device
await explorer.updateViewerPose();

// Cleanup
await explorer.shutdown();
```

### Platform-Specific Examples

#### Apple visionOS

```typescript
import { createDOGESpatialExplorer, PlatformType } from 'doge-spatial-explorer';

const explorer = createDOGESpatialExplorer(PlatformType.APPLE_VISIONOS, {
  privacy: {
    encryptData: true,
    anonymizeData: true,
    localProcessingOnly: true, // No cloud processing
    dataRetentionDays: 7
  },
  ai: {
    enableOnDevice: true, // Use Core ML
    enableEdge: false,
    enableOpenAI: false
  }
});

await explorer.initialize();
```

#### Microsoft HoloLens

```typescript
const explorer = createDOGESpatialExplorer(PlatformType.MICROSOFT_HOLOLENS, {
  rendering: {
    width: 1280,
    height: 720,
    antialias: true,
    enableVR: true,
    enableAR: true
  }
});

await explorer.initialize();
```

#### Meta Quest

```typescript
const explorer = createDOGESpatialExplorer(PlatformType.META_QUEST, {
  ai: {
    enableOnDevice: true,
    enableEdge: true,
    edgeEndpoint: 'https://edge.example.com/ai'
  }
});

await explorer.initialize();
```

### AI Integration

```typescript
import { AIProcessingMode } from 'doge-spatial-explorer';

// Configure with OpenAI
const explorer = createDOGESpatialExplorer(PlatformType.APPLE_IOS, {
  ai: {
    enableOnDevice: true,
    enableOpenAI: true,
    openAIKey: 'your-openai-api-key'
  }
});

await explorer.initialize();

// Run AI inference
const result = await explorer.runAIInference({
  model: {
    modelId: 'gpt-4',
    version: '1.0',
    processingMode: AIProcessingMode.CLOUD
  },
  input: {
    prompt: 'Analyze this spatial scene',
    context: { objects: 5, environment: 'indoor' }
  },
  options: {
    temperature: 0.7,
    maxTokens: 1000
  }
});

console.log('AI Response:', result.output);
```

### Custom Privacy Settings

```typescript
const explorer = createDOGESpatialExplorer(PlatformType.META_QUEST, {
  privacy: {
    encryptData: true,
    anonymizeData: true,
    localProcessingOnly: true, // Force local-only
    dataRetentionDays: 1 // Delete data after 1 day
  },
  security: {
    enableEncryption: true,
    encryptionAlgorithm: 'ChaCha20', // Fast encryption
    enableSecureChannel: true,
    certificatePinning: true
  }
});
```

## Architecture

```
DOGE Spatial Explorer
├── Platform Layer
│   ├── Apple (iOS/macOS/visionOS)
│   ├── Microsoft (Windows/HoloLens)
│   ├── Meta Quest
│   └── Manus VR
├── AI Layer
│   ├── On-Device Processing
│   ├── Edge Computing
│   └── Cloud (OpenAI)
├── Security Layer
│   ├── Encryption Service
│   ├── Privacy Manager
│   └── Secure Channel
└── Rendering Layer
    ├── 3D Rendering Engine
    └── Spatial Audio Engine
```

## API Reference

### DOGESpatialExplorer

Main class for the spatial explorer.

#### Methods

- `initialize(canvas?: HTMLCanvasElement): Promise<void>` - Initialize the explorer
- `addSpatialObject(object: SpatialObject): string` - Add object to scene
- `removeSpatialObject(objectId: string): void` - Remove object from scene
- `updateObjectPose(objectId: string, pose: SpatialPose): void` - Update object position
- `getDevicePose(): Promise<SpatialPose>` - Get current device pose
- `updateViewerPose(): Promise<void>` - Update camera from device
- `runAIInference(request: AIInferenceRequest): Promise<any>` - Run AI inference
- `startRendering(): void` - Start rendering loop
- `stopRendering(): void` - Stop rendering
- `getPlatformCapabilities()` - Get platform capabilities
- `getRenderingStats()` - Get rendering statistics
- `shutdown(): Promise<void>` - Cleanup and shutdown

### Platform Types

```typescript
enum PlatformType {
  APPLE_IOS = 'apple_ios',
  APPLE_MACOS = 'apple_macos',
  APPLE_VISIONOS = 'apple_visionos',
  MICROSOFT_WINDOWS = 'microsoft_windows',
  MICROSOFT_HOLOLENS = 'microsoft_hololens',
  META_QUEST = 'meta_quest',
  MANUS_VR = 'manus_vr',
  WEB = 'web'
}
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Security Best Practices

1. **Always enable encryption** in production environments
2. **Use local processing** when handling sensitive data
3. **Configure appropriate data retention** policies
4. **Enable certificate pinning** for secure communications
5. **Regularly update** to get latest security patches

## Privacy Considerations

- All user data is encrypted by default
- PII is automatically anonymized when enabled
- Local processing mode prevents cloud data transmission
- Configurable data retention policies
- Transparent data handling

## Platform Requirements

### Apple Platforms
- iOS 15.0+ / macOS 12.0+ / visionOS 1.0+
- ARKit support for AR features
- Core ML for on-device AI

### Microsoft Platforms
- Windows 10+ / Windows Mixed Reality
- HoloLens 2 for full MR features

### Meta Quest
- Quest 2, Quest Pro, Quest 3
- Hand tracking enabled

### Manus VR
- Manus Core SDK
- Compatible VR gloves

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer/issues)
- Documentation: [Full API docs](https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer/wiki)

## Acknowledgments

Built with:
- Three.js for 3D rendering
- TypeScript for type safety
- Node.js crypto for security

Designed for cross-platform spatial computing with privacy and security at its core.