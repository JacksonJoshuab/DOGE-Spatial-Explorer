import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../_core/env";
import { getAppleAppSiteAssociation, getEcosystemStatus, getProviderConfiguration, runProviderPrompt } from "./ecosystem";

const originalEnv = { ...ENV };

beforeEach(() => {
  Object.assign(ENV, originalEnv, {
    openAiApiKey: "",
    openAiModel: "gpt-4.1-mini",
    nvidiaApiKey: "",
    nvidiaNimBaseUrl: "https://integrate.api.nvidia.com/v1",
    nvidiaNimModel: "",
    metaHorizonAppId: "",
    appleAppId: "",
    appleAssociatedDomain: "",
    microsoftTenantId: "",
    microsoftClientId: "",
    microsoftClientSecret: "",
  });
});

afterEach(() => {
  Object.assign(ENV, originalEnv);
  vi.unstubAllGlobals();
});

describe("ecosystem integration configuration", () => {
  it("reports all requested vendor integration surfaces without exposing secret values", () => {
    const status = getEcosystemStatus();
    expect(status.map(entry => entry.id)).toEqual(["openai", "nvidia", "meta", "apple", "microsoft"]);
    expect(status.every(entry => entry.requiredSettings.length > 0)).toBe(true);
  });

  it("keeps the provider endpoints server-side and returns a safe Apple association shape", () => {
    expect(getProviderConfiguration("openai").endpoint).toBe("https://api.openai.com/v1/responses");
    expect(getProviderConfiguration("nvidia").endpoint).toContain("/responses");
    expect(getAppleAppSiteAssociation()).toEqual({ applinks: { details: [] } });
  });
});

describe("runProviderPrompt", () => {
  it("rejects an unconfigured provider before issuing a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(runProviderPrompt("openai", "Assess this route.")).rejects.toThrow("OpenAI is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes an OpenAI response request server-side and extracts output text", async () => {
    ENV.openAiApiKey = "server-only-test-key";
    ENV.openAiModel = "gpt-test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: "Operational summary" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(runProviderPrompt("openai", "Assess this route.")).resolves.toEqual({
      provider: "openai",
      model: "gpt-test",
      text: "Operational summary",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ authorization: "Bearer server-only-test-key" }) })
    );
  });

  it("uses the NVIDIA response endpoint and handles response failures", async () => {
    ENV.nvidiaApiKey = "nvidia-test-key";
    ENV.nvidiaNimModel = "meta/llama-test";
    ENV.nvidiaNimBaseUrl = "https://nim.example.test/v1/";
    const fetchMock = vi.fn().mockResolvedValue(new Response("upstream unavailable", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(runProviderPrompt("nvidia", "Assess this route.")).rejects.toThrow("NVIDIA NIM request failed with status 502");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://nim.example.test/v1/responses",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer nvidia-test-key" }) })
    );
  });

  it("extracts NVIDIA output through the same normalized response contract", async () => {
    ENV.nvidiaApiKey = "nvidia-test-key";
    ENV.nvidiaNimModel = "meta/llama-test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output: [{ content: [{ text: "NIM operational summary" }] }] }), { status: 200 })
    ));

    await expect(runProviderPrompt("nvidia", "Assess this route.")).resolves.toEqual({
      provider: "nvidia",
      model: "meta/llama-test",
      text: "NIM operational summary",
    });
  });
});
