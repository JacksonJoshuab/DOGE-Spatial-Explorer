# Ecuador GPX, access, and protected-area verification

## Operational rule

The bundled route and all generated map graphics are **planning references only**. The operational app accepts only an exact GPX file paired with a manifest that passes `Verification/verify-operational-route.mjs`.

No social post, old GPX, commercial itinerary, AI answer, tourism article, or map pin is sufficient evidence that a trail, road, bridge, park, private property, river crossing, or filming location is open.

## Verification roles

- **Route verifier:** Ecuador-based guide or operator with current local knowledge and authority to inspect/confirm the route.
- **Access verifier:** protected-area authority, landowner, road authority, municipality, or other party controlling the segment.
- **Weather/incident verifier:** designated operations lead using current official notices and direct field reports.
- **Go/no-go authority:** named expedition lead who is independent from the person pressuring the schedule or production outcome.

## Required source hierarchy

Use the strongest available evidence in this order:

1. posted closure, police, emergency-management, road-authority, protected-area, or landowner direction at the location;
2. current written notice from the responsible Ecuador authority;
3. same-day physical inspection by the authorized local route verifier;
4. current direct confirmation from the responsible municipality/community/landowner;
5. commercial operator report with timestamp and named reporter;
6. public mapping/community data only as a lead requiring verification.

Conflicts are resolved in favor of the more restrictive source.

## Verification package

The private evidence record must include:

- final GPX filename and SHA-256 hash;
- route version and date;
- named verifier, organization, role, and confirmed contact;
- exact segment ledger from Pifo through each overnight/support base and back;
- optional Pacific extension as a separate route, not an implied continuation;
- road/highway references and exact secondary-road/trail geometry;
- open, conditional, closed, or unknown status for each segment;
- support-vehicle access and bailout coordinates;
- current bridge, landslide, construction, river, volcanic, weather, and security conditions;
- protected-area boundary determination and written access/filming decision;
- landowner/community permission where required;
- fuel, medical, recovery, communications, and nightfall constraints;
- evidence references rather than private documents committed to Git;
- go/no-go decision, decision maker, timestamp, and conditions.

## Freshness rules

The validator enforces these maximum ages unless operations adopts a stricter standard:

- access and segment checks: 72 hours;
- weather check: 24 hours;
- manifest expiration: explicit and in the future;
- rider acknowledgement: after route verification;
- protected-area and landowner approval: valid for the exact date, people, vehicles, activity, and filming scope.

Conditions with faster change potential—landslides, volcanic alerts, river crossings, public-order events, wildfire, severe rain, or an active closure—must be checked again immediately before the affected stage.

## Protected areas

For Cayambe-Coca, Cotopaxi, and any other protected area or buffer-zone segment:

- load official boundary data into the support console;
- determine whether the GPX is inside, adjacent to, or outside the controlled area;
- obtain the responsible authority's current motorcycle, group, guide, access-time, and commercial-filming determination;
- record permit/not-required evidence in the manifest;
- keep an external legal public-road bailout;
- stop and comply with on-site staff even if the manifest says open.

## Rotary and community visits

Rotary pins indicate a possible coordination area, not a confirmed project. A visit is enabled only when the tracker contains:

- named club/district host;
- meeting location and time;
- project owner and beneficiary organization;
- requested expedition role;
- consent and filming status;
- donation/data-ownership/support plan, when technology is involved;
- cancellation and safeguarding contact.

## Pre-stage execution

1. Verify the GPX hash on the support iPad and rider iPhone.
2. Run:

```bash
node Verification/verify-operational-route.mjs \
  Verification/<route-manifest>.json \
  Verification/<exact-route>.gpx
```

3. Confirm the output contains `"valid": true` and retain it with the stage evidence.
4. Review official notices, local guide report, WeatherKit/forecast context, and support-vehicle access.
5. Conduct the rider briefing and record acknowledgement.
6. Begin only after the named go/no-go authority records `GO` or `CONDITIONAL_GO`.
7. Suspend the route immediately when a higher-authority source or field condition conflicts with the manifest.

## Release acceptance

The public app may ship with planning data, but **operational guidance and any claim that the route is currently rideable remain blocked** until a fresh validated package exists for the actual expedition dates.
