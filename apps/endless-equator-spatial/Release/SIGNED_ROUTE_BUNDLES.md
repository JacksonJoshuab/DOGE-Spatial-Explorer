# Signed operational route bundles

Unsigned GPX files are planning geometry only. An `.eqroute` file is the only import format that can produce an operational `RoutePlan`, and only after all cryptographic and operational checks pass.

## Format

An `.eqroute` file is a bounded JSON envelope containing:

- exact raw operational-manifest JSON bytes, base64 encoded;
- exact raw GPX bytes, base64 encoded;
- Ed25519 signer key ID;
- 64-byte Ed25519 signature;
- bundle creation timestamp.

The signature covers a domain-separated binary payload:

```text
"com.gonzosocialclub.endlessequator.routebundle.v1\0"
+ uint64be(manifest byte count)
+ exact manifest bytes
+ uint64be(GPX byte count)
+ exact GPX bytes
```

There is no JSON canonicalization ambiguity: the signed manifest bytes are carried unchanged in the envelope. The manifest also contains the GPX SHA-256, giving an explicit audit value in addition to the signature's byte binding.

## Trust model

`Sources/EndlessEquatorCore/Resources/trusted-route-signers.json` contains public keys only. It intentionally ships empty until the organization completes signer governance.

A production signer record contains:

```json
{
  "keyID": "ecuador-route-authority-2026-01",
  "displayName": "Named authorized route-verification organization",
  "publicKeyBase64": "32-byte-Ed25519-public-key-in-base64",
  "enabled": true,
  "validFrom": "2026-08-01T00:00:00Z",
  "validUntil": "2027-08-01T00:00:00Z"
}
```

Adding or replacing a trusted public key changes the signed application and requires normal code review, Xcode 27 validation, signing, TestFlight/device testing, and release evidence. Private signing keys never enter GitHub, the app bundle, CI logs, or chat.

## Create an offline signer

On an approved offline or tightly controlled workstation:

```bash
node Tools/signed-route-bundle.mjs generate-key \
  --private-key-out route-signer.pem \
  --signer-out route-signer-public.json \
  --key-id ecuador-route-authority-2026-01 \
  --display-name "Authorized Ecuador Route Verification"
```

The private PEM is created with restrictive permissions. Move it into the approved hardware-backed or encrypted signing process. Copy only the public signer record into the reviewed trusted-signer catalog.

## Sign

First run the existing manifest/GPX validator. Then create the envelope:

```bash
node Verification/verify-operational-route.mjs manifest.json route.gpx
node Tools/signed-route-bundle.mjs sign \
  --manifest manifest.json \
  --gpx route.gpx \
  --private-key route-signer.pem \
  --key-id ecuador-route-authority-2026-01 \
  --out endless-equator.eqroute
```

## Independently verify

```bash
node Tools/signed-route-bundle.mjs verify \
  --bundle endless-equator.eqroute \
  --trusted-signers Sources/EndlessEquatorCore/Resources/trusted-route-signers.json
```

The app repeats signature, signer-validity, GPX hash, timestamp, segment, permit, bailout, landowner/protected-area, go/no-go, GPX parser, and native verification checks. It stores the original signed envelope with complete file protection and re-verifies it on every launch. Expired or stale evidence cannot silently remain operational.

## Required manifest conditions

- `status` is `operationalCandidate`;
- access and segment checks are no more than 72 hours old;
- weather check is no more than 24 hours old;
- `expiresAt` is explicit and in the future;
- at least one official source is present and current;
- permits are `approved` or `notRequired`;
- every segment is `open` or explicitly `conditional`;
- conditional segments state their conditions;
- every segment has a confirmed bailout;
- protected-area and required landowner evidence is present;
- go/no-go is `GO` or `CONDITIONAL_GO`;
- the local rider acknowledges the exact verified bundle after import.

Posted closures, protected-area staff, police, landowners, local guides, and observed conditions always override a valid bundle.
