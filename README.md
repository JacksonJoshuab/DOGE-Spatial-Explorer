'''
# DOGE Spatial Explorer

**A cross-platform spatial editing studio for the future of mixed reality.**

DOGE Spatial Explorer is a comprehensive, multi-platform spatial editing application that enables real-time collaboration across Apple Vision Pro, Meta Quest, desktop (via Blender), and mobile/tablet devices. It serves as a live editing studio integrated with FaceTime and SharePlay, with a strong focus on privacy, security, and high-performance rendering.

This project is designed to be a reference architecture for building complex, collaborative mixed reality experiences that span the entire Apple and Meta ecosystems, with a robust cloud backend for synchronization, asset management, and AI-powered generative features.

![DOGE Spatial Explorer Banner](https://user-images.githubusercontent.com/12345/placeholder.png) <!-- Replace with actual banner -->

## Core Features

- **Cross-Platform Collaboration**: Seamlessly edit 3D scenes in real-time with users on visionOS, Meta Horizon OS, iPadOS, tvOS, and Blender.
- **High-Fidelity Rendering**: Leverages RealityKit and Metal on Apple platforms and the Meta Spatial SDK for high-performance rendering, supporting:
  - Volumetric rendering (Z-Pinch plasma column style)
  - Gaussian splats
  - LiDAR point clouds
  - PBR materials
- **FaceTime & SharePlay Integration**: Launch collaborative editing sessions directly from FaceTime, with shared context and audio.
- **Advanced Privacy & Security**: End-to-end encryption, Secure Enclave support, and granular privacy zones to protect sensitive data.
- **AI-Powered Generation**: Integrated cloud services for:
  - Text-to-3D model generation
  - Text-to-PBR texture generation
  - Image-to-3D reconstruction
  - Audio-to-scene visualization
  - RAG-powered NPC assistants
- **Companion Apps**: Manage sessions, assets, and projects from iPadOS and tvOS.
- **Blender Integration**: A powerful Blender addon for bidirectional scene sync, asset management, and live collaboration with spatial devices.
- **Cloud Backend**: A scalable backend built with Node.js, Express, and WebSocket for real-time sync, authentication, and asset storage.

## Project Architecture

The DOGE Spatial Explorer is a monorepo containing several distinct but interconnected applications and plugins. This structure allows for shared code, types, and a unified development workflow.

```mermaid
graph TD
    subgraph Cloud
        A[Cloud Backend (Node.js)]
        B[Database (MySQL/TiDB)]
        C[Asset Storage (S3)]
        D[AI Services]
    end

    subgraph Apple Ecosystem
        E[visionOS App (Swift/RealityKit)]
        F[iPadOS/tvOS Companion App (SwiftUI)]
    end

    subgraph Meta Ecosystem
        G[Meta Quest App (Kotlin/Spatial SDK)]
    end

    subgraph Desktop
        H[Blender Addon (Python)]
    end

    A <--> B
    A <--> C
    A <--> D

    E <--> A
    F <--> A
    G <--> A
    H <--> A

    E <-.-> G
    E <-.-> H
    G <-.-> H
```

### Components

| Directory | Description |
|---|---|
| `/apps/visionos-app` | The primary spatial editing application for Apple Vision Pro, built with Swift, SwiftUI, and RealityKit. |
| `/apps/meta-app` | The cross-platform spatial editing client for Meta Quest devices, built with Kotlin and the Meta Spatial SDK. |
| `/apps/ios-companion` | A multi-platform companion app for iPadOS and tvOS to manage sessions, projects, and assets remotely. |
| `/plugins/blender-addon` | A Python addon for Blender that provides bidirectional sync with the cloud backend. |
| `/cloud-backend` | The Node.js/Express server that powers real-time collaboration, authentication, and asset management. |
| `/shared` | (Future) Shared TypeScript types and validation schemas for cross-component consistency. |

## Getting Started

### Prerequisites

- **visionOS**: Xcode 16+, visionOS 3 SDK
- **Meta Quest**: Android Studio, Meta Spatial SDK, OpenXR
- **Companion App**: Xcode 16+, iOS 18 / tvOS 18 SDK
- **Blender Addon**: Blender 4.0+, Python 3.10+
- **Cloud Backend**: Node.js 20+, Docker, a MySQL-compatible database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer.git
   cd DOGE-Spatial-Explorer
   ```

2. **Setup the Cloud Backend:**
   - Navigate to the `cloud-backend` directory.
   - Install dependencies: `npm install`
   - Configure environment variables in a `.env` file (see `cloud-backend/README.md`).
   - Run the server: `npm run dev`

3. **Build and run the applications:**
   - **visionOS App**: Open `apps/visionos-app` in Xcode and run on a simulator or device.
   - **Meta Quest App**: Open `apps/meta-app` in Android Studio and deploy to a connected Quest device.
   - **Companion App**: Open `apps/ios-companion` in Xcode and run on an iPad or Apple TV simulator/device.
   - **Blender Addon**: Install the `plugins/blender-addon` directory as a Blender addon from the preferences menu.

## Documentation

- **[Architecture Overview](./ARCHITECTURE.md)**: A detailed breakdown of the system architecture and data flow.
- **[API Reference](./docs/api.md)**: (Future) Documentation for the cloud backend REST API.
- **[Component Guides](./docs/)**: (Future) In-depth guides for each application and plugin.

## Contributing

We welcome contributions from the community! Please read our **[Contributing Guidelines](./CONTRIBUTING.md)** to get started.

## Code of Conduct

This project adheres to the **[Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md)**. By participating, you are expected to uphold this code.

## License

This project is licensed under the **[MIT License](./LICENSE)**.
'''))_response": {"output": "File written: /home/ubuntu/DOGE-Spatial-Explorer/README.md"}}
