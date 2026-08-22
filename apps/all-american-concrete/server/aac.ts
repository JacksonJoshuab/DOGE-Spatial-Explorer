import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { alertActivities, dailyBriefActions, dailyBriefs, dailyKpiSnapshots, fleetEquipment, jobSites, materials, operationalAlerts, crewMembers } from "../drizzle/schema";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";

const seedSites = [
  { code: "JS-001", name: "County Road 22 Expansion", client: "Muscatine County", location: "County Road 22, West Liberty", status: "active" as const, pourDate: "Today", pourStart: "06:30 AM", pourEnd: "01:00 PM", plannedYards: 4200, notes: "Complete before the afternoon weather window." },
  { code: "JS-002", name: "West Liberty Community Center", client: "City of West Liberty", location: "120 E 3rd Street, West Liberty", status: "active" as const, pourDate: "Today", pourStart: "08:00 AM", pourEnd: "03:00 PM", plannedYards: 1850, notes: "Foundation and interior flatwork." },
  { code: "JS-003", name: "Iowa 70 Bridge Deck Repair", client: "IDOT", location: "Iowa 70 Corridor", status: "standby" as const, pourDate: "Today", pourStart: "Pending", pourEnd: "Pending", plannedYards: 2600, notes: "Waiting for inspector arrival." },
  { code: "JS-004", name: "Muscatine County Road 16 Overlay", client: "Muscatine County", location: "County Road 16", status: "scheduled" as const, pourDate: "Tomorrow", pourStart: "06:00 AM", pourEnd: "02:00 PM", plannedYards: 3100, notes: "Aggregate delivery confirmed." },
];

const seedFleet = [
  { unitNumber: "MT-001", type: "Mixer Truck", status: "operational" as const, fuelPercent: 92, mileage: 83941, assignment: "JS-001", operator: "Miguel Santos", lastService: "02/24/2026", serviceDue: "03/24/2026", maintenanceNote: null },
  { unitNumber: "MT-002", type: "Mixer Truck", status: "maintenance" as const, fuelPercent: 54, mileage: 102113, assignment: "Yard", operator: "—", lastService: "02/28/2026", serviceDue: "03/09/2026", maintenanceNote: "Drum bearing replacement in progress; return target March 9." },
  { unitNumber: "MT-004", type: "Mixer Truck", status: "maintenance" as const, fuelPercent: 76, mileage: 91203, assignment: "Yard", operator: "—", lastService: "03/01/2026", serviceDue: "03/08/2026", maintenanceNote: "Hydraulic line inspection and repair." },
  { unitNumber: "MT-007", type: "Mixer Truck", status: "alert" as const, fuelPercent: 68, mileage: 74650, assignment: "JS-002", operator: "Dave Kline", lastService: "02/25/2026", serviceDue: "03/25/2026", maintenanceNote: "Fuel stop scheduled at yard around 09:30 AM." },
  { unitNumber: "MT-008", type: "Mixer Truck", status: "operational" as const, fuelPercent: 86, mileage: 66720, assignment: "JS-001", operator: "Rosa Diaz", lastService: "02/26/2026", serviceDue: "03/26/2026", maintenanceNote: null },
  { unitNumber: "MT-009", type: "Mixer Truck", status: "operational" as const, fuelPercent: 81, mileage: 59014, assignment: "JS-001", operator: "Marcus Lee", lastService: "02/20/2026", serviceDue: "03/20/2026", maintenanceNote: null },
  { unitNumber: "MT-011", type: "Mixer Truck", status: "operational" as const, fuelPercent: 95, mileage: 48308, assignment: "JS-002", operator: "Tyler Brooks", lastService: "02/22/2026", serviceDue: "03/22/2026", maintenanceNote: null },
  { unitNumber: "LD-001", type: "Wheel Loader", status: "operational" as const, fuelPercent: 88, mileage: 12430, assignment: "Batch Plant", operator: "Carla Nguyen", lastService: "02/18/2026", serviceDue: "03/18/2026", maintenanceNote: null },
  { unitNumber: "BP-001", type: "Batch Plant", status: "operational" as const, fuelPercent: 100, mileage: 0, assignment: "Main Yard", operator: "Carla Nguyen", lastService: "02/15/2026", serviceDue: "03/15/2026", maintenanceNote: "Moisture sensor #3 on manual cross-check." },
];

