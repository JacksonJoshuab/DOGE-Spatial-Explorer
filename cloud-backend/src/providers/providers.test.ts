import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { clearAiProviderModelCache, extractResponseText, generateAiResponse, getAiProviderModels, getAiProviderPolicy, getAiProviderStatuses, validateAiGenerationRequest } from "./ai.js";
import { getProviderReadiness } from "./catalog.js";
import { verifyMetaAccessToken } from "./meta.js";
import { probeMicrosoftGraph } from "./microsoftGraph.js";
import { clearJetsonReplayCache, createJetsonRegistrationSignature, createJetsonTelemetrySignature, verifyJetsonRegistration, verifyJetsonTelemetry } from "./nvidiaEdge.js";
import { clearOidcJwksCache, verifyOidcIdToken } from "./oidc.js";

const OPENAI_ENV = { OPENAI_API_KEY: "openai-secret", OPENAI_MODEL: "gpt-test", OPENAI_ALLOWED_MODELS: "gpt-test,gpt-fallback" };
const NIM_ENV = { NIM_BASE_URL: "https://nim.example.com", NIM_API_KEY: "nim-secret", NIM_MODEL: "meta/test" };

describe("Provider catalog and AI policy", () => {
  it("reports safe provider configuration diagnostics without exposing secrets", () => {
    const readiness = getProviderReadiness({ ...OPENAI_ENV, ...NIM_ENV, META_APP_SECRET: "do-not-leak" });
    expect(readiness.totalProviderCount).toBe(6);
    expect(readiness.providers.find((provider) => provider.id === "meta-quest")?.missingVariables).toContain("META_APP_ID");
    expect(JSON.stringify(readiness)).not.toContain("do-not-leak");
  });

  it("reports AI provider configuration and enforces a provider model allow-list", () => {
    expect(getAiProviderStatuses(OPENAI_ENV)[0]).toMatchObject({ id: "openai", configured: true, defaultModel: "gpt-test" });
    expect(getAiProviderPolicy("openai", OPENAI_ENV).allowedModels).toEqual(["gpt-test", "gpt-fallback"]);
    expect(() => validateAiGenerationRequest({ provider: "openai", input: "hi", model: "not-allowed" }, OPENAI_ENV)).toThrow("not permitted");
  });

  it("extracts Responses API output text", () => {
    expect(extractResponseText({ output_text: "direct response" })).toBe("direct response");
    expect(extractResponseText({ output: [{ content: [{ type: "output_text", text: "first" }, { type: "output_text", text: "second" }] }] })).toBe("first\nsecond");
  });

  it("fails over from OpenAI to NVIDIA NIM and returns explicit attempt metadata", async () => {
    const calls: string[] = [];
    const fakeFetch: typeof fetch = async (url) => {
      calls.push(String(url));
      if (String(url).includes("api.openai.com")) return new Response(JSON.stringify({ error: { message: "temporary outage" } }), { status: 503 });
      return new Response(JSON.stringify({ id: "nim-response-1", output_text: "NIM answer" }));
    };
    const result = await generateAiResponse({ provider: "openai", input: "Describe this scene" }, { ...OPENAI_ENV, ...NIM_ENV }, fakeFetch);
    expect(result).toMatchObject({ provider: "nvidia-nim", text: "NIM answer" });
    expect(result.attempts).toHaveLength(2);
    expect(calls).toEqual(["https://api.openai.com/v1/responses", "https://nim.example.com/v1/responses"]);
  });

  it("caches model discovery responses within the TTL", async () => {
    clearAiProviderModelCache();
    let calls = 0;
    const fakeFetch: typeof fetch = async () => { calls += 1; return new Response(JSON.stringify({ data: [{ id: "meta/test" }, { id: "meta/vision" }] })); };
    const first = await getAiProviderModels("nvidia-nim", NIM_ENV, fakeFetch, 1_000);
    const second = await getAiProviderModels("nvidia-nim", NIM_ENV, fakeFetch, 2_000);
    expect(first).toMatchObject({ cached: false, models: ["meta/test", "meta/vision"] });
    expect(second.cached).toBe(true);
    expect(calls).toBe(1);
  });
});

describe("OIDC, Meta, and Microsoft validation", () => {
  it("validates an ID token against JWKS, issuer, audience, and nonce", async () => {
    clearOidcJwksCache();
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = pair.privateKey.export({ format: "pem", type: "pkcs8" });
    const publicJwk = pair.publicKey.export({ format: "jwk" });
    const token = jwt.sign({ sub: "user-123", email: "user@example.com", name: "Example User", nonce: "nonce-123" }, privateKey, { algorithm: "RS256", issuer: "https://issuer.example.com", audience: "client-123", keyid: "key-1", expiresIn: "5m" });
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "key-1", use: "sig", alg: "RS256" }] }));
    await expect(verifyOidcIdToken({ token, issuer: "https://issuer.example.com", audience: "client-123", jwksUrl: "https://issuer.example.com/keys", nonce: "nonce-123", fetchImpl: fakeFetch })).resolves.toMatchObject({ subject: "user-123" });
    await expect(verifyOidcIdToken({ token, issuer: "https://issuer.example.com", audience: "client-123", jwksUrl: "https://issuer.example.com/keys", nonce: "wrong", fetchImpl: fakeFetch })).rejects.toThrow("nonce");
  });

  it("rejects Meta access tokens that do not belong to the configured app", async () => {
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ data: { is_valid: true, app_id: "another-app", user_id: "abc" } }));
    await expect(verifyMetaAccessToken("token", { META_APP_ID: "expected-app", META_APP_SECRET: "secret" }, fakeFetch)).rejects.toThrow("invalid");
  });

  it("reports Graph readiness without exposing the delegated token", async () => {
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ id: "m-1", displayName: "Morgan", mail: "morgan@example.com" }));
    await expect(probeMicrosoftGraph("delegated-token", "https://graph.example.com/v1.0", fakeFetch)).resolves.toMatchObject({ ready: true, profile: { id: "m-1" } });
  });
});

describe("NVIDIA edge signatures", () => {
  it("validates time-bounded Jetson registrations", () => {
    const now = 1_700_000_000_000;
    const secret = "edge-device-secret";
    const signature = createJetsonRegistrationSignature("jetson-01", now, secret);
    expect(verifyJetsonRegistration({ deviceId: "jetson-01", timestamp: now, signature }, { NVIDIA_JETSON_SHARED_SECRET: secret }, now)).toBe(true);
    expect(verifyJetsonRegistration({ deviceId: "jetson-01", timestamp: now - 6 * 60 * 1000, signature }, { NVIDIA_JETSON_SHARED_SECRET: secret }, now)).toBe(false);
  });

  it("accepts one signed telemetry envelope and rejects its replay", () => {
    clearJetsonReplayCache();
    const now = 1_700_000_000_000;
    const secret = "edge-device-secret";
    const payload = { gpuTempC: 62.5, fps: 59.8, sensors: { lidar: "ready" } };
    const signature = createJetsonTelemetrySignature("jetson-01", now, "nonce-1", payload, secret);
    const envelope = { deviceId: "jetson-01", timestamp: now, nonce: "nonce-1", payload, signature };
    expect(verifyJetsonTelemetry(envelope, { NVIDIA_JETSON_SHARED_SECRET: secret }, now)).toBe(true);
    expect(verifyJetsonTelemetry(envelope, { NVIDIA_JETSON_SHARED_SECRET: secret }, now)).toBe(false);
  });
});
