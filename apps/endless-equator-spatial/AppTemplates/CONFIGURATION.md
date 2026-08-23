# Apple target configuration

## iOS + iPadOS companion

1. Create one SwiftUI application target with iPhone and iPad destinations and a minimum deployment of iOS/iPadOS 27.
2. Add this folder as a local Swift package and link `EndlessEquatorAppleUI`.
3. Use `iOS/EndlessEquatorCompanionApp.swift` as the app entry point.
4. Use `../Config/Info-iOS.plist`, `../Config/EndlessEquator.entitlements`, and `../Config/PrivacyInfo.xcprivacy` as the starting configuration files.
5. Enable WeatherKit for the App ID and target. Maps, Location, Local Network, and Bonjour are used by the source.
6. Set `EndlessEquatorServerURL` to an HTTPS gateway for devices. `http://localhost:8787` is intended only for simulator/local development.
7. Keep `OPENAI_API_KEY`, the Apple Maps private key, and NVIDIA credentials on the server or deployment platform. Never add them to build settings that ship in the app.

## visionOS

1. Create a SwiftUI visionOS application target with a minimum deployment of visionOS 27.
2. Link `EndlessEquatorAppleUI` and use `visionOS/EndlessEquatorVisionApp.swift`.
3. Use `../Config/Info-visionOS.plist`, the shared entitlements file, and the privacy manifest.
4. Configure one mixed `ImmersiveSpace` with the ID `endless-equator-route` through the supplied app entry point.
5. The route room must remain stationary-only. Do not convert it into an in-motion motorcycle HUD.

## Signing and identifiers

Assign your own development team and bundle identifiers. The sample files deliberately contain no developer team, provisioning profile, service key, or production domain.

## Minimum device tests

- deny and grant Location permission;
- deny and grant Local Network permission;
- pair two devices by confirming peer names in person;
- verify that an unverified seed route cannot start guidance;
- import a locally verified GPX and confirm maneuver progression;
- simulate an off-route condition;
- verify that Vision Pro locks the route room while moving or when location quality is uncertain;
- disconnect the gateway and confirm local route/AOI operation;
- confirm that WebKit blocks navigation to non-gateway hosts.
