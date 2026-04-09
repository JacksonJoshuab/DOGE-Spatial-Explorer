/*
 * DOGE-LANDSCAPER — WebSocket Telemetry
 * Connects to ws://jetson-orin.local:8765/telemetry (Nvidia Jetson Orin AGX)
 * Falls back to simulation if the robot is offline / unreachable.
 *
 * Protocol: Jetson sends JSON frames at 10 Hz matching TelemetryData shape.
 * On connect: sends {"type":"subscribe","channels":["all"]}
 * On disconnect: auto-reconnects every 3 s (up to 5 attempts), then stays simulated.
 *
 * West Liberty, Iowa — 905 N Columbus St (Muscatine County Parcel 0112177049)
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface TelemetryData {
  // System
  cpuUsage: number;
  gpuUsage: number;
  ramUsed: number;
  ramTotal: number;
  cpuTemp: number;
  gpuTemp: number;
  powerDraw: number;
  uptime: string;
  // Sensors
  lidarPoints: number;
  lidarHz: number;
  cameraFps: number;
  imuRoll: number;
  imuPitch: number;
  imuYaw: number;
  // GPS
  lat: number;
  lon: number;
  gpsAccuracy: number;
  heading: number;
  speed: number;
  // Environment
  windSpeed: number;
  windDir: number;
  soilMoisture: number[];
  ambientTemp: number;
  // Network
  wifiRssi: number;
  latencyMs: number;
  uploadMbps: number;
  downloadMbps: number;
  continuityStatus: "connected" | "standby" | "disconnected";
  visionOsStatus: "connected" | "standby" | "disconnected";
  // AI
  objectsDetected: number;
  weedsIdentified: number;
  inferenceMs: number;
  aiConfidence: number;
  // Robot state
  batteryLevel: number;
  batteryVoltage: number;
  motorTemp: number;
  jointPositions: number[];
  // Connection
  connected: boolean;
  lastPacket: Date | null;
  packetCount: number;
}

// ── Coordinates ────────────────────────────────────────────────────────────────
const BASE_LAT = 41.5769;
const BASE_LON = -91.2607;

// ── Helpers ────────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function noise(base: number, range: number) {
  return base + (Math.random() - 0.5) * range;
}
function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

// ── Initial state ──────────────────────────────────────────────────────────────
const INITIAL_STATE: TelemetryData = {
  cpuUsage: 42, gpuUsage: 67, ramUsed: 9.2, ramTotal: 16, cpuTemp: 52, gpuTemp: 61,
  powerDraw: 18.4, uptime: "14h 23m 11s",
  lidarPoints: 32768, lidarHz: 20, cameraFps: 30, imuRoll: 0.2, imuPitch: -0.8, imuYaw: 127.4,
  lat: BASE_LAT, lon: BASE_LON, gpsAccuracy: 2.1, heading: 127, speed: 0.4,
  windSpeed: 8.2, windDir: 315, soilMoisture: [28, 31, 25, 33], ambientTemp: 58,
  wifiRssi: -42, latencyMs: 12, uploadMbps: 2.1, downloadMbps: 8.4,
  continuityStatus: "connected", visionOsStatus: "standby",
  objectsDetected: 12, weedsIdentified: 23, inferenceMs: 47, aiConfidence: 94.2,
  batteryLevel: 78, batteryVoltage: 48.2, motorTemp: 38, jointPositions: [0, 15, -10, 5, 0, 0],
  connected: true, lastPacket: new Date(), packetCount: 0,
};

// ── WebSocket endpoint ─────────────────────────────────────────────────────────
const JETSON_WS_URL = "ws://jetson-orin.local:8765/telemetry";
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

export function useTelemetry() {
  const [data, setData] = useState<TelemetryData>(INITIAL_STATE);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "simulated" | "error">("connecting");
  const uptimeRef = useRef(14 * 3600 + 23 * 60 + 11);
  const packetRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLiveRef = useRef(false); // true when WS is actually connected and sending data

  // ── Simulation tick ──────────────────────────────────────────────────────────
  const simulateTick = useCallback(() => {
    uptimeRef.current += 1;
    packetRef.current += 1;
    setData(prev => {
      const next: TelemetryData = {
        cpuUsage: clamp(noise(prev.cpuUsage, 4), 25, 95),
        gpuUsage: clamp(noise(prev.gpuUsage, 3), 40, 99),
        ramUsed: clamp(noise(prev.ramUsed, 0.1), 7, 15),
        ramTotal: 16,
        cpuTemp: clamp(noise(prev.cpuTemp, 0.5), 45, 75),
        gpuTemp: clamp(noise(prev.gpuTemp, 0.5), 50, 82),
        powerDraw: clamp(noise(prev.powerDraw, 0.3), 12, 28),
        uptime: formatUptime(uptimeRef.current),
        lidarPoints: clamp(Math.round(noise(prev.lidarPoints, 1000)), 20000, 65536),
        lidarHz: 20,
        cameraFps: clamp(Math.round(noise(prev.cameraFps, 1)), 24, 30),
        imuRoll: clamp(noise(prev.imuRoll, 0.3), -5, 5),
        imuPitch: clamp(noise(prev.imuPitch, 0.3), -8, 8),
        imuYaw: (prev.imuYaw + noise(0, 0.5) + 360) % 360,
        lat: BASE_LAT + Math.sin(Date.now() / 30000) * 0.0003,
        lon: BASE_LON + Math.cos(Date.now() / 25000) * 0.0004,
        gpsAccuracy: clamp(noise(prev.gpsAccuracy, 0.2), 1.5, 5.0),
        heading: (prev.heading + noise(0, 1) + 360) % 360,
        speed: clamp(noise(prev.speed, 0.1), 0, 1.2),
        windSpeed: clamp(noise(prev.windSpeed, 0.4), 2, 25),
        windDir: (prev.windDir + noise(0, 2) + 360) % 360,
        soilMoisture: prev.soilMoisture.map(m => clamp(noise(m, 0.5), 10, 80)),
        ambientTemp: clamp(noise(prev.ambientTemp, 0.2), 40, 95),
        wifiRssi: clamp(Math.round(noise(prev.wifiRssi, 2)), -80, -25),
        latencyMs: clamp(Math.round(noise(prev.latencyMs, 3)), 5, 120),
        uploadMbps: clamp(noise(prev.uploadMbps, 0.2), 0.5, 10),
        downloadMbps: clamp(noise(prev.downloadMbps, 0.5), 2, 50),
        continuityStatus: prev.continuityStatus,
        visionOsStatus: prev.visionOsStatus,
        objectsDetected: clamp(Math.round(noise(prev.objectsDetected, 1)), 5, 25),
        weedsIdentified: prev.weedsIdentified,
        inferenceMs: clamp(Math.round(noise(prev.inferenceMs, 3)), 30, 80),
        aiConfidence: clamp(noise(prev.aiConfidence, 0.5), 75, 99),
        batteryLevel: clamp(prev.batteryLevel - 0.002, 5, 100),
        batteryVoltage: clamp(noise(prev.batteryVoltage, 0.05), 40, 54.6),
        motorTemp: clamp(noise(prev.motorTemp, 0.3), 30, 65),
        jointPositions: prev.jointPositions.map(p => clamp(noise(p, 2), -180, 180)),
        connected: isLiveRef.current,
        lastPacket: new Date(),
        packetCount: packetRef.current,
      };
      return next;
    });
  }, []);

  const startSimulation = useCallback(() => {
    if (simulationIntervalRef.current) return;
    simulationIntervalRef.current = setInterval(simulateTick, 100); // 10 Hz
  }, [simulateTick]);

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // ── WebSocket connection ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    // Clean up any existing socket
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setWsStatus("connecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(JETSON_WS_URL);
    } catch {
      // WebSocket constructor can throw in some environments
      setWsStatus("simulated");
      startSimulation();
      return;
    }
    wsRef.current = ws;

    // Connection timeout — if no open within 4 s, fall back to simulation
    const openTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setWsStatus("simulated");
        isLiveRef.current = false;
        startSimulation();
      }
    }, 4000);

    ws.onopen = () => {
      clearTimeout(openTimeout);
      reconnectAttemptsRef.current = 0;
      isLiveRef.current = true;
      setWsStatus("connected");
      stopSimulation(); // live data replaces simulation
      // Subscribe to all telemetry channels
      ws.send(JSON.stringify({ type: "subscribe", channels: ["all"] }));
    };

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data as string);
        packetRef.current += 1;
        // Merge incoming frame with current state (partial updates supported)
        setData(prev => ({
          ...prev,
          ...frame,
          lastPacket: new Date(),
          packetCount: packetRef.current,
          connected: true,
          uptime: frame.uptime ?? formatUptime(uptimeRef.current),
        }));
      } catch {
        // Malformed frame — ignore
      }
    };

    ws.onerror = () => {
      clearTimeout(openTimeout);
      // Error is always followed by onclose; handle reconnect there
    };

    ws.onclose = () => {
      clearTimeout(openTimeout);
      isLiveRef.current = false;
      wsRef.current = null;

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        setWsStatus("connecting");
        // Run simulation while waiting to reconnect
        startSimulation();
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      } else {
        // Give up — stay in simulation mode permanently
        setWsStatus("simulated");
        startSimulation();
      }
    };
  }, [startSimulation, stopSimulation]);

  useEffect(() => {
    connect();
    return () => {
      // Cleanup on unmount
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopSimulation();
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, stopSimulation]);

  return { data, wsStatus };
}
