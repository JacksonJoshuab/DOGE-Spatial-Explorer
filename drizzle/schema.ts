import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Base32-encoded TOTP secret generated at MFA enrollment. Null until enrolled. */
  totpSecret: varchar("totpSecret", { length: 64 }),
  /** Whether MFA has been fully enrolled and verified for this account. */
  mfaEnabled: int("mfaEnabled").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Persistent audit log for RBAC changes, access denials, and critical security events.
 * Every permission toggle, staff change, route access denial, and sensor alert is written here.
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  /** Client-generated unique ID (e.g. AUDIT-001) for display in the UI */
  clientId: varchar("clientId", { length: 32 }).notNull(),
  /** UTC timestamp as epoch ms — stored as bigint for precision */
  ts: bigint("ts", { mode: "number" }).notNull(),
  /** Human-readable ISO timestamp string for quick queries */
  isoTime: varchar("isoTime", { length: 32 }).notNull(),
  /** Actor name (staff name or system) */
  actor: varchar("actor", { length: 128 }).notNull(),
  /** Municipal role of the actor at time of event */
  actorRole: varchar("actorRole", { length: 64 }).notNull(),
  /** Audit category: rbac | access | iot | finance | system */
  category: varchar("category", { length: 32 }).notNull(),
  /** Short action code e.g. ROLE_GRANTED, ACCESS_DENIED, SENSOR_ALERT */
  action: varchar("action", { length: 64 }).notNull(),
  /** Target resource or entity affected */
  target: text("notNull").notNull(),
  /** Severity: info | warning | critical */
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull().default("info"),
  /** Full detail text for the audit record */
  detail: text("detail"),
  /** Created at for DB-level ordering */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogRow = typeof auditLog.$inferSelect;
export type InsertAuditLogRow = typeof auditLog.$inferInsert;
