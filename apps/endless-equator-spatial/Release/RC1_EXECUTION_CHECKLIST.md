# Endless Equator RC1 execution checklist

**Release state:** `NO-GO` for public operational navigation until every mandatory evidence gate is satisfied.

This checklist converts the post-merge work into an auditable release-candidate sequence. A checked box requires an evidence record with an immutable hash, owner, timestamp, scope, result, and source location. Source completion alone cannot close a field, signing, privacy, security, or partner gate.

## RC1 identity

- Product: Endless Equator Spatial Navigator
- Targets: iPhone, iPadOS, Apple Vision Pro, WebKit/PWA, gateway, optional NVIDIA edge/rendering
- Release candidate: RC1
- Publishing entity: `NOT YET CONFIRMED`
- Final bundle identifiers: `NOT YET REGISTERED`
- Production gateway: `NOT YET DEPLOYED`
- Operational Ecuador GPX: `NOT YET VERIFIED`

## Gate A — source and reproducible build

- [ ] Main contains the reviewed PR merge commit.
- [ ] Xcode 27 workflow passes for iPhone build-for-testing.
- [ ] iPadOS support-console build passes.
- [ ] visionOS stationary route-room build passes.
- [ ] Static analyzer passes.
- [ ] Unsigned iOS archive passes.
- [ ] Unsigned visionOS archive passes.
- [ ] Gateway boundary tests pass.
- [ ] JavaScript CodeQL passes.
- [ ] Swift CodeQL passes.
- [ ] Spatial/server/data workflow passes.
- [ ] Build logs, Xcode/Swift versions, dependency revisions, and archive hashes are indexed.

## Gate B — Apple identity, capability, and signed artifacts

- [ ] Publishing legal entity and Apple Developer team are approved.
- [ ] Final iOS/iPadOS explicit App ID is registered.
- [ ] Final visionOS explicit App ID is registered.
- [ ] Matching App Store Connect records exist.
- [ ] WeatherKit is enabled only on targets that call it.
- [ ] Distribution profiles were regenerated after capability activation.
- [ ] Protected Xcode 27 signing runner is configured.
- [ ] iOS/iPadOS archive passes `codesign --verify --deep --strict`.
- [ ] visionOS archive passes `codesign --verify --deep --strict`.
- [ ] Embedded application and provisioning-profile entitlements match.
- [ ] Both builds process in App Store Connect and enter the approved internal TestFlight group.

## Gate C — physical Apple-device qualification

- [ ] Oldest supported iPhone passes the critical matrix.
- [ ] Current Pro iPhone passes the critical matrix and spatial-video workflow.
- [ ] Cellular iPad passes the support-console matrix.
- [ ] M-series iPad Pro passes the full console/WebKit/GPX matrix.
- [ ] Every Vision Pro hardware generation being deployed passes stationary-lock, spatial-room, WebKit, accessibility, and fallback tests.
- [ ] Representative helmet/intercom systems deliver one clear prompt at a time.
- [ ] Cellular, hotspot/private 5G, and Starlink paths pass degraded-network tests.
- [ ] Battery, thermal, low-power, nearly-full-storage, and endurance tests pass.
- [ ] No severity-1 or severity-2 defect remains open.

## Gate D — production HTTPS gateway

- [ ] Azure production environment and named owners are recorded.
- [ ] GitHub OIDC federation and least-privilege roles are approved.
- [ ] Key Vault contains rotated OpenAI and Apple Maps secrets.
- [ ] Immutable image is built and scanned.
- [ ] Container App uses HTTPS-only ingress, managed identity, health probes, autoscaling, and multiple revisions.
- [ ] Production hostname and certificate are valid.
- [ ] Exact native/WebKit and MapKit origins are allowlisted.
- [ ] Health, areas, route, guide fallback, CORS, CSP, token-origin, rate-limit, and redaction tests pass.
- [ ] Previous revision recovers 100-percent traffic during a rollback drill.
- [ ] Alerts, log retention, on-call routing, backup owner, and maintenance window are active.

