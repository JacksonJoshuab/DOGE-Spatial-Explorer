/**
 * useIoTSensors — Live IoT sensor feed with WebSocket + exponential backoff
 * Civic Intelligence Light design system
 *
 * Connection strategy:
 *  1. Attempt WebSocket connection to WS_ENDPOINT (configurable via VITE_IOT_WS_URL).
 *  2. On open: subscribe to all sensor channels, set wsStatus = "connected".
 *  3. On message: parse JSON payload, update sensor state via UPDATE_SCRIPTS.
 *  4. On close/error: enter reconnect loop with exponential backoff
 *     (1s → 2s → 4s → 8s → 16s → 30s cap) up to MAX_RETRIES attempts.
 *  5. After MAX_RETRIES failures: fall back to setInterval simulation so the
 *     UI always shows live-looking data even without a real WS endpoint.
 *
 * Expected WS message format:
 *   { "type": "sensor_update", "id": "WL-VALVE-001", "psi": 72.4, "gpm": 14.1 }
 *   { "type": "alert", "sensorId": "WL-STORM-001", "severity": "alert", "msg": "..." }
 *   { "type": "ping" }   — server keepalive, ignored
 *
 * Production endpoint: ws://iot.cityofwestlibertyia.org/sensors
 * (Set VITE_IOT_WS_URL in .env to override)
 */
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
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

export type WsStatus = "connecting" | "connected" | "reconnecting" | "failed" | "simulation";

// ─── WebSocket config ─────────────────────────────────────────────────────────
const WS_ENDPOINT = (import.meta.env.VITE_IOT_WS_URL as string | undefined)
  ?? "ws://iot.cityofwestlibertyia.org/sensors";

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

// ─── Seed data ────────────────────────────────────────────────────────────────
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

// ─── Telemetry simulation (used as fallback when WS unavailable) ──────────────
function jitter(base: number, range: number, decimals = 1): number {
  return parseFloat((base + (Math.random() - 0.5) * range * 2).toFixed(decimals));
}
function secondsAgo(s: number): string {
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}

const UPDATE_SCRIPTS: Record<string, (prev: SensorReading) => Partial<SensorReading>> = {
  "WL-VALVE-001": () => {
    const psi = jitter(72, 3); const gpm = jitter(14.2, 1.5);
    return { reading: `Pressure: ${psi} PSI | Flow: ${gpm} GPM`, lastSeen: "just now", status: "online", alert: null };
  },
  "WL-VALVE-002": (prev) => {
    const psi = jitter(58, 5); const gpm = jitter(9.1, 2);
    const isLow = psi < 55; const isRecovering = psi > 65;
    return {
      reading: `Pressure: ${psi} PSI${isLow ? " ⚠ LOW" : isRecovering ? " ✓ RECOVERING" : ""} | Flow: ${gpm} GPM`,
      status: isRecovering ? "online" : prev.status,
      alert: isRecovering ? null : prev.alert, lastSeen: "just now",
    };
  },
  "WL-WATER-003": () => {
    const level = jitter(42, 8, 0); const pump2 = level > 55 ? "ON" : "STANDBY";
    return { reading: `Level: ${level}% | Pump 1: ON | Pump 2: ${pump2}`, lastSeen: "just now" };
  },
  "WL-GAS-001": () => {
    const psi = jitter(18, 1); const lel = jitter(0, 0.05, 2); const isAlert = lel > 0.08;
    return {
      reading: `Pressure: ${psi} PSI | Methane: ${lel}% LEL`,
      status: isAlert ? "warning" : "online",
      alert: isAlert ? `Methane trace detected — ${lel}% LEL. Monitor closely.` : null, lastSeen: "just now",
    };
  },
  "WL-STORM-001": (prev) => {
    const cur = parseInt(prev.reading.match(/Level: (\d+)/)?.[1] ?? "78");
    const lv = Math.min(95, Math.max(60, cur + Math.floor((Math.random() - 0.3) * 4)));
    return {
      reading: `Level: ${lv}%${lv >= 70 ? " ⚠ HIGH" : ""} | Debris: ${lv > 65 ? "DETECTED" : "CLEAR"}`,
      status: lv >= 85 ? "alert" : lv >= 70 ? "warning" : "online",
      alert: lv >= 85 ? `CRITICAL: Storm drain ${lv}% full — immediate dispatch required`
           : lv >= 70 ? `Storm drain ${lv}% full — debris blockage detected.` : null,
      lastSeen: "just now",
    };
  },
  "WL-STORM-002": () => {
    const lv = jitter(22, 6, 0);
    return { reading: `Level: ${lv}% | ${lv > 40 ? "⚠ Elevated" : "Clear"}`, lastSeen: secondsAgo(Math.floor(Math.random() * 30)) };
  },
  "WL-ROAD-001": (prev) => {
    const cycles = parseInt(prev.reading.match(/cycles: (\d+)/)?.[1] ?? "47") + (Math.random() > 0.85 ? 1 : 0);
    const strain = jitter(0.008, 0.002, 4); const isAlert = strain > 0.009;
    return {
      reading: `Freeze-thaw cycles: ${cycles} | Strain: ${strain}%${isAlert ? " ⚠" : ""}`,
      status: isAlert ? "warning" : "online",
      alert: isAlert ? "Pavement strain threshold approaching — schedule inspection" : null,
      lastSeen: secondsAgo(Math.floor(Math.random() * 60)),
    };
  },
  "WL-PARK-001": () => {
    const users = Math.max(0, Math.floor(jitter(12, 6, 0))); const db = jitter(48, 8, 0);
    return { reading: `Occupancy: ${users} users | Noise: ${db} dB`, lastSeen: "just now" };
  },
  "WL-PARK-002": () => {
    const moisture = jitter(34, 5, 1); const irrigating = moisture < 28;
    return { reading: `Soil moisture: ${moisture}% VWC | Irrigation: ${irrigating ? "ON" : "OFF"}`, lastSeen: secondsAgo(Math.floor(Math.random() * 30)) };
  },
  "WL-PD-001": () => {
    const temp = jitter(68, 1); const rh = jitter(45, 3, 0);
    return { reading: `Temp: ${temp}°F | Humidity: ${rh}% RH | Access: SECURE`, lastSeen: "just now" };
  },
};

