# Endless Equator Spatial Navigator

Apple-first, local-first expedition navigation for the Ecuador **Endless Equator** enduro route.

This folder contains a reusable Swift package, copy-ready iOS/iPadOS and visionOS app entry points, a framework-free WebKit/PWA operations environment, a server-side OpenAI/MapKit token gateway, and optional NVIDIA CloudXR/Jetson adapters.

## Safety boundary

- **iPhone/iPad are the riding interfaces.** They own location, turn prompts, haptics, voice, off-route detection, emergency cards, and GPX verification.
- **Apple Vision Pro is stationary-only.** The mixed-reality route room is locked when reported speed exceeds the stationary threshold or location quality is uncertain.
- The bundled route is a **planning preview**, not an operational trail authorization. Import a locally verified GPX file and attach verification metadata before enabling operational guidance.
- The app never treats AI output as road-access, medical, weather, or emergency authority.

## Targets

| Target | Role |
|---|---|
| iOS | Rider turn-by-turn, offline route, voice, haptics, safety and capture notes |
| iPadOS | Support-vehicle console, route verification, rider status, area research |
| visionOS | Stationary mixed-reality route table, area-of-interest rooms and team briefing |
| WebKit/PWA | Data-driven environment for every area of interest, route ledger and operations desk |
| Server | Keeps OpenAI and Apple Maps credentials off clients; serves canonical route/AOI data |
| NVIDIA | Optional CloudXR remote rendering and Jetson edge hazard/media analysis |

## Quick start

### Swift package

1. Open Xcode 27 or newer.
2. Add `apps/endless-equator-spatial` as a local Swift package.
3. Create iOS/iPadOS and visionOS app targets.
4. Copy the relevant file from `AppTemplates/` into each target.
5. Add the `EndlessEquatorServerURL` Info.plist key for physical devices (for example, an HTTPS deployment or a trusted LAN gateway); the simulator defaults to `http://localhost:8787`.
6. Add capabilities only as needed: Maps, Location, WeatherKit, Background Modes, and Local Network.

The package requires Swift 6.4 and targets iOS/iPadOS 27 and visionOS 27.

### Web/server

```bash
cd apps/endless-equator-spatial/Server
cp .env.example .env
node server.mjs
```

Open `http://localhost:8787`. The web app remains useful without MapKit JS authorization by falling back to its offline route schematic.

### Credentials

Never place keys in an app bundle, JavaScript file, Git commit, or client log.

- `OPENAI_API_KEY` is read only by the server gateway.
- Apple Maps private keys remain on the server and generate short-lived, origin-limited `mapkit_js` tokens.
- NVIDIA CloudXR credentials and Jetson endpoints are deployment configuration, not source constants.

## Route verification contract

Operational navigation requires all of the following:

- imported GPX or signed route bundle;
- `verificationState == verified`;
- nonempty verifier name;
- trail/access check timestamp;
- weather check timestamp;
- explicit rider acknowledgement.

The seed route and commercial/community pins deliberately remain labeled with their source confidence.

## Primary platform references

- Apple MapKit, Core Location, WeatherKit, RealityKit, WebKit and MapKit JS documentation
- OpenAI Responses API with Structured Outputs and `store: false`
- NVIDIA CloudXR Framework 6.2 for Apple platforms

See `ARCHITECTURE.md`, `SECURITY.md`, and `AGENTS.md` for implementation contracts.
