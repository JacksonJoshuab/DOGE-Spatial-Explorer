import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../_core/env";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";
import { buildSpatialManifest, filterCommandCenterTimeline, getCommandCenterSnapshot } from "./commandCenter";

const originalEnv = { ...ENV };

const operator = {
  id: 1,
  openId: "command-operator",
  email: "operator@example.com",
  name: "Command Operator",
  loginMethod: "manus",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function makeContext(user: TrpcContext["user"] = operator): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

beforeEach(() => {
  Object.assign(ENV, originalEnv, {
    openAiApiKey: "",
    nvidiaApiKey: "",
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

describe("command-center integration", () => {
  it("builds a key-free readiness snapshot with all core surfaces", async () => {
    const snapshot = await getCommandCenterSnapshot();
    expect(snapshot.health.providers).toHaveLength(5);
    expect(snapshot.overlays).toHaveLength(3);
    expect(snapshot.apple.associationPath).toBe("/.well-known/apple-app-site-association");
    expect(snapshot.posture.checks.some(check => check.id === "server-boundary" && check.passed)).toBe(true);
  });

  it("stages a short-lived manifest without exposing a provider credential", () => {
    const manifest = buildSpatialManifest({
      target: "meta",
      sessionName: "Harbor review",
      sceneRef: "scene://harbor",
      classification: "restricted",
    });
    expect(manifest.manifestId).toMatch(/^spatial_/);
    expect(manifest.state).toContain("staged");
    expect(manifest.safeguards).toContain("No provider credential in payload");
    expect(manifest.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("filters activity records by the requested type and priority", () => {
    expect(filterCommandCenterTimeline({ type: "identity" })).toHaveLength(1);
    expect(filterCommandCenterTimeline({ priority: "critical" })).toHaveLength(1);
    expect(filterCommandCenterTimeline({ type: "unknown" })).toHaveLength(0);
  });

  it("measures a configured OpenAI endpoint probe without returning its credential", async () => {
    ENV.openAiApiKey = "server-test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 })));

    const snapshot = await getCommandCenterSnapshot();
    const diagnostic = snapshot.diagnostics.find(entry => entry.provider === "openai");
    expect(diagnostic).toMatchObject({ configured: true, state: "reachable" });
    expect(diagnostic?.latencyMs).not.toBeNull();
  });
});

describe("command-center router", () => {
  it("requires an authenticated operator", async () => {
    const caller = appRouter.createCaller(makeContext(null));
    await expect(caller.commandCenter.snapshot()).rejects.toThrow();
  });

  it("returns the command-center snapshot and stages an Apple manifest", async () => {
    const caller = appRouter.createCaller(makeContext());
    await expect(caller.commandCenter.snapshot()).resolves.toMatchObject({ health: { total: 5 }, overlays: expect.any(Array) });
    await expect(caller.commandCenter.buildManifest({
      target: "apple",
      sessionName: "Coastal review",
      sceneRef: "scene://coastal",
      classification: "internal",
    })).resolves.toMatchObject({ target: "apple", sessionName: "Coastal review" });
  });
});
