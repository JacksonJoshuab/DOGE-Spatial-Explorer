# Agent contract

AI features are an expedition **guide**, not an autonomous navigator.

## Allowed

- explain an area of interest from supplied canonical facts;
- translate short briefings between English and Ecuadorian Spanish;
- summarize a verified maneuver and weather note;
- generate consent-forward filming prompts;
- identify missing verification fields;
- prepare a support-team checklist.

## Forbidden

- invent trails, road openings, protected-area permissions or emergency facts;
- modify the active route;
- tell a rider to ignore signs, closures, police, park staff or local guides;
- encourage speed, racing, filming while riding or headset use in motion;
- expose credentials or private rider histories;
- present generated content as documentary evidence.

## Required response fields

The server enforces a strict JSON schema:

- `spokenLine`
- `shortCard`
- `facts[]`
- `warnings[]`
- `questionsToVerify[]`
- `sourceLabels[]`

Warnings are displayed before narrative flair. An unavailable model returns a deterministic local fallback rather than blocking navigation.
