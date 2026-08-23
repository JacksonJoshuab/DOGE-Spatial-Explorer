# App Store Privacy and Accessibility Review

## Data inventory

The release owner must validate the final binary and server deployment against this intended behavior:

| Data | Purpose | Default handling |
|---|---|---|
| Precise location | On-device route progress, off-route detection, weather request and stationary gate | On device; not retained by gateway by default |
| Heading/speed/accuracy | Navigation and Vision Pro safety gate | On device; nearby packet only when explicitly paired |
| GPX route | Verified navigation | Local import; export only by user action |
| Nearby peer name/code | Device pairing | Local network; pairing code is never logged |
| AI question and minimal AOI context | Advisory guide response | Server request with `store: false`; no exact location by default |
| Weather coordinates | WeatherKit request | Sent to Apple WeatherKit under Apple terms |
| Selected camera frame | Optional Jetson analysis | Explicit asset selection only; no automatic library upload |

Any analytics, crash reporter, push service, account system or cloud route history added later must reopen the privacy review.

## Privacy manifest

Before submission:

1. Generate a privacy report from the final signed archives.
2. Inspect dependency manifests and required-reason API declarations.
3. Replace the current minimal `PrivacyInfo.xcprivacy` only when the final API/dependency report identifies required declarations.
4. Verify that App Store Connect privacy answers match actual client, server, OpenAI, WeatherKit, MapKit and NVIDIA handling.
5. Publish a privacy policy that names service providers, retention, deletion, consent and contact processes.

## Accessibility evidence

Automated CI audits cover action, contrast, Dynamic Type, hit region, element descriptions and clipped text on the iPhone simulator. Physical-device review must additionally cover:

- VoiceOver reading and focus order;
- Voice Control names;
- Larger Text and accessibility XXXL;
- Increase Contrast, Differentiate Without Color and color filters;
- Reduce Motion;
- hearing-independent alerts through text/haptics;
- switch/pointer/keyboard navigation on iPad;
- supported visionOS accessibility controls;
- Spanish labels and pronunciation.

## App Store accessibility support labels

Only claim an accessibility feature after the physical-device matrix proves the feature works across the app’s primary tasks. Store screenshots, test videos and issue references supporting every claimed label.

## Review notes

App Review notes must clearly state:

- the seed route is a planning preview;
- operational navigation requires an independently verified GPX manifest;
- Vision Pro is stationary-only;
- the AI guide is advisory and cannot change route state;
- account credentials are not required unless a later release adds accounts;
- a deterministic fallback works when the AI gateway is unavailable.
