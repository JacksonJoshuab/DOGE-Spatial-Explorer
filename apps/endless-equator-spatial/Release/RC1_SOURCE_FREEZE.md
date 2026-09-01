# Endless Equator RC1 source-freeze candidate

This file intentionally creates the exact-main application-tree commit used for the RC1 engineering evidence cycle.

## Candidate scope

The source-freeze candidate includes:

- native iPhone and iPadOS companion application;
- stationary Apple Vision Pro briefing and route-room application;
- local-first route, maneuver, GPX, verification, and nearby-sync libraries;
- WebKit/PWA area environments and production gateway;
- OpenAI advisory guide boundary;
- optional NVIDIA CloudXR and Jetson boundaries;
- Apple build, archive, privacy-manifest, entitlement, and static-analysis controls;
- gateway, source, security, route, provider, and release-evidence validators;
- exact-main Gate A evidence collection.

## Required exact-commit engineering workflows

Gate A is eligible to pass only when these workflows complete successfully for the same 40-character `main` commit:

1. `Endless Equator Spatial`
2. `Endless Equator Security`
3. `Endless Equator Main Xcode 27`

The automatic collector then hashes the selected workflow metadata, jobs and steps, log archives, generated artifacts, and complete Gate A package. Pull-request evidence or a run against another commit cannot close the gate.

## Current release decision

**NO-GO for public release and NO-GO for operational Ecuador navigation.**

A green Gate A proves only that the exact source is reproducibly built, analyzed, archived without signing, and covered by the automated engineering/security checks. It does not prove or imply:

- registered Apple bundle identifiers;
- WeatherKit capability activation;
- signed archives or TestFlight processing;
- physical iPhone, iPad, Vision Pro, helmet/intercom, battery, thermal, or network qualification;
- deployed Azure, DNS, Key Vault, TLS, monitoring, or rollback controls;
- a current Ecuador GPX, route access, protected-area permission, landowner/community permission, weather, bailout, medical, or recovery plan;
- final App Store privacy or accessibility acceptance;
- independent penetration or operational acceptance testing;
- written guide, motorcycle, hotel, Rotary/community, authority, surf, medical, recovery, fixer, or immersive-production confirmations.

Those gates remain independently fail-closed in the RC1 evidence index.

## Change control after this point

Any source, dependency, capability, entitlement, build-setting, workflow, gateway, route-data, security-control, privacy, accessibility, or production-configuration change creates a new source commit and requires a new Gate A evidence package. Operational GPX/access and provider evidence retain their own shorter freshness and validity periods even when the application source is unchanged.
