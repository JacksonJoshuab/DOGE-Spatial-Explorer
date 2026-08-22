import type { ProviderId } from "./catalog.js";

export type AiProviderId = Extract<ProviderId, "openai" | "nvidia-nim">;
type FetchLike = typeof fetch;
type Environment = Record<string, string | undefined>;

const INPUT_LIMIT = 32_000;
const OUTPUT_LIMIT = 8_192;
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const modelCache = new Map<AiProviderId, { expiresAt: number; models: string[] }>();

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
  allowFallback?: boolean;
}

export interface AiGenerationAttempt {
  provider: AiProviderId;
  model?: string;
  error?: string;
}

export interface AiGenerationResponse {
  provider: AiProviderId;
  model: string;
  text: string;
  responseId?: string;
  attempts: AiGenerationAttempt[];
}

export interface AiProviderPolicy {
  maxInputCharacters: number;
  maxOutputTokens: number;
  allowedModels: string[];
}

function trimTrailingSlash(value: string): string { return value.replace(/\/+$/, ""); }

function configured(env: Environment, id: AiProviderId): boolean {
  return id === "openai" ? Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL) : Boolean(env.NIM_BASE_URL && env.NIM_MODEL);
}

function endpoint(env: Environment, id: AiProviderId): string {
  return id === "openai" ? "https://api.openai.com/v1/responses" : `${trimTrailingSlash(env.NIM_BASE_URL!)}/v1/responses`;
}

function defaultModel(env: Environment, id: AiProviderId): string { return id === "openai" ? env.OPENAI_MODEL! : env.NIM_MODEL!; }

function allowedModels(env: Environment, id: AiProviderId): string[] {
  const configuredModels = id === "openai" ? env.OPENAI_ALLOWED_MODELS : env.NIM_ALLOWED_MODELS;
  const values = configuredModels?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const base = defaultModel(env, id);
  return Array.from(new Set([base, ...values]));
}

export function getAiProviderStatuses(env: Environment = process.env): AiProviderStatus[] {
  return (["openai", "nvidia-nim"] as AiProviderId[]).map((id) => ({
    id,
    configured: configured(env, id),
    defaultModel: id === "openai" ? env.OPENAI_MODEL : env.NIM_MODEL,
    endpoint: configured(env, id) ? endpoint(env, id) : undefined,
    reason: configured(env, id) ? undefined : id === "openai" ? "Set OPENAI_API_KEY and OPENAI_MODEL" : "Set NIM_BASE_URL and NIM_MODEL",
  }));
}

export function getAiProviderPolicy(id: AiProviderId, env: Environment = process.env): AiProviderPolicy {
  if (!configured(env, id)) throw new Error(`${id} is not configured`);
  return { maxInputCharacters: INPUT_LIMIT, maxOutputTokens: OUTPUT_LIMIT, allowedModels: allowedModels(env, id) };
}

export function validateAiGenerationRequest(request: AiGenerationRequest, env: Environment = process.env): AiGenerationRequest {
  if (!request.input?.trim() || request.input.length > INPUT_LIMIT) throw new Error(`Input must contain 1-${INPUT_LIMIT} characters`);
  if (request.instructions && request.instructions.length > 16_000) throw new Error("Instructions exceed 16,000 characters");
  if (request.maxOutputTokens !== undefined && (!Number.isSafeInteger(request.maxOutputTokens) || request.maxOutputTokens < 1 || request.maxOutputTokens > OUTPUT_LIMIT)) {
    throw new Error(`maxOutputTokens must be a whole number from 1-${OUTPUT_LIMIT}`);
  }
  if (request.provider && !configured(env, request.provider)) throw new Error(`${request.provider} is not configured`);
  if (request.provider && request.model && !getAiProviderPolicy(request.provider, env).allowedModels.includes(request.model)) {
    throw new Error(`Model override is not permitted for ${request.provider}`);
  }
  return { ...request, input: request.input.trim() };
}

export function extractResponseText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const response = body as { output_text?: unknown; output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>; choices?: Array<{ message?: { content?: unknown }; text?: unknown }> };
  if (typeof response.output_text === "string") return response.output_text;
  const outputText = response.output?.flatMap((item) => item.content ?? []).filter((content) => content.type === "output_text" && typeof content.text === "string").map((content) => content.text as string).join("\n");
  if (outputText) return outputText;
  const choice = response.choices?.[0];
  return typeof choice?.message?.content === "string" ? choice.message.content : typeof choice?.text === "string" ? choice.text : "";
}

