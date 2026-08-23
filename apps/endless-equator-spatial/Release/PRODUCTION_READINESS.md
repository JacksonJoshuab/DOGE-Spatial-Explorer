# Endless Equator — Production Readiness Ledger

This ledger is the release authority for the iPhone, iPadOS, Apple Vision Pro, WebKit/PWA, gateway, OpenAI, and optional NVIDIA components. A gate is **complete** only when its evidence link or artifact is attached. A planning statement, email promise, or stale screenshot is not evidence.

## Release decision

| Gate | Owner | Acceptance evidence | Current state |
|---|---|---|---|
| Xcode 27 compilation | Engineering | Green `Endless Equator Xcode 27` run for iPhone, iPad, visionOS, analyzer and unsigned archives | In progress in PR CI |
| Apple identifiers | Apple Account Holder/Admin | Registered companion and visionOS identifiers matching the release configuration | External credential gate |
| WeatherKit | Apple Account Holder/Admin | WeatherKit enabled for both identifiers; signed entitlements inspected in archives | External credential gate |
| Signing | Release manager | Valid Apple Distribution certificate/profile or managed cloud signing; signed archives | External credential gate |
| TestFlight | Release manager | Builds processed and shown as Ready to Test/Testing for iOS/iPadOS and visionOS | External credential gate |
| Physical-device verification | QA lead | Signed device matrix with evidence on target devices and OS builds | Physical-device gate |
| HTTPS gateway | Platform owner | Production URL, valid TLS, health checks, rollback and monitoring evidence | Deployment gate |
| App privacy | Privacy owner | Final data inventory, privacy manifest validation and App Store privacy responses | Human review gate |
| Accessibility | Accessibility owner | Simulator audit, physical VoiceOver/Voice Control/Larger Text testing and support-label decisions | Human/device gate |
| Security | Security owner | Threat-model review, SAST/dependency/container/DAST evidence, remediated findings and OAT sign-off | Human review gate |
| Ecuador route | Expedition lead + named local verifier | Signed route manifest, exact GPX hash, access and weather timestamps, bailout and emergency validation | In-country operational gate |
| Protected areas | Expedition lead | Written/current authority confirmation and date for each applicable protected area | In-country authority gate |
| Commercial providers | Producer | Executed quotes/agreements for motorcycle, lodging, guide and production services | Vendor gate |
| Rotary/community | Community lead | Named host, purpose, consent/release plan, project status and appointment confirmation | Community gate |

## Release invariants

1. The bundled seed route always remains `planningOnly`.
2. Operational guidance is enabled only by importing the exact verified GPX covered by the signed field manifest.
3. Apple Vision Pro remains stationary-only; iPhone/iPad own active rider navigation.
4. AI guide output never mutates route state, declares access open, or replaces weather, emergency, medical, park, police, or local-guide direction.
5. No OpenAI, Apple, App Store Connect, MapKit, NVIDIA, TLS, or signing secret is committed or shipped in client configuration.
6. Generated media is labeled and cannot be represented as documentary capture.
7. A red gate blocks release. An amber gate blocks public release but may permit a narrowly scoped internal test when the test owner documents the exception.

## Build evidence required for each release candidate

- immutable Git commit SHA;
- Xcode and Swift build versions;
- resolved package revisions;
- iPhone, iPad and visionOS build logs;
- accessibility `.xcresult`;
- static analyzer log;
- unsigned archive hashes from CI;
- signed archive hashes from the protected release environment;
- App Store Connect upload/delivery logs;
- privacy manifest report;
- SBOM and container image digest;
- deployment health/rollback result;
- exact GPX SHA-256 and signed field-verification manifest.

## Go/no-go rule

Public release requires every gate above to be complete. TestFlight internal testing may begin after the Xcode, identifier, WeatherKit, signing, privacy-manifest, baseline security and simulator-accessibility gates are complete. Field navigation remains disabled until the route, protected-area, provider and operational gates are independently complete.
