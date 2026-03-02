import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  insertAuditEntry, queryAuditLog, clearAuditLog,
  saveTotpSecret, enableMfa, getTotpSecret,
  createWorkOrder, listWorkOrders, updateWorkOrderStatus, updateWorkOrderAssignee, getWorkOrdersBySensor,
  recordSensorReading, getSensorReadings, pruneOldSensorReadings,
} from "./db";
import { z } from "zod";
import {
  fetchFederalRegister,
  fetchCensusData,
  fetchBlsData,
  fetchBlsTrend,
  fetchIowaGovFeeds,
  fetchLocalNewsFeeds,
  fetchSocialFeeds,
  fetchGrantsGov,
} from "./feeds";
import { notifyOwner } from "./_core/notification";
import { emsRouter } from "./ems";
import { dispatchCriticalAlert } from "./alertDispatcher";
import {
  generateSecret as otplibGenerateSecret,
  generateURI as otplibGenerateURI,
  verifySync as otplibVerifySync,
} from "otplib";

// ─── Audit entry input schema ─────────────────────────────────────────────────
const auditEntryInput = z.object({
  clientId: z.string(),
  ts: z.number(),
  isoTime: z.string(),
  actor: z.string(),
  actorRole: z.string(),
  category: z.string(),
  action: z.string(),
  target: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  detail: z.string().optional(),
});

