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

/**
 * Work orders created from IoT sensor alerts or manual dispatch.
 * Appears in the Operations Center queue with status lifecycle.
 */
export const workOrders = mysqlTable("work_orders", {
  id: int("id").autoincrement().primaryKey(),
  /** WO-XXXXX display number */
  woNumber: varchar("woNumber", { length: 16 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).notNull().default("normal"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "cancelled"]).notNull().default("open"),
  /** Sensor ID that triggered this work order, if any */
  sensorId: varchar("sensorId", { length: 32 }),
  sensorName: varchar("sensorName", { length: 128 }),
  assignee: varchar("assignee", { length: 128 }).notNull(),
  description: text("description"),
  estimatedHours: varchar("estimatedHours", { length: 8 }),
  /** Actor who created the work order */
  createdBy: varchar("createdBy", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

/**
 * Sensor telemetry readings — one row per tick per sensor.
 * Enables real historical sparklines on the SensorDetail drill-down page.
 * Rows older than 48h should be pruned by a scheduled job.
 */
export const sensorReadings = mysqlTable("sensor_readings", {
  id: int("id").autoincrement().primaryKey(),
  sensorId: varchar("sensorId", { length: 32 }).notNull(),
  sensorName: varchar("sensorName", { length: 128 }).notNull(),
  sensorType: varchar("sensorType", { length: 32 }).notNull(),
  /** Primary numeric reading value (pressure, level, temp, etc.) */
  value: varchar("value", { length: 32 }).notNull(),
  /** Raw reading string from the sensor */
  reading: text("reading").notNull(),
  status: mysqlEnum("status", ["online", "warning", "alert", "offline"]).notNull().default("online"),
  /** UTC epoch ms */
  ts: bigint("ts", { mode: "number" }).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = typeof sensorReadings.$inferInsert;
