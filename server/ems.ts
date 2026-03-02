/**
 * EMS & Fire Service Suite — DB helpers and tRPC router
 * Covers: incidents, units, billing, compliance
 */
import { and, desc, eq, gte, like, or } from "drizzle-orm";
import {
  EmsBilling,
  EmsCompliance,
  EmsIncident,
  EmsUnit,
  InsertEmsBilling,
  InsertEmsCompliance,
  InsertEmsIncident,
  InsertEmsUnit,
  emsBilling,
  emsCompliance,
  emsIncidents,
  emsUnits,
} from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

// ─── Seed helpers ─────────────────────────────────────────────────────────────

const SEED_UNITS: InsertEmsUnit[] = [
  { unitId: "AMB-1", unitType: "ambulance", callSign: "Medic 1", status: "available", crew: "J. Rivera, T. Chen", lat: "41.5728", lng: "-91.2612", vehicle: "2022 Ford F-450 Type III", plate: "EMS-001", lastPingTs: Date.now() },
  { unitId: "AMB-2", unitType: "ambulance", callSign: "Medic 2", status: "dispatched", crew: "S. Patel, L. Johnson", lat: "41.5741", lng: "-91.2589", vehicle: "2021 Chevy Express Type II", plate: "EMS-002", lastPingTs: Date.now() },
  { unitId: "ENG-1", unitType: "fire_engine", callSign: "Engine 1", status: "available", crew: "Capt. Williams, F. Garcia, M. Lee, D. Brown", lat: "41.5715", lng: "-91.2634", vehicle: "2020 Pierce Enforcer Pumper", plate: "FIRE-001", lastPingTs: Date.now() },
  { unitId: "ENG-2", unitType: "fire_engine", callSign: "Engine 2", status: "on_scene", crew: "Lt. Davis, R. Martinez, K. Wilson", lat: "41.5698", lng: "-91.2601", vehicle: "2019 E-ONE Typhoon Pumper", plate: "FIRE-002", lastPingTs: Date.now() },
  { unitId: "LAD-1", unitType: "ladder", callSign: "Ladder 1", status: "available", crew: "Capt. Thompson, A. Harris, B. Clark", lat: "41.5715", lng: "-91.2634", vehicle: "2018 Sutphen Aerial Platform 75'", plate: "FIRE-003", lastPingTs: Date.now() },
  { unitId: "CMD-1", unitType: "command", callSign: "Command 1", status: "standby", crew: "Chief Anderson", lat: "41.5722", lng: "-91.2620", vehicle: "2023 Chevy Tahoe", plate: "CMD-001", lastPingTs: Date.now() },
  { unitId: "HAZ-1", unitType: "hazmat", callSign: "HazMat 1", status: "available", crew: "Spec. Robinson, Spec. White", lat: "41.5715", lng: "-91.2634", vehicle: "2021 International HazMat Unit", plate: "HAZ-001", lastPingTs: Date.now() },
  { unitId: "DRONE-1", unitType: "drone", callSign: "UAV Alpha", status: "standby", crew: "Operator: T. Kim", lat: "41.5715", lng: "-91.2634", vehicle: "DJI Matrice 300 RTK", plate: "N/A", lastPingTs: Date.now() },
  { unitId: "TOWER-1", unitType: "radio_tower", callSign: "Dispatch Tower", status: "available", lat: "41.5720", lng: "-91.2625", vehicle: "Fixed Installation", plate: "N/A", lastPingTs: Date.now() },
];

