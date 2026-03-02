/**
 * useIoTSensors — Live IoT sensor polling hook
 * Civic Intelligence Light design system
 *
 * Simulates a WebSocket/polling feed for the 10 West Liberty IoT sensors.
 * In production this would connect to ws://iot.westlibertyia.gov/sensors or
 * poll GET /api/sensors every N seconds. Here we generate realistic telemetry
 * fluctuations on a configurable interval so the Spatial Map pins update live
 * without a page refresh.
 */
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Sensor type ──────────────────────────────────────────────────────────────
export interface SensorReading {
  id: string;
  name: string;
  type: "water" | "sewer" | "roads" | "parks" | "le";
  color: string;
  lat: number;
  lng: number;
  address: string;
  status: "online" | "warning" | "alert" | "offline";
  reading: string;
  device: string;
  lastSeen: string;
  alert: string | null;
  /** Monotonically increasing tick counter — triggers map marker re-color */
  tick: number;
}

export interface AlertItem {
  id: string;
  sensorId: string;
  type: "alert" | "warning" | "info";
  msg: string;
  time: string;
  dispatched: boolean;
}

// ─── Seed data (matches SpatialMap static constants) ─────────────────────────
const SEED_SENSORS: Omit<SensorReading, "tick">[] = [
  {
    id: "WL-VALVE-001", name: "Water Tower Valve", type: "water", color: "#2563eb",
    lat: 41.5762, lng: -91.2618, address: "Water Tower Rd, West Liberty",
    status: "online", reading: "Pressure: 72 PSI | Flow: 14.2 GPM",
    device: "SmartValve Pro", lastSeen: "12s ago", alert: null,
  },
  {
    id: "WL-VALVE-002", name: "Main St Water Main", type: "water", color: "#2563eb",
    lat: 41.5740, lng: -91.2642, address: "N Calhoun St & W 3rd St",
    status: "warning", reading: "Pressure: 58 PSI ⚠ LOW | Flow: 9.1 GPM",
    device: "SmartValve Pro", lastSeen: "4s ago",
    alert: "Low pressure detected — possible leak downstream",
  },
  {
    id: "WL-WATER-003", name: "Wastewater Lift Station", type: "sewer", color: "#7c3aed",
    lat: 41.5720, lng: -91.2658, address: "S Calhoun St, West Liberty",
    status: "online", reading: "Level: 42% | Pump 1: ON | Pump 2: STANDBY",
    device: "AquaSentinel Node", lastSeen: "8s ago", alert: null,
  },
  {
    id: "WL-GAS-001", name: "Gas Regulator Station", type: "sewer", color: "#d97706",
    lat: 41.5748, lng: -91.2601, address: "E 7th St, West Liberty",
    status: "online", reading: "Pressure: 18 PSI | Methane: 0.0% LEL",
    device: "GasPulse Monitor", lastSeen: "22s ago", alert: null,
  },
  {
    id: "WL-STORM-001", name: "Storm Drain — N Calhoun", type: "roads", color: "#059669",
    lat: 41.5752, lng: -91.2635, address: "N Calhoun St & W 5th St",
    status: "alert", reading: "Level: 78% ⚠ HIGH | Debris: DETECTED",
    device: "StormNet Drain Sensor", lastSeen: "1s ago",
    alert: "Storm drain 78% full — debris blockage detected. Dispatch required.",
  },
  {
    id: "WL-STORM-002", name: "Storm Drain — E 3rd St", type: "roads", color: "#059669",
    lat: 41.5733, lng: -91.2620, address: "E 3rd St & N Iowa Ave",
    status: "online", reading: "Level: 22% | Clear",
    device: "StormNet Drain Sensor", lastSeen: "15s ago", alert: null,
  },
  {
    id: "WL-ROAD-001", name: "Pavement Monitor — W 7th St", type: "roads", color: "#059669",
    lat: 41.5742, lng: -91.2670, address: "W 7th St, West Liberty",
    status: "warning", reading: "Freeze-thaw cycles: 47 | Strain: 0.008% ⚠",
    device: "RoadSense Pavement Monitor", lastSeen: "30s ago",
    alert: "Pavement strain threshold approaching — schedule inspection",
  },
  {
    id: "WL-PARK-001", name: "Wapsi-Great Western Trail", type: "parks", color: "#16a34a",
    lat: 41.5758, lng: -91.2650, address: "Wapsi-Great Western Trail, West Liberty",
    status: "online", reading: "Occupancy: 12 users | Noise: 48 dB",
    device: "ParkPulse Occupancy Node", lastSeen: "5s ago", alert: null,
  },
  {
    id: "WL-PARK-002", name: "City Park Irrigation", type: "parks", color: "#16a34a",
    lat: 41.5730, lng: -91.2645, address: "City Park, West Liberty",
    status: "online", reading: "Soil moisture: 34% VWC | Irrigation: OFF",
    device: "IrriSmart Soil Sensor", lastSeen: "18s ago", alert: null,
  },
  {
    id: "WL-PD-001", name: "Police Dept Evidence Room", type: "le", color: "#dc2626",
    lat: 41.5742, lng: -91.2635, address: "West Liberty Police Dept, 405 N Calhoun St",
    status: "online", reading: "Temp: 68°F | Humidity: 45% RH | Access: SECURE",
    device: "DOGE Sentinel Node", lastSeen: "3s ago", alert: null,
  },
];

