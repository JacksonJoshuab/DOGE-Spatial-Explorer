# Core Provider Upgrade API

This release centralizes safe readiness information in `GET /api/health/providers/configuration`. The response reports missing variable **names**, capability names, and documentation links; it never returns credential values.

| Capability | API surface | Security boundary |
|---|---|---|
| Provider catalog and configuration diagnostics | `GET /api/health/providers/configuration` | No provider secrets or access tokens are returned. |
| Model discovery | `GET /api/ai/providers/:provider/models` | Requires the normal authenticated AI route and uses a five-minute server cache. |
| Request policy | `GET /api/ai/providers/:provider/policy` | Model overrides are restricted to `*_ALLOWED_MODELS`; inputs and output limits are bounded on the server. |
| AI failover | `POST /api/ai/generate` | The response includes only provider/model/error attempt metadata; it never includes keys. |
| Streaming generation | `POST /api/ai/generate/stream` | The server validates the request before forwarding upstream server-sent events. |
| OIDC nonce | `POST /api/auth/nonce` | The issued nonce expires after ten minutes and is consumed once after a validated Apple or Microsoft ID token. |
| Graph readiness | `POST /api/auth/microsoft/graph-readiness` | Runs the minimum delegated profile call and does not persist or echo the access token. |
| Quest capability attestation | `POST /api/devices/register` | Requires a verified Meta session; metadata is allow-listed and cannot contain an access token. |
| Jetson telemetry | `POST /api/devices/:id/telemetry/jetson` | Requires device-owner authorization plus a time-bounded HMAC over the canonical payload; duplicate nonces are rejected. |

OpenAI uses the server-side Responses API. NVIDIA NIM supports the same Responses-compatible shape for the configured deployment. [OpenAI quickstart](https://developers.openai.com/api/docs/quickstart) [NVIDIA NIM API reference](https://docs.nvidia.com/nim/large-language-models/latest/api-reference.html)

Microsoft requires the client to put the server-issued nonce into its authorization request and return it with the ID token. Microsoft documents nonce matching as a token-replay mitigation. [Microsoft OpenID Connect guidance](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)