const seedCrew = [
  { name: "Carla Nguyen", role: "Quality Control Lead", availability: "assigned" as const, assignment: "Batch Plant / JS-001", shift: "05:30–14:00", phone: "(319) 555-0142" },
  { name: "Miguel Santos", role: "Mixer Operator", availability: "assigned" as const, assignment: "JS-001", shift: "06:00–15:00", phone: "(319) 555-0189" },
  { name: "Rosa Diaz", role: "Mixer Operator", availability: "assigned" as const, assignment: "JS-001", shift: "06:00–15:00", phone: "(319) 555-0128" },
  { name: "Marcus Lee", role: "Mixer Operator", availability: "assigned" as const, assignment: "JS-001", shift: "06:00–15:00", phone: "(319) 555-0164" },
  { name: "Dave Kline", role: "Mixer Operator", availability: "assigned" as const, assignment: "JS-002", shift: "07:30–16:30", phone: "(319) 555-0171" },
  { name: "Tyler Brooks", role: "Mixer Operator", availability: "assigned" as const, assignment: "JS-002", shift: "07:30–16:30", phone: "(319) 555-0193" },
  { name: "Ava Peterson", role: "Finisher", availability: "available" as const, assignment: "Standby", shift: "06:00–14:30", phone: "(319) 555-0116" },
  { name: "Noah Hayes", role: "Finisher", availability: "available" as const, assignment: "Standby", shift: "06:00–14:30", phone: "(319) 555-0153" },
];

const seedMaterials = [
  { sku: "CEM-I2", name: "Portland Cement Type I/II", unit: "tons", quantity: "42.50", reorderThreshold: "20.00", supplier: "Hawkeye Cement" },
  { sku: "AGG-57", name: "Coarse Aggregate #57", unit: "tons", quantity: "118.00", reorderThreshold: "50.00", supplier: "River Rock Supply" },
  { sku: "SAND-01", name: "Fine Aggregate (Sand)", unit: "tons", quantity: "85.00", reorderThreshold: "40.00", supplier: "River Rock Supply" },
  { sku: "AEA-90", name: "Air Entraining Agent", unit: "gal", quantity: "28.00", reorderThreshold: "30.00", supplier: "Midwest Admix" },
  { sku: "FA-C", name: "Fly Ash Class C", unit: "tons", quantity: "8.50", reorderThreshold: "15.00", supplier: "Iowa Pozzolan" },
  { sku: "RB-4", name: "Rebar Grade 60 #4", unit: "tons", quantity: "3.20", reorderThreshold: "5.00", supplier: "Heartland Steel" },
];

const seedAlerts = [
  { title: "Batch Plant Moisture Sensor #3 Anomaly", severity: "warning" as const, source: "Batch Plant", detail: "Manual cross-check is active. QC to validate the first three JS-001 loads.", status: "active" as const },
  { title: "MT-007 Low Fuel", severity: "warning" as const, source: "Fleet Telemetry", detail: "Fuel at 68%; yard refuel stop planned for approximately 09:30 AM.", status: "active" as const },
  { title: "JS-003 Inspector Pending", severity: "info" as const, source: "Job Site", detail: "IDOT inspector arrival is required before bridge deck repair can begin.", status: "active" as const },
  { title: "MT-002 Drum Bearing Replacement", severity: "info" as const, source: "Maintenance", detail: "Replacement is in progress with an expected return on March 9.", status: "active" as const },
];

const seedActions = [
  { title: "Validate initial JS-001 loads against manual moisture cross-check", owner: "Carla Nguyen", priority: "high" as const, status: "in_progress" as const, dueLabel: "Before 07:15 AM", source: "Batch Plant" },
  { title: "Complete MT-007 refuel stop before second JS-002 dispatch cycle", owner: "Dave Kline", priority: "high" as const, status: "open" as const, dueLabel: "By 09:30 AM", source: "Fleet" },
  { title: "Place reorder requests for low-stock admixture, fly ash, and rebar", owner: "Operations Desk", priority: "normal" as const, status: "open" as const, dueLabel: "Before noon", source: "Materials" },
];

