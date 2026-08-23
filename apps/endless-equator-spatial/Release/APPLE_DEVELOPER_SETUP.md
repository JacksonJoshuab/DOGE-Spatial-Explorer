# Apple Developer, WeatherKit, Signing and TestFlight Runbook

These steps require an Apple Developer Program Account Holder or Admin and cannot be completed by repository code alone.

## Identifiers

Register explicit App IDs for the release targets:

- `com.gonzosocialclub.endlessequator.companion`
- `com.gonzosocialclub.endlessequator.vision`

Before registering, the Account Holder must confirm that Gonzo Social Club is the correct legal publishing entity and that these identifiers should be permanent. Bundle identifiers cannot be casually reused after App Store records and receipts depend on them.

## Capabilities

Enable WeatherKit on both App IDs. Add only capabilities the shipping targets actually use. The current configuration requires:

- WeatherKit;
- Maps and Location through the application frameworks;
- Local Network permission and `_eq-nav._tcp` Bonjour service for nearby companion sync.

Do not add background location until a documented user requirement, battery test and App Review justification exist.

## App Store Connect records

Create separate App Store Connect records for the companion and visionOS app when required by the chosen distribution model. Confirm:

- SKU and primary language;
- app name availability;
- bundle ID selection;
- privacy-policy and support URLs;
- age rating;
- export-compliance response;
- App Store categories;
- tester groups and internal-test owners.

## Signing secrets for GitHub

Create a protected GitHub environment named `endless-equator-testflight`. Require a human reviewer. Store only these environment secrets:

- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY_B64`
- `APPLE_DISTRIBUTION_P12_B64`
- `APPLE_DISTRIBUTION_P12_PASSWORD`
- `IOS_PROVISIONING_PROFILE_B64`
- `IOS_PROFILE_NAME`
- `VISIONOS_PROVISIONING_PROFILE_B64`
- `VISIONOS_PROFILE_NAME`
- `TEMP_KEYCHAIN_PASSWORD`

Use the least-privileged App Store Connect API key that can upload and manage TestFlight builds. Keys are one-time-download secrets; rotate immediately after suspected exposure.

## First signed build procedure

1. Complete the green Xcode 27 unsigned-build gate.
2. Register identifiers and enable WeatherKit.
3. Create/refresh distribution profiles containing the WeatherKit entitlement.
4. Add protected environment secrets.
5. Run `Endless Equator TestFlight Release` manually.
6. Inspect signed archive entitlements with `codesign -d --entitlements :-`.
7. Confirm both uploads in App Store Connect delivery logs.
8. Resolve export-compliance or invalid-binary warnings before adding testers.
9. Retain archive hashes, delivery logs, profile UUIDs and App Store build IDs in the release evidence folder.

## WeatherKit acceptance test

A release candidate passes WeatherKit only when:

- both signed apps contain `com.apple.developer.weatherkit = true`;
- current weather loads on a physical device under the production App ID;
- denied location produces a usable non-live planning experience;
- no exact location is sent to the OpenAI gateway by default;
- an unavailable WeatherKit service does not block local route guidance.
