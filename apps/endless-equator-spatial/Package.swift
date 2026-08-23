// swift-tools-version: 6.4
import PackageDescription

let package = Package(
    name: "EndlessEquatorSpatial",
    platforms: [
        .iOS("27.0"),
        .visionOS("27.0")
    ],
    products: [
        .library(name: "EndlessEquatorCore", targets: ["EndlessEquatorCore"]),
        .library(name: "EndlessEquatorAppleUI", targets: ["EndlessEquatorAppleUI"]),
        .library(name: "EndlessEquatorNVIDIA", targets: ["EndlessEquatorNVIDIA"])
    ],
    dependencies: [
        .package(
            url: "https://github.com/NVIDIA/cloudxr-framework",
            revision: "5cd43e00e6e038d64b03896b00cad53821030b20"
        )
    ],
    targets: [
        .target(
            name: "EndlessEquatorCore",
            resources: [.process("Resources")],
            swiftSettings: [.swiftLanguageMode(.v6)]
        ),
        .target(
            name: "EndlessEquatorNVIDIA",
            dependencies: [
                "EndlessEquatorCore",
                .product(
                    name: "CloudXRKit",
                    package: "cloudxr-framework",
                    condition: .when(platforms: [.iOS, .visionOS])
                )
            ],
            swiftSettings: [.swiftLanguageMode(.v6)]
        ),
        .target(
            name: "EndlessEquatorAppleUI",
            dependencies: ["EndlessEquatorCore"],
            swiftSettings: [.swiftLanguageMode(.v6)]
        ),
        .testTarget(
            name: "EndlessEquatorCoreTests",
            dependencies: ["EndlessEquatorCore"],
            swiftSettings: [.swiftLanguageMode(.v6)]
        )
    ]
)