const SEED_INCIDENTS: InsertEmsIncident[] = [
  {
    incidentNumber: "INC-20240301-0001", incidentType: "medical", priority: "P1", status: "resolved",
    address: "123 Elm St", city: "West Liberty", state: "IA", lat: "41.5731", lng: "-91.2598",
    patientName: "J. Doe", patientInsurance: "Wellmark BCBS", dispatchedUnits: "AMB-1",
    leadCrew: "J. Rivera", hospital: "University of Iowa Hospitals", nemsisCode: "2207015",
    narrative: "Chest pain, 67M. Transported to UIHC. Vitals stable on arrival.",
    dispatchedAt: new Date("2024-03-01T08:14:00Z"), onSceneAt: new Date("2024-03-01T08:22:00Z"),
    transportedAt: new Date("2024-03-01T08:35:00Z"), resolvedAt: new Date("2024-03-01T09:10:00Z"),
  },
  {
    incidentNumber: "INC-20240301-0002", incidentType: "fire", priority: "P1", status: "resolved",
    address: "456 Oak Ave", city: "West Liberty", state: "IA", lat: "41.5698", lng: "-91.2601",
    dispatchedUnits: "ENG-1,ENG-2,LAD-1", leadCrew: "Capt. Williams", nfirsCode: "111",
    narrative: "Structure fire, residential. 2-story wood frame. Contained in 22 minutes.",
    dispatchedAt: new Date("2024-03-01T14:05:00Z"), onSceneAt: new Date("2024-03-01T14:11:00Z"),
    resolvedAt: new Date("2024-03-01T15:30:00Z"),
  },
  {
    incidentNumber: "INC-20240302-0001", incidentType: "mva", priority: "P2", status: "resolved",
    address: "US-6 & County Rd X30", city: "West Liberty", state: "IA", lat: "41.5755", lng: "-91.2544",
    patientName: "M. Smith", patientInsurance: "Medicare", dispatchedUnits: "AMB-2,ENG-1",
    leadCrew: "S. Patel", hospital: "Mercy Iowa City", nemsisCode: "2207017",
    narrative: "2-vehicle MVA. Minor injuries. 1 patient transported.",
    dispatchedAt: new Date("2024-03-02T11:30:00Z"), onSceneAt: new Date("2024-03-02T11:38:00Z"),
    transportedAt: new Date("2024-03-02T11:52:00Z"), resolvedAt: new Date("2024-03-02T12:25:00Z"),
  },
  {
    incidentNumber: "INC-20240302-0002", incidentType: "medical", priority: "P2", status: "dispatched",
    address: "789 Maple Dr", city: "West Liberty", state: "IA", lat: "41.5742", lng: "-91.2615",
    dispatchedUnits: "AMB-2", leadCrew: "S. Patel", nemsisCode: "2207001",
    narrative: "Diabetic emergency, 45F. Unit en route.",
    dispatchedAt: new Date(),
  },
];

const SEED_BILLING: InsertEmsBilling[] = [
  {
    billNumber: "BILL-20240301-001", incidentId: 1, incidentNumber: "INC-20240301-0001",
    patientName: "J. Doe", billingType: "insurance", insurerName: "Wellmark BCBS",
    policyNumber: "WB-88234512", icd10Code: "I21.9", transportCode: "A0427",
    billedAmountCents: 185000, allowedAmountCents: 142000, paidAmountCents: 113600,
    patientResponsibilityCents: 28400, status: "paid", paidAt: new Date("2024-03-28T00:00:00Z"),
  },
  {
    billNumber: "BILL-20240302-001", incidentId: 3, incidentNumber: "INC-20240302-0001",
    patientName: "M. Smith", billingType: "medicare", insurerName: "Medicare Part B",
    icd10Code: "S09.90XA", transportCode: "A0429",
    billedAmountCents: 145000, allowedAmountCents: 98000, paidAmountCents: 78400,
    patientResponsibilityCents: 19600, status: "paid", paidAt: new Date("2024-04-05T00:00:00Z"),
  },
  {
    billNumber: "BILL-20240302-002", incidentId: 4, incidentNumber: "INC-20240302-0002",
    patientName: "Pending", billingType: "insurance",
    billedAmountCents: 145000, status: "draft",
  },
];

