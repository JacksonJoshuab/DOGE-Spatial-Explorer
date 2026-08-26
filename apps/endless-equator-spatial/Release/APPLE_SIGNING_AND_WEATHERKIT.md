# Apple signing and WeatherKit activation runbook

## Proposed identifiers

These values are intentionally configurable and must be checked for availability in the Apple Developer account before registration.

| Target | Proposed bundle identifier |
|---|---|
| iPhone and iPadOS companion | `com.gonzosocialclub.endlessequator` |
| Apple Vision Pro | `com.gonzosocialclub.endlessequator.spatial` |

The responsible Apple account holder records the final identifiers, Team ID, App ID record identifiers, profile names, certificate serial numbers, and expiration dates in the private release evidence system. Do not commit private certificates or provisioning profiles.

## Registration procedure

1. Register an explicit App ID for each bundle identifier.
2. Enable WeatherKit for both identifiers when the visionOS target will request WeatherKit directly. If the visionOS target will rely entirely on the companion/server, document that architecture and remove the unused entitlement instead.
3. Create App Store Connect app records with the exact identifiers.
4. Create development and distribution signing material through the organization's approved certificate process.
5. Regenerate provisioning profiles after enabling WeatherKit; old profiles will not automatically contain the new entitlement.
6. Set the protected GitHub environment `apple-production` with required reviewers.
7. Configure repository/environment values:
   - secret `APPLE_TEAM_ID`
   - variable `ENDLESS_EQUATOR_IOS_BUNDLE_ID`
   - variable `ENDLESS_EQUATOR_VISION_BUNDLE_ID`
8. Configure the protected self-hosted Apple builder with Xcode 27, XcodeGen, the approved signing identities, and profiles. The runner labels must include `macOS`, `xcode27`, and `endless-equator-signing`.
9. Run the `Endless Equator Xcode 27` workflow with `signed_archive=true`.
10. Save archive hashes, `codesign` verification output, embedded provisioning entitlement output, and build logs.

## Required entitlement evidence

For each archived app, collect:

```bash
codesign -d --entitlements :- "<APP_PATH>"
security cms -D -i "<APP_PATH>/embedded.mobileprovision" > /tmp/profile.plist
/usr/libexec/PlistBuddy -c 'Print :Entitlements:com.apple.developer.weatherkit' /tmp/profile.plist
/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' /tmp/profile.plist
```

Expected results:

- `com.apple.developer.weatherkit` is `true` only for targets intentionally using WeatherKit;
- `application-identifier` begins with the correct Team ID and exactly matches the target's bundle ID;
- the distribution profile is not expired and is appropriate for the archive/export method;
- no development-only or unrelated entitlement is present in the production archive.

## Physical WeatherKit acceptance

Run on signed physical iPhone, iPad, and Vision Pro targets that call WeatherKit:

- first request after clean install;
- current conditions for Pifo, Cayambe, Papallacta, Tena, Baños, Quilotoa, Cotopaxi perimeter, Manta, and Ayampe;
- network unavailable and timeout behavior;
- authorization/capability misconfiguration behavior in a nonproduction build;
- background/foreground transitions;
- clock/time-zone change;
- rate-limit or service error fallback;
- display of observation timestamp and source attribution;
- no replacement of official closure, emergency, or local-guide decisions by weather output.

## Signing acceptance criteria

- Both release archives build with Xcode 27.
- `codesign --verify --deep --strict` passes.
- Embedded profiles contain the expected application identifiers and WeatherKit entitlement.
- No secret is present in the archive, dSYM, app resources, or build log.
- A TestFlight internal build installs and launches on every target device class.
- App Store Connect processing completes without entitlement or privacy-manifest errors.
