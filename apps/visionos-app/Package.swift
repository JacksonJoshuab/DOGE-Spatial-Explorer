// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "DOGESpatialEditor",
    platforms: [
        .visionOS(.v2),
        .iOS(.v18),
        .macOS(.v15),
        .tvOS(.v18)
    ],
    products: [
        .library(
            name: "DOGESpatialEditor",
            targets: ["DOGESpatialEditor"]
        ),
        .library(
            name: "SpatialCollaboration",
            targets: ["SpatialCollaboration"]
        ),
        .library(
            name: "SpatialPrivacy",
            targets: ["SpatialPrivacy"]
        ),
        .library(
            name: "SpatialRendering",
            targets: ["SpatialRendering"]
        ),
    ],
    dependencies: [
        // Apple's RealityKit Content package for USDZ assets
    ],
    targets: [
        // MARK: - Core Editor Module
        .target(
            name: "DOGESpatialEditor",
            dependencies: [
                "SpatialCollaboration",
                "SpatialPrivacy",
                "SpatialRendering",
            ],
            path: "Sources"
        ),

        // MARK: - Collaboration Module (SharePlay + FaceTime)
        .target(
            name: "SpatialCollaboration",
            dependencies: [],
            path: "Sources/Services/Collaboration"
        ),

        // MARK: - Privacy Module (Secure Enclave + E2E Encryption)
        .target(
            name: "SpatialPrivacy",
            dependencies: [],
            path: "Sources/Services/Privacy"
        ),

        // MARK: - Rendering Module (RealityKit + Metal)
        .target(
            name: "SpatialRendering",
            dependencies: [],
            path: "Sources/Services/Rendering"
        ),

        // MARK: - Tests
        .testTarget(
            name: "DOGESpatialEditorTests",
            dependencies: ["DOGESpatialEditor"],
            path: "Tests"
        ),
    ]
)