// ─── Work Orders router ───────────────────────────────────────────────────────
const workOrdersRouter = router({
  /** Create a new work order (from sensor alert or manual dispatch). */
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
      sensorId: z.string().optional(),
      sensorName: z.string().optional(),
      assignee: z.string().min(1).max(128),
      description: z.string().optional(),
      estimatedHours: z.string().optional(),
      createdBy: z.string().min(1).max(128),
    }))
    .mutation(async ({ input }) => {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.floor(1000 + Math.random() * 9000);
      const woNumber = `WO-${datePart}-${rand}`;
      await createWorkOrder({
        woNumber,
        title: input.title,
        priority: input.priority,
        sensorId: input.sensorId ?? null,
        sensorName: input.sensorName ?? null,
        assignee: input.assignee,
        description: input.description ?? null,
        estimatedHours: input.estimatedHours ?? null,
        createdBy: input.createdBy,
      });
      // Notify on all new work orders — critical ones also trigger email/SMS
      try {
        await dispatchCriticalAlert({
          action: "WORK_ORDER_CREATED",
          actor: input.createdBy,
          actorRole: "staff",
          target: woNumber,
          isoTime: new Date().toISOString(),
          category: "work_order",
          severity: input.priority === "critical" ? "critical" : "info",
          detail: `${input.title} | Assignee: ${input.assignee} | Priority: ${input.priority.toUpperCase()}`,
        });
      } catch (err) {
        console.warn("[WorkOrders] Failed to dispatch alert:", err);
      }
      return { success: true, woNumber };
    }),

  /** List all work orders, newest first. */
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional() }))
    .query(async ({ input }) => listWorkOrders(input.limit ?? 100)),

  /** Update the status of a work order (Open → In Progress → Resolved). */
  updateStatus: publicProcedure
    .input(z.object({
      woNumber: z.string(),
      status: z.enum(["open", "in_progress", "resolved", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      await updateWorkOrderStatus(input.woNumber, input.status);
      return { success: true };
    }),

  /** Reassign a work order to a different staff member. */
  updateAssignee: publicProcedure
    .input(z.object({
      woNumber: z.string(),
      assignee: z.string().min(1).max(128),
      reassignedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateWorkOrderAssignee(input.woNumber, input.assignee);
      try {
        await dispatchCriticalAlert({
          action: "WORK_ORDER_REASSIGNED",
          actor: input.reassignedBy ?? "system",
          actorRole: "staff",
          target: input.woNumber,
          isoTime: new Date().toISOString(),
          category: "work_order",
          severity: "info",
          detail: `Reassigned to ${input.assignee}`,
        });
      } catch (err) {
        console.warn("[WorkOrders] Failed to dispatch reassign alert:", err);
      }
      return { success: true };
    }),

  /** Get work orders for a specific sensor. */
  bySensor: publicProcedure
    .input(z.object({ sensorId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => getWorkOrdersBySensor(input.sensorId, input.limit ?? 50)),
});

// ─── Sensor Readings router ───────────────────────────────────────────────────
const sensorReadingsRouter = router({
  /** Record a single sensor telemetry tick. */
  record: publicProcedure
    .input(z.object({
      sensorId: z.string(),
      sensorName: z.string(),
      sensorType: z.string(),
      value: z.string(),
      reading: z.string(),
      status: z.enum(["online", "warning", "alert", "offline"]),
      ts: z.number(),
    }))
    .mutation(async ({ input }) => {
      await recordSensorReading(input);
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      pruneOldSensorReadings(cutoff).catch(() => {/* best-effort */});
      return { success: true };
    }),

  /** Get the last 24 hours of readings for a sensor, newest-first. */
  getLast24h: publicProcedure
    .input(z.object({ sensorId: z.string() }))
    .query(async ({ input }) => {
      const sinceTs = Date.now() - 24 * 60 * 60 * 1000;
      return getSensorReadings(input.sensorId, sinceTs, 300);
    }),
});

// ─── Main app router ──────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── MFA / TOTP procedures ────────────────────────────────────────────────
  mfa: router({
    generateSecret: publicProcedure
      .input(z.object({ openId: z.string(), accountName: z.string() }))
      .mutation(async ({ input }) => {
        const secret = otplibGenerateSecret();
        await saveTotpSecret(input.openId, secret);
        const otpauthUrl = otplibGenerateURI({
          secret,
          label: input.accountName,
          issuer: "West Liberty Municipal",
        });
        return { secret, otpauthUrl };
      }),

    verifyAndEnroll: publicProcedure
      .input(z.object({ openId: z.string(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const secret = await getTotpSecret(input.openId);
        if (!secret) return { success: false, error: "No TOTP secret found. Generate a secret first." };
        const result = await otplibVerifySync({ token: input.code, secret });
        const valid = result && (result as { valid?: boolean }).valid !== false;
        if (!valid) return { success: false, error: "Invalid code. Please try again." };
        await enableMfa(input.openId);
        return { success: true };
      }),

    verifyCode: publicProcedure
      .input(z.object({ openId: z.string(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const secret = await getTotpSecret(input.openId);
        if (!secret) {
          const demoValid = /^\d{6}$/.test(input.code);
          return { success: demoValid, error: demoValid ? undefined : "Invalid code." };
        }
        const result = await otplibVerifySync({ token: input.code, secret });
        const valid = !!(result && (result as { valid?: boolean }).valid !== false);
        return { success: valid, error: valid ? undefined : "Invalid code. Please try again." };
      }),
  }),

  // ─── Audit Log procedures ─────────────────────────────────────────────────
  audit: router({
    append: publicProcedure
      .input(auditEntryInput)
      .mutation(async ({ input }) => {
        await insertAuditEntry({
          clientId: input.clientId,
          ts: input.ts,
          isoTime: input.isoTime,
          actor: input.actor,
          actorRole: input.actorRole,
          category: input.category,
          action: input.action,
          target: input.target,
          severity: input.severity,
          detail: input.detail ?? null,
        });
        if (input.severity === "critical") {
          // Dispatch to all configured channels: Manus push, SendGrid email, Twilio SMS
          dispatchCriticalAlert({
            action: input.action,
            actor: input.actor,
            actorRole: input.actorRole,
            target: input.target,
            isoTime: input.isoTime,
            category: input.category,
            severity: input.severity,
            detail: input.detail,
          }).catch(err => console.warn("[Audit] Alert dispatch error:", err));
        }
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        severity: z.string().optional(),
        actor: z.string().optional(),
        fromTs: z.number().optional(),
        toTs: z.number().optional(),
        limit: z.number().min(1).max(1000).optional(),
      }))
      .query(async ({ input }) => queryAuditLog(input)),

    clear: publicProcedure
      .mutation(async () => {
        await clearAuditLog();
        return { success: true };
      }),
  }),

  // ─── Feature sub-routers ──────────────────────────────────────────────────
  workOrders: workOrdersRouter,
  sensorReadings: sensorReadingsRouter,

  // ─── Intelligence Feed Hub ────────────────────────────────────────────────
  feeds: router({
    /** Federal Register — regulations, executive orders, rules */
    federalRegister: publicProcedure
      .input(z.object({ query: z.string().optional() }))
      .query(async ({ input }) => fetchFederalRegister(input.query ?? "municipal infrastructure Iowa")),

    /** US Census ACS — Muscatine County demographic & economic data */
    census: publicProcedure
      .query(async () => fetchCensusData()),

    /** BLS — Muscatine County unemployment, CPI, employment */
    bls: publicProcedure
      .query(async () => fetchBlsData()),

    /** BLS Quarterly Trend — 8-quarter history for unemployment rate and labor force */
    blsTrend: publicProcedure
      .query(async () => fetchBlsTrend()),

    /** Iowa state government news & policy RSS */
    iowaGov: publicProcedure
      .query(async () => fetchIowaGovFeeds()),

    /** Local news RSS — Muscatine Journal, Iowa Public Radio, Radio Iowa */
    localNews: publicProcedure
      .query(async () => fetchLocalNewsFeeds()),

    /** Social media — Reddit r/Iowa, r/IowaCity */
    social: publicProcedure
      .query(async () => fetchSocialFeeds()),

    /** Grants.gov — open opportunities for Iowa municipal infrastructure */
    grants: publicProcedure
      .input(z.object({ keyword: z.string().optional() }))
      .query(async ({ input }) => fetchGrantsGov(input.keyword ?? "Iowa municipal infrastructure")),
  }),
  ems: emsRouter,
});

export type AppRouter = typeof appRouter;
