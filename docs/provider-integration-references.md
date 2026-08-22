# Provider Integration References

The cloud backend's OpenAI and NVIDIA adapters use the Responses API shape and retain credentials only on the server.

| Provider | Reference | Implementation note |
|---|---|---|
| OpenAI | https://developers.openai.com/api/docs/quickstart | The server uses `POST /v1/responses` with a bearer token from `OPENAI_API_KEY`; model selection is configured by `OPENAI_MODEL`. |
| NVIDIA NIM | https://docs.nvidia.com/nim/large-language-models/latest/api-reference.html | NIM exposes OpenAI-compatible `POST /v1/responses` and `/v1/models` endpoints; the server uses a configurable HTTPS `NIM_BASE_URL` and `NIM_MODEL`. |

The Apple, Microsoft Entra, and Meta adapters validate provider identity or access tokens server-side. Their app registrations, redirect configuration, and production secrets must be completed in each provider's developer console before enabling those paths.
