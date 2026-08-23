# Physical Device Acceptance Matrix

Record OS build, device model, app build, tester, timestamp, evidence link and pass/fail for every row.

## Required devices

| Surface | Minimum physical coverage |
|---|---|
| iPhone rider | Current Pro-class iPhone plus one supported lower-memory iPhone |
| iPad support | 13-inch iPad Pro/Air plus one compact iPad or iPad mini |
| Apple Vision Pro | Physical Vision Pro on the release visionOS build |
| Network | Home/office Wi-Fi, private hotspot, degraded cellular, offline mode and supported field LAN |

## iPhone rider tests

- clean install, upgrade and reinstall;
- allow/deny/revoke Location and Local Network permissions;
- planning route cannot start operational guidance;
- verified GPX imports and its hash matches the field manifest;
- spoken turn interrupts stale speech and does not overlap;
- haptic, lock-screen, rotation, thermal and battery behavior;
- off-route warning and safe-stop language;
- loss and recovery of GPS, cellular, WeatherKit and gateway;
- Dynamic Type through accessibility XXXL;
- VoiceOver, Voice Control, Reduce Motion, Increase Contrast and color-filter checks;
- English and Ecuadorian Spanish content review;
- no interaction required while the motorcycle is moving.

## iPad support tests

- split view and full screen in portrait/landscape;
- route/AOI selection and support-console readability in sun and low light;
- GPX import from Files and AirDrop;
- paired rider maneuver latency and reconnect behavior;
- concurrent WebKit, map and weather use under memory pressure;
- external keyboard, pointer and VoiceOver navigation;
- offline support packet and emergency-card access.

## Vision Pro tests

- clean install and permission prompts;
- stationary gate locked with motion or uncertain location;
- explicit seated/standing acknowledgement;
- companion pairing and authentication-code mismatch rejection;
- mixed route room opens and closes repeatedly without stranded immersive state;
- route-room comfort, text depth, reach, contrast and occlusion;
- VoiceOver, Dwell Control, pointer control, window repositioning and reduced motion;
- CloudXR unavailable fallback to native RealityKit;
- headset removal, sleep/wake and thermal behavior;
- no presentation as a riding HUD.

## Field tests

- representative altitude, cold, rain, glove and bright-sun conditions;
- known tunnel/tree-cover GPS degradation;
- support-vehicle separation and reconnection;
- satellite/cellular outage with local route continuity;
- current road closure and bailout drill;
- emergency stop and incident-log drill;
- camera workflows only from controlled stopped positions.

## Exit criteria

No Severity 1 or Severity 2 defect remains open. Every safety-critical test has two witnesses or one tester plus timestamped device/video evidence. Device results are tied to the exact Git commit, signed build number and field-manifest version.