async function ensureSeeded() {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select({ id: jobSites.id }).from(jobSites).limit(1);
  const existingActions = await db.select({ id: dailyBriefActions.id }).from(dailyBriefActions).limit(1);
  if (existing.length) {
    if (!existingActions.length) await db.insert(dailyBriefActions).values(seedActions);
    return true;
  }
  await db.insert(jobSites).values(seedSites);
  await db.insert(fleetEquipment).values(seedFleet);
  await db.insert(crewMembers).values(seedCrew);
  await db.insert(materials).values(seedMaterials);
  await db.insert(operationalAlerts).values(seedAlerts);
  await db.insert(dailyBriefActions).values(seedActions);
  return true;
}

async function getWeather() {
  try {
    const point = await fetch("https://api.weather.gov/points/41.5706,-91.2641", { headers: { "User-Agent": "AAC-Operations/1.0 operations@example.com" } });
    if (!point.ok) throw new Error("Point unavailable");
    const pointJson = await point.json() as { properties?: { forecast?: string } };
    const forecast = await fetch(pointJson.properties?.forecast ?? "", { headers: { "User-Agent": "AAC-Operations/1.0 operations@example.com" } });
    if (!forecast.ok) throw new Error("Forecast unavailable");
    const forecastJson = await forecast.json() as { properties?: { periods?: Array<{ name: string; temperature: number; temperatureUnit: string; shortForecast: string; windSpeed: string; windDirection: string }> } };
    const period = forecastJson.properties?.periods?.[0];
    if (period) return { source: "National Weather Service", temperature: `${period.temperature}°${period.temperatureUnit}`, summary: period.shortForecast, wind: `${period.windDirection} ${period.windSpeed}` };
  } catch { /* fall through to operating fallback */ }
  return { source: "Operating forecast", temperature: "47°F", summary: "Mostly cloudy; monitor afternoon conditions", wind: "NW 15–20 mph, gusts near 30" };
}

export function createFallbackBrief(input: { sites: Array<typeof seedSites[number]>; fleet: Array<typeof seedFleet[number]>; crew: Array<typeof seedCrew[number]>; lowStock: Array<typeof seedMaterials[number]>; alerts: Array<typeof seedAlerts[number]>; weather: Awaited<ReturnType<typeof getWeather>>; date: string }) {
  const activeSites = input.sites.filter(site => site.status === "active");
  const operationalFleet = input.fleet.filter(unit => unit.status === "operational").length;
  const assignedCrew = input.crew.filter(member => member.availability === "assigned").length;
  return `## Morning priorities\n\n1. **Protect the JS-001 pour window.** County Road 22 has ${activeSites[0]?.plannedYards?.toLocaleString() ?? "4,200"} cu yd scheduled from ${activeSites[0]?.pourStart ?? "06:30 AM"} through ${activeSites[0]?.pourEnd ?? "1:00 PM"}. Confirm dispatch cadence and the QC cross-check before the first load.\n2. **Resolve readiness exceptions.** MT-007 needs its planned fuel stop, while MT-002 and MT-004 remain in maintenance.\n3. **Place supply orders today.** ${input.lowStock.map(material => material.name).join(", ")} are below their reorder threshold.\n\n## Active pours & job sites\n\n${input.sites.map(site => `- **${site.code} — ${site.name}:** ${site.status}; ${site.plannedYards.toLocaleString()} cu yd; ${site.pourStart ?? "schedule pending"}–${site.pourEnd ?? "schedule pending"}. ${site.notes ?? ""}`).join("\n")}\n\n## Fleet & equipment\n\n${operationalFleet} of ${input.fleet.length} units are operational. Units requiring attention: ${input.fleet.filter(unit => unit.status !== "operational").map(unit => `${unit.unitNumber} (${unit.status})`).join(", ") || "none"}.\n\n## Workforce\n\n${assignedCrew} of ${input.crew.length} listed crew members are assigned. Available standby support: ${input.crew.filter(member => member.availability === "available").map(member => member.name).join(", ") || "none"}.\n\n## Alerts & materials\n\n${input.alerts.map(alert => `- **${alert.severity.toUpperCase()} — ${alert.title}:** ${alert.detail}`).join("\n")}\n\nLow stock: ${input.lowStock.map(material => `${material.name} (${material.quantity} ${material.unit}; reorder at ${material.reorderThreshold})`).join("; ")}.\n\n## West Liberty weather\n\n**${input.weather.temperature} · ${input.weather.summary} · ${input.weather.wind}**. Plan the heaviest placement and finishing work around the current wind and evolving afternoon conditions.`;
}

