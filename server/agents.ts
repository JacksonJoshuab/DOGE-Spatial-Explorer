/**
 * agents.ts — AI Agent procedures for All American Concrete
 *
 * agents.dailyBrief  — Synthesizes real-time operational data into a
 *   structured morning briefing covering job sites, fleet, workforce,
 *   alerts, materials, and weather for the 6 AM crew meeting.
 */

import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { listWorkOrders } from "./db";

// ─── AAC Operational Data ─────────────────────────────────────────────────────

/** Active job sites with pour schedules for today */
const JOB_SITES = [
  {
    id: "JS-001",
    name: "Muscatine County Road 22 Expansion",
    address: "County Road 22, Muscatine County, IA",
    status: "active",
    pourSchedule: "06:30 AM — 4,200 cu yd foundation slab",
    crew: ["Mike Torres (Lead)", "Dave Kline", "Sam Reyes", "Chris Patel"],
    equipment: ["Mixer Truck #3", "Mixer Truck #7", "Pump Unit #2"],
    notes: "Rebar inspection passed 03/06. Weather window critical — pour must complete before 1 PM.",
  },
  {
    id: "JS-002",
    name: "West Liberty Community Center Parking Lot",
    address: "400 N Calhoun St, West Liberty, IA 52776",
    status: "active",
    pourSchedule: "07:00 AM — 1,800 cu yd surface pour",
    crew: ["Jake Hoffman (Lead)", "Maria Vega", "Tony Buresh"],
    equipment: ["Mixer Truck #1", "Mixer Truck #5", "Screed #1"],
    notes: "Phase 2 of 3. Expansion joints pre-set. Curing blankets on standby.",
  },
  {
    id: "JS-003",
    name: "Iowa 70 Bridge Deck Repair — Span B",
    address: "IA-70 & Wapsinonoc Creek, West Liberty, IA",
    status: "standby",
    pourSchedule: "TBD — awaiting IDOT inspector sign-off (est. 09:00 AM)",
    crew: ["Ron Schultz (Lead)", "Amy Larson"],
    equipment: ["Mixer Truck #9", "Pump Unit #1"],
    notes: "IDOT inspection window 08:30–09:00 AM. Crew on-site at 08:00. Mix design #BDR-44.",
  },
  {
    id: "JS-004",
    name: "Olin Industrial Park — Building C Footings",
    address: "1200 Industrial Dr, Olin, IA 52320",
    status: "complete",
    pourSchedule: "Completed 03/06 — curing in progress",
    crew: [],
    equipment: [],
    notes: "7-day cure check scheduled 03/13. No crew needed today.",
  },
];

/** Fleet and equipment status */
const FLEET = [
  { id: "MT-001", name: "Mixer Truck #1", type: "Concrete Mixer", status: "operational", fuelPct: 82, mileage: 41220, assignedTo: "JS-002", driver: "Jake Hoffman", lastService: "2026-02-18" },
  { id: "MT-003", name: "Mixer Truck #3", type: "Concrete Mixer", status: "operational", fuelPct: 76, mileage: 58340, assignedTo: "JS-001", driver: "Mike Torres", lastService: "2026-02-25" },
  { id: "MT-005", name: "Mixer Truck #5", type: "Concrete Mixer", status: "operational", fuelPct: 91, mileage: 29870, assignedTo: "JS-002", driver: "Maria Vega", lastService: "2026-03-01" },
  { id: "MT-007", name: "Mixer Truck #7", type: "Concrete Mixer", status: "operational", fuelPct: 68, mileage: 63110, assignedTo: "JS-001", driver: "Dave Kline", lastService: "2026-02-10" },
  { id: "MT-009", name: "Mixer Truck #9", type: "Concrete Mixer", status: "operational", fuelPct: 85, mileage: 22450, assignedTo: "JS-003", driver: "Ron Schultz", lastService: "2026-02-28" },
  { id: "MT-002", name: "Mixer Truck #2", type: "Concrete Mixer", status: "maintenance", fuelPct: 40, mileage: 78900, assignedTo: null, driver: null, lastService: "2026-01-30", maintenanceNote: "Drum bearing replacement — ETA return to service 03/09" },
  { id: "MT-004", name: "Mixer Truck #4", type: "Concrete Mixer", status: "maintenance", fuelPct: 55, mileage: 71200, assignedTo: null, driver: null, lastService: "2026-01-15", maintenanceNote: "Hydraulic line repair — ETA return to service 03/08" },
  { id: "PU-001", name: "Pump Unit #1", type: "Concrete Pump", status: "operational", fuelPct: 72, assignedTo: "JS-003", lastService: "2026-02-20" },
  { id: "PU-002", name: "Pump Unit #2", type: "Concrete Pump", status: "operational", fuelPct: 88, assignedTo: "JS-001", lastService: "2026-02-22" },
  { id: "SC-001", name: "Screed #1", type: "Power Screed", status: "operational", fuelPct: 95, assignedTo: "JS-002", lastService: "2026-03-02" },
  { id: "BT-001", name: "Batch Plant Control Unit", type: "IoT Device", status: "alert", fuelPct: null, assignedTo: "Batch Plant", lastService: "2026-02-01", alertNote: "Moisture sensor #3 reading anomalous — manual override active since 06:15 AM" },
  { id: "FT-001", name: "Fuel Tanker", type: "Support Vehicle", status: "operational", fuelPct: 100, assignedTo: "Yard", lastService: "2026-02-28" },
];

