/**
 * Vitest: audit tRPC procedures
 * Tests the append, list, and clear mutations/queries using an in-memory mock.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mock the DB helpers so tests run without a real DB ───────────────────────
vi.mock("./db", () => ({
  insertAuditEntry: vi.fn().mockResolvedValue(undefined),
  queryAuditLog: vi.fn().mockResolvedValue([
    {
      id: 1,
      clientId: "AUD-TEST-001",
      ts: 1700000000000,
      isoTime: "2023-11-14T22:13:20.000Z",
      actor: "Leigh Ann Erickson",
      actorRole: "City Administrator",
      category: "rbac",
      action: "ROLE_GRANTED",
      target: "Police Chief — SCIF Management",
      severity: "warning",
      detail: "Test entry",
      createdAt: new Date("2023-11-14T22:13:20.000Z"),
    },
  ]),
  clearAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock the notification helper ────────────────────────────────────────────
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const SAMPLE_ENTRY = {
  clientId: "AUD-TEST-001",
  ts: 1700000000000,
  isoTime: "2023-11-14T22:13:20.000Z",
  actor: "Leigh Ann Erickson",
  actorRole: "City Administrator",
  category: "rbac",
  action: "ROLE_GRANTED",
  target: "Police Chief — SCIF Management",
  severity: "warning" as const,
  detail: "Test entry",
};

describe("audit.append", () => {
  it("inserts an audit entry and returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.audit.append(SAMPLE_ENTRY);
    expect(result).toEqual({ success: true });
  });

  it("calls notifyOwner for critical severity entries", async () => {
    const { notifyOwner } = await import("./_core/notification");
    const caller = appRouter.createCaller(makeCtx());
    await caller.audit.append({ ...SAMPLE_ENTRY, severity: "critical" });
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("Critical IoT Alert") })
    );
  });

  it("does NOT call notifyOwner for info/warning entries", async () => {
    const { notifyOwner } = await import("./_core/notification");
    vi.clearAllMocks();
    const caller = appRouter.createCaller(makeCtx());
    await caller.audit.append({ ...SAMPLE_ENTRY, severity: "info" });
    expect(notifyOwner).not.toHaveBeenCalled();
  });
});

describe("audit.list", () => {
  it("returns audit log rows", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const rows = await caller.audit.list({});
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("clientId");
  });

  it("accepts optional filter params", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const rows = await caller.audit.list({ category: "rbac", limit: 10 });
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe("audit.clear", () => {
  it("clears the audit log and returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.audit.clear();
    expect(result).toEqual({ success: true });
  });
});
