# Ecuador Outage Resilience — Phase 3

Status: implementation contract  
Scope: `apps/endless-equator-spatial` and the Ecuador Spatial Intelligence Atlas  
Evidence cut: 2026-08-27T12:40:05Z

## Objective

Advance the outage workspace from a source registry and city evidence heat map into a governed dependency and recovery system without implying that public-source coverage is a live outage feed.

## Non-negotiable evidence rules

1. `UNKNOWN` is not zero, healthy or restored.
2. Restoration, root-cause review and validated closeout remain separate gates.
3. A BGP return, valve opening, scheduled end or operator statement is not independently verified service recovery.
4. Brand diversity is not physical path diversity.
5. Source count never increases outage heat.
6. A heat kernel around a city point is not an outage polygon.
7. Incident overlays remain `CORRELATED` unless accountable primary evidence establishes causation.
8. The production snapshot must state its retrieval time and connector state.

## First-dependency acceptance bundle

A selected location cannot be used for operational outage attribution until the applicable artifacts are retained:

- authorized site identity and operating boundary;
- meter, feeder and current electrical one-line;
- UPS, ATS, generator, load and tested autonomy;
- carrier contract, circuit ID and demarcation inventory;
- entrance, duct, handhole, riser and ODF path;
- serving node, PoP, upstream and shared-risk group;
- field telemetry with a common UTC clock;
- service denominator and affected geometry;
- restoration measurement independent from RCA;
- corrective-action validation and reviewer decision.

## Selected-location blockers

| Location | Current gate |
|---|---|
| La Carolina focal point | Exact occupied sub-site, meter, feeder, circuit and demarcation are unresolved. |
| CCI–La Carolina district | Assume common building power, entrance and riser until disproved. |
| Ibarra / UTN | The 3 Aug 2026 AS271821 transition is control-plane evidence, not customer impact or physical cause. |
| Inta-Kara | Dispatch and recovery timing are blocked until the site pin, operator and access route are authorized. |
| Intag–Cotacachi | Localize by parish, feeder/tower, provider and UTC time before aggregating impact. |

## Monitoring readiness

| Capability | State | Acceptance evidence |
|---|---|---|
| Public source registry | Registered | 107 unique surfaces with domain, role, grain, ceiling and heat eligibility |
| Scheduled public checks | Not connected | Run ledger, retrieval timestamp, HTTP/result state, content hash and bounded retry |
| Authenticated provider records | Gated | Authorized account or contract plus retained ticket/NOC/circuit artifact |
| Field telemetry | Not connected | Meter/UPS/optical/RF/application observations tied to a verified site |
| Recovery normalization | Registered | Service, routing, work and censored clocks remain separate |
| Root-event stitching | Partial | Shared event ID plus aligned clock, geometry and denominator |
| Alerting | Blocked | Alerts must reference a qualifying event, uncertainty and next verification action |

## Recovery clock contract

Each incident record must preserve:

- `detected_at_utc`
- `impact_start_at_utc` or explicit unknown
- `work_start_at_utc` when applicable
- `service_restored_at_utc` or a right-censored bound
- `root_cause_decided_at_utc`
- `corrective_action_validated_at_utc`
- clock source and uncertainty
- evidence grade `R0`–`R3`
- service denominator and geometry
- root-event ID and service-effect ID
- source URL/artifact hash
- claim ceiling

National or cross-provider MTTR remains suppressed until a comparable cohort has aligned clock definitions, denominators and independently verified R2/R3 service restoration.

## Release acceptance

- TypeScript and lint pass.
- Contract tests assert the Dependencies workspace and static/live boundary.
- Production build completes.
- No active outage claim is introduced.
- No unresolved dependency is promoted by proximity, branding or a later network event.
- The Atlas and this GitHub contract retain the same restoration/RCA separation.
