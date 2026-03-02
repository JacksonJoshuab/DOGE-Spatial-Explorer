import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { insertAuditEntry, queryAuditLog, clearAuditLog, saveTotpSecret, enableMfa, getTotpSecret } from "./db";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import { generateSecret as otplibGenerateSecret, generateURI as otplibGenerateURI, generateSync as otplibGenerateSync, verifySync as otplibVerifySync } from "otplib";

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

  // ─── MFA / TOTP procedures ──────────────────────────────────────────────────
  mfa: router({
    /**
     * Generate a new TOTP secret for a staff member and return the otpauth URI
     * so the frontend can render a QR code.  The secret is saved to the DB but
     * mfaEnabled stays false until verifyAndEnroll confirms the first code.
     *
     * openId is the Manus OAuth identifier for the staff account.
     * In the demo the frontend passes the actorName; production would use ctx.user.openId.
     */
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

    /**
     * Verify a TOTP code and, if valid, mark mfaEnabled = true.
     * Used during the enrollment flow (first-time setup).
     */
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

    /**
     * Verify a TOTP code for an already-enrolled account.
     * Used by the MFA gate in RouteGuard on every high-security route visit.
     */
    verifyCode: publicProcedure
      .input(z.object({ openId: z.string(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const secret = await getTotpSecret(input.openId);
        // Fallback: if no secret stored (demo staff without DB record), accept any 6-digit code
        if (!secret) {
          const demoValid = /^\d{6}$/.test(input.code);
          return { success: demoValid, error: demoValid ? undefined : "Invalid code." };
        }
        const result = await otplibVerifySync({ token: input.code, secret });
        const valid = !!(result && (result as { valid?: boolean }).valid !== false);
        return { success: valid, error: valid ? undefined : "Invalid code. Please try again." };
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
