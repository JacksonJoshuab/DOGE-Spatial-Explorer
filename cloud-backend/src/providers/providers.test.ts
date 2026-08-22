import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { extractResponseText, generateAiResponse, getAiProviderStatuses } from "./ai.js";
import { verifyMetaAccessToken } from "./meta.js";
import { clearOidcJwksCache, verifyOidcIdToken } from "./oidc.js";
import { createJetsonRegistrationSignature, verifyJetsonRegistration } from "./nvidiaEdge.js";
import { getMicrosoftProfile } from "./microsoftGraph.js";

describe("AI providers", () => {
  it("reports provider configuration without exposing secrets", () => {
    const statuses = getAiProviderStatuses({
      OPENAI_API_KEY: "secret",
      OPENAI_MODEL: "gpt-test",
      NIM_BASE_URL: "https://nim.example.com/",
      NIM_MODEL: "meta/test",
    });

    expect(statuses).toEqual([
      expect.objectContaining({ id: "openai", configured: true, defaultModel: "gpt-test" }),
      expect.objectContaining({ id: "nvidia-nim", configured: true, endpoint: "https://nim.example.com/v1/responses" }),
    ]);
    expect(JSON.stringify(statuses)).not.toContain("secret");
  });

  it("extracts Responses API output text", () => {
    expect(extractResponseText({ output_text: "direct response" })).toBe("direct response");
    expect(extractResponseText({ output: [{ content: [{ type: "output_text", text: "first" }, { type: "output_text", text: "second" }] }] })).toBe("first\nsecond");
  });

  it("sends a NIM-compatible Responses API request", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fakeFetch: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ id: "nim-response-1", output_text: "NIM answer" }), { status: 200 });
    };

    const result = await generateAiResponse(
      { provider: "nvidia-nim", input: "Describe this scene" },
      { NIM_BASE_URL: "https://nim.example.com", NIM_API_KEY: "nim-secret", NIM_MODEL: "meta/test" },
      fakeFetch,
    );

    expect(result).toEqual({ provider: "nvidia-nim", model: "meta/test", text: "NIM answer", responseId: "nim-response-1" });
    expect(calls[0]?.url).toBe("https://nim.example.com/v1/responses");
    expect((calls[0]?.init?.headers as Record<string, string>).Authorization).toBe("Bearer nim-secret");
  });
});

describe("OIDC and Meta provider validation", () => {
  it("validates an ID token against a matching JWKS key, issuer, and audience", async () => {
    clearOidcJwksCache();
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = pair.privateKey.export({ format: "pem", type: "pkcs8" });
    const publicJwk = pair.publicKey.export({ format: "jwk" });
    const token = jwt.sign({ sub: "user-123", email: "user@example.com", name: "Example User" }, privateKey, {
      algorithm: "RS256",
      issuer: "https://issuer.example.com",
      audience: "client-123",
      keyid: "key-1",
      expiresIn: "5m",
    });
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "key-1", use: "sig", alg: "RS256" }] }));

    const identity = await verifyOidcIdToken({
      token,
      issuer: "https://issuer.example.com",
      audience: "client-123",
      jwksUrl: "https://issuer.example.com/keys",
      fetchImpl: fakeFetch,
    });

    expect(identity).toMatchObject({ subject: "user-123", email: "user@example.com", displayName: "Example User" });
  });

  it("rejects a Meta token that does not belong to the configured app", async () => {
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ data: { is_valid: true, app_id: "another-app", user_id: "abc" } }));
    await expect(verifyMetaAccessToken("token", { META_APP_ID: "expected-app", META_APP_SECRET: "secret" }, fakeFetch)).rejects.toThrow("invalid");
  });

  it("accepts a verified Meta application token", async () => {
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ data: { is_valid: true, app_id: "expected-app", user_id: "abc", scopes: ["public_profile"] } }));
    await expect(verifyMetaAccessToken("token", { META_APP_ID: "expected-app", META_APP_SECRET: "secret" }, fakeFetch)).resolves.toEqual({ subject: "abc", scopes: ["public_profile"] });
  });
});

describe("Microsoft Graph and NVIDIA edge", () => {
  it("retrieves a minimal Microsoft Graph profile using a delegated token", async () => {
    const fakeFetch: typeof fetch = async (_url, init) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer delegated-token");
      return new Response(JSON.stringify({ id: "m-1", displayName: "Morgan", mail: "morgan@example.com" }));
    };
    await expect(getMicrosoftProfile("delegated-token", "https://graph.example.com/v1.0", fakeFetch)).resolves.toMatchObject({ id: "m-1", displayName: "Morgan" });
  });

  it("validates time-bounded Jetson HMAC registrations", () => {
    const now = 1_700_000_000_000;
    const secret = "edge-device-secret";
    const signature = createJetsonRegistrationSignature("jetson-01", now, secret);
    expect(verifyJetsonRegistration({ deviceId: "jetson-01", timestamp: now, signature }, { NVIDIA_JETSON_SHARED_SECRET: secret }, now)).toBe(true);
    expect(verifyJetsonRegistration({ deviceId: "jetson-01", timestamp: now - 6 * 60 * 1000, signature }, { NVIDIA_JETSON_SHARED_SECRET: secret }, now)).toBe(false);
  });
});
