import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createItem,
  deleteItem,
  getItemBySlug,
  getItems,
  seedItemsIfEmpty,
  updateItem,
  switchUserRole,
} from "./db";

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
        return createItem({ ...input, ownerId: ctx.user.openId });
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
        const item = await getItemBySlug(slug);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });

        // Only owner or admin can update
        if (item.ownerId !== ctx.user.openId && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to edit this record" });
        }

        return updateItem(slug, payload);
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
});

export type AppRouter = typeof appRouter;
