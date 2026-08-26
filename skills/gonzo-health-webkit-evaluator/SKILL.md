# Gonzo | Health WebKit Evaluation Skill

## Purpose

Evaluate the public **Gonzo | Health — Spatial Cognition Lab** as a deployed WebKit/PWA product, not merely as a source tree. This skill verifies brand implementation, assessment functionality, privacy boundaries, offline readiness, and deployment integrity.

The evaluator is fail-closed: a high cosmetic score cannot override a broken assessment flow, missing privacy boundary, stale deployment, or browser error.

## Default inputs

```text
PUBLIC_URL=https://jacksonjoshuab.github.io/DOGE-Spatial-Explorer/gonzo-health-spatial-cognition/
SOURCE_REF=feature/gonzo-health-brand-refresh
SITE_DIRECTORY=gonzo-health-spatial-cognition
BROWSER=webkit
```

Override these values explicitly when evaluating a preview, custom domain, or release candidate.

## Required evidence

Collect and retain:

1. Git commit and source ref.
2. Public URL and evaluation timestamp in UTC.
3. HTTP status for the app, manifest, service worker, health check, privacy page, support page, brand media, and payload loader.
4. Static contract findings.
5. WebKit browser findings.
6. Console errors, page errors, failed requests, and CSP violations.
7. Screenshots of lobby, active assessment, and results.
8. Machine-readable JSON report.
9. Human-readable Markdown summary.

Do not report a gate as passing unless the corresponding evidence was actually collected.

## Critical gates

Any critical failure makes the overall result **FAIL**, regardless of numeric score.

| Gate | Requirement |
|---|---|
| Deployment | Main URL returns a successful HTML response and app assets resolve. |
| Boot | Packed assessment payload opens and `#app` becomes visible. |
| Brand | `gonzo-health-webkit-brand/1.0.0` marker is present and the lobby displays “Focus. Remember. Thrive.” |
| Media | Brand icon, neural hero, and seven-generation media strip load without errors. |
| Measurement contract | Exactly seven generation selectors, three battery selectors, and twelve shared anchors are represented. |
| Functional flow | Daily demo starts, consent works, assessment screen appears, and a results view is reached or a partial session can be ended and scored. |
| Privacy | Core activity remains local-first; no provider API key, diagnostic claim, or hidden external tracker is present. |
| WebKit/PWA | Manifest, service worker, safe-area metadata, standalone metadata, offline screen, and CSP are present. |
| Runtime quality | No uncaught page error, unhandled rejection, blocked critical asset, or critical console error occurs. |

## Weighted rubric

| Domain | Weight |
|---|---:|
| Brand fidelity and media | 25 |
| Assessment functionality | 30 |
| WebKit/PWA/offline readiness | 20 |
| Privacy and safety boundary | 15 |
| Deployment integrity and performance | 10 |
| **Total** | **100** |

Passing thresholds:

```text
PASS: score >= 90, all critical gates pass, zero critical browser errors
CAUTION: score 80–89 with no critical failure
FAIL: score < 80 or any critical gate fails
```

A release promotion requires **PASS**. “CAUTION” is suitable only for active development.

## Brand fidelity requirements

The lobby must contain:

- Gonzo | Health branded neural-orbit mark
- Cyan → blue → violet → magenta visual system
- “Focus. Remember. Thrive.” hero message
- Original neural cognition hero media
- Focus, Memory, Speed, Calm, Progress, and Privacy capability icons
- Seven original generation-media treatments
- Results, privacy, and science proof cards
- Stable, opaque scored-stimulus surface during assessment

Visual changes must not replace or mutate the deterministic assessment engine.

## Functional test sequence

1. Open the target in Playwright WebKit.
2. Wait for the packed payload and brand layer to report ready.
3. Assert the lobby has seven generation controls and three battery controls.
4. Select Generation X and confirm selected state changes.
5. Start the accelerated Daily demonstration.
6. Accept the prototype participation notice.
7. Verify the assessment screen, timer, progress, response controls, and live-evidence panel.
8. Allow the demo to complete, or end the session through the participant stop control and accept the confirmation dialog.
9. Verify a results view contains accuracy, validity, recommendations, or exported evidence controls.
10. Reload and verify local state/history remains available.
11. Capture lobby, assessment, and results screenshots.

Never use a production participant identity or health record in this evaluation.

## Static checks

Verify:

- Required files exist.
- `index.html` references the brand stylesheet and enhancement module.
- Content Security Policy permits only the intended self/blob execution model.
- `manifest.webmanifest` is valid JSON and contains branded icons, screenshots, and shortcuts.
- `service-worker.js` caches the brand media plus all 48 packed payload chunks.
- `healthcheck.json` declares the current brand version, seven packs, 36/132/252 response counts, and twelve anchors.
- No `OPENAI_API_KEY`, `sk-`, advertising identifier, analytics tracker, or external script host appears in the public artifact.
- Privacy and support pages are linked and reachable.
- Brand enhancement code is presentation-only and does not import or overwrite scoring functions.

## Commands

Install the browser dependency:

```bash
cd evaluation/gonzo-health-webkit
npm install --no-package-lock
npx playwright install --with-deps webkit
```

Evaluate a local release candidate:

```bash
python3 -m http.server 4173 --directory site-source/gonzo-health-spatial-cognition &
node scripts/evaluate-gonzo-health-webkit.mjs \
  --site-dir site-source/gonzo-health-spatial-cognition \
  --url http://127.0.0.1:4173/ \
  --browser webkit \
  --json evaluation-output/report.json \
  --markdown evaluation-output/report.md \
  --screenshots evaluation-output/screenshots
```

Evaluate the public deployment:

```bash
node scripts/evaluate-gonzo-health-webkit.mjs \
  --url https://jacksonjoshuab.github.io/DOGE-Spatial-Explorer/gonzo-health-spatial-cognition/ \
  --browser webkit \
  --require-live \
  --json evaluation-output/live-report.json \
  --markdown evaluation-output/live-report.md \
  --screenshots evaluation-output/live-screenshots
```

## Output contract

The JSON report must include:

```json
{
  "schemaVersion": "gonzo-health-webkit-evaluation/1.0",
  "evaluatedAt": "ISO-8601 UTC",
  "target": { "url": "string", "siteDirectory": "string or null", "browser": "webkit" },
  "status": "PASS | CAUTION | FAIL",
  "score": 0,
  "criticalFailures": [],
  "domains": {},
  "checks": [],
  "browser": { "consoleErrors": [], "pageErrors": [], "failedRequests": [] },
  "artifacts": { "screenshots": [] }
}
```

Every check must record its name, domain, criticality, pass/fail state, points earned, points possible, and supporting detail.

## Release decision language

Use:

- “Verified in Playwright WebKit at `<timestamp>`.”
- “The deployed commit and evaluated source are aligned.”
- “The result is PASS with 100/100 and zero critical browser errors.”

Avoid:

- “Fully functional” when only static files were inspected.
- “Safari verified” when only Chromium was tested.
- “Offline verified” when the service worker was not installed and exercised.
- “Clinically validated” or diagnostic language.

## Escalation rules

Stop release promotion and open a GitHub issue when:

- The public deployment commit lags the approved source.
- The brand marker or required media is missing.
- A test cannot start or produce results.
- A console/page error affects the core flow.
- A privacy or diagnostic-language gate fails.
- The service worker caches an incomplete payload.
- The health check disagrees with the actual measurement contract.

Include reproduction steps, affected URL, source ref, screenshot, failing check ID, and suggested owner in the issue.