export function buildOperationalIntelligence(input: { sites: any[]; fleet: any[]; crew: any[]; inventory: any[]; alerts: any[]; weather: { summary: string; wind: string } }) {
  const activeSites = input.sites.filter(site => site.status === "active");
  const fleetOperational = input.fleet.filter(unit => unit.status === "operational");
  const averageFuel = input.fleet.length ? Math.round(input.fleet.reduce((sum, unit) => sum + Number(unit.fuelPercent || 0), 0) / input.fleet.length) : 0;
  const lowStock = input.inventory.filter(material => Number(material.quantity) < Number(material.reorderThreshold));
  const openActions = input.alerts.filter(alert => alert.status === "active");
  const weatherRisk = /thunder|storm|rain|snow|ice/i.test(input.weather.summary) ? "high" : /gust|wind/i.test(input.weather.wind) ? "moderate" : "low";
  const fleetReadiness = Math.max(0, Math.min(100, Math.round((fleetOperational.length / Math.max(input.fleet.length, 1)) * 70 + Math.min(averageFuel, 90) * 0.2 - input.fleet.filter(unit => unit.status === "alert").length * 8 - input.fleet.filter(unit => unit.status === "maintenance").length * 5)));
  const dispatchTimeline = input.sites.map(site => {
    const isActive = site.status === "active";
    const risk = site.status === "standby" ? "watch" : isActive && weatherRisk !== "low" ? "weather" : isActive ? "on_track" : "scheduled";
    return { id: site.id, code: site.code, name: site.name, status: site.status, pourStart: site.pourStart || "TBD", pourEnd: site.pourEnd || "TBD", plannedYards: Number(site.plannedYards || 0), progress: isActive ? 42 : site.status === "complete" ? 100 : 0, risk };
  });
  const purchaseRecommendations = lowStock.map(material => ({ sku: material.sku, name: material.name, supplier: material.supplier || "Preferred supplier", unit: material.unit, onHand: Number(material.quantity), reorderPoint: Number(material.reorderThreshold), recommendedQuantity: Math.max(Number(material.reorderThreshold) * 3 - Number(material.quantity), Number(material.reorderThreshold)), urgency: Number(material.quantity) < Number(material.reorderThreshold) * 0.6 ? "critical" : "high" }));
  const crewCapacity = input.crew.reduce((acc: Record<string, { assignment: string; assigned: number; available: number; names: string[] }>, member) => { const key = member.assignment || "Unassigned"; if (!acc[key]) acc[key] = { assignment: key, assigned: 0, available: 0, names: [] }; if (member.availability === "assigned") acc[key].assigned += 1; if (member.availability === "available") acc[key].available += 1; acc[key].names.push(member.name); return acc; }, {});
  return {
    weatherRisk,
    fleetReadiness,
    averageFuel,
    dispatchTimeline,
    purchaseRecommendations,
    crewCapacity: Object.values(crewCapacity),
    kpis: {
      activePourYards: activeSites.reduce((sum, site) => sum + Number(site.plannedYards || 0), 0),
      utilization: Math.round((input.crew.filter(member => member.availability === "assigned").length / Math.max(input.crew.length, 1)) * 100),
      materialExposure: lowStock.length,
      unresolvedExceptions: openActions.length,
    },
  };
}