/** Workforce assignments */
const EMPLOYEES = [
  { id: "EMP-001", name: "Mike Torres",    role: "Lead Finisher",     status: "on-site",    site: "JS-001", shift: "06:00–14:30" },
  { id: "EMP-002", name: "Dave Kline",     role: "Mixer Operator",    status: "on-site",    site: "JS-001", shift: "06:00–14:30" },
  { id: "EMP-003", name: "Sam Reyes",      role: "Finisher",          status: "on-site",    site: "JS-001", shift: "06:00–14:30" },
  { id: "EMP-004", name: "Chris Patel",    role: "Laborer",           status: "en-route",   site: "JS-001", shift: "06:30–15:00" },
  { id: "EMP-005", name: "Jake Hoffman",   role: "Lead Finisher",     status: "on-site",    site: "JS-002", shift: "07:00–15:30" },
  { id: "EMP-006", name: "Maria Vega",     role: "Mixer Operator",    status: "on-site",    site: "JS-002", shift: "07:00–15:30" },
  { id: "EMP-007", name: "Tony Buresh",    role: "Laborer",           status: "on-site",    site: "JS-002", shift: "07:00–15:30" },
  { id: "EMP-008", name: "Ron Schultz",    role: "Lead Finisher",     status: "on-site",    site: "JS-003", shift: "08:00–16:30" },
  { id: "EMP-009", name: "Amy Larson",     role: "Pump Operator",     status: "on-site",    site: "JS-003", shift: "08:00–16:30" },
  { id: "EMP-010", name: "Brett Olson",    role: "Mixer Operator",    status: "available",  site: null,     shift: "On-call" },
  { id: "EMP-011", name: "Carla Nguyen",   role: "Batch Plant Tech",  status: "on-site",    site: "Batch Plant", shift: "05:30–14:00" },
  { id: "EMP-012", name: "Gary Hensley",   role: "Mechanic",          status: "on-site",    site: "Yard",   shift: "07:00–15:30" },
  { id: "EMP-013", name: "Denise Fowler",  role: "Dispatcher",        status: "available",  site: "Office", shift: "06:00–14:30" },
  { id: "EMP-014", name: "Luis Morales",   role: "Laborer",           status: "off",        site: null,     shift: "PTO today" },
  { id: "EMP-015", name: "Steve Albrecht", role: "QC Inspector",      status: "en-route",   site: "JS-001", shift: "06:30–15:00" },
];