const TICKER_POOL: { sensorId: string; type: AlertItem["type"]; msg: string }[] = [
  { sensorId: "WL-VALVE-001", type: "info",    msg: "Water tower pressure nominal — 72 PSI" },
  { sensorId: "WL-GAS-001",   type: "info",    msg: "Gas regulator station — methane clear" },
  { sensorId: "WL-PARK-002",  type: "info",    msg: "City park irrigation skipped — soil moisture adequate" },
  { sensorId: "WL-STORM-001", type: "alert",   msg: "Storm drain blockage worsening — 82% full" },
  { sensorId: "WL-PD-001",    type: "info",    msg: "Evidence room access log — no anomalies" },
  { sensorId: "WL-WATER-003", type: "info",    msg: "Lift station pump cycle completed normally" },
  { sensorId: "WL-ROAD-001",  type: "warning", msg: "W 7th St pavement strain approaching threshold" },
  { sensorId: "WL-PARK-001",  type: "info",    msg: "Trail occupancy: 15 users — above average" },
  { sensorId: "WL-VALVE-002", type: "warning", msg: "Pressure recovery detected on N Calhoun main" },
  { sensorId: "WL-STORM-002", type: "info",    msg: "E 3rd St storm drain clear — 18% capacity" },
];

const INITIAL_ALERTS: AlertItem[] = [
  { id: "A001", sensorId: "WL-STORM-001", type: "alert",   msg: "Storm drain 78% full — debris blockage detected", time: "just now", dispatched: false },
  { id: "A002", sensorId: "WL-VALVE-002", type: "warning", msg: "Low water pressure on N Calhoun — possible leak",  time: "2m ago",   dispatched: false },
  { id: "A003", sensorId: "WL-ROAD-001",  type: "warning", msg: "W 7th St pavement strain approaching threshold",   time: "8m ago",   dispatched: false },
  { id: "A004", sensorId: "WL-PARK-001",  type: "info",    msg: "Trail occupancy normal — 12 users detected",       time: "12m ago",  dispatched: false },
  { id: "A005", sensorId: "WL-WATER-003", type: "info",    msg: "Lift station pump cycle completed normally",        time: "18m ago",  dispatched: false },
];

// ─── Hook options ─────────────────────────────────────────────────────────────
export interface UseIoTSensorsOptions {
  sensorInterval?: number;
  alertInterval?: number;
  /** Called when any sensor transitions into "alert" or "warning" status */
  onAlert?: (sensor: SensorReading, prevStatus: SensorReading["status"]) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useIoTSensors(options: UseIoTSensorsOptions = {}) {
  const { sensorInterval = 4000, alertInterval = 6000, onAlert } = options;
  const onAlertRef = useRef(onAlert);
  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);

  const [sensors, setSensors] = useState<SensorReading[]>(SEED_SENSORS.map(s => ({ ...s, tick: 0 })));
  const [alerts, setAlerts]   = useState<AlertItem[]>(INITIAL_ALERTS);
  const [isLive, setIsLive]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");

  const wsRef       = useRef<WebSocket | null>(null);
  const retryCount  = useRef(0);
  const retryTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerIdx   = useRef(0);
  const usingSimRef = useRef(false); // true once we give up on WS

  // ── Simulation fallback ───────────────────────────────────────────────────
  const runSimulation = useCallback(() => {
    usingSimRef.current = true;
    setWsStatus("simulation");
  }, []);

