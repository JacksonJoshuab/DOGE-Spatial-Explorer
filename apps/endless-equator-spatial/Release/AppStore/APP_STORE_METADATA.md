# Endless Equator — App Store Connect metadata draft

This package is a drafting aid for the final signed binary. Publishing legal entity, URLs, bundle identifiers, age rating, category, territories, pricing, screenshots, privacy answers, export compliance, and review-contact details must be verified in App Store Connect.

## Product identity

| Field | Draft |
|---|---|
| App name | Endless Equator |
| visionOS display name | Endless Equator Spatial |
| Subtitle | Verified expedition planning |
| Primary category | Navigation |
| Secondary category | Travel |
| Copyright | © 2026 publishing legal entity — `NOT YET CONFIRMED` |
| SKU | `ENDLESS-EQUATOR-RC1` |
| iOS/iPadOS bundle ID | Proposed `com.gonzosocialclub.endlessequator`; not registered until evidenced |
| visionOS bundle ID | Proposed `com.gonzosocialclub.endlessequator.spatial`; not registered until evidenced |

## Promotional text

Plan and brief a supported Ecuador expedition across the Andes, Amazon foothills, community stops, and Pacific coast—while keeping live route, access, weather, and partner verification separate from AI narration.

## Short description

Endless Equator is a local-first expedition planning and support system for iPhone, iPad, and Apple Vision Pro. Review areas of interest, highway corridors, seasonal weather context, support notes, community protocols, and a locally verified GPX route. Active riding guidance stays on iPhone; Vision Pro is a stationary briefing environment.

## Full description

**Plan the expedition. Verify the route. Stop safely before interacting.**

Endless Equator brings an Ecuador motorcycle expedition into one Apple-first workspace:

- iPhone turn prompts, voice, haptics, route progress, off-route warnings, and offline planning data;
- iPad support-console views for GPX verification, rider status, weather context, areas of interest, and operational records;
- a stationary Apple Vision Pro route room for team briefings and spatial review;
- WebKit area environments for volcanoes, hot springs, jungle stages, crater landscapes, cultural sites, community coordination, lodging, support, and Pacific surf extensions;
- optional advisory AI summaries that are structurally separated from verified route and access truth.

The bundled Ecuador line is a planning preview. Operational guidance remains locked until an exact GPX is paired with a named verifier, current access and weather checks, rider acknowledgement, and the required permission records. Posted signs, closures, police, emergency services, protected-area staff, landowners, and authorized local direction always override the app.

Apple Vision Pro is not used as an in-motion motorcycle display. The spatial route room is intended for seated or stationary briefings. Core navigation continues locally even when the AI guide, MapKit JS environment, WeatherKit request, production gateway, or optional NVIDIA rendering service is unavailable.

Endless Equator does not replace a licensed guide, emergency services, medical advice, protected-area authority, landowner permission, a weather warning, or professional judgment.

## Keywords draft

Ecuador, expedition, enduro, motorcycle, GPX, route, navigation, Andes, volcano, support, Vision Pro, spatial, offline, travel

Do not add competitor names, camera brands, Rotary, protected-area names, or provider names as keywords without rights and relevance review.

## Version 0.1 release notes

- Local-first Ecuador route and area planning
- Verified-GPX operational lock
- iPhone voice, haptic, progress, and off-route guidance
- iPad support console and nearby-device synchronization
- Stationary Apple Vision Pro route briefing room
- September and October planning context
- WebKit area environments
- Advisory AI guide with deterministic offline fallback
- Production, privacy, consent, and route-verification safeguards

## App Review notes draft

### Purpose

The application is a supported-expedition planning and team-briefing tool. The seed route is intentionally marked planning-only. Reviewers do not need to travel or simulate movement to inspect the principal features.

### Suggested review path

1. Launch the iPhone/iPadOS app.
2. Observe the `PLANNING PREVIEW` status and locked operational guidance.
3. Open the route-verification screen to see the named-verifier, access, weather, and rider-acknowledgement requirements.
4. Select areas of interest to review safety notes, highway references, seasonal context, and the embedded WebKit environment.
5. Deny Location and confirm the app remains usable for planning.
6. Disconnect networking and confirm bundled route/area data and deterministic guide fallback remain available.
7. On iPad, inspect the support-console layout and encrypted nearby-pairing screen.
8. On Vision Pro, inspect the windowed briefing dashboard. The immersive route room is deliberately locked until the user acknowledges being safely stationary and the motion-safety state permits it.

### Location

Location supports route progress, heading where available, distance to maneuver, off-route warnings, area weather context, and the stationary safety gate. Precise location is not sent to the OpenAI guide by default, and the product does not automatically maintain a cloud location history.

### Local Network and nearby devices

Local Network and Bonjour permissions support explicitly paired, encrypted Multipeer Connectivity sessions among the rider phone, support iPad, and stationary Vision Pro briefing app. Incoming invitations are accepted only during a user-opened pairing window, and the team confirms peer names in person.

### WeatherKit

WeatherKit provides timestamped conditions and forecast context. Weather never declares a road, trail, park, bridge, river crossing, or route safe.

### AI guide

The optional server-side guide returns a strict structured response and uses `store: false`. It cannot change route state or assert that access is open. When the gateway/model is unavailable, the application provides a deterministic local safety-first card instead.

### WebKit

The embedded browser is restricted to the configured expedition gateway host; it is not a general-purpose browser.

### Vision Pro safety

There is no in-motion motorcycle HUD. Vision Pro is a stationary team-planning surface. Active turn-by-turn guidance remains on the iPhone/iPad path.

### Demo data

All bundled Ecuador route geometry and provider/community pins are planning data with visible confidence/verification labels. No live provider appointment, park permission, Rotary project, hotel rate, rental inventory, or operational trail access is represented as confirmed in the review build.

## URLs requiring final deployment

- Privacy policy: `NOT YET DEPLOYED`
- Support: `NOT YET DEPLOYED`
- Marketing: `NOT YET DEPLOYED`
- Terms/expedition disclaimer: `NOT YET DEPLOYED`

These URLs must use HTTPS, match the final legal entity and data flows, and remain available throughout review and distribution.

## Screenshot and preview set

### iPhone

1. Planning-preview map and next-turn card
2. Route-verification lock
3. Area safety/weather environment
4. Offline/fallback state
5. Nearby pairing and privacy controls

### iPadOS

1. Three-column support console
2. GPX import and verification manifest
3. Selected area with WebKit environment
4. Rider sync and stale-data state
5. Accessibility text-size example

### visionOS

1. Windowed expedition dashboard
2. Stationary safety acknowledgement
3. Mixed-reality route table
4. Area-of-interest briefing
5. Native fallback without CloudXR

Every screenshot must come from the exact candidate build, contain no private participant/provider information, and clearly label planning versus verified information.
