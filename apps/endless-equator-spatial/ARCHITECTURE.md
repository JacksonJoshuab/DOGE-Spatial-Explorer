# Architecture

```text
                        ┌───────────────────────────────┐
                        │ Canonical expedition bundle  │
                        │ AOIs + route + verification  │
                        └──────────────┬────────────────┘
                                       │
             ┌─────────────────────────┼──────────────────────────┐
             │                         │                          │
   ┌─────────▼─────────┐     ┌────────▼─────────┐      ┌────────▼─────────┐
   │ iPhone / iPadOS   │     │ Apple Vision Pro │      │ WebKit / PWA     │
   │ MapKit + Location │     │ RealityKit table │      │ MapKit JS 6      │
   │ voice + haptics   │     │ stationary gate  │      │ offline fallback │
   └─────────┬─────────┘     └────────┬─────────┘      └────────┬─────────┘
             │ encrypted nearby sync  │                          │ HTTPS
             └────────────────────────┘                          │
                                                     ┌───────────▼──────────┐
                                                     │ Server-side gateway   │
                                                     │ OpenAI + Maps tokens  │
                                                     │ no client secrets     │
                                                     └───────────┬──────────┘
                                                                 │ optional
                                            ┌────────────────────┴────────────┐
                                            │ NVIDIA edge/rendering plane      │
                                            │ Jetson store-and-forward         │
                                            │ CloudXR stationary spatial stream│
                                            └───────────────────────────────────┘
```

## Navigation truth hierarchy

1. Rider observation, posted signs, closures and authorized local direction.
2. Verified GPX and route manifest cached on device.
3. Core Location position/heading and MapKit presentation.
4. Live weather and support-team updates.
5. AI guide context. AI never changes the route or declares access open.

## Apple surfaces

### iPhone

- glanceable next-turn card;
- offline route geometry and maneuver queue;
- haptic and spoken guidance with current speech stopped before a new prompt;
- one-tap emergency card and support check-in;
- spatial-video capture prompts only when stopped.

### iPadOS

- `NavigationSplitView` support console;
- route verification editor;
- all riders and latest sync state;
- WebKit area environment for research, contacts and media;
- GPX import and export.

### visionOS

- windowed briefing dashboard;
- volumetric route preview;
- one mixed `ImmersiveSpace` route room;
- RealityKit route ribbon, elevation markers and area cards;
- hard stationary gate; no rider HUD and no dependency for safe locomotion.

## Web environment per area

Every area is addressable as `/?area=<slug>`. The same shell renders category, coordinates, elevation, highway references, weather planning, safety notes, verification state, filming notes, Rotary/community context, lodging/rental notes and route position. MapKit JS is progressive enhancement; the application shell and route ledger work offline.

## OpenAI boundary

The client sends a minimum context envelope to `/api/guide`:

- area ID;
- current verified maneuver text;
- locale;
- coarse, optional context;
- user question.

The server uses the Responses API with JSON Schema Structured Outputs and `store: false`. The response is advisory narrative only and cannot set route state.

## NVIDIA boundary

- Jetson edge endpoints can receive explicitly selected frames or telemetry summaries for local hazard/media classification.
- CloudXR is optional for stationary, high-fidelity route/digital-twin rooms.
- Canonical route and AOI data remain open JSON/GeoJSON/GPX, so NVIDIA services are never a lock-in dependency.