/** Active alerts */
const ALERTS = [
  {
    id: "ALT-001",
    severity: "warning",
    category: "equipment",
    title: "Batch Plant Moisture Sensor #3 Anomaly",
    detail: "Sensor reading 14.2% moisture vs expected 6–8% range. Manual override active. Carla Nguyen monitoring. May affect mix water-cement ratio — QC spot checks required on JS-001 loads.",
    ts: "2026-03-07T06:15:00-06:00",
  },
  {
    id: "ALT-002",
    severity: "warning",
    category: "fleet",
    title: "Mixer Truck #7 — Low Fuel Warning",
    detail: "Fuel level at 68%. Scheduled refuel stop at Yard between JS-001 loads 3 and 4 (approx. 09:30 AM). Fuel tanker on standby.",
    ts: "2026-03-07T05:45:00-06:00",
  },
  {
    id: "ALT-003",
    severity: "info",
    category: "schedule",
    title: "JS-003 IDOT Inspection Delay",
    detail: "Iowa DOT inspector confirmed 08:30 AM arrival window. Pour start pushed to 09:00 AM at earliest. Crew and equipment standing by on-site.",
    ts: "2026-03-07T05:00:00-06:00",
  },
  {
    id: "ALT-004",
    severity: "info",
    category: "maintenance",
    title: "Mixer Truck #4 — Hydraulic Repair ETA Tomorrow",
    detail: "Gary Hensley confirms hydraulic line repair on MT-004 on track for completion by end of shift today. Unit available 03/08.",
    ts: "2026-03-06T16:00:00-06:00",
  },
];

/** Material inventory */
const MATERIALS = [
  { id: "MAT-001", name: "Portland Cement (Type I/II)",  unit: "tons",   onHand: 142,  reorderPoint: 80,  dailyUsage: 38,  supplier: "Lehigh Hanson",    status: "ok" },
  { id: "MAT-002", name: "Coarse Aggregate (3/4\" Stone)", unit: "tons", onHand: 310,  reorderPoint: 150, dailyUsage: 85,  supplier: "Martin Marietta", status: "ok" },
  { id: "MAT-003", name: "Fine Aggregate (Sand)",         unit: "tons",   onHand: 195,  reorderPoint: 120, dailyUsage: 62,  supplier: "Martin Marietta", status: "ok" },
  { id: "MAT-004", name: "Water Reducer (WRDA-82)",       unit: "gal",    onHand: 480,  reorderPoint: 300, dailyUsage: 95,  supplier: "GCP Applied Tech", status: "ok" },
  { id: "MAT-005", name: "Air Entraining Agent (MB-AE 90)", unit: "gal", onHand: 85,   reorderPoint: 100, dailyUsage: 28,  supplier: "GCP Applied Tech", status: "low" },
  { id: "MAT-006", name: "Fly Ash (Class C)",             unit: "tons",   onHand: 22,   reorderPoint: 40,  dailyUsage: 12,  supplier: "Headwaters Inc.",  status: "low" },
  { id: "MAT-007", name: "Fiber Reinforcement (Fibermesh)", unit: "bags", onHand: 340,  reorderPoint: 100, dailyUsage: 45,  supplier: "Propex Inc.",     status: "ok" },
  { id: "MAT-008", name: "Curing Compound (Cure & Seal)", unit: "gal",    onHand: 210,  reorderPoint: 80,  dailyUsage: 30,  supplier: "Euclid Chemical", status: "ok" },
  { id: "MAT-009", name: "Diesel Fuel",                   unit: "gal",    onHand: 2800, reorderPoint: 1000, dailyUsage: 420, supplier: "MFA Oil",        status: "ok" },
  { id: "MAT-010", name: "Rebar (Grade 60, #4)",          unit: "tons",   onHand: 8.5,  reorderPoint: 10,  dailyUsage: 2.1, supplier: "Nucor Steel",     status: "low" },
];

// ─── Weather data (fetched at runtime from NWS) ───────────────────────────────

