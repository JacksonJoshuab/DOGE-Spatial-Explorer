# Gonzo | Health Exam, Reporting & UX Evaluation v2

Release candidate: `gonzo-health-experience/2.3.0`

## Fail-closed critical gates

A candidate fails regardless of score if any of these occur:

1. Daily/Standard/Research response contracts differ from 36/132/252.
2. The 12 shared anchors are changed by presentation UX.
3. Scoring, validity, or evidence values are mutated by the experience layer.
4. A scored stimulus becomes translucent, animated, or visually unstable.
5. A keyboard-only user cannot start, respond, stop, review, export, or delete.
6. High contrast or reduced motion becomes unusable.
7. Offline navigation cannot reach the cached app shell.
8. Results imply diagnosis, intelligence, disease probability, or clinical causality.
9. Export/deletion/privacy controls are hidden behind an account or subscription.
10. Browser console/page/CSP errors occur in a critical flow.

## 100-point rubric

| Domain | Points | Required evidence |
|---|---:|---|
| Exam clarity and readiness | 15 | battery duration/response metadata, readiness checklist, instructions |
| Stimulus and response UX | 20 | stable stimulus surface, target size, progress, pause/stop, keyboard |
| Reporting comprehension | 20 | validity-first explanation, metric hierarchy, non-diagnostic language |
| Goals and follow-up | 10 | next actions, repeatability, trend review, export |
| Accessibility | 15 | keyboard, focus, contrast, reduced motion, zoom, semantic labels |
| Mobile/WebKit/PWA | 10 | safe areas, light default, theme toggle, offline shell, install behavior |
| Privacy and trust | 5 | local-first disclosure, export/delete discoverability |
| Performance/error quality | 5 | no critical errors, bounded enhancement layer |

Release threshold: **90/100 and zero critical failures**.

## Usability targets

- Lobby primary action identifiable within 5 seconds.
- Battery differences understandable without opening documentation.
- No more than one primary CTA per decision surface.
- Response targets at least 44×44 CSS px.
- Results answer, in order: Was the session valid? What happened? What should I do next? How does it compare with my baseline?
- Do not rank generations against each other as health groups.
- Report accuracy before speed when there is a speed/accuracy tradeoff.
- Show uncertainty/caution when validity is not fully valid.
- Repeat sessions should preserve comparable anchors.

## Test matrix

Run at minimum in Playwright WebKit at 390×844, 768×1024, and 1440×900; test light/dark, high contrast, reduced motion, 200% zoom, keyboard-only, offline reload, Daily demo completion, results, history, privacy, export, and deletion.
