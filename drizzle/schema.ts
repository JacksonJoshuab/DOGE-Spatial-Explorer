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

// ─── EMS & Fire Service Suite ────────────────────────────────────────────────

/**
 * EMS / Fire units — ambulances, fire engines, command vehicles, and transmission devices.
 * Each unit has a real-time position, status, and crew assignment.
 */
export const emsUnits = mysqlTable("ems_units", {
  id: int("id").autoincrement().primaryKey(),
  /** Unit identifier e.g. AMB-1, ENG-2, CMD-1, DRONE-1 */
  unitId: varchar("unitId", { length: 16 }).notNull().unique(),
  unitType: mysqlEnum("unitType", ["ambulance", "fire_engine", "ladder", "command", "rescue", "hazmat", "drone", "radio_tower"]).notNull(),
  callSign: varchar("callSign", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["available", "dispatched", "on_scene", "transporting", "at_hospital", "returning", "out_of_service", "standby"]).notNull().default("available"),
  /** Current crew members (comma-separated names) */
  crew: text("crew"),
  /** Current latitude (stored as string for precision) */
  lat: varchar("lat", { length: 20 }),
  /** Current longitude */
  lng: varchar("lng", { length: 20 }),
  /** Speed in mph */
  speedMph: int("speedMph").default(0),
  /** Heading in degrees 0-359 */
  heading: int("heading").default(0),
  /** Current incident ID if dispatched */
  currentIncidentId: int("currentIncidentId"),
  /** Vehicle make/model/year */
  vehicle: varchar("vehicle", { length: 128 }),
  /** License plate */
  plate: varchar("plate", { length: 16 }),
  /** Last GPS ping timestamp (epoch ms) */
  lastPingTs: bigint("lastPingTs", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmsUnit = typeof emsUnits.$inferSelect;
export type InsertEmsUnit = typeof emsUnits.$inferInsert;

/**
 * EMS / Fire incidents — 911 calls, medical emergencies, fire responses.
 * Tracks the full lifecycle from dispatch to resolution.
 */
export const emsIncidents = mysqlTable("ems_incidents", {
  id: int("id").autoincrement().primaryKey(),
  /** INC-YYYYMMDD-XXXX display number */
  incidentNumber: varchar("incidentNumber", { length: 24 }).notNull().unique(),
  incidentType: mysqlEnum("incidentType", ["medical", "fire", "mva", "hazmat", "rescue", "mutual_aid", "public_assist", "false_alarm"]).notNull(),
  /** Priority 1-4 (1 = life-threatening) */
  priority: mysqlEnum("priority", ["P1", "P2", "P3", "P4"]).notNull().default("P2"),
  status: mysqlEnum("status", ["pending", "dispatched", "on_scene", "transporting", "resolved", "cancelled"]).notNull().default("pending"),
  /** Incident address */
  address: varchar("address", { length: 256 }).notNull(),
  city: varchar("city", { length: 64 }).notNull().default("West Liberty"),
  state: varchar("state", { length: 2 }).notNull().default("IA"),
  lat: varchar("lat", { length: 20 }),
  lng: varchar("lng", { length: 20 }),
  /** Patient name (HIPAA — display only to authorized roles) */
  patientName: varchar("patientName", { length: 128 }),
  patientDob: varchar("patientDob", { length: 16 }),
  patientInsurance: varchar("patientInsurance", { length: 128 }),
  /** Dispatched unit IDs (comma-separated) */
  dispatchedUnits: text("dispatchedUnits"),
  /** Lead crew member */
  leadCrew: varchar("leadCrew", { length: 128 }),
  /** Narrative / incident notes */
  narrative: text("narrative"),
  /** NEMSIS incident type code */
  nemsisCode: varchar("nemsisCode", { length: 16 }),
  /** NFIRS incident type code */
  nfirsCode: varchar("nfirsCode", { length: 16 }),
  /** Receiving hospital */
  hospital: varchar("hospital", { length: 128 }),
  dispatchedAt: timestamp("dispatchedAt"),
  onSceneAt: timestamp("onSceneAt"),
  transportedAt: timestamp("transportedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmsIncident = typeof emsIncidents.$inferSelect;
export type InsertEmsIncident = typeof emsIncidents.$inferInsert;

/**
 * EMS billing records — insurance claims, Medicare/Medicaid, and government billing.
 * One billing record per incident; tracks claim lifecycle from draft to paid.
 */
export const emsBilling = mysqlTable("ems_billing", {
  id: int("id").autoincrement().primaryKey(),
  /** BILL-XXXXXXXX display number */
  billNumber: varchar("billNumber", { length: 20 }).notNull().unique(),
  incidentId: int("incidentId").notNull(),
  incidentNumber: varchar("incidentNumber", { length: 24 }).notNull(),
  patientName: varchar("patientName", { length: 128 }),
  billingType: mysqlEnum("billingType", ["insurance", "medicare", "medicaid", "self_pay", "government", "workers_comp"]).notNull(),
  insurerName: varchar("insurerName", { length: 128 }),
  policyNumber: varchar("policyNumber", { length: 64 }),
  groupNumber: varchar("groupNumber", { length: 64 }),
  /** Primary ICD-10 diagnosis code */
  icd10Code: varchar("icd10Code", { length: 16 }),
  /** HCPCS/CPT transport code */
  transportCode: varchar("transportCode", { length: 16 }),
  /** Billed amount in cents */
  billedAmountCents: int("billedAmountCents").notNull().default(0),
  /** Allowed amount in cents */
  allowedAmountCents: int("allowedAmountCents").default(0),
  /** Paid amount in cents */
  paidAmountCents: int("paidAmountCents").default(0),
  /** Patient responsibility in cents */
  patientResponsibilityCents: int("patientResponsibilityCents").default(0),
  status: mysqlEnum("status", ["draft", "submitted", "pending", "approved", "denied", "appealed", "paid", "written_off"]).notNull().default("draft"),
  /** Denial reason code if denied */
  denialCode: varchar("denialCode", { length: 32 }),
  denialReason: text("denialReason"),
  submittedAt: timestamp("submittedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmsBilling = typeof emsBilling.$inferSelect;
export type InsertEmsBilling = typeof emsBilling.$inferInsert;

/**
 * EMS compliance records — NEMSIS, NFIRS, PCR, and certification tracking.
 */
export const emsCompliance = mysqlTable("ems_compliance", {
  id: int("id").autoincrement().primaryKey(),
  complianceType: mysqlEnum("complianceType", ["nemsis", "nfirs", "pcr", "certification", "equipment_check", "training", "hipaa", "cms_audit"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["compliant", "due", "overdue", "in_review", "waived"]).notNull().default("due"),
  /** Related incident ID if applicable */
  incidentId: int("incidentId"),
  /** Assigned staff member */
  assignedTo: varchar("assignedTo", { length: 128 }),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  /** Notes or corrective action */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmsCompliance = typeof emsCompliance.$inferSelect;
export type InsertEmsCompliance = typeof emsCompliance.$inferInsert;