const SEED_COMPLIANCE: InsertEmsCompliance[] = [
  { complianceType: "nemsis", title: "NEMSIS 3.5 PCR Submission — Q1 2024", status: "compliant", assignedTo: "J. Rivera", completedAt: new Date("2024-04-05T00:00:00Z"), notes: "All Q1 incidents submitted to Iowa EMS Data System." },
  { complianceType: "nfirs", title: "NFIRS Annual Fire Incident Report 2023", status: "compliant", assignedTo: "Capt. Williams", completedAt: new Date("2024-01-31T00:00:00Z") },
  { complianceType: "certification", title: "EMT-Basic Recertification — S. Patel", status: "due", assignedTo: "S. Patel", dueDate: new Date("2024-06-30T00:00:00Z") },
  { complianceType: "certification", title: "Paramedic License Renewal — J. Rivera", status: "compliant", assignedTo: "J. Rivera", completedAt: new Date("2024-01-15T00:00:00Z") },
  { complianceType: "equipment_check", title: "AED Monthly Inspection — AMB-1", status: "compliant", assignedTo: "T. Chen", completedAt: new Date("2024-03-01T00:00:00Z") },
  { complianceType: "equipment_check", title: "SCBA Annual Service — ENG-1", status: "due", assignedTo: "F. Garcia", dueDate: new Date("2024-04-15T00:00:00Z") },
  { complianceType: "hipaa", title: "Annual HIPAA Training — All EMS Staff", status: "in_review", assignedTo: "Chief Anderson", dueDate: new Date("2024-05-01T00:00:00Z") },
  { complianceType: "cms_audit", title: "CMS Ambulance Billing Audit — FY2024", status: "due", assignedTo: "Finance Director", dueDate: new Date("2024-07-31T00:00:00Z"), notes: "Prepare documentation for Medicare billing review." },
  { complianceType: "training", title: "Mass Casualty Incident Drill — Spring 2024", status: "due", assignedTo: "Chief Anderson", dueDate: new Date("2024-05-15T00:00:00Z") },
  { complianceType: "pcr", title: "Patient Care Report Completeness Audit — March 2024", status: "overdue", assignedTo: "J. Rivera", dueDate: new Date("2024-04-01T00:00:00Z"), notes: "3 PCRs missing narrative fields." },
];

// ─── DB helpers ───────────────────────────────────────────────────────────────

export async function seedEmsIfEmpty(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(emsUnits).limit(1);
  if (existing.length > 0) return;
  await db.insert(emsUnits).values(SEED_UNITS);
  await db.insert(emsIncidents).values(SEED_INCIDENTS);
  // Seed billing after incidents so IDs are set
  const incidents = await db.select().from(emsIncidents).limit(10);
  const billingWithIds = SEED_BILLING.map((b, i) => ({
    ...b,
    incidentId: incidents[i]?.id ?? i + 1,
  }));
  await db.insert(emsBilling).values(billingWithIds);
  await db.insert(emsCompliance).values(SEED_COMPLIANCE);
}

export async function listEmsUnits(): Promise<EmsUnit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emsUnits).orderBy(emsUnits.unitId);
}

export async function updateEmsUnitStatus(unitId: string, status: EmsUnit["status"], lat?: string, lng?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emsUnits).set({ status, ...(lat ? { lat } : {}), ...(lng ? { lng } : {}), lastPingTs: Date.now() }).where(eq(emsUnits.unitId, unitId));
}

export async function listEmsIncidents(limit = 50, status?: string): Promise<EmsIncident[]> {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(emsIncidents).orderBy(desc(emsIncidents.createdAt)).limit(limit);
  if (status) {
    return db.select().from(emsIncidents).where(eq(emsIncidents.status, status as EmsIncident["status"])).orderBy(desc(emsIncidents.createdAt)).limit(limit);
  }
  return q;
}

export async function createEmsIncident(data: InsertEmsIncident): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(emsIncidents).values(data);
  return { id: (result as { insertId: number }).insertId };
}

export async function updateEmsIncidentStatus(id: number, status: EmsIncident["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const extra: Partial<EmsIncident> = {};
  if (status === "on_scene") extra.onSceneAt = now;
  if (status === "transporting") extra.transportedAt = now;
  if (status === "resolved") extra.resolvedAt = now;
  await db.update(emsIncidents).set({ status, ...extra }).where(eq(emsIncidents.id, id));
}

export async function listEmsBilling(limit = 50): Promise<EmsBilling[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emsBilling).orderBy(desc(emsBilling.createdAt)).limit(limit);
}

export async function updateEmsBillingStatus(id: number, status: EmsBilling["status"], paidAmountCents?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emsBilling).set({
    status,
    ...(paidAmountCents !== undefined ? { paidAmountCents } : {}),
    ...(status === "paid" ? { paidAt: new Date() } : {}),
    ...(status === "submitted" ? { submittedAt: new Date() } : {}),
  }).where(eq(emsBilling.id, id));
}

export async function createEmsBilling(data: InsertEmsBilling): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(emsBilling).values(data);
  return { id: (result as { insertId: number }).insertId };
}

