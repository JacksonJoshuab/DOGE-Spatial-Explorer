import { describe, expect, it } from "vitest";
import { buildOperationalIntelligence, createFallbackBrief } from "./aac";

describe("AAC operational readiness rules", () => {
  it("identifies material below its reorder threshold", () => {
    const material = { quantity: "8.50", reorderThreshold: "15.00" };
    expect(Number(material.quantity) < Number(material.reorderThreshold)).toBe(true);
  });

  it("keeps active job sites distinct from standby sites", () => {
    const sites = [{ status: "active" }, { status: "standby" }, { status: "active" }];
    expect(sites.filter(site => site.status === "active")).toHaveLength(2);
  });

  it("creates a meeting-ready fallback brief from operational data", () => {
    const content = createFallbackBrief({
      sites: [{ code: "JS-100", name: "Test Pour", client: "AAC", location: "West Liberty", status: "active", pourDate: "Today", pourStart: "06:00 AM", pourEnd: "12:00 PM", plannedYards: 400, notes: "QC start-up check." }] as any,
      fleet: [{ unitNumber: "MT-100", type: "Mixer Truck", status: "operational", fuelPercent: 90, mileage: 1000, assignment: "JS-100", operator: "Operator", lastService: "Today", serviceDue: "Next month", maintenanceNote: null }] as any,
      crew: [{ name: "Operator", role: "Driver", availability: "assigned", assignment: "JS-100", shift: "Day", phone: "" }] as any,
      lowStock: [{ sku: "ADMIX", name: "Test Admixture", unit: "gal", quantity: "2", reorderThreshold: "5", supplier: "AAC" }] as any,
      alerts: [{ title: "Fuel watch", severity: "warning", source: "Fleet", detail: "Schedule a stop.", status: "active" }] as any,
      weather: { source: "NWS", temperature: "68°F", summary: "Clear", wind: "W 8 mph" },
      date: "August 22, 2026",
    });
    expect(content).toContain("JS-100");
    expect(content).toContain("Test Admixture");
    expect(content).toContain("68°F");
  });

  it("derives concrete placement intelligence from operating conditions", () => {
    const intelligence = buildOperationalIntelligence({
      sites: [{ code: "JS-100", status: "active", plannedYards: 400, pourStart: "06:00", pourEnd: "12:00" }],
      fleet: [{ status: "operational", fuelPercent: 90 }, { status: "alert", fuelPercent: 60 }],
      crew: [{ name: "A", assignment: "JS-100", availability: "assigned" }, { name: "B", assignment: "Standby", availability: "available" }],
      inventory: [{ sku: "ADMIX", name: "Admixture", quantity: "2", reorderThreshold: "5", supplier: "AAC", unit: "gal" }],
      alerts: [{ status: "active" }],
      weather: { summary: "Sunny", wind: "NW 18 mph gusts" },
    });
    expect(intelligence.weatherRisk).toBe("moderate");
    expect(intelligence.purchaseRecommendations[0]?.recommendedQuantity).toBeGreaterThan(0);
    expect(intelligence.kpis.unresolvedExceptions).toBe(1);
  });
});