## Gate E — current Ecuador route authorization

- [ ] Named Ecuador route verifier is contracted and identity-evidenced.
- [ ] Exact GPX is stored with SHA-256 and version.
- [ ] Every segment has current open/conditional status and evidence.
- [ ] Access and segment checks are no older than the approved freshness window.
- [ ] Weather check is current for the stage.
- [ ] Support-vehicle access and bailout points are confirmed.
- [ ] Protected-area boundary and permission determinations are written and current.
- [ ] Landowner/community permissions are written where required.
- [ ] Fuel, communications, medical, recovery, nightfall, bridge, landslide, river, volcanic, construction, and security constraints are recorded.
- [ ] Rider acknowledgement follows route verification.
- [ ] Independent `GO`, `CONDITIONAL_GO`, or `NO_GO` decision is signed.
- [ ] App-imported GPX hash exactly matches the approved manifest.

## Gate F — privacy, accessibility, and App Store package

- [ ] Production data-flow inventory matches the final binary, gateway, SDKs, analytics, logs, and contracts.
- [ ] Privacy manifest and required-reason API review pass.
- [ ] App Store privacy answers and public privacy policy match actual processing.
- [ ] Retention, deletion, access, correction, consent withdrawal, and incident procedures are approved.
- [ ] VoiceOver and equivalent non-map navigation paths pass.
- [ ] Dynamic Type, contrast, noncolor status, Reduce Motion, Voice/Switch/keyboard input, captions, and cognitive-accessibility checks pass.
- [ ] Vision Pro provides a complete two-dimensional alternative and never exposes an in-motion riding HUD.
- [ ] Reviewer notes explain planning-only data, exact-GPX authorization, Location, WeatherKit, nearby sync, WebKit, OpenAI advisory output, and stationary Vision Pro use.

## Gate G — independent security and operational acceptance

- [ ] Independent mobile static/dynamic assessment is complete.
- [ ] Independent gateway/PWA/API assessment is complete.
- [ ] Azure identity, Key Vault, ACR, revision, and rollback permissions are reviewed.
- [ ] Jetson/CloudXR assessment is complete when those components are deployed.
- [ ] All critical/high findings are remediated and retested.
- [ ] Medium findings are remediated or covered by a time-limited approved exception.
- [ ] Controlled route rehearsal passes GPS/network/weather/AI/peer/CloudXR failure drills.
- [ ] Road closure, manual no-go, rider separation, disabled motorcycle, medical evacuation, severe weather, lost device, compromised key, provider cancellation, and consent-withdrawal exercises pass.
- [ ] Product, accessibility, privacy, security, operations, safety, and expedition leads sign the acceptance record.

## Gate H — written Ecuador provider and partner confirmations

- [ ] Local guide and exact-route verifier.
- [ ] Motorcycle fleet, mechanic, insurance, spares, replacement, and recovery.
- [ ] Pifo/Quito lodging and secure storage.
- [ ] Papallacta lodging and recovery support.
- [ ] Baños technical-stage base.
- [ ] Chugchilán/Quilotoa lodging.
- [ ] Machachi lodging/final regroup.
- [ ] Actual Quito, Tena/Baños, and Manta Rotary/community hosts only where a real project visit is agreed.
- [ ] Cayambe-Coca, Cotopaxi, and any other responsible protected-area authority.
- [ ] Ingapirca/cultural authority when included.
- [ ] Pacific surf and water-safety guide when included.
- [ ] Medical/evacuation provider.
- [ ] Insured 4x4 recovery/support provider.
- [ ] Ecuador production fixer/permit lead.
- [ ] Proven immersive/spatial production provider—or professional immersive capture is removed from scope.

## Final decision

RC1 may enter internal TestFlight after Gates A and B are complete. It may enter controlled physical field rehearsal after Gates A–D and the practice-route subset of Gates E–G are complete. It may provide operational Ecuador guidance only after **all applicable gates** are complete and the exact, unexpired route manifest records `GO` or `CONDITIONAL_GO`.
