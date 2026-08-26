# Security and privacy

## Nonnegotiable controls

- No OpenAI, Apple Maps, CloudXR, or Jetson credential is embedded in Swift, JavaScript or a shipped app bundle.
- Server requests use allowlisted origins, short timeouts, body-size limits and a basic rate limiter.
- OpenAI requests set `store: false` and omit exact location by default.
- MapKit JS tokens are short-lived, ES256-signed, `mapkit_js` scoped and origin-limited.
- Nearby Apple-device sync requires encrypted Multipeer Connectivity sessions and explicit peer selection.
- No raw gaze collection, unrestricted camera upload or background microphone capture.
- Camera/media analysis is opt-in and selects individual assets; it never auto-sends a photo library.
- Logs redact authorization headers, private keys, location histories and user free text.

## Threat model

| Threat | Control |
|---|---|
| Stolen client bundle | Contains no service secret |
| Malicious web origin | Server origin allowlist and origin-bound Maps token |
| Prompt injection in POI text | Canonical fields separated from user text; strict output schema; AI cannot mutate route |
| Stale/false trail access | Operational mode requires signed/verified manifest and timestamps |
| Moving-headset distraction | visionOS spatial route gate locks on motion/uncertain state |
| Lost connectivity | route, AOIs and maneuver queue are local resources |
| Edge device compromise | mTLS/private LAN recommended; encrypted NVMe; minimum telemetry |

## Production hardening still required

- Replace in-memory rate limits with a shared service.
- Add identity and role-based authorization for team deployments.
- Sign route bundles and verify signatures in Secure Enclave-backed key material.
- Add certificate pinning only after an operational rotation plan exists.
- Complete Apple privacy manifests, App Store disclosures and penetration testing.
