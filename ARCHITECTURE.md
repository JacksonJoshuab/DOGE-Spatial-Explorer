# DOGE Spatial Explorer: System Architecture and Project Structure

## 1. Introduction

This document outlines the system architecture and project structure for the DOGE Spatial Explorer, a cross-platform spatial editing application. The application will provide a collaborative, real-time 3D editing experience across Apple visionOS, Meta Quest/Horizon, and the web, with companion management apps for iPadOS and tvOS, and a plugin for Blender.

## 2. High-Level Architecture

The DOGE Spatial Explorer will be built as a monorepo, containing multiple applications and shared packages. This approach will facilitate code sharing and streamlined dependency management across the various platforms.

The architecture is designed to be modular and extensible, with a clear separation of concerns between the frontend applications, the backend services, and the shared libraries.

## 3. Monorepo Project Structure

The project will be organized into the following directories:

```
/DOGE-Spatial-Explorer
|-- apps/
|   |-- visionos-app/   # visionOS spatial editing application
|   |-- meta-app/       # Meta Quest/Horizon spatial editing application
|   |-- ios-app/        # iPadOS/tvOS companion management application
|   `-- web-app/        # Existing web application (adapted for management)
|-- packages/
|   |-- shared-types/   # Shared data types and interfaces (TypeScript)
|   |-- swift-models/   # Shared data models for Swift applications
|   `-- ui-components/  # Shared UI components (React)
|-- plugins/
|   `-- blender-plugin/ # Blender addon for asset import/export
|-- server/             # Cloud backend and collaboration services
|-- ARCHITECTURE.md     # This document
|-- README.md           # Project README
`-- package.json        # Monorepo root package.json
```

## 4. Component Breakdown

### 4.1. visionOS Application (`apps/visionos-app`)

- **Platform:** Apple visionOS
- **Language:** Swift, SwiftUI
- **Frameworks:** RealityKit, SharePlay, GroupActivities
- **Functionality:**
    - Real-time, collaborative 3D scene editing.
    - Integration with FaceTime for spatial communication.
    - High-fidelity rendering of 3D models and environments.
    - Intuitive spatial interaction for object manipulation.

### 4.2. Meta Quest/Horizon Application (`apps/meta-app`)

- **Platform:** Meta Horizon OS
- **Framework:** Meta Spatial SDK, OpenXR
- **Language:** Kotlin, Java
- **Functionality:**
    - Cross-platform collaboration with visionOS users.
    - Passthrough and mixed reality features.
    - Scene and anchor management for spatial awareness.

### 4.3. iPadOS/tvOS Companion App (`apps/ios-app`)

- **Platform:** Apple iPadOS, tvOS
- **Language:** Swift, SwiftUI
- **Functionality:**
    - 2D interface for project and scene management.
    - User and permission administration.
    - Asset library browsing and management.

### 4.4. Blender Plugin (`plugins/blender-plugin`)

- **Platform:** Blender (PC, Mac, Linux)
- **Language:** Python
- **Functionality:**
    - Export 3D models and scenes to USDZ format.
    - Direct upload and download of assets to the cloud backend.
    - Integration with Blender's asset management system.

### 4.5. Cloud Backend (`server`)

- **Platform:** Node.js, Express, tRPC
- **Database:** MySQL (via Drizzle ORM)
- **Functionality:**
    - Real-time synchronization of scene data using WebSockets.
    - User authentication and authorization.
    - Asset storage and management (e.g., using AWS S3).
    - RESTful API for communication with client applications.

## 5. Data Flow and Synchronization

The cloud backend will serve as the central hub for all data synchronization. Client applications will establish a WebSocket connection to the backend to receive real-time updates to the scene graph. When a user makes a change in one of the client applications, the change will be sent to the backend, which will then broadcast the update to all other connected clients.

SharePlay will be used for the visionOS application to provide a low-latency, peer-to-peer connection for collaboration within a FaceTime call. The cloud backend will still be used for persistent storage and for collaboration with non-visionOS users.

## 6. Next Steps

The next phase of the project will be to build out the individual components of the system, starting with the core visionOS application and the cloud backend. The other components will then be developed in parallel.