// ─── Telemetry simulation helpers ─────────────────────────────────────────────
function jitter(base: number, range: number, decimals = 1): number {
  const v = base + (Math.random() - 0.5) * range * 2;
  return parseFloat(v.toFixed(decimals));
}

function secondsAgo(s: number): string {
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

const UPDATE_SCRIPTS: Record<string, (prev: SensorReading) => Partial<SensorReading>> = {
  "WL-VALVE-001": () => {
    const psi = jitter(72, 3);
    const gpm = jitter(14.2, 1.5);
    return { reading: `Pressure: ${psi} PSI | Flow: ${gpm} GPM`, lastSeen: "just now", status: "online", alert: null };
  },
  "WL-VALVE-002": (prev) => {
    const psi = jitter(58, 5);
    const gpm = jitter(9.1, 2);
    const isLow = psi < 55;
    const isRecovering = psi > 65;
    return {
      reading: `Pressure: ${psi} PSI${isLow ? " ⚠ LOW" : isRecovering ? " ✓ RECOVERING" : ""} | Flow: ${gpm} GPM`,
      status: isRecovering ? "online" : prev.status,
      alert: isRecovering ? null : prev.alert,
      lastSeen: "just now",
    };
  },
  "WL-WATER-003": () => {
    const level = jitter(42, 8, 0);
    const pump2 = level > 55 ? "ON" : "STANDBY";
    return { reading: `Level: ${level}% | Pump 1: ON | Pump 2: ${pump2}`, lastSeen: "just now" };
  },
  "WL-GAS-001": () => {
    const psi = jitter(18, 1);
    const lel = jitter(0, 0.05, 2);
    const isAlert = lel > 0.08;
    return {
      reading: `Pressure: ${psi} PSI | Methane: ${lel}% LEL`,
      status: isAlert ? "warning" : "online",
      alert: isAlert ? `Methane trace detected — ${lel}% LEL. Monitor closely.` : null,
      lastSeen: "just now",
    };
  },
  "WL-STORM-001": (prev) => {
    const currentLevel = parseInt(prev.reading.match(/Level: (\d+)/)?.[1] ?? "78");
    const newLevel = Math.min(95, Math.max(60, currentLevel + Math.floor((Math.random() - 0.3) * 4)));
    const isCritical = newLevel >= 85;
    const isAlert = newLevel >= 70;
    return {
      reading: `Level: ${newLevel}%${isAlert ? " ⚠ HIGH" : ""} | Debris: ${newLevel > 65 ? "DETECTED" : "CLEAR"}`,
      status: isCritical ? "alert" : isAlert ? "warning" : "online",
      alert: isCritical
        ? `CRITICAL: Storm drain ${newLevel}% full — immediate dispatch required`
        : isAlert
        ? `Storm drain ${newLevel}% full — debris blockage detected. Dispatch required.`
        : null,
      lastSeen: "just now",
    };
  },
  "WL-STORM-002": () => {
    const level = jitter(22, 6, 0);
    return { reading: `Level: ${level}% | ${level > 40 ? "⚠ Elevated" : "Clear"}`, lastSeen: secondsAgo(Math.floor(Math.random() * 30)) };
  },
  "WL-ROAD-001": (prev) => {
    const cycles = parseInt(prev.reading.match(/cycles: (\d+)/)?.[1] ?? "47");
    const newCycles = cycles + (Math.random() > 0.85 ? 1 : 0);
    const strain = jitter(0.008, 0.002, 4);
    const isAlert = strain > 0.009;
    return {
      reading: `Freeze-thaw cycles: ${newCycles} | Strain: ${strain}%${isAlert ? " ⚠" : ""}`,
      status: isAlert ? "warning" : "online",
      alert: isAlert ? "Pavement strain threshold approaching — schedule inspection" : null,
      lastSeen: secondsAgo(Math.floor(Math.random() * 60)),
    };
  },
  "WL-PARK-001": () => {
    const users = Math.max(0, Math.floor(jitter(12, 6, 0)));
    const db = jitter(48, 8, 0);
    return { reading: `Occupancy: ${users} users | Noise: ${db} dB`, lastSeen: "just now" };
  },
  "WL-PARK-002": () => {
    const moisture = jitter(34, 5, 1);
    const irrigating = moisture < 28;
    return {
      reading: `Soil moisture: ${moisture}% VWC | Irrigation: ${irrigating ? "ON" : "OFF"}`,
      lastSeen: secondsAgo(Math.floor(Math.random() * 30)),
    };
  },
  "WL-PD-001": () => {
    const temp = jitter(68, 1);
    const rh = jitter(45, 3, 0);
    return { reading: `Temp: ${temp}°F | Humidity: ${rh}% RH | Access: SECURE`, lastSeen: "just now" };
  },
};

// ─── Alert message pool for new-event ticker ─────────────────────────────────
const TICKER_POOL: { sensorId: string; type: AlertItem["type"]; msg: string }[] = [
  { sensorId: "WL-VALVE-001", type: "info", msg: "Water tower pressure nominal — 72 PSI" },
  { sensorId: "WL-GAS-001", type: "info", msg: "Gas regulator station — methane clear" },
  { sensorId: "WL-PARK-002", type: "info", msg: "City park irrigation skipped — soil moisture adequate" },
  { sensorId: "WL-STORM-001", type: "alert", msg: "Storm drain blockage worsening — 82% full" },
  { sensorId: "WL-PD-001", type: "info", msg: "Evidence room access log — no anomalies" },
  { sensorId: "WL-WATER-003", type: "info", msg: "Lift station pump cycle completed normally" },
  { sensorId: "WL-ROAD-001", type: "warning", msg: "W 7th St pavement strain approaching threshold" },
  { sensorId: "WL-PARK-001", type: "info", msg: "Trail occupancy: 15 users — above average for this hour" },
  { sensorId: "WL-VALVE-002", type: "warning", msg: "Pressure recovery detected on N Calhoun main" },
  { sensorId: "WL-STORM-002", type: "info", msg: "E 3rd St storm drain clear — 18% capacity" },
];

const INITIAL_ALERTS: AlertItem[] = [
  { id: "A001", sensorId: "WL-STORM-001", type: "alert", msg: "Storm drain 78% full — debris blockage detected", time: "just now", dispatched: false },
  { id: "A002", sensorId: "WL-VALVE-002", type: "warning", msg: "Low water pressure on N Calhoun — possible leak", time: "2m ago", dispatched: false },
  { id: "A003", sensorId: "WL-ROAD-001", type: "warning", msg: "W 7th St pavement strain approaching threshold", time: "8m ago", dispatched: false },
  { id: "A004", sensorId: "WL-PARK-001", type: "info", msg: "Trail occupancy normal — 12 users detected", time: "12m ago", dispatched: false },
  { id: "A005", sensorId: "WL-WATER-003", type: "info", msg: "Lift station pump cycle completed normally", time: "18m ago", dispatched: false },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface UseIoTSensorsOptions {
  /** Sensor telemetry update interval in ms. Default 4000. */
  sensorInterval?: number;
  /** Alert ticker interval in ms. Default 6000. */
  alertInterval?: number;
}

export function useIoTSensors(options: UseIoTSensorsOptions = {}) {
  const { sensorInterval = 4000, alertInterval = 6000 } = options;

  const [sensors, setSensors] = useState<SensorReading[]>(
    SEED_SENSORS.map(s => ({ ...s, tick: 0 }))
  );
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const tickerIdx = useRef(0);

  // Sensor telemetry polling
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      setSensors(prev =>
        prev.map(sensor => {
          const script = UPDATE_SCRIPTS[sensor.id];
          if (!script) return sensor;
          const patch = script(sensor);
          return { ...sensor, ...patch, tick: sensor.tick + 1 };
        })
      );
      setLastUpdated(new Date());
    }, sensorInterval);
    return () => clearInterval(id);
  }, [isLive, sensorInterval]);

  // Alert ticker
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      const ev = TICKER_POOL[tickerIdx.current % TICKER_POOL.length];
      tickerIdx.current++;
      const newAlert: AlertItem = {
        id: `A${Date.now()}`,
        sensorId: ev.sensorId,
        type: ev.type,
        msg: ev.msg,
        time: "just now",
        dispatched: false,
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }, alertInterval);
    return () => clearInterval(id);
  }, [isLive, alertInterval]);

  const dispatchAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dispatched: true } : a));
  }, []);

  const dispatchAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, dispatched: true })));
  }, []);

  const toggleLive = useCallback(() => setIsLive(v => !v), []);

  const alertCount = alerts.filter(a => !a.dispatched && a.type !== "info").length;
  const onlineCount = sensors.filter(s => s.status === "online").length;
  const warningCount = sensors.filter(s => s.status === "warning").length;
  const alertSensorCount = sensors.filter(s => s.status === "alert").length;

  return {
    sensors,
    alerts,
    isLive,
    lastUpdated,
    alertCount,
    onlineCount,
    warningCount,
    alertSensorCount,
    dispatchAlert,
    dispatchAll,
    toggleLive,
  };
}
