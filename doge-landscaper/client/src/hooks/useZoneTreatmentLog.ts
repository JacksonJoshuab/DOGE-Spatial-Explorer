/**
 * DOGE-LANDSCAPER — Zone Treatment Log Hook
 * Persists zone treatment history in localStorage
 * Tracks: zone, product, timestamp, weather conditions, applicator
 */

import { useState, useCallback, useEffect } from "react";

export interface ZoneTreatmentEntry {
  id: string;
  zoneId: string;
  zoneName: string;
  product: string;
  appliedAt: string; // ISO timestamp
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCondition: string;
  applicator: string;
  notes: string;
  daysAgo?: number;
}

const STORAGE_KEY = "doge-landscaper-zone-log";

// Zone metadata
export const ZONE_META: Record<string, { name: string; area: string; color: string; description: string }> = {
  A: { name: "Front Lawn", area: "~2,400 sq ft", color: "#4ade80", description: "Main front yard, near oak tree" },
  B: { name: "Side Yard", area: "~1,200 sq ft", color: "#facc15", description: "Swing set area, child-safe buffer" },
  C: { name: "Garden Beds", area: "~800 sq ft", color: "#a78bfa", description: "Scilla bulbs, selective spray" },
  D: { name: "Back Fence", area: "~1,600 sq ft", color: "#f87171", description: "Orange safety fence boundary" },
};

function getDaysAgo(isoDate: string): number {
  const now = new Date();
  const then = new Date(isoDate);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function loadFromStorage(): ZoneTreatmentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultHistory();
    const parsed = JSON.parse(raw) as ZoneTreatmentEntry[];
    return parsed.map(e => ({ ...e, daysAgo: getDaysAgo(e.appliedAt) }));
  } catch {
    return getDefaultHistory();
  }
}

function getDefaultHistory(): ZoneTreatmentEntry[] {
  // Pre-seed with some historical entries for demo
  const now = new Date();
  const entries: ZoneTreatmentEntry[] = [
    {
      id: "hist-1",
      zoneId: "A",
      zoneName: "Front Lawn",
      product: "Scotts Turf Builder Weed & Feed",
      appliedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      temperature: 62,
      humidity: 72,
      windSpeed: 6,
      weatherCondition: "Partly Cloudy",
      applicator: "Chip McHaymaker",
      notes: "Applied at 8am. Excellent conditions. Dandelion coverage was heavy — used full spreader setting.",
      daysAgo: 14,
    },
    {
      id: "hist-2",
      zoneId: "B",
      zoneName: "Side Yard",
      product: "Scotts Turf Builder Weed & Feed",
      appliedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      temperature: 62,
      humidity: 72,
      windSpeed: 6,
      weatherCondition: "Partly Cloudy",
      applicator: "Chip McHaymaker",
      notes: "Swing set area treated with reduced rate. Child-safe buffer maintained.",
      daysAgo: 14,
    },
    {
      id: "hist-3",
      zoneId: "A",
      zoneName: "Front Lawn",
      product: "Scotts EZ Seed Patch & Repair",
      appliedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      temperature: 55,
      humidity: 65,
      windSpeed: 4,
      weatherCondition: "Clear",
      applicator: "Chip McHaymaker",
      notes: "Overseeded thin spots near oak tree drip line. Watered in immediately.",
      daysAgo: 28,
    },
    {
      id: "hist-4",
      zoneId: "C",
      zoneName: "Garden Beds",
      product: "Preen Garden Weed Preventer",
      appliedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      temperature: 58,
      humidity: 60,
      windSpeed: 8,
      weatherCondition: "Mostly Clear",
      applicator: "Chip McHaymaker",
      notes: "Pre-emergent applied around scilla bulbs. Careful not to disturb bulb foliage.",
      daysAgo: 21,
    },
  ];
  return entries;
}

export function useZoneTreatmentLog() {
  const [entries, setEntries] = useState<ZoneTreatmentEntry[]>(loadFromStorage);

  // Persist to localStorage whenever entries change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch { /* storage full or unavailable */ }
  }, [entries]);

  const addEntry = useCallback((entry: Omit<ZoneTreatmentEntry, "id" | "daysAgo">) => {
    const newEntry: ZoneTreatmentEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      daysAgo: 0,
    };
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get last treatment date per zone
  const getLastTreatment = useCallback((zoneId: string): ZoneTreatmentEntry | null => {
    const zoneEntries = entries.filter(e => e.zoneId === zoneId);
    if (zoneEntries.length === 0) return null;
    return zoneEntries.reduce((latest, e) =>
      new Date(e.appliedAt) > new Date(latest.appliedAt) ? e : latest
    );
  }, [entries]);

  // Get zone health status based on last treatment
  const getZoneStatus = useCallback((zoneId: string): "fresh" | "good" | "due" | "overdue" | "untreated" => {
    const last = getLastTreatment(zoneId);
    if (!last) return "untreated";
    const days = getDaysAgo(last.appliedAt);
    if (days <= 7) return "fresh";
    if (days <= 21) return "good";
    if (days <= 42) return "due";
    return "overdue";
  }, [getLastTreatment]);

  return { entries, addEntry, removeEntry, clearAll, getLastTreatment, getZoneStatus };
}
