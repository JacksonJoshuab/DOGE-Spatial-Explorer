export type ProviderId = "openai" | "nvidia-nim" | "apple" | "microsoft" | "meta-quest" | "nvidia-jetson";

type Environment = Record<string, string | undefined>;

export interface ProviderCatalogEntry {
  id: ProviderId;
  label: string;
  category: "ai" | "identity" | "spatial" | "edge";
  requiredVariables: string[];
  optionalVariables: string[];
  capabilities: string[];
  documentationUrl: string;
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "openai", label: "OpenAI", category: "ai",
    requiredVariables: ["OPENAI_API_KEY", "OPENAI_MODEL"],
    optionalVariables: ["OPENAI_ALLOWED_MODELS"],
    capabilities: ["responses", "streaming", "model-discovery", "failover"],
    documentationUrl: "https://developers.openai.com/api/docs/quickstart",
  },
  {
    id: "nvidia-nim", label: "NVIDIA NIM", category: "ai",
    requiredVariables: ["NIM_BASE_URL", "NIM_MODEL"],
    optionalVariables: ["NIM_API_KEY", "NIM_ALLOWED_MODELS"],
    capabilities: ["responses", "streaming", "model-discovery", "failover"],
    documentationUrl: "https://docs.nvidia.com/nim/large-language-models/latest/api-reference.html",
  },
  {
    id: "apple", label: "Sign in with Apple", category: "identity",
    requiredVariables: ["APPLE_CLIENT_ID"], optionalVariables: ["REQUIRE_OIDC_NONCE"],
    capabilities: ["oidc-id-token-validation", "jwks-key-rotation", "nonce-validation"],
    documentationUrl: "https://developer.apple.com/documentation/signinwithapple",
  },
  {
    id: "microsoft", label: "Microsoft Entra and Graph", category: "identity",
    requiredVariables: ["MICROSOFT_TENANT_ID", "MICROSOFT_CLIENT_ID"], optionalVariables: ["MICROSOFT_GRAPH_BASE_URL", "REQUIRE_OIDC_NONCE"],
    capabilities: ["oidc-id-token-validation", "nonce-validation", "graph-profile-readiness"],
    documentationUrl: "https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc",
  },
  {
    id: "meta-quest", label: "Meta Quest and Horizon", category: "spatial",
    requiredVariables: ["META_APP_ID", "META_APP_SECRET"], optionalVariables: ["META_TOKEN_DEBUG_URL"],
    capabilities: ["access-token-introspection", "quest-capability-registration", "session-attestation-metadata"],
    documentationUrl: "https://developers.meta.com/horizon/documentation/",
  },
  {
    id: "nvidia-jetson", label: "NVIDIA Jetson", category: "edge",
    requiredVariables: ["NVIDIA_JETSON_SHARED_SECRET"], optionalVariables: [],
    capabilities: ["signed-registration", "signed-telemetry", "replay-protection"],
    documentationUrl: "https://developer.nvidia.com/embedded/jetson-developer-kits",
  },
];

export function getProviderReadiness(env: Environment = process.env) {
  const providers = PROVIDER_CATALOG.map((provider) => {
    const missingVariables = provider.requiredVariables.filter((name) => !env[name]);
    return {
      id: provider.id,
      label: provider.label,
      category: provider.category,
      configured: missingVariables.length === 0,
      missingVariables,
      capabilities: provider.capabilities,
      documentationUrl: provider.documentationUrl,
    };
  });

  return {
    providers,
    configuredProviderCount: providers.filter((provider) => provider.configured).length,
    totalProviderCount: providers.length,
  };
}
