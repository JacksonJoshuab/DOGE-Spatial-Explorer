/*
 * DOGE-LANDSCAPER — WebSocket Telemetry Simulation
 * Simulates live Nvidia Jetson Orin sensor data stream
 * In production: connect to ws://jetson-orin.local:8765
 * Uses BroadcastChannel to simulate multi-tab sync (visionOS companion)
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

// Wilton, Iowa base GPS — simulates robot moving around property
const BASE_LAT = 41.5867;
const BASE_LON = -91.0154;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

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

export function useTelemetry() {
  const [data, setData] = useState<TelemetryData>(INITIAL_STATE);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "simulated" | "error">("simulated");
  const uptimeRef = useRef(14 * 3600 + 23 * 60 + 11);
  const packetRef = useRef(0);
  const prevRef = useRef<TelemetryData>(INITIAL_STATE);

  // Simulate WebSocket-style streaming at 10Hz
  const simulate = useCallback(() => {
    uptimeRef.current += 1;
    packetRef.current += 1;

    setData(prev => {
      const next: TelemetryData = {
        // System — gradual drift with noise
        cpuUsage: clamp(noise(prev.cpuUsage, 4), 25, 95),
        gpuUsage: clamp(noise(prev.gpuUsage, 3), 40, 99),
        ramUsed: clamp(noise(prev.ramUsed, 0.1), 7, 15),
        ramTotal: 16,
        cpuTemp: clamp(noise(prev.cpuTemp, 0.5), 45, 75),
        gpuTemp: clamp(noise(prev.gpuTemp, 0.5), 50, 82),
        powerDraw: clamp(noise(prev.powerDraw, 0.3), 12, 28),
        uptime: formatUptime(uptimeRef.current),

        // LiDAR — varies with environment complexity
        lidarPoints: clamp(Math.round(noise(prev.lidarPoints, 1000)), 20000, 65536),
        lidarHz: 20,
        cameraFps: clamp(Math.round(noise(prev.cameraFps, 1)), 24, 30),

        // IMU — small vibrations while moving
        imuRoll: clamp(noise(prev.imuRoll, 0.3), -5, 5),
        imuPitch: clamp(noise(prev.imuPitch, 0.3), -8, 8),
        imuYaw: (prev.imuYaw + noise(0, 0.5) + 360) % 360,

        // GPS — robot moves slowly around property
        lat: BASE_LAT + Math.sin(Date.now() / 30000) * 0.0003,
        lon: BASE_LON + Math.cos(Date.now() / 25000) * 0.0004,
        gpsAccuracy: clamp(noise(prev.gpsAccuracy, 0.2), 1.5, 5.0),
        heading: (prev.heading + noise(0, 1) + 360) % 360,
        speed: clamp(noise(prev.speed, 0.1), 0, 1.2),

        // Environment
        windSpeed: clamp(noise(prev.windSpeed, 0.4), 2, 25),
        windDir: (prev.windDir + noise(0, 2) + 360) % 360,
        soilMoisture: prev.soilMoisture.map(m => clamp(noise(m, 0.5), 10, 80)),
        ambientTemp: clamp(noise(prev.ambientTemp, 0.2), 40, 95),

        // Network
        wifiRssi: clamp(Math.round(noise(prev.wifiRssi, 2)), -80, -25),
        latencyMs: clamp(Math.round(noise(prev.latencyMs, 3)), 5, 120),
        uploadMbps: clamp(noise(prev.uploadMbps, 0.2), 0.5, 10),
        downloadMbps: clamp(noise(prev.downloadMbps, 0.5), 2, 50),
        continuityStatus: prev.continuityStatus,
        visionOsStatus: prev.visionOsStatus,

        // AI — occasional detection changes
        objectsDetected: clamp(Math.round(noise(prev.objectsDetected, 1)), 5, 25),
        weedsIdentified: prev.weedsIdentified,
        inferenceMs: clamp(Math.round(noise(prev.inferenceMs, 3)), 30, 80),
        aiConfidence: clamp(noise(prev.aiConfidence, 0.5), 75, 99),

        // Battery — slow drain
        batteryLevel: clamp(prev.batteryLevel - 0.002, 5, 100),
        batteryVoltage: clamp(noise(prev.batteryVoltage, 0.05), 40, 54.6),
        motorTemp: clamp(noise(prev.motorTemp, 0.3), 30, 65),
        jointPositions: prev.jointPositions.map(p => clamp(noise(p, 2), -180, 180)),

        connected: true,
        lastPacket: new Date(),
        packetCount: packetRef.current,
      };
      prevRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    setWsStatus("simulated");
    // Simulate 10Hz telemetry stream (100ms interval)
    const interval = setInterval(simulate, 100);
    return () => clearInterval(interval);
  }, [simulate]);

  // Attempt real WebSocket connection (will fail gracefully in browser)
  useEffect(() => {
    // In production, replace with actual Jetson Orin WebSocket endpoint
    // const ws = new WebSocket("ws://jetson-orin.local:8765/telemetry");
    // ws.onopen = () => setWsStatus("connected");
    // ws.onmessage = (e) => setData(JSON.parse(e.data));
    // ws.onerror = () => setWsStatus("simulated");
    // return () => ws.close();
  }, []);

  return { data, wsStatus };
}