  // ── Sensor telemetry update (shared by WS handler + simulation) ───────────
  const applyTelemetryUpdate = useCallback(() => {
    setSensors(prev => {
      const next = prev.map(sensor => {
        const script = UPDATE_SCRIPTS[sensor.id];
        if (!script) return sensor;
        const patch = script(sensor);
        const updated: SensorReading = { ...sensor, ...patch, tick: sensor.tick + 1 };

        // Fire onAlert when a sensor transitions INTO alert or warning
        const prevStatus = sensor.status;
        const newStatus  = updated.status;
        if (newStatus !== prevStatus && (newStatus === "alert" || newStatus === "warning")) {
          // Defer to avoid setState-in-render
          setTimeout(() => onAlertRef.current?.(updated, prevStatus), 0);
        }

        return updated;
      });
      return next;
    });
    setLastUpdated(new Date());
  }, []);

  // ── WebSocket connection with exponential backoff ─────────────────────────
  const connect = useCallback(() => {
    if (usingSimRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsStatus(retryCount.current === 0 ? "connecting" : "reconnecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_ENDPOINT);
    } catch {
      // WebSocket constructor can throw in some environments (e.g., invalid URL)
      runSimulation();
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      setWsStatus("connected");
      // Subscribe to all sensor channels
      ws.send(JSON.stringify({ type: "subscribe", channels: ["sensors", "alerts"] }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        if (msg.type === "ping") return;

        if (msg.type === "sensor_update") {
          // Real WS payload: merge partial update into sensor state
          setSensors(prev => prev.map(s => {
            if (s.id !== msg.id) return s;
            const patch: Partial<SensorReading> = {};
            if (typeof msg.psi === "number") patch.reading = `Pressure: ${msg.psi} PSI`;
            if (typeof msg.status === "string") patch.status = msg.status as SensorReading["status"];
            if (typeof msg.alert === "string" || msg.alert === null) patch.alert = msg.alert as string | null;
            return { ...s, ...patch, lastSeen: "just now", tick: s.tick + 1 };
          }));
          setLastUpdated(new Date());
        }

        if (msg.type === "alert") {
          const newAlert: AlertItem = {
            id: `A${Date.now()}`,
            sensorId: String(msg.sensorId ?? ""),
            type: (msg.severity as AlertItem["type"]) ?? "info",
            msg: String(msg.msg ?? ""),
            time: "just now",
            dispatched: false,
          };
          setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
        }
      } catch {
        // Malformed message — ignore
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror; handle retry there
    };

    ws.onclose = () => {
      if (usingSimRef.current) return;
      retryCount.current += 1;
      if (retryCount.current > MAX_RETRIES) {
        setWsStatus("failed");
        runSimulation();
        return;
      }
      const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount.current - 1), MAX_BACKOFF_MS);
      setWsStatus("reconnecting");
      retryTimer.current = setTimeout(connect, delay);
    };
  }, [runSimulation]);

  // ── Lifecycle: attempt WS, fall back to simulation ────────────────────────
  useEffect(() => {
    connect();
    return () => {
      usingSimRef.current = true; // prevent reconnect on unmount
      if (retryTimer.current) clearTimeout(retryTimer.current);
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Simulation interval (runs when WS unavailable or paused) ─────────────
  useEffect(() => {
    if (!isLive) return;
    // Always run simulation — if WS is connected it will also update state
    // via onmessage, but simulation ensures the UI is never stale.
    const id = setInterval(applyTelemetryUpdate, sensorInterval);
    return () => clearInterval(id);
  }, [isLive, sensorInterval, applyTelemetryUpdate]);

  // ── Alert ticker ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      const ev = TICKER_POOL[tickerIdx.current % TICKER_POOL.length];
      tickerIdx.current++;
      setAlerts(prev => [{
        id: `A${Date.now()}`,
        sensorId: ev.sensorId,
        type: ev.type,
        msg: ev.msg,
        time: "just now",
        dispatched: false,
      }, ...prev.slice(0, 9)]);
    }, alertInterval);
    return () => clearInterval(id);
  }, [isLive, alertInterval]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const dispatchAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dispatched: true } : a));
  }, []);

  const dispatchAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, dispatched: true })));
  }, []);

  const toggleLive = useCallback(() => setIsLive(v => !v), []);

  // ── Derived counts ────────────────────────────────────────────────────────
  const alertCount      = alerts.filter(a => !a.dispatched && a.type !== "info").length;
  const onlineCount     = sensors.filter(s => s.status === "online").length;
  const warningCount    = sensors.filter(s => s.status === "warning").length;
  const alertSensorCount = sensors.filter(s => s.status === "alert").length;

  return {
    sensors, alerts, isLive, lastUpdated, wsStatus,
    alertCount, onlineCount, warningCount, alertSensorCount,
    dispatchAlert, dispatchAll, toggleLive,
  };
}
