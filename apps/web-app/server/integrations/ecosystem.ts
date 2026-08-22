import { ENV } from "../_core/env";

export type AiProvider = "openai" | "nvidia";

type ProviderConfiguration = {
  configured: boolean;
  model: string;
  endpoint: string;
};

export type EcosystemStatus = {
  id: "openai" | "nvidia" | "meta" | "apple" | "microsoft";
  label: string;
  category: "AI" | "Spatial" | "Identity";
  configured: boolean;
  capability: string;
  setup: string;
  requiredSettings: string[];
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getProviderConfiguration(provider: AiProvider): ProviderConfiguration {
  if (provider === "openai") {
    return {
      configured: Boolean(ENV.openAiApiKey),
      model: ENV.openAiModel,
      endpoint: "https://api.openai.com/v1/responses",
    };
  }

  const baseUrl = trimTrailingSlash(ENV.nvidiaNimBaseUrl);
  return {
    configured: Boolean(ENV.nvidiaApiKey && ENV.nvidiaNimModel && baseUrl),
    model: ENV.nvidiaNimModel,
    endpoint: `${baseUrl}/responses`,
  };
}

export async function probeProvider(provider: AiProvider) {
  const configuration = getProviderConfiguration(provider);
  const label = provider === "openai" ? "OpenAI" : "NVIDIA NIM";
  if (!configuration.configured) {
    return { provider, label, configured: false, latencyMs: null as number | null, state: "awaiting configuration" };
  }

  const apiKey = provider === "openai" ? ENV.openAiApiKey : ENV.nvidiaApiKey;
  const modelsEndpoint = configuration.endpoint.replace(/\/responses$/, "/models");
  const startedAt = Date.now();
  try {
    const response = await fetch(modelsEndpoint, {
      method: "GET",
      headers: { authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4_000),
    });
    return {
      provider,
      label,
      configured: true,
      latencyMs: Date.now() - startedAt,
      state: response.ok ? "reachable" : `endpoint returned ${response.status}`,
    };
  } catch {
    return {
      provider,
      label,
      configured: true,
      latencyMs: Date.now() - startedAt,
      state: "endpoint unavailable",
    };
  }
}

export function getEcosystemStatus(): EcosystemStatus[] {
  const openAi = getProviderConfiguration("openai");
  const nvidia = getProviderConfiguration("nvidia");

  return [
    {
      id: "openai",
      label: "OpenAI",
      category: "AI",
      configured: openAi.configured,
      capability: "Server-side Responses API for spatial analysis, mission briefs, and structured intelligence.",
      setup: "Add a project-scoped API key; browser clients never receive it.",
      requiredSettings: ["OPENAI_API_KEY", "OPENAI_MODEL (optional)"],
    },
    {
      id: "nvidia",
      label: "NVIDIA NIM",
      category: "AI",
      configured: nvidia.configured,
      capability: "OpenAI-compatible inference routing for NIM-hosted or NVIDIA API Endpoint models.",
      setup: "Choose a NIM model and endpoint that are available to your NVIDIA account or deployment.",
      requiredSettings: ["NVIDIA_API_KEY", "NVIDIA_NIM_MODEL", "NVIDIA_NIM_BASE_URL (optional)"],
    },
    {
      id: "meta",
      label: "Meta Horizon OS",
      category: "Spatial",
      configured: Boolean(ENV.metaHorizonAppId),
      capability: "A signed session manifest can be handed to a Quest client implementing Horizon OS app deep linking.",
      setup: "Register the target Quest application ID and implement message validation in the native receiving app.",
      requiredSettings: ["META_HORIZON_APP_ID"],
    },
    {
      id: "apple",
      label: "Apple Spatial",
      category: "Spatial",
      configured: Boolean(ENV.appleAppId && ENV.appleAssociatedDomain),
      capability: "Universal-link association for visionOS, iPadOS, and tvOS handoff into spatial content.",
      setup: "Configure the app identifier and associated domain in Apple Developer and Xcode.",
      requiredSettings: ["APPLE_APP_ID", "APPLE_ASSOCIATED_DOMAIN"],
    },
    {
      id: "microsoft",
      label: "Microsoft Entra ID",
      category: "Identity",
      configured: Boolean(ENV.microsoftTenantId && ENV.microsoftClientId && ENV.microsoftClientSecret),
      capability: "Enterprise OpenID Connect configuration for a future opt-in workforce sign-in flow.",
      setup: "Register a web application and its redirect URI in Microsoft Entra before enabling SSO.",
      requiredSettings: ["MICROSOFT_TENANT_ID", "MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
    },
  ];
}

export function getAppleAppSiteAssociation() {
  const details = ENV.appleAppId
    ? [{ appIDs: [ENV.appleAppId], components: [{ "/": "/spatial/*" }, { "/": "/app/geospatial/*" }] }]
    : [];

  return {
    applinks: {
      details,
    },
  };
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as Record<string, unknown>;

  if (typeof data.output_text === "string") return data.output_text;

  if (Array.isArray(data.output)) {
    const text = data.output
      .flatMap(item => {
        if (!item || typeof item !== "object") return [];
        const content = (item as Record<string, unknown>).content;
        if (!Array.isArray(content)) return [];
        return content
          .map(part => {
            if (!part || typeof part !== "object") return "";
            const record = part as Record<string, unknown>;
            return typeof record.text === "string" ? record.text : "";
          })
          .filter(Boolean);
      })
      .join("\n");
    if (text) return text;
  }

  const choices = data.choices;
  if (Array.isArray(choices)) {
    const content = (choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content;
    if (typeof content === "string") return content;
  }

  return "";
}

export async function runProviderPrompt(provider: AiProvider, prompt: string) {
  const configuration = getProviderConfiguration(provider);
  if (!configuration.configured) {
    throw new Error(`${provider === "openai" ? "OpenAI" : "NVIDIA NIM"} is not configured for this project.`);
  }

  const apiKey = provider === "openai" ? ENV.openAiApiKey : ENV.nvidiaApiKey;
  const response = await fetch(configuration.endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: configuration.model, input: prompt }),
  });

  if (!response.ok) {
    throw new Error(`${provider === "openai" ? "OpenAI" : "NVIDIA NIM"} request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  if (!text) throw new Error("The selected AI provider returned no text output.");

  return { provider, model: configuration.model, text };
}
