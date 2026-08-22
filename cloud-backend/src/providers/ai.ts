export type AiProviderId = "openai" | "nvidia-nim";

type FetchLike = typeof fetch;

export interface AiProviderStatus {
  id: AiProviderId;
  configured: boolean;
  defaultModel?: string;
  endpoint?: string;
  reason?: string;
}

export interface AiGenerationRequest {
  provider?: AiProviderId;
  input: string;
  instructions?: string;
  model?: string;
  maxOutputTokens?: number;
}

export interface AiGenerationResponse {
  provider: AiProviderId;
  model: string;
  text: string;
  responseId?: string;
}

type Environment = Record<string, string | undefined>;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getAiProviderStatuses(env: Environment = process.env): AiProviderStatus[] {
  const openaiConfigured = Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL);
  const nimConfigured = Boolean(env.NIM_BASE_URL && env.NIM_MODEL);

  return [
    {
      id: "openai",
      configured: openaiConfigured,
      defaultModel: env.OPENAI_MODEL,
      endpoint: openaiConfigured ? "https://api.openai.com/v1/responses" : undefined,
      reason: openaiConfigured ? undefined : "Set OPENAI_API_KEY and OPENAI_MODEL",
    },
    {
      id: "nvidia-nim",
      configured: nimConfigured,
      defaultModel: env.NIM_MODEL,
      endpoint: nimConfigured ? `${trimTrailingSlash(env.NIM_BASE_URL!)}/v1/responses` : undefined,
      reason: nimConfigured ? undefined : "Set NIM_BASE_URL and NIM_MODEL",
    },
  ];
}

export function extractResponseText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const response = body as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
    choices?: Array<{ message?: { content?: unknown }; text?: unknown }>;
  };

  if (typeof response.output_text === "string") return response.output_text;

  const outputText = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text as string)
    .join("\n");
  if (outputText) return outputText;

  const choice = response.choices?.[0];
  if (typeof choice?.message?.content === "string") return choice.message.content;
  if (typeof choice?.text === "string") return choice.text;
  return "";
}

export async function generateAiResponse(
  request: AiGenerationRequest,
  env: Environment = process.env,
  fetchImpl: FetchLike = globalThis.fetch,
): Promise<AiGenerationResponse> {
  const statuses = getAiProviderStatuses(env);
  const selectedId = request.provider ?? (statuses.find((status) => status.id === "openai" && status.configured)?.id ?? "nvidia-nim");
  const status = statuses.find((candidate) => candidate.id === selectedId);

  if (!status?.configured || !status.endpoint || !status.defaultModel) {
    throw new Error(status?.reason ?? `AI provider ${selectedId} is not configured`);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (selectedId === "openai") {
    headers.Authorization = `Bearer ${env.OPENAI_API_KEY}`;
  } else if (env.NIM_API_KEY) {
    headers.Authorization = `Bearer ${env.NIM_API_KEY}`;
  }

  const response = await fetchImpl(status.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: request.model ?? status.defaultModel,
      input: request.input,
      ...(request.instructions ? { instructions: request.instructions } : {}),
      ...(request.maxOutputTokens ? { max_output_tokens: request.maxOutputTokens } : {}),
    }),
  });

  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const detail = typeof body?.error === "object" && body.error && "message" in body.error
      ? String((body.error as { message?: unknown }).message)
      : `Provider returned HTTP ${response.status}`;
    throw new Error(detail);
  }

  const text = extractResponseText(body);
  if (!text) throw new Error("Provider response did not contain generated text");

  return {
    provider: selectedId,
    model: request.model ?? status.defaultModel,
    text,
    responseId: typeof body?.id === "string" ? body.id : undefined,
  };
}
