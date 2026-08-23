# Penetration and operational acceptance test plan

Automated checks reduce obvious defects; they do not replace an independent penetration test or a field acceptance exercise.

## Test environments

- **CI:** no production secrets, deterministic fallback AI, synthetic route data.
- **Staging:** production-equivalent Azure architecture, separate Key Vault and service keys, no real participant data.
- **Field rehearsal:** signed TestFlight builds, verified nonoperational practice GPX, actual devices/network/support vehicle.
- **Production:** accessed only after staging and field gates pass.

## Penetration scope

### Native apps

- bundle/resource secret extraction;
- entitlement and provisioning-profile review;
- local storage and backup behavior;
- GPX/manifest tampering and path/file-size abuse;
- URL scheme/universal-link handling if added;
- WebKit navigation and message-handler abuse;
- Local Network/Bonjour discovery and peer spoofing;
- Multipeer session invitation abuse, replay, stale packet, malformed packet, and denial of service;
- log and crash-report leakage;
- device lock, lost device, reinstall, restore, and backup scenarios;
- accessibility as a security control for critical confirmations.

### Gateway and PWA

- TLS, HSTS, CORS, CSP, cache, cookie, and security headers;
- origin-bypass attempts against MapKit token issuance;
- authentication/authorization controls when team identity is added;
- body-size, rate-limit, timeout, malformed JSON, method, and path traversal tests;
- prompt injection and untrusted AOI/user-text separation;
- strict output-schema bypass attempts;
- OpenAI/Apple/Azure error redaction;
- Key Vault reference, managed identity, ACR pull, and deployment identity privilege review;
- log injection, free-text leakage, and precise-location leakage;
- denial of service and replica-scaling behavior;
- old revision and rollback security;
- dependency, container, IaC, and source analysis.

### NVIDIA edge and CloudXR

- Jetson local API authentication and mTLS/private-network enforcement;
- explicit-frame-only media boundary;
- payload size and decompression abuse;
- encrypted NVMe, boot integrity, update, and lost-device handling;
- CloudXR credential, session, network downgrade, and failure/fallback testing;
- proof that NVIDIA loss cannot remove rider navigation or safety information.

## Minimum security tools/evidence

- GitHub CodeQL results for JavaScript/TypeScript and Swift;
- gateway abuse test output from `Security/pentest-smoke.mjs`;
- successful nonroot container build/run;
- Bicep validation and Azure configuration export;
- dependency and container vulnerability reports;
- mobile application static/dynamic assessment by an independent tester;
- API/PWA dynamic assessment against staging;
- remediation retest report;
- signed exception record for any accepted low/medium issue.

## Severity and release rule

- Critical/high findings block release.
- Medium findings require remediation or a time-limited, owner-approved exception with compensating control.
- Low/informational findings are tracked with owner and target date.
- No exception may authorize false route/access information, credential exposure, broken motion lock, inaccessible emergency controls, or bypass of the verified-GPX gate.

## Operational acceptance scenarios

### Mission preparation

- team roles, contact tree, device assignments, inventory, serial numbers, and insurance recorded;
- final GPX hash and manifest independently verified on iPhone and iPad;
- official access, weather, security, medical, fuel, and lodging checks current;
- participant consent/release and safeguarding status recorded without exposing private records in Git;
- emergency, evacuation, recovery, and communications plans briefed;
- support vehicle can reach every required regroup or documented alternative.

### Controlled route rehearsal

- start planning-only build and confirm operational guidance is locked;
- import a verified practice GPX and unlock only after every manifest control is satisfied;
- execute turns, missed turn, off-route, pause, resume, and route end;
- lose/recover GPS, cellular, gateway, WeatherKit, OpenAI, peer sync, and CloudXR;
- verify one voice at a time over actual helmet/intercom hardware;
- verify iPad support position and stale-data indications;
- verify Vision Pro remains stationary-only;
- simulate road closure and prove the app cannot invent a detour;
- exercise manual suspension and no-go decision.

### Incident exercises

- rider separated from group;
- motorcycle disabled;
- medical event requiring evacuation;
- severe rain/landslide or volcanic/park closure;
- stolen/lost phone or iPad;
- gateway/key compromise;
- media consent withdrawal;
- local host/provider cancellation;
- unavailable hotel, fuel, or support vehicle;
- device overheating, low battery, or storage exhaustion.

### Recovery and continuity

- restore from offline route data;
- swap to spare iPhone/iPad;
- revoke a lost device and rotate affected credentials;
- roll gateway traffic back to the prior revision;
- rotate OpenAI and Apple Maps credentials without a client rebuild;
- preserve required incident evidence while honoring privacy and deletion obligations.

## Acceptance record

The final OAT record identifies:

- build number and archive hash;
- device/OS/network inventory;
- route/manifest hash;
- test operators and witnesses;
- each scenario result and evidence reference;
- defects and severity;
- accepted exceptions;
- independent security result;
- operations, product, safety, security, and expedition-lead signatures;
- final `GO`, `CONDITIONAL_GO`, or `NO_GO` decision.

A successful lab rehearsal does not authorize the Ecuador route. The final route manifest and partner/access confirmations remain separate mandatory gates.