export function buildKpiTrends(current: { utilization: number; materialExposure: number; unresolvedExceptions: number; fleetReadiness: number }, previous?: { utilization: number; materialExposure: number; unresolvedExceptions: number; fleetReadiness: number } | null) {
  const trend = (value: number, prior?: number) => ({ value, delta: typeof prior === "number" ? value - prior : null });
  return {
    utilization: trend(current.utilization, previous?.utilization),
    materialExposure: trend(current.materialExposure, previous?.materialExposure),
    unresolvedExceptions: trend(current.unresolvedExceptions, previous?.unresolvedExceptions),
    fleetReadiness: trend(current.fleetReadiness, previous?.fleetReadiness),
  };
}

const siteInput = z.object({ code: z.string().min(2), name: z.string().min(2), client: z.string().optional(), location: z.string().min(2), status: z.enum(["active", "scheduled", "standby", "complete", "on_hold"]), pourDate: z.string().optional(), pourStart: z.string().optional(), pourEnd: z.string().optional(), plannedYards: z.number().int().nonnegative(), notes: z.string().optional() });
const fleetInput = z.object({ unitNumber: z.string().min(2), type: z.string().min(2), status: z.enum(["operational", "maintenance", "alert", "offline"]), fuelPercent: z.number().int().min(0).max(100), mileage: z.number().int().nonnegative(), assignment: z.string().optional(), operator: z.string().optional(), lastService: z.string().optional(), serviceDue: z.string().optional(), maintenanceNote: z.string().optional() });
const actionInput = z.object({ id: z.number().int().optional(), title: z.string().min(2), owner: z.string().optional(), priority: z.enum(["critical", "high", "normal", "low"]), status: z.enum(["open", "in_progress", "complete"]), dueLabel: z.string().optional(), source: z.string().optional() });

