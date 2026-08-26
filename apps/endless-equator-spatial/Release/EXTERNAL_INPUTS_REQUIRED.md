# Owner-supplied inputs required to close release

The repository now contains the engineering gates, deployment path, test plans, route controls, security tests, and confirmation ledger. The following values/evidence cannot be manufactured by source code and must come from the account owner, physical test lab, Ecuador operations team, or contracted providers.

## Apple account

- Apple Developer Team ID
- final available iOS/iPadOS bundle identifier
- final available visionOS bundle identifier
- App Store Connect app records
- WeatherKit capability activation decision for each target
- development/distribution signing identities and profiles on the protected builder
- App Store roles and release approvers

## Apple hardware lab

- physical iPhone models/OS builds, including the user's iPhone 12 Pro when compatible with the final deployment target
- current Pro iPhone for spatial capture
- cellular iPad and M-series iPad Pro
- every Vision Pro model to be deployed
- actual helmet/intercom, hotspot/private 5G, and Starlink equipment
- named test operators and device availability windows

## Production gateway

- Azure subscription, resource group, region, and OIDC workload identity
- RBAC-enabled Key Vault
- OpenAI key stored as `endless-equator-openai-api-key`
- Apple Maps ES256 private key stored as `endless-equator-apple-maps-private-key`
- Apple Maps Team ID and Key ID
- exact production API/web origins
- production hostname and DNS control
- named platform owner, backup owner, on-call path, alert destinations, and maintenance window

## Ecuador operations

- exact expedition dates and group/vehicle counts
- named Ecuador route verifier and support operator
- current exact GPX file and segment evidence
- protected-area, landowner/community, cultural-site, and filming determinations
- medical/evacuation and 4x4 recovery commitments
- current security, road, weather, fuel, lodging, and communications checks
- independent go/no-go authority

## Partners and production

- written current quotes/confirmations for every selected hotel and motorcycle provider
- named Rotary/community hosts and actual project owner/beneficiary consent
- surf/water-safety operator for any Pacific activity
- Ecuador production fixer and permitting owner
- proven Apple Immersive/Blackmagic URSA Cine Immersive provider, or a documented decision to remove that capture tier
- insurance, customs/import, media ownership, data handling, cancellation, and emergency terms

## Independent review

- mobile/API penetration tester
- accessibility reviewer using physical devices
- privacy/legal reviewer for final App Store answers, policy, provider contracts, releases, and data retention
- field OAT witnesses and release signatories

Until these items are supplied and linked to the corresponding release issues, the public source may be reviewed and tested, but the operational ride and production release remain NO-GO.