function requestHeaders(env: Environment, id: AiProviderId): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (id === "openai") headers.Authorization = `Bearer ${env.OPENAI_API_KEY}`;
  else if (env.NIM_API_KEY) headers.Authorization = `Bearer ${env.NIM_API_KEY}`;
  return headers;
}

async function requestResponse(id: AiProviderId, request: AiGenerationRequest, env: Environment, fetchImpl: FetchLike): Promise<AiGenerationResponse> {
  const model = request.model ?? defaultModel(env, id);
  const response = await fetchImpl(endpoint(env, id), { method: "POST", headers: requestHeaders(env, id), body: JSON.stringify({ model, input: request.input, ...(request.instructions ? { instructions: request.instructions } : {}), ...(request.maxOutputTokens ? { max_output_tokens: request.maxOutputTokens } : {}) }) });
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new Error(typeof body?.error === "object" && body.error && "message" in body.error ? String((body.error as { message?: unknown }).message) : `Provider returned HTTP ${response.status}`);
  const text = extractResponseText(body);
  if (!text) throw new Error("Provider response did not contain generated text");
  return { provider: id, model, text, responseId: typeof body?.id === "string" ? body.id : undefined, attempts: [{ provider: id, model }] };
}

export async function generateAiResponse(request: AiGenerationRequest, env: Environment = process.env, fetchImpl: FetchLike = globalThis.fetch): Promise<AiGenerationResponse> {
  const validRequest = validateAiGenerationRequest(request, env);
  const primary = validRequest.provider ?? (configured(env, "openai") ? "openai" : "nvidia-nim");
  const candidates = validRequest.allowFallback === false ? [primary] : Array.from(new Set([primary, "openai", "nvidia-nim"])).filter((id): id is AiProviderId => configured(env, id as AiProviderId));
  const attempts: AiGenerationAttempt[] = [];
  for (const provider of candidates) {
    try {
      const result = await requestResponse(provider, { ...validRequest, provider }, env, fetchImpl);
      return { ...result, attempts: [...attempts, ...result.attempts] };
    } catch (error) {
      attempts.push({ provider, model: validRequest.model ?? (configured(env, provider) ? defaultModel(env, provider) : undefined), error: error instanceof Error ? error.message : "Provider request failed" });
    }
  }
  throw new Error(`All configured AI providers failed: ${attempts.map((attempt) => `${attempt.provider}: ${attempt.error}`).join("; ")}`);
}

export async function getAiProviderModels(id: AiProviderId, env: Environment = process.env, fetchImpl: FetchLike = globalThis.fetch, now = Date.now()): Promise<{ provider: AiProviderId; models: string[]; cached: boolean }> {
  if (!configured(env, id)) throw new Error(`${id} is not configured`);
  const cached = modelCache.get(id);
  if (cached && cached.expiresAt > now) return { provider: id, models: cached.models, cached: true };
  const modelsEndpoint = id === "openai" ? "https://api.openai.com/v1/models" : `${trimTrailingSlash(env.NIM_BASE_URL!)}/v1/models`;
  const response = await fetchImpl(modelsEndpoint, { headers: requestHeaders(env, id) });
  const body = await response.json().catch(() => null) as { data?: Array<{ id?: unknown }> } | null;
  if (!response.ok || !Array.isArray(body?.data)) throw new Error(`Unable to list models for ${id}`);
  const models = body.data.map((item) => item.id).filter((model): model is string => typeof model === "string").sort();
  modelCache.set(id, { models, expiresAt: now + MODEL_CACHE_TTL_MS });
  return { provider: id, models, cached: false };
}

export function clearAiProviderModelCache(): void { modelCache.clear(); }

export async function createAiStream(id: AiProviderId, request: AiGenerationRequest, env: Environment = process.env, fetchImpl: FetchLike = globalThis.fetch): Promise<{ provider: AiProviderId; model: string; response: Response }> {
  const validRequest = validateAiGenerationRequest({ ...request, provider: id, allowFallback: false }, env);
  const model = validRequest.model ?? defaultModel(env, id);
  const response = await fetchImpl(endpoint(env, id), { method: "POST", headers: requestHeaders(env, id), body: JSON.stringify({ model, input: validRequest.input, ...(validRequest.instructions ? { instructions: validRequest.instructions } : {}), ...(validRequest.maxOutputTokens ? { max_output_tokens: validRequest.maxOutputTokens } : {}), stream: true }) });
  if (!response.ok || !response.body) throw new Error(`Unable to start ${id} stream`);
  return { provider: id, model, response };
}
