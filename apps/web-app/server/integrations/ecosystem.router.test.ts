import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../_core/env";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";

const originalEnv = { ...ENV };

function makeContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const user = {
  id: 1,
  openId: "operator-1",
  email: "operator@example.com",
  name: "Operator",
  loginMethod: "manus",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

beforeEach(() => {
  Object.assign(ENV, originalEnv, { openAiApiKey: "", nvidiaApiKey: "", nvidiaNimModel: "" });
});

afterEach(() => Object.assign(ENV, originalEnv));

describe("ecosystem router", () => {
  it("requires authentication for ecosystem status", async () => {
    const caller = appRouter.createCaller(makeContext(null));
    await expect(caller.ecosystem.status()).rejects.toThrow();
  });

  it("returns the five non-secret provider status records to an authenticated operator", async () => {
    const caller = appRouter.createCaller(makeContext(user));
    const status = await caller.ecosystem.status();
    expect(status).toHaveLength(5);
    expect(status.find(entry => entry.id === "openai")?.requiredSettings).toContain("OPENAI_API_KEY");
  });

  it("validates prompt input and translates an unavailable provider to a safe procedure error", async () => {
    const caller = appRouter.createCaller(makeContext(user));
    await expect(caller.ecosystem.analyze({ provider: "openai", prompt: "" })).rejects.toThrow();
    await expect(caller.ecosystem.analyze({ provider: "openai", prompt: "Assess this route." })).rejects.toThrow("OpenAI is not configured");
  });

  it("returns a normalized successful provider result through the protected procedure", async () => {
    ENV.openAiApiKey = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: "Ready for dispatch" }), { status: 200 })));
    const caller = appRouter.createCaller(makeContext(user));

    await expect(caller.ecosystem.analyze({ provider: "openai", prompt: "Assess this route." })).resolves.toEqual({
      provider: "openai",
      model: "gpt-4.1-mini",
      text: "Ready for dispatch",
    });
  });
});
