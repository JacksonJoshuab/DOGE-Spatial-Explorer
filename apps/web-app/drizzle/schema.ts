import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Intelligence records table — persists CRUD items across sessions.
 */
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  /** Human-readable slug like "i1", "i2" for URL routing */
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  ownerId: varchar("ownerId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

/**
 * Audit log table — records every create/update/delete action with user, timestamp, and changed fields.
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  /** The action performed */
  action: mysqlEnum("action", ["create", "update", "delete"]).notNull(),
  /** The resource type (e.g., "item") */
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  /** The resource identifier (slug or id) */
  resourceId: varchar("resourceId", { length: 64 }).notNull(),
  /** Human-readable resource name at the time of the action */
  resourceName: varchar("resourceName", { length: 200 }),
  /** The user who performed the action */
  actorId: varchar("actorId", { length: 64 }).notNull(),
  actorName: varchar("actorName", { length: 200 }),
  /** JSON-encoded changed fields: { field: { from, to } } */
  changes: text("changes"),
  /** Additional context (e.g., status transition details) */
  context: text("context"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
