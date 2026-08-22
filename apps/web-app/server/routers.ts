import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  createItem,
  deleteItem,
  getAuditLog,
  getItemBySlug,
  getItems,
  seedItemsIfEmpty,
  switchUserRole,
  updateItem,
  writeAuditLog,
} from "./db";
import { getEcosystemStatus, runProviderPrompt } from "./integrations/ecosystem";
import { buildSpatialManifest, composeMissionBrief, filterCommandCenterTimeline, getCommandCenterSnapshot } from "./integrations/commandCenter";

const itemStatusEnum = z.enum(["draft", "active", "archived"]);

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

  users: router({
    /** Switch the current user's role — for RBAC demo purposes */
    switchRole: protectedProcedure
      .input(z.object({ role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        return switchUserRole(ctx.user.openId, input.role);
      }),
  }),

  items: router({
    /** List items with pagination, search, and status filter */
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(8),
          query: z.string().default(""),
          status: itemStatusEnum.or(z.literal("")).default(""),
        })
      )
      .query(async ({ ctx, input }) => {
        // Seed demo data on first use
        await seedItemsIfEmpty(ctx.user.openId);
        return getItems(input);
      }),

    /** Get a single item by slug */
    get: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const item = await getItemBySlug(input.slug);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
        return item;
      }),

    /** Create a new item */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(200),
          status: itemStatusEnum,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const item = await createItem({ ...input, ownerId: ctx.user.openId });

        // Write audit log
        await writeAuditLog({
          action: "create",
          resourceType: "item",
          resourceId: item.slug,
          resourceName: item.name,
          actorId: ctx.user.openId,
          actorName: ctx.user.name ?? ctx.user.openId,
          changes: JSON.stringify({ status: { from: null, to: item.status } }),
          context: `New record created with status "${item.status}"`,
        });

        // Notify owner if created as active
        if (item.status === "active") {
          await notifyOwner({
            title: "New Active Record Created",
            content: `Record "${item.name}" was created with status **active** by ${ctx.user.name ?? ctx.user.openId}.`,
          });
        }

        return item;
      }),

    /** Update an existing item */
    update: protectedProcedure
      .input(
        z.object({
          slug: z.string(),
          name: z.string().min(1).max(200).optional(),
          status: itemStatusEnum.optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { slug, ...payload } = input;
        const before = await getItemBySlug(slug);
        if (!before) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });

        // Only owner or admin can update
        if (before.ownerId !== ctx.user.openId && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to edit this record" });
        }

        const after = await updateItem(slug, payload);

        // Build changes object
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        if (payload.name && payload.name !== before.name) {
          changes.name = { from: before.name, to: payload.name };
        }
        if (payload.status && payload.status !== before.status) {
          changes.status = { from: before.status, to: payload.status };
        }

        // Write audit log
        await writeAuditLog({
          action: "update",
          resourceType: "item",
          resourceId: after.slug,
          resourceName: after.name,
          actorId: ctx.user.openId,
          actorName: ctx.user.name ?? ctx.user.openId,
          changes: JSON.stringify(changes),
          context: Object.keys(changes).length > 0
            ? `Updated fields: ${Object.keys(changes).join(", ")}`
            : "No field changes detected",
        });

        // Notify owner when a record is promoted from draft → active
        if (before.status === "draft" && after.status === "active") {
          await notifyOwner({
            title: "Record Promoted to Active",
            content: `Record "${after.name}" was promoted from **draft** to **active** by ${ctx.user.name ?? ctx.user.openId}.`,
          });
        }

        return after;
      }),

    /** Delete an item — admin only */
    delete: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const item = await getItemBySlug(input.slug);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });

        // Only owner or admin can delete
        if (item.ownerId !== ctx.user.openId && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this record" });
        }

        // Write audit log BEFORE deletion (so we have the name)
        await writeAuditLog({
          action: "delete",
          resourceType: "item",
          resourceId: item.slug,
          resourceName: item.name,
          actorId: ctx.user.openId,
          actorName: ctx.user.name ?? ctx.user.openId,
          changes: JSON.stringify({ status: { from: item.status, to: null } }),
          context: `Record permanently deleted`,
        });

        await deleteItem(input.slug);
        return { success: true };
      }),

    /** Get item counts by status for the dashboard */
    stats: protectedProcedure.query(async ({ ctx }) => {
      await seedItemsIfEmpty(ctx.user.openId);
      const [all, active, draft, archived] = await Promise.all([
        getItems({ page: 1, pageSize: 1 }),
        getItems({ page: 1, pageSize: 1, status: "active" }),
        getItems({ page: 1, pageSize: 1, status: "draft" }),
        getItems({ page: 1, pageSize: 1, status: "archived" }),
      ]);
      return {
        total: all.total,
        active: active.total,
        draft: draft.total,
        archived: archived.total,
      };
    }),
  }),

  // ─── AIS Vessel Feed ──────────────────────────────────────────────────────
  ais: router({
    /**
     * Returns AIS vessel positions with deterministic physics-based drift.
     * Positions update every 30 seconds based on heading + speed.
     * This simulates a live AIS feed without requiring a paid API subscription.
     */
    vessels: protectedProcedure.query(() => {
      // Base vessel definitions — these represent the "home" positions
      const BASE_VESSELS = [
        { id: "V001", name: "MV Atlantic Star",      type: "Container",   baseLat: 40.68,  baseLng: -73.97,  speed: 14.2, heading: 220, flag: "US", status: "Underway" },
        { id: "V002", name: "SS Gulf Pioneer",        type: "Tanker",      baseLat: 29.75,  baseLng: -93.85, speed: 11.8, heading: 135, flag: "PA", status: "Underway" },
        { id: "V003", name: "MV Pacific Bridge",      type: "Bulk Carrier",baseLat: 37.82,  baseLng: -122.47,speed: 9.5,  heading: 280, flag: "MH", status: "Anchored" },
        { id: "V004", name: "SS Chesapeake Bay",      type: "Ro-Ro",       baseLat: 36.95,  baseLng: -76.32, speed: 12.1, heading: 45,  flag: "US", status: "Underway" },
        { id: "V005", name: "MV Great Lakes Trader",  type: "Bulk Carrier",baseLat: 43.05,  baseLng: -79.05, speed: 8.3,  heading: 90,  flag: "CA", status: "Underway" },
        { id: "V006", name: "SS Mississippi Queen",   type: "River Barge", baseLat: 29.95,  baseLng: -90.07, speed: 6.1,  heading: 180, flag: "US", status: "Underway" },
        { id: "V007", name: "MV Savannah Express",    type: "Container",   baseLat: 32.08,  baseLng: -80.90, speed: 16.4, heading: 60,  flag: "DE", status: "Underway" },
        { id: "V008", name: "SS Port Arthur",         type: "Tanker",      baseLat: 29.90,  baseLng: -93.93, speed: 0,    heading: 0,   flag: "US", status: "Moored"   },
        { id: "V009", name: "MV Columbia River",      type: "Container",   baseLat: 46.20,  baseLng: -123.8, speed: 10.5, heading: 270, flag: "US", status: "Underway" },
        { id: "V010", name: "SS Tampa Bay Trader",    type: "Bulk Carrier",baseLat: 27.95,  baseLng: -82.45, speed: 7.2,  heading: 160, flag: "PA", status: "Underway" },
        { id: "V011", name: "MV Boston Harbor",       type: "Container",   baseLat: 42.35,  baseLng: -71.05, speed: 13.0, heading: 200, flag: "US", status: "Underway" },
        { id: "V012", name: "SS New Orleans Belle",   type: "River Barge", baseLat: 30.05,  baseLng: -89.95, speed: 5.8,  heading: 0,   flag: "US", status: "Anchored"  },
      ];

      // Calculate elapsed 30-second intervals since a fixed epoch
      const EPOCH = 1700000000000; // fixed reference point
      const INTERVAL_MS = 30_000;  // 30 seconds
      const intervals = Math.floor((Date.now() - EPOCH) / INTERVAL_MS);

      // Knots to degrees per interval (1 knot ≈ 0.000278 deg/s lat, adjusted for 30s)
      const KNOTS_TO_DEG_PER_INTERVAL = 0.000278 * 30;

      return BASE_VESSELS.map((v) => {
        if (v.status !== "Underway" || v.speed === 0) {
          return { ...v, lat: v.baseLat, lng: v.baseLng, lastUpdated: new Date() };
        }

        // Deterministic drift: heading in degrees, convert to lat/lng delta
        const headingRad = (v.heading * Math.PI) / 180;
        const totalDist = v.speed * KNOTS_TO_DEG_PER_INTERVAL * intervals;
        const latDelta = Math.cos(headingRad) * totalDist;
        const lngDelta = Math.sin(headingRad) * totalDist / Math.cos((v.baseLat * Math.PI) / 180);

        // Oscillate using modulo to keep vessels in a bounded patrol area
        const cycle = intervals % 200; // 200 intervals ≈ 100 min patrol cycle
        const phase = cycle < 100 ? cycle : 200 - cycle; // triangle wave 0→100→0
        const factor = phase / 100;

        return {
          ...v,
          lat: v.baseLat + latDelta * factor * 0.1,
          lng: v.baseLng + lngDelta * factor * 0.1,
          lastUpdated: new Date(),
        };
      });
    }),
  }),

  ecosystem: router({
    /** Provider readiness is safe to expose to authenticated operators; keys are never returned. */
    status: protectedProcedure.query(() => getEcosystemStatus()),

    /** Route a bounded operator prompt through a configured server-side AI provider. */
    analyze: protectedProcedure
      .input(
        z.object({
          provider: z.enum(["openai", "nvidia"]),
          prompt: z.string().trim().min(1).max(6000),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await runProviderPrompt(input.provider, input.prompt);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Provider request could not be completed.";
          throw new TRPCError({ code: "PRECONDITION_FAILED", message });
        }
      }),
  }),

  commandCenter: router({
    snapshot: protectedProcedure.query(async () => getCommandCenterSnapshot()),

    buildManifest: protectedProcedure
      .input(z.object({
        target: z.enum(["apple", "meta"]),
        sessionName: z.string().trim().min(3).max(100),
        sceneRef: z.string().trim().min(3).max(160),
        classification: z.enum(["internal", "restricted"]),
      }))
      .mutation(({ input }) => buildSpatialManifest(input)),

    composeBrief: protectedProcedure
      .input(z.object({
        provider: z.enum(["openai", "nvidia"]),
        objective: z.string().trim().min(8).max(1200),
        area: z.string().trim().min(2).max(160),
        priority: z.enum(["routine", "priority", "critical"]),
      }))
      .mutation(async ({ input }) => {
        try {
          return await composeMissionBrief(input);
        } catch (error) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: error instanceof Error ? error.message : "Mission brief could not be generated.",
          });
        }
      }),

    timeline: protectedProcedure
      .input(z.object({ type: z.string().default(""), priority: z.enum(["routine", "priority", "critical", ""]).default("") }))
      .query(({ input }) => filterCommandCenterTimeline(input)),
  }),

  // ─── Audit Log ─────────────────────────────────────────────────────────────
  activity: router({
    /** List audit log entries with pagination and optional filters */
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(20),
          resourceType: z.string().default(""),
          action: z.enum(["create", "update", "delete", ""]).default(""),
        })
      )
      .query(async ({ input }) => {
        return getAuditLog(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