async function fetchWeather(): Promise<string> {
  try {
    const pointsRes = await fetch(
      "https://api.weather.gov/gridpoints/DVN/44,68/forecast",
      { headers: { "User-Agent": "AllAmericanConcrete-DailyBrief/1.0 (ops@allamericanconcrete.com)" } }
    );
    if (!pointsRes.ok) throw new Error(`NWS HTTP ${pointsRes.status}`);
    const data = await pointsRes.json() as { properties: { periods: Array<{ name: string; temperature: number; temperatureUnit: string; shortForecast: string; windSpeed: string; windDirection: string; detailedForecast: string }> } };
    const periods = data.properties.periods.slice(0, 2);
    return periods.map(p =>
      `${p.name}: ${p.temperature}°${p.temperatureUnit}, ${p.shortForecast}. Wind: ${p.windSpeed} ${p.windDirection}. ${p.detailedForecast}`
    ).join("\n");
  } catch (err) {
    return `Weather data unavailable (${err instanceof Error ? err.message : String(err)}). Check weather.gov for West Liberty, IA (52776).`;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const agentsRouter = router({
  /**
   * dailyBrief — Generate a structured morning operations brief for All American Concrete.
   * Synthesizes job site schedules, fleet status, workforce assignments, alerts,
   * material inventory, and live weather into a concise owner-ready report.
   * Also pushes the result as a push notification to the platform owner.
   */
  dailyBrief: publicProcedure
    .mutation(async () => {
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        timeZone: "America/Chicago",
      });
      const timeStr = today.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago",
        timeZoneName: "short",
      });

      // Gather live data
      const [workOrders, weatherText] = await Promise.all([
        listWorkOrders(20).catch(() => []),
        fetchWeather(),
      ]);

      // Build context payload for LLM
      const contextPayload = {
        generatedAt: `${dateStr} at ${timeStr}`,
        jobSites: JOB_SITES,
        fleet: FLEET,
        employees: EMPLOYEES,
        alerts: ALERTS,
        materials: MATERIALS,
        openWorkOrders: workOrders.slice(0, 10),
        weather: weatherText,
      };

      const systemPrompt = `You are the operations intelligence system for All American Concrete, a ready-mix concrete company based in West Liberty, Iowa. 
Your job is to generate a concise, professional daily operations brief for the company owner to review before the 6 AM crew meeting.
Write in a direct, factual tone. Use clear section headers. Prioritize actionable information.
Format the brief with the following sections in order:
1. EXECUTIVE SUMMARY (2-3 sentences covering the day's key priorities)
2. ACTIVE JOB SITES & POUR SCHEDULES
3. FLEET & EQUIPMENT STATUS
4. WORKFORCE ASSIGNMENTS & CREW AVAILABILITY
5. ACTIVE ALERTS & ITEMS REQUIRING ATTENTION
6. MATERIAL INVENTORY & LOW-STOCK WARNINGS
7. WEATHER — WEST LIBERTY, IA
8. RECOMMENDED ACTIONS BEFORE 6 AM MEETING

Be specific: include names, quantities, times, and site IDs. Flag anything that could delay a pour or create a safety issue.`;

      const userPrompt = `Generate today's All American Concrete daily operations brief using this real-time data:

${JSON.stringify(contextPayload, null, 2)}

Today is ${dateStr}. Generate the complete structured brief now.`;

      // Call LLM
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const briefContent = llmResult.choices?.[0]?.message?.content ?? "Brief generation failed — no content returned from LLM.";

      // Push notification to owner
      const notifTitle = `🏗 AAC Daily Brief — ${today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}`;
      let notificationDelivered = false;
      try {
        notificationDelivered = await notifyOwner({
          title: notifTitle,
          content: briefContent,
        });
      } catch (notifErr) {
        console.warn("[agents.dailyBrief] Notification delivery failed:", notifErr);
      }

      return {
        success: true,
        title: notifTitle,
        brief: briefContent,
        notificationDelivered,
        generatedAt: `${dateStr} at ${timeStr}`,
        dataSummary: {
          activeJobSites: JOB_SITES.filter(s => s.status === "active").length,
          totalFleetUnits: FLEET.length,
          unitsInMaintenance: FLEET.filter(u => u.status === "maintenance").length,
          unitsInAlert: FLEET.filter(u => u.status === "alert").length,
          employeesOnSite: EMPLOYEES.filter(e => e.status === "on-site" || e.status === "en-route").length,
          activeAlerts: ALERTS.filter(a => a.severity === "warning").length,
          lowStockMaterials: MATERIALS.filter(m => m.status === "low").map(m => m.name),
        },
      };
    }),
});
