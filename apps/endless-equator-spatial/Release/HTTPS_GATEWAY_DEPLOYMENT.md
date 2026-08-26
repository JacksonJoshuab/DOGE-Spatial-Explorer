# Production HTTPS gateway deployment

The production target is Azure Container Apps with:

- immutable images built in Azure Container Registry;
- HTTPS-only external ingress;
- one minimum replica and controlled scale-out;
- liveness and readiness checks on `/health`;
- OpenAI and Apple Maps private material read from Azure Key Vault;
- user-assigned managed identity for Key Vault and ACR access;
- multiple revisions for rollback;
- origin allowlists for the native/WebKit and MapKit JS clients.

## One-time configuration

### Azure federation

Create a workload identity for GitHub Actions scoped to the intended subscription/resource group. Store the following in the protected GitHub environment `gateway-production`:

**Secrets**

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

**Variables**

- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `AZURE_KEY_VAULT_NAME`
- `APPLE_MAPS_TEAM_ID`
- `APPLE_MAPS_KEY_ID`
- `ALLOWED_ORIGINS` — comma-separated exact origins
- `MAPKIT_ALLOWED_ORIGINS` — comma-separated exact HTTPS web origins
- `OPENAI_MODEL`

Require at least one independent reviewer for the environment.

### Key Vault

Create or select an RBAC-enabled Key Vault and load these secrets outside GitHub logs:

- `endless-equator-openai-api-key`
- `endless-equator-apple-maps-private-key`

The Apple Maps secret is the complete ES256 private key PEM. Do not store it as a repository secret when a Key Vault reference is available.

### DNS and custom domain

The first deployment receives an Azure-managed HTTPS FQDN. Before release:

1. assign the production API hostname;
2. add the required DNS verification and CNAME/A records;
3. bind a managed or approved certificate;
4. update `ALLOWED_ORIGINS` and `MAPKIT_ALLOWED_ORIGINS` to exact production origins;
5. update the Apple app `EndlessEquatorServerURL` build setting;
6. repeat the full smoke, CORS, CSP, token-origin, and rollback tests.

## Deployment

Run the protected workflow **Endless Equator Deploy Gateway** and type `DEPLOY`.

The workflow:

1. logs in with Azure OIDC;
2. validates both Bicep files;
3. creates/updates the Container Apps environment, logs, managed identity, and ACR;
4. builds an immutable image tagged with the Git commit;
5. deploys a revision with Key Vault references;
6. rejects insecure HTTP ingress;
7. tests `/health`, `/api/areas`, and `/api/route` over HTTPS;
8. restores traffic to the previous active revision if smoke testing fails.

## Production acceptance checks

- TLS certificate is valid, trusted, unexpired, and hostname-matched.
- HTTP redirects to HTTPS or is not exposed.
- HSTS is enabled at the approved edge after rollback and subdomain implications are reviewed.
- CSP blocks unapproved scripts, frames, and connections.
- MapKit token requests fail from an unapproved origin.
- OpenAI guide requests are rate-limited, strict-schema, and `store: false`.
- No authorization header, API key, private key, free-text prompt, or precise route history appears in logs.
- Azure logs and alerting cover failed health probes, 5xx rate, latency, replica restarts, and Key Vault failures.
- A previous revision can regain 100-percent traffic within the documented rollback procedure.
- Key rotation is tested for both OpenAI and Apple Maps without rebuilding the client apps.
- Backup copies of canonical AOI/route data and release manifests are retained separately from runtime logs.

## Operational ownership

Record the named platform owner, backup owner, Azure subscription, resource group, Key Vault, production hostname, on-call path, severity model, and approved maintenance window in the private operations register before launch.