export async function listEmsCompliance(limit = 100): Promise<EmsCompliance[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emsCompliance).orderBy(emsCompliance.dueDate).limit(limit);
}

export async function updateEmsComplianceStatus(id: number, status: EmsCompliance["status"], notes?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emsCompliance).set({
    status,
    ...(notes ? { notes } : {}),
    ...(status === "compliant" ? { completedAt: new Date() } : {}),
  }).where(eq(emsCompliance.id, id));
}

// ─── tRPC EMS Router ──────────────────────────────────────────────────────────

export const emsRouter = router({
  // Seed demo data on first load
  seed: publicProcedure.mutation(async () => {
    await seedEmsIfEmpty();
    return { ok: true };
  }),

  // Units
  listUnits: publicProcedure.query(async () => {
    await seedEmsIfEmpty();
    return listEmsUnits();
  }),

  updateUnitStatus: publicProcedure
    .input(z.object({
      unitId: z.string(),
      status: z.enum(["available", "dispatched", "on_scene", "transporting", "at_hospital", "returning", "out_of_service", "standby"]),
      lat: z.string().optional(),
      lng: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateEmsUnitStatus(input.unitId, input.status, input.lat, input.lng);
      return { ok: true };
    }),

  // Incidents
  listIncidents: publicProcedure
    .input(z.object({ limit: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      await seedEmsIfEmpty();
      return listEmsIncidents(input.limit ?? 50, input.status);
    }),

  createIncident: publicProcedure
    .input(z.object({
      incidentNumber: z.string(),
      incidentType: z.enum(["medical", "fire", "mva", "hazmat", "rescue", "mutual_aid", "public_assist", "false_alarm"]),
      priority: z.enum(["P1", "P2", "P3", "P4"]).default("P2"),
      address: z.string(),
      city: z.string().default("West Liberty"),
      state: z.string().default("IA"),
      lat: z.string().optional(),
      lng: z.string().optional(),
      patientName: z.string().optional(),
      patientInsurance: z.string().optional(),
      dispatchedUnits: z.string().optional(),
      leadCrew: z.string().optional(),
      narrative: z.string().optional(),
      nemsisCode: z.string().optional(),
      nfirsCode: z.string().optional(),
      hospital: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await createEmsIncident({ ...input, dispatchedAt: new Date() });
      // Notify on P1
      if (input.priority === "P1") {
        await notifyOwner({
          title: `🚨 P1 Incident: ${input.incidentType.toUpperCase()} at ${input.address}`,
          content: `Incident ${input.incidentNumber} dispatched. Units: ${input.dispatchedUnits ?? "TBD"}`,
        }).catch(() => {});
      }
      return result;
    }),

  updateIncidentStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "dispatched", "on_scene", "transporting", "resolved", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      await updateEmsIncidentStatus(input.id, input.status);
      return { ok: true };
    }),

  // Billing
  listBilling: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      await seedEmsIfEmpty();
      return listEmsBilling(input.limit ?? 50);
    }),

  updateBillingStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "submitted", "pending", "approved", "denied", "appealed", "paid", "written_off"]),
      paidAmountCents: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateEmsBillingStatus(input.id, input.status, input.paidAmountCents);
      return { ok: true };
    }),

  createBilling: publicProcedure
    .input(z.object({
      billNumber: z.string(),
      incidentId: z.number(),
      incidentNumber: z.string(),
      patientName: z.string().optional(),
      billingType: z.enum(["insurance", "medicare", "medicaid", "self_pay", "government", "workers_comp"]),
      insurerName: z.string().optional(),
      policyNumber: z.string().optional(),
      icd10Code: z.string().optional(),
      transportCode: z.string().optional(),
      billedAmountCents: z.number(),
    }))
    .mutation(async ({ input }) => {
      return createEmsBilling({ ...input, status: "draft" });
    }),

  // Compliance
  listCompliance: publicProcedure.query(async () => {
    await seedEmsIfEmpty();
    return listEmsCompliance();
  }),

  updateComplianceStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["compliant", "due", "overdue", "in_review", "waived"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateEmsComplianceStatus(input.id, input.status, input.notes);
      return { ok: true };
    }),
});
