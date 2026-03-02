import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { insertAuditEntry, queryAuditLog, clearAuditLog } from "./db";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";

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

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ─── Audit Log procedures ───────────────────────────────────────────────────
  audit: router({
    /**
     * Append one audit entry to the persistent log.
     * Also triggers owner push notification for critical severity events.
     */
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

        // Push notification to City Administrator for critical events
        if (input.severity === "critical") {
          try {
            await notifyOwner({
              title: `🚨 Critical Audit Event — ${input.action}`,
              content: `**Actor:** ${input.actor} (${input.actorRole})\n**Target:** ${input.target}\n**Time:** ${input.isoTime}\n**Detail:** ${input.detail ?? "No detail provided"}`,
            });
          } catch (err) {
            console.warn("[Audit] Failed to send push notification:", err);
          }
        }

        return { success: true };
      }),

    /**
     * Query the persistent audit log with optional filters.
     */
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        severity: z.string().optional(),
        actor: z.string().optional(),
        fromTs: z.number().optional(),
        toTs: z.number().optional(),
        limit: z.number().min(1).max(1000).optional(),
      }))
      .query(async ({ input }) => {
        const rows = await queryAuditLog(input);
        return rows;
      }),

    /**
     * Clear all audit log entries (admin only — enforced client-side via RBAC).
     */
    clear: publicProcedure
      .mutation(async () => {
        await clearAuditLog();
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