export const aacRouter = router({
  dashboard: publicProcedure.query(async () => {
    const ready = await ensureSeeded();
    const weather = await getWeather();
    if (!ready) {
      const intelligence = buildOperationalIntelligence({ sites: seedSites, fleet: seedFleet, crew: seedCrew, inventory: seedMaterials, alerts: seedAlerts, weather });
      const kpiTrends = buildKpiTrends({ ...intelligence.kpis, fleetReadiness: intelligence.fleetReadiness }, null);
      return { jobSites: seedSites, fleet: seedFleet, crew: seedCrew, materials: seedMaterials, alerts: seedAlerts, actionItems: seedActions, weather, intelligence: { ...intelligence, kpiTrends }, persistent: false };
    }
    const db = await getDb();
    const [sites, fleet, crew, inventory, alerts, actionItems] = await Promise.all([
      db!.select().from(jobSites), db!.select().from(fleetEquipment), db!.select().from(crewMembers), db!.select().from(materials), db!.select().from(operationalAlerts).where(eq(operationalAlerts.status, "active")), db!.select().from(dailyBriefActions).where(inArray(dailyBriefActions.status, ["open", "in_progress"])),
    ]);
    const intelligence = buildOperationalIntelligence({ sites, fleet, crew, inventory, alerts, weather });
    const snapshotDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
    const currentSnapshot = { snapshotDate, utilization: intelligence.kpis.utilization, materialExposure: intelligence.kpis.materialExposure, unresolvedExceptions: intelligence.kpis.unresolvedExceptions, fleetReadiness: intelligence.fleetReadiness };
    const todaySnapshots = await db!.select().from(dailyKpiSnapshots).where(eq(dailyKpiSnapshots.snapshotDate, snapshotDate)).limit(1);
    if (!todaySnapshots.length) await db!.insert(dailyKpiSnapshots).values(currentSnapshot);
    const priorSnapshots = await db!.select().from(dailyKpiSnapshots).orderBy(desc(dailyKpiSnapshots.capturedAt)).limit(8);
    const previousSnapshot = priorSnapshots.find(snapshot => snapshot.snapshotDate !== snapshotDate) ?? null;
    const kpiTrends = buildKpiTrends({ ...intelligence.kpis, fleetReadiness: intelligence.fleetReadiness }, previousSnapshot);
    return { jobSites: sites, fleet, crew, materials: inventory, alerts, actionItems, weather, intelligence: { ...intelligence, kpiTrends }, persistent: true };
  }),
  jobSites: publicProcedure.query(async () => {
    await ensureSeeded(); const db = await getDb(); return db ? db.select().from(jobSites) : seedSites;
  }),
  saveJobSite: publicProcedure.input(siteInput.extend({ id: z.number().int().optional() })).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    const { id, ...values } = input; if (id) await db.update(jobSites).set(values).where(eq(jobSites.id, id)); else await db.insert(jobSites).values(values); return { saved: true };
  }),
  fleet: publicProcedure.query(async () => { await ensureSeeded(); const db = await getDb(); return db ? db.select().from(fleetEquipment) : seedFleet; }),
  saveFleetUnit: publicProcedure.input(fleetInput.extend({ id: z.number().int().optional() })).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    const { id, ...values } = input; if (id) await db.update(fleetEquipment).set(values).where(eq(fleetEquipment.id, id)); else await db.insert(fleetEquipment).values(values); return { saved: true };
  }),
  crew: publicProcedure.query(async () => { await ensureSeeded(); const db = await getDb(); return db ? db.select().from(crewMembers) : seedCrew; }),
  saveCrewMember: publicProcedure.input(z.object({ id: z.number().int().optional(), name: z.string().min(2), role: z.string().min(2), availability: z.enum(["assigned", "available", "off", "unavailable"]), assignment: z.string().optional(), shift: z.string().optional(), phone: z.string().optional() })).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    const { id, ...values } = input; if (id) await db.update(crewMembers).set(values).where(eq(crewMembers.id, id)); else await db.insert(crewMembers).values(values); return { saved: true };
  }),
  materials: publicProcedure.query(async () => { await ensureSeeded(); const db = await getDb(); return db ? db.select().from(materials) : seedMaterials; }),
  saveMaterial: publicProcedure.input(z.object({ id: z.number().int().optional(), sku: z.string().min(2), name: z.string().min(2), unit: z.string().min(1), quantity: z.string(), reorderThreshold: z.string(), supplier: z.string().optional() })).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    const { id, ...values } = input; if (id) await db.update(materials).set(values).where(eq(materials.id, id)); else await db.insert(materials).values(values); return { saved: true };
  }),
  alerts: publicProcedure.query(async () => { await ensureSeeded(); const db = await getDb(); return db ? db.select().from(operationalAlerts).where(eq(operationalAlerts.status, "active")) : seedAlerts; }),
  saveAlert: publicProcedure.input(z.object({ id: z.number().int().optional(), title: z.string().min(2), severity: z.enum(["critical", "warning", "info"]), source: z.string().min(2), detail: z.string().min(2), status: z.enum(["active", "acknowledged", "resolved"]) })).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    const { id, ...values } = input; if (id) await db.update(operationalAlerts).set(values).where(eq(operationalAlerts.id, id)); else await db.insert(operationalAlerts).values(values); return { saved: true };
  }),
  alertHistory: publicProcedure.input(z.object({ alertId: z.number().int() })).query(async ({ input }) => { const db = await getDb(); return db ? db.select().from(alertActivities).where(eq(alertActivities.alertId, input.alertId)).orderBy(desc(alertActivities.createdAt)) : []; }),
  transitionAlert: publicProcedure.input(z.object({ alertId: z.number().int(), status: z.enum(["acknowledged", "resolved"]), note: z.string().min(2), actor: z.string().optional() })).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    await db.update(operationalAlerts).set({ status: input.status }).where(eq(operationalAlerts.id, input.alertId));
    await db.insert(alertActivities).values({ alertId: input.alertId, action: input.status, note: input.note, actor: input.actor || "AAC Operations" });
    return { saved: true };
  }),
  actions: publicProcedure.query(async () => { await ensureSeeded(); const db = await getDb(); return db ? db.select().from(dailyBriefActions).orderBy(desc(dailyBriefActions.createdAt)) : seedActions; }),
  saveAction: publicProcedure.input(actionInput).mutation(async ({ input }) => {
    await ensureSeeded(); const db = await getDb(); if (!db) return { saved: false };
    const { id, ...values } = input; if (id) await db.update(dailyBriefActions).set(values).where(eq(dailyBriefActions.id, id)); else await db.insert(dailyBriefActions).values({ ...values, source: values.source || "Daily Brief" }); return { saved: true };
  }),
  dailyBrief: publicProcedure.mutation(async () => {
    await ensureSeeded(); const db = await getDb();
    const [sites, fleet, crew, inventory, alerts, weather] = await Promise.all([
      db ? db.select().from(jobSites) : Promise.resolve(seedSites), db ? db.select().from(fleetEquipment) : Promise.resolve(seedFleet), db ? db.select().from(crewMembers) : Promise.resolve(seedCrew), db ? db.select().from(materials) : Promise.resolve(seedMaterials), db ? db.select().from(operationalAlerts).where(eq(operationalAlerts.status, "active")) : Promise.resolve(seedAlerts), getWeather(),
    ]);
    const lowStock = inventory.filter((material: any) => Number(material.quantity) < Number(material.reorderThreshold));
    const date = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/Chicago" }).format(new Date());
    const fallback = createFallbackBrief({ sites: sites as any, fleet: fleet as any, crew: crew as any, lowStock: lowStock as any, alerts: alerts as any, weather, date });
    let content = fallback;
    try {
      const response = await invokeLLM({ messages: [
        { role: "system", content: "You are the operations coordinator for All American Concrete. Write a concise, factual morning briefing in markdown. Use only supplied operating data. Cover priorities, active pours, fleet, workforce, alerts/materials, and weather. Do not invent facts." },
        { role: "user", content: JSON.stringify({ date, sites, fleet, crew, lowStock, alerts, weather }) },
      ] });
      const generated = response.choices?.[0]?.message?.content;
      if (typeof generated === "string" && generated.trim().length > 120) content = generated.trim();
    } catch { /* reliable operational fallback is retained */ }
    const title = `🏗 AAC Daily Brief — ${date}`;
    let notificationDelivered = false;
    try { notificationDelivered = await notifyOwner({ title, content }); } catch { notificationDelivered = false; }
    const suggestedActions = [
      ...lowStock.map((material: any) => ({ title: `Reorder ${material.name}`, owner: "Operations Desk", priority: Number(material.quantity) < Number(material.reorderThreshold) * 0.6 ? "critical" as const : "high" as const, status: "open" as const, dueLabel: "Before noon", source: "Materials" })),
      ...alerts.filter((alert: any) => alert.severity !== "info").map((alert: any) => ({ title: `Resolve: ${alert.title}`, owner: "Operations Desk", priority: alert.severity === "critical" ? "critical" as const : "high" as const, status: "open" as const, dueLabel: "Today", source: alert.source })),
    ].slice(0, 5);
    if (db) { await db.insert(dailyBriefs).values({ briefDate: date, title, content, notificationDelivered: notificationDelivered ? 1 : 0 }); if (suggestedActions.length) await db.insert(dailyBriefActions).values(suggestedActions); }
    return { title, content, generatedAt: new Date().toISOString(), notificationDelivered, suggestedActions, dataSummary: { activeJobSites: sites.filter((site: any) => site.status === "active").length, totalFleetUnits: fleet.length, unitsInMaintenance: fleet.filter((unit: any) => unit.status === "maintenance").length, unitsInAlert: fleet.filter((unit: any) => unit.status === "alert").length, employeesAssigned: crew.filter((member: any) => member.availability === "assigned").length, activeAlerts: alerts.length, lowStockMaterials: lowStock.map((material: any) => material.name) } };
  }),
  recentBriefs: publicProcedure.query(async () => { const db = await getDb(); return db ? db.select().from(dailyBriefs).orderBy(desc(dailyBriefs.generatedAt)).limit(7) : []; }),
});
