// swift-tools-version: 6.0
// Package.swift
// DOGE Spatial Explorer — iPadOS & tvOS Companion App
//
// Multi-platform companion app for managing spatial editing sessions
// from iPad and Apple TV. Provides remote control, asset management,
// collaboration monitoring, and project administration.

import PackageDescription

let package = Package(
    name: "DOGESpatialCompanion",
    platforms: [
        .iOS(.v18),
        .tvOS(.v18),
        .macOS(.v15)
    ],
    products: [
        .executable(name: "DOGESpatialCompanion", targets: ["App"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-collections.git", from: "1.1.0"),
        .package(url: "https://github.com/apple/swift-async-algorithms.git", from: "1.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [
                .product(name: "Collections", package: "swift-collections"),
                .product(name: "AsyncAlgorithms", package: "swift-async-algorithms"),
            ],
            path: "Sources"
        )
    ]
)
