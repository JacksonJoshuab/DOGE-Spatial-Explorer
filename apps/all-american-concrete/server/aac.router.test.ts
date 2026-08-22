import { beforeEach, describe, expect, it, vi } from "vitest";
import { alertActivities, crewMembers, dailyBriefActions, dailyBriefs, fleetEquipment, jobSites, materials, operationalAlerts } from "../drizzle/schema";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), invokeLLM: vi.fn(), notifyOwner: vi.fn() }));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));

import { aacRouter } from "./aac";

const sites = [{ id: 1, code: "JS-001", name: "County Road Pour", client: "County", location: "West Liberty", status: "active", pourDate: "Today", pourStart: "06:30 AM", pourEnd: "01:00 PM", plannedYards: 4200, notes: "Finish before weather change." }];
const fleet = [{ id: 1, unitNumber: "MT-001", type: "Mixer Truck", status: "operational", fuelPercent: 90, mileage: 1000, assignment: "JS-001", operator: "A. Operator", lastService: "Today", serviceDue: "Next month", maintenanceNote: null }];
const crew = [{ id: 1, name: "A. Operator", role: "Mixer Operator", availability: "assigned", assignment: "JS-001", shift: "Day", phone: "" }];
const inventory = [{ id: 1, sku: "ADMIX", name: "Air Entraining Agent", unit: "gal", quantity: "2.00", reorderThreshold: "5.00", supplier: "AAC" }];
const alerts = [{ id: 1, title: "Fuel Watch", severity: "warning", source: "Fleet", detail: "Refuel before second run.", status: "active" }];

function queryResult(values: unknown[]) {
  const promise = Promise.resolve(values) as Promise<unknown[]> & { where: () => typeof promise; limit: () => typeof promise; orderBy: () => typeof promise };
  promise.where = () => promise;
  promise.limit = () => promise;
  promise.orderBy = () => promise;
  return promise;
}

function mockDatabase() {
  const updates: Array<{ table: unknown; values: unknown }> = [];
  const database = {
    select: () => ({ from: (table: unknown) => queryResult(table === jobSites ? sites : table === fleetEquipment ? fleet : table === crewMembers ? crew : table === materials ? inventory : table === operationalAlerts ? alerts : []) }),
    insert: (table: unknown) => ({ values: (values: unknown) => { updates.push({ table, values }); return Promise.resolve({}); } }),
    update: (table: unknown) => ({ set: (values: unknown) => ({ where: () => { updates.push({ table, values }); return Promise.resolve({}); } }) }),
  };
  return { database, updates };
}

describe("AAC tRPC operations", () => {
  beforeEach(() => {
    const { database } = mockDatabase();
    mocks.getDb.mockReset(); mocks.invokeLLM.mockReset(); mocks.notifyOwner.mockReset();
    mocks.getDb.mockResolvedValue(database);
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "## Morning priorities\n\nConfirm fleet readiness before dispatch." } }] });
    mocks.notifyOwner.mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline test")));
  });

  it("returns operational dashboard data and fallback weather", async () => {
    const result = await aacRouter.createCaller({} as any).dashboard();
    expect(result.jobSites).toHaveLength(1);
    expect(result.fleet[0].unitNumber).toBe("MT-001");
    expect(result.weather.temperature).toBe("47°F");
    expect(result.persistent).toBe(true);
  });

  it("persists an alert mutation against the operational store", async () => {
    const { database, updates } = mockDatabase();
    mocks.getDb.mockResolvedValue(database);
    const result = await aacRouter.createCaller({} as any).saveAlert({ title: "Plant review", severity: "info", source: "Batch Plant", detail: "Confirm moisture reading.", status: "active" });
    expect(result).toEqual({ saved: true });
    expect(updates.some(update => update.table === operationalAlerts)).toBe(true);
  });

  it("records an auditable acknowledgement when an alert state changes", async () => {
    const { database, updates } = mockDatabase();
    mocks.getDb.mockResolvedValue(database);
    const result = await aacRouter.createCaller({} as any).transitionAlert({ alertId: 1, status: "acknowledged", note: "Dispatcher has notified the operator.", actor: "AAC Operations" });
    expect(result).toEqual({ saved: true });
    expect(updates.some(update => update.table === operationalAlerts)).toBe(true);
    expect(updates.some(update => update.table === alertActivities)).toBe(true);
  });

  it("generates a Daily Brief, records it, and notifies the owner", async () => {
    const { database, updates } = mockDatabase();
    mocks.getDb.mockResolvedValue(database);
    const result = await aacRouter.createCaller({} as any).dailyBrief();
    expect(result.content).toContain("Morning priorities");
    expect(result.dataSummary.lowStockMaterials).toContain("Air Entraining Agent");
    expect(result.notificationDelivered).toBe(true);
    expect(mocks.notifyOwner).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining("AAC Daily Brief") }));
    expect(updates.some(update => update.table === dailyBriefs)).toBe(true);
    expect(updates.some(update => update.table === dailyBriefActions)).toBe(true);
  });
});
