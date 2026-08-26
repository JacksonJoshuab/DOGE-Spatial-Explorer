# Physical iPhone, iPad, and Apple Vision Pro test plan

## Device matrix

Test the shipping build, not only a debug build. Record model, OS build, app build, battery health, storage, carrier, accessories, and test operator.

| Device class | Minimum required coverage | Primary role |
|---|---|---|
| Oldest iPhone supported by the final iOS 27 deployment target, including the user's iPhone 12 Pro when OS-compatible | one device | performance floor, voice/haptic navigation, offline use |
| Current Pro iPhone with spatial-video capture | one device | rider companion and consent-forward spatial capture |
| Cellular iPad mini or standard iPad | one device | compact support-console workflow |
| M-series iPad Pro | one device | full support console, WebKit research, GPX verification |
| Apple Vision Pro used by the expedition | every hardware generation deployed | stationary route room, nearby sync, WebKit, accessibility |
| Paired Bluetooth helmet/intercom system | at least two representative models | clear, nonoverlapping spoken guidance |
| Support-vehicle hotspot/private 5G/Starlink path | each deployed network path | gateway and synchronization behavior |

## Critical scenarios

### Installation and identity

- clean install from TestFlight;
- upgrade from the previous internal build;
- correct display name, bundle ID, version, privacy manifest, entitlements, and server URL;
- revoked/expired profile negative test in a disposable nonproduction build;
- no secret or private key in the app bundle or logs.

### Location and route

- Location denied, limited, granted, and changed in Settings;
- poor GPS accuracy, tunnel, urban canyon, mountain valley, and recovered signal;
- route preview remains locked from operational mode;
- verified GPX import with exact hash and manifest;
- maneuver progression at walking speed and controlled vehicle speed;
- missed turn and 150-meter off-route warning;
- app never invents an alternate trail;
- stale route/access/weather manifest blocks operational launch;
- device clock and time-zone changes do not make stale evidence appear current.

### Voice, haptics, and rider ergonomics

- one spoken prompt at a time; stale prompt is cancelled;
- Bluetooth, device speaker, and muted output;
- volume audible over engine/wind in a controlled test environment;
- haptics distinguish turn advance from off-route warning;
- large text remains readable in sun, rain cover, gloves, and dark mode;
- no interaction is required while the motorcycle is moving.

### Offline and degraded networks

- airplane mode after route/AOI download;
- cellular-only, slow network, packet loss, and gateway timeout;
- MapKit unavailable while local route remains usable;
- WeatherKit unavailable with timestamped fallback messaging;
- OpenAI unavailable with deterministic local guide fallback;
- nearby peer loss/reconnect;
- no duplicate or stale maneuver after reconnect.

### iPadOS support console

- split-view and full-screen layouts;
- GPX import from Files, AirDrop, external drive, and managed storage;
- route verification fields and evidence link handling;
- rider sync and stale-data indication;
- WebKit host allowlist and blocked external navigation;
- keyboard, pointer, touch, and VoiceOver operation.

### Apple Vision Pro

- mixed-reality route room is locked during motion, uncertain location, or absent stationary acknowledgement;
- route room unlocks only from a safe stationary briefing location;
- synced maneuver is clearly labeled as companion data, not an independent route command;
- hand/eye interaction, VoiceOver, Reduce Motion, window scaling, and seated/standing use;
- WebKit environment and route table work without CloudXR;
- CloudXR loss returns to native RealityKit without affecting rider navigation;
- no in-motion motorcycle HUD workflow is exposed.

### WeatherKit

- signed physical-device request for each device target using WeatherKit;
- correct observation timestamp, units, language, and source attribution;
- error, timeout, rate-limit, and offline states;
- weather never declares a road, park, trail, or river crossing safe.

### Battery, thermal, storage, and endurance

- four-hour navigation soak;
- eight-hour support-console soak;
- one-hour Vision Pro route-room session;
- charging while navigating;
- high ambient heat and cold-start simulation within manufacturer limits;
- low-power mode and 10-percent battery behavior;
- storage nearly full;
- media capture does not starve navigation or logs.

### Emergency and privacy

- emergency card available offline;
- consent and media-capture status visible to the support team;
- no raw gaze, background microphone, unrestricted camera, or photo-library upload;
- logs redact authorization headers, exact location history, and user free text;
- local peer pairing requires in-person name confirmation.

## Pass/fail rule

Any false route/access state, missing motion lock, credential disclosure, crash during active navigation, or inaccessible emergency control is severity 1 and stops release. Any broken offline route, voice/haptic path, GPX verification gate, or WeatherKit entitlement is severity 2 and blocks release.
