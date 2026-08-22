import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export const jobSites = mysqlTable("aac_job_sites", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  client: varchar("client", { length: 160 }),
  location: varchar("location", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "scheduled", "standby", "complete", "on_hold"]).default("scheduled").notNull(),
  pourDate: varchar("pourDate", { length: 32 }),
  pourStart: varchar("pourStart", { length: 32 }),
  pourEnd: varchar("pourEnd", { length: 32 }),
  plannedYards: int("plannedYards").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fleetEquipment = mysqlTable("aac_fleet_equipment", {
  id: int("id").autoincrement().primaryKey(),
  unitNumber: varchar("unitNumber", { length: 32 }).notNull().unique(),
  type: varchar("type", { length: 96 }).notNull(),
  status: mysqlEnum("status", ["operational", "maintenance", "alert", "offline"]).default("operational").notNull(),
  fuelPercent: int("fuelPercent").default(100).notNull(),
  mileage: int("mileage").default(0).notNull(),
  assignment: varchar("assignment", { length: 160 }),
  operator: varchar("operator", { length: 120 }),
  lastService: varchar("lastService", { length: 32 }),
  serviceDue: varchar("serviceDue", { length: 32 }),
  maintenanceNote: text("maintenanceNote"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const crewMembers = mysqlTable("aac_crew_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 96 }).notNull(),
  availability: mysqlEnum("availability", ["assigned", "available", "off", "unavailable"]).default("available").notNull(),
  assignment: varchar("assignment", { length: 160 }),
  shift: varchar("shift", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const materials = mysqlTable("aac_materials", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  unit: varchar("unit", { length: 24 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).default("0.00").notNull(),
  reorderThreshold: decimal("reorderThreshold", { precision: 12, scale: 2 }).default("0.00").notNull(),
  supplier: varchar("supplier", { length: 160 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const operationalAlerts = mysqlTable("aac_operational_alerts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("info").notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  detail: text("detail").notNull(),
  status: mysqlEnum("status", ["active", "acknowledged", "resolved"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dailyBriefs = mysqlTable("aac_daily_briefs", {
  id: int("id").autoincrement().primaryKey(),
  briefDate: varchar("briefDate", { length: 16 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: text("content").notNull(),
  notificationDelivered: int("notificationDelivered").default(0).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export const dailyBriefActions = mysqlTable("aac_daily_brief_actions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  owner: varchar("owner", { length: 120 }),
  priority: mysqlEnum("priority", ["critical", "high", "normal", "low"]).default("normal").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "complete"]).default("open").notNull(),
  dueLabel: varchar("dueLabel", { length: 64 }),
  source: varchar("source", { length: 120 }).default("Daily Brief").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const alertActivities = mysqlTable("aac_alert_activities", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alertId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  note: text("note"),
  actor: varchar("actor", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dailyKpiSnapshots = mysqlTable("aac_daily_kpi_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: varchar("snapshotDate", { length: 16 }).notNull(),
  utilization: int("utilization").notNull(),
  materialExposure: int("materialExposure").notNull(),
  unresolvedExceptions: int("unresolvedExceptions").notNull(),
  fleetReadiness: int("fleetReadiness").notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
