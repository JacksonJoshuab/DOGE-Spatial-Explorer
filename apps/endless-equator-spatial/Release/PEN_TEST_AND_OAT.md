# Penetration Test and Operational Acceptance Test

## Scope

- iOS/iPadOS and visionOS binaries;
- WebKit/PWA origin;
- HTTPS gateway and MapKit token endpoint;
- OpenAI guide endpoint;
- Bonjour/NWConnection companion sync;
- GPX importer and route-verification manifest;
- optional Jetson and CloudXR paths;
- CI signing and release environment.

## Security test cases

### Client and route integrity

- modify route JSON, GPX and manifest independently and verify hash/signature rejection;
- import malformed, oversized and hostile XML/GPX;
- verify path traversal and external-navigation rejection in WebKit;
- inspect app bundle for secrets, private keys and production tokens;
- verify logs omit exact location history, pairing codes and authorization headers.

### Nearby sync

- connect with wrong pairing code;
- replay, truncate, reorder and corrupt encrypted frames;
- attempt unauthenticated incoming connection outside the pairing window;
- verify frame-size limits and connection cleanup;
- verify peer display names are untrusted text, not authorization.

### Gateway/API

- origin bypass, CORS, CSP and host-header tests;
- rate-limit and oversized-body tests;
- JSON-schema and content-type fuzzing;
- prompt injection in AOI/user text;
- SSRF, path traversal and static-file fallback tests;
- OpenAI outage/timeout/invalid JSON fallback;
- MapKit token origin, lifetime and key-rotation tests;
- dependency, container and SBOM review.

### Privacy

- deny all permissions and confirm graceful behavior;
- packet capture to verify TLS and absence of exact location in AI requests;
- verify WeatherKit and MapKit calls match disclosed purposes;
- verify selected-frame Jetson upload is opt-in.

## Operational acceptance drills

- rollback gateway to previous image digest;
- rotate every service key without client update;
- expire a Maps token and recover;
- revoke an App Store Connect key;
- lose cellular/Starlink during route use;
- lose rider/support pairing and reconnect;
- mark a route closed after GPX import and verify operational lockout process;
- incident escalation, evidence retention and post-trip data deletion.

## Severity and exit

- **S1:** safety bypass, route-integrity compromise, remote code execution or secret disclosure — blocks all testing.
- **S2:** authentication/privacy failure, persistent crash, unusable emergency/offline path — blocks external TestFlight and field use.
- **S3:** degraded noncritical function with workaround — requires owner and scheduled fix.
- **S4:** cosmetic/documentation issue — may be accepted with written rationale.

Release requires zero open S1/S2 issues, documented disposition of S3/S4 issues, an independent tester, and signed OAT evidence tied to the release commit and deployment digest.
