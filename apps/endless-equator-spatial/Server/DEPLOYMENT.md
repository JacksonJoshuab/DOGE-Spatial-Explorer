# Production HTTPS Gateway Deployment

The gateway is an OCI container. Build from the application root:

```bash
docker build -f Server/Dockerfile -t endless-equator-gateway:<git-sha> .
docker run --rm -p 8787:8787 --env-file Server/.env endless-equator-gateway:<git-sha>
```

## Required production secrets

- `OPENAI_API_KEY`
- `APPLE_MAPS_TEAM_ID`
- `APPLE_MAPS_KEY_ID`
- `APPLE_MAPS_PRIVATE_KEY_PEM`

Required nonsecret configuration:

- `OPENAI_MODEL`
- `ALLOWED_ORIGINS`
- `MAPKIT_ALLOWED_ORIGINS`
- `PORT`

## Platform requirements

- TLS 1.2+ at the ingress; HTTP redirects to HTTPS;
- secret manager injection, never image/build arguments;
- at least two replicas or documented single-replica maintenance window;
- `/health` startup, liveness and readiness probes;
- request and error metrics without request-body/location logging;
- egress restricted to OpenAI and required Apple services where supported;
- immutable image digest, SBOM and vulnerability result;
- automatic rollback on failed health checks;
- MapKit private-key and OpenAI-key rotation procedure;
- origin allowlists set to the final production domains only.

## Acceptance evidence

1. DNS and certificate chain report.
2. Container image digest and source commit.
3. Health result from two independent networks.
4. CORS/origin rejection test.
5. MapKit short-lived token origin/lifetime test.
6. OpenAI success, timeout and no-key fallback tests.
7. Restart, scale-out and rollback drill.
8. Monitoring alert routed to an accountable owner.
9. Backup of configuration metadata—not secrets—and recovery procedure.

The client `EndlessEquatorServerURL` must use the final HTTPS origin for physical-device/TestFlight builds. Local HTTP is limited to simulator or controlled LAN development.
