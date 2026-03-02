/**
 * SpatialMap — /map (dashboard)
 * Real West Liberty, IA coordinates centered on City Hall (41.5742° N, 91.2635° W)
 * Clickable IoT sensor pins, live alert ticker, click-to-dispatch to Operations Center
 * Design: Civic Intelligence Light
 */
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Droplets, Zap, Shield, Wrench, TreePine, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, Radio, X,
  Layers, Activity, Send, Eye, EyeOff, Wifi, GitBranch
} from "lucide-react";
import { toast } from "sonner";

// ─── West Liberty IoT Sensor Locations ───────────────────────────────────────
// All coordinates verified against West Liberty, IA street map
const IOT_SENSORS = [
  {
    id: "WL-VALVE-001",
    name: "Water Tower Valve",
    type: "water",
    icon: Droplets,
    color: "#2563eb",
    lat: 41.5762,
    lng: -91.2618,
    address: "Water Tower Rd, West Liberty",
    status: "online",
    reading: "Pressure: 72 PSI | Flow: 14.2 GPM",
    device: "SmartValve Pro",
    lastSeen: "12s ago",
    alert: null,
  },
  {
    id: "WL-VALVE-002",
    name: "Main St Water Main",
    type: "water",
    icon: Droplets,
    color: "#2563eb",
    lat: 41.5740,
    lng: -91.2642,
    address: "N Calhoun St & W 3rd St",
    status: "warning",
    reading: "Pressure: 58 PSI ⚠ LOW | Flow: 9.1 GPM",
    device: "SmartValve Pro",
    lastSeen: "4s ago",
    alert: "Low pressure detected — possible leak downstream",
  },
  {
    id: "WL-WATER-003",
    name: "Wastewater Lift Station",
    type: "sewer",
    icon: Zap,
    color: "#7c3aed",
    lat: 41.5720,
    lng: -91.2658,
    address: "S Calhoun St, West Liberty",
    status: "online",
    reading: "Level: 42% | Pump 1: ON | Pump 2: STANDBY",
    device: "AquaSentinel Node",
    lastSeen: "8s ago",
    alert: null,
  },
  {
    id: "WL-GAS-001",
    name: "Gas Regulator Station",
    type: "sewer",
    icon: Zap,
    color: "#d97706",
    lat: 41.5748,
    lng: -91.2601,
    address: "E 7th St, West Liberty",
    status: "online",
    reading: "Pressure: 18 PSI | Methane: 0.0% LEL",
    device: "GasPulse Monitor",
    lastSeen: "22s ago",
    alert: null,
  },
  {
    id: "WL-STORM-001",
    name: "Storm Drain — N Calhoun",
    type: "roads",
    icon: Wrench,
    color: "#059669",
    lat: 41.5752,
    lng: -91.2635,
    address: "N Calhoun St & W 5th St",
    status: "alert",
    reading: "Level: 78% ⚠ HIGH | Debris: DETECTED",
    device: "StormNet Drain Sensor",
    lastSeen: "1s ago",
    alert: "Storm drain 78% full — debris blockage detected. Dispatch required.",
  },
  {
    id: "WL-STORM-002",
    name: "Storm Drain — E 3rd St",
    type: "roads",
    icon: Wrench,
    color: "#059669",
    lat: 41.5733,
    lng: -91.2620,
    address: "E 3rd St & N Iowa Ave",
    status: "online",
    reading: "Level: 22% | Clear",
    device: "StormNet Drain Sensor",
    lastSeen: "15s ago",
    alert: null,
  },
  {
    id: "WL-ROAD-001",
    name: "Pavement Monitor — W 7th St",
    type: "roads",
    icon: Wrench,
    color: "#059669",
    lat: 41.5742,
    lng: -91.2670,
    address: "W 7th St, West Liberty",
    status: "warning",
    reading: "Freeze-thaw cycles: 47 | Strain: 0.008% ⚠",
    device: "RoadSense Pavement Monitor",
    lastSeen: "30s ago",
    alert: "Pavement strain threshold approaching — schedule inspection",
  },
  {
    id: "WL-PARK-001",
    name: "Wapsi-Great Western Trail",
    type: "parks",
    icon: TreePine,
    color: "#16a34a",
    lat: 41.5758,
    lng: -91.2650,
    address: "Wapsi-Great Western Trail, West Liberty",
    status: "online",
    reading: "Occupancy: 12 users | Noise: 48 dB",
    device: "ParkPulse Occupancy Node",
    lastSeen: "5s ago",
    alert: null,
  },
  {
    id: "WL-PARK-002",
    name: "City Park Irrigation",
    type: "parks",
    icon: TreePine,
    color: "#16a34a",
    lat: 41.5730,
    lng: -91.2645,
    address: "City Park, West Liberty",
    status: "online",
    reading: "Soil moisture: 34% VWC | Irrigation: OFF",
    device: "IrriSmart Soil Sensor",
    lastSeen: "18s ago",
    alert: null,
  },
  {
    id: "WL-PD-001",
    name: "Police Dept Evidence Room",
    type: "le",
    icon: Shield,
    color: "#dc2626",
    lat: 41.5742,
    lng: -91.2635,
    address: "West Liberty Police Dept, 405 N Calhoun St",
    status: "online",
    reading: "Temp: 68°F | Humidity: 45% RH | Access: SECURE",
    device: "DOGE Sentinel Node",
    lastSeen: "3s ago",
    alert: null,
  },
];

const LAYER_CONFIG: Record<string, { label: string; color: string }> = {
  water: { label: "Water Utility", color: "#2563eb" },
  sewer: { label: "Sewer / Gas", color: "#7c3aed" },
  roads: { label: "Public Works", color: "#059669" },
  parks: { label: "Parks & Rec", color: "#16a34a" },
  le: { label: "Law Enforcement", color: "#dc2626" },
};

// GIS infrastructure polyline routes for West Liberty, IA
const GIS_LAYERS = {
  water_main: {
    label: "Water Mains",
    color: "#2563eb",
    weight: 4,
    opacity: 0.7,
    paths: [
      // N Calhoun St water main (north-south trunk)
      [{ lat: 41.5770, lng: -91.2635 }, { lat: 41.5742, lng: -91.2635 }, { lat: 41.5715, lng: -91.2635 }],
      // W 7th St water main (east-west)
      [{ lat: 41.5742, lng: -91.2680 }, { lat: 41.5742, lng: -91.2635 }, { lat: 41.5742, lng: -91.2590 }],
      // E 3rd St lateral
      [{ lat: 41.5730, lng: -91.2660 }, { lat: 41.5730, lng: -91.2610 }],
      // Iowa Ave lateral
      [{ lat: 41.5760, lng: -91.2620 }, { lat: 41.5720, lng: -91.2620 }],
    ],
  },
  sewer_line: {
    label: "Sewer Lines",
    color: "#7c3aed",
    weight: 3,
    opacity: 0.65,
    paths: [
      // Main sewer trunk to lift station
      [{ lat: 41.5760, lng: -91.2640 }, { lat: 41.5742, lng: -91.2645 }, { lat: 41.5720, lng: -91.2658 }],
      // E side collector
      [{ lat: 41.5755, lng: -91.2600 }, { lat: 41.5735, lng: -91.2610 }, { lat: 41.5720, lng: -91.2630 }],
      // W side collector
      [{ lat: 41.5750, lng: -91.2670 }, { lat: 41.5730, lng: -91.2665 }, { lat: 41.5720, lng: -91.2658 }],
    ],
  },
  fiber_route: {
    label: "Fiber Routes",
    color: "#f59e0b",
    weight: 2,
    opacity: 0.8,
    paths: [
      // Municipal fiber ring — City Hall to Police to Utilities
      [{ lat: 41.5742, lng: -91.2635 }, { lat: 41.5742, lng: -91.2635 }, { lat: 41.5758, lng: -91.2650 }, { lat: 41.5762, lng: -91.2618 }, { lat: 41.5748, lng: -91.2601 }, { lat: 41.5742, lng: -91.2635 }],
      // Last-mile to park sensors
      [{ lat: 41.5742, lng: -91.2635 }, { lat: 41.5730, lng: -91.2645 }],
    ],
  },
};

type GisLayerKey = keyof typeof GIS_LAYERS;

const INITIAL_ALERTS = [
  { id: "A001", sensorId: "WL-STORM-001", type: "alert" as const, msg: "Storm drain 78% full — debris blockage detected", time: "just now", dispatched: false },
  { id: "A002", sensorId: "WL-VALVE-002", type: "warning" as const, msg: "Low water pressure on N Calhoun — possible leak", time: "2m ago", dispatched: false },
  { id: "A003", sensorId: "WL-ROAD-001", type: "warning" as const, msg: "W 7th St pavement strain approaching threshold", time: "8m ago", dispatched: false },
  { id: "A004", sensorId: "WL-PARK-001", type: "info" as const, msg: "Trail occupancy normal — 12 users detected", time: "12m ago", dispatched: false },
  { id: "A005", sensorId: "WL-WATER-003", type: "info" as const, msg: "Lift station pump cycle completed normally", time: "18m ago", dispatched: false },
];

type AlertItem = typeof INITIAL_ALERTS[0];

function getStatusColor(status: string) {
  if (status === "alert") return "#dc2626";
  if (status === "warning") return "#d97706";
  if (status === "offline") return "#6b7280";
  return "#16a34a";
}

function getAlertTypeStyle(type: string) {
  if (type === "alert") return { bg: "oklch(0.58 0.22 25 / 10%)", border: "oklch(0.58 0.22 25 / 25%)", text: "oklch(0.45 0.22 25)" };
  if (type === "warning") return { bg: "oklch(0.72 0.18 75 / 10%)", border: "oklch(0.72 0.18 75 / 25%)", text: "oklch(0.50 0.18 75)" };
  return { bg: "oklch(0.40 0.18 240 / 8%)", border: "oklch(0.40 0.18 240 / 20%)", text: "oklch(0.40 0.18 240)" };
}

export default function SpatialMap() {
  const [, navigate] = useLocation();
  const [selectedSensor, setSelectedSensor] = useState<typeof IOT_SENSORS[0] | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["water", "sewer", "roads", "parks", "le"]));
  const [activeGisLayers, setActiveGisLayers] = useState<Set<GisLayerKey>>(new Set());
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, google.maps.Polyline[]>>(new Map());

  // Simulate new alerts arriving every 6 seconds
  useEffect(() => {
    const NEW_EVENTS = [
      { sensorId: "WL-VALVE-001", type: "info" as const, msg: "Water tower pressure nominal — 72 PSI" },
      { sensorId: "WL-GAS-001", type: "info" as const, msg: "Gas regulator station — methane clear" },
      { sensorId: "WL-PARK-002", type: "info" as const, msg: "City park irrigation skipped — soil moisture adequate" },
      { sensorId: "WL-STORM-001", type: "alert" as const, msg: "Storm drain blockage worsening — 82% full" },
      { sensorId: "WL-PD-001", type: "info" as const, msg: "Evidence room access log — no anomalies" },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const ev = NEW_EVENTS[idx % NEW_EVENTS.length];
      idx++;
      const newAlert: AlertItem = {
        id: `A${Date.now()}`,
        sensorId: ev.sensorId,
        type: ev.type,
        msg: ev.msg,
        time: "just now",
        dispatched: false,
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setCenter({ lat: 41.5742, lng: -91.2635 });
    map.setZoom(15);

    // City Hall marker
    new google.maps.Marker({
      position: { lat: 41.5742, lng: -91.2635 },
      map,
      title: "West Liberty City Hall — 111 W 7th St",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#1e40af",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 11,
      },
      zIndex: 999,
    });

    // IoT sensor markers
    IOT_SENSORS.forEach((sensor) => {
      const color = getStatusColor(sensor.status);
      const marker = new google.maps.Marker({
        position: { lat: sensor.lat, lng: sensor.lng },
        map,
        title: sensor.name,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: sensor.status === "alert" ? 1.8 : 1.4,
          anchor: new google.maps.Point(12, 22),
        },
        animation: sensor.status === "alert" ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener("click", () => {
        setSelectedSensor(sensor);
        map.panTo({ lat: sensor.lat, lng: sensor.lng });
      });

      markersRef.current.set(sensor.id, marker);
    });
  }, []);

  const toggleGisLayer = (layer: GisLayerKey) => {
    setActiveGisLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
        polylinesRef.current.get(layer)?.forEach(p => p.setVisible(false));
      } else {
        next.add(layer);
        const map = mapRef.current;
        if (map) {
          const existing = polylinesRef.current.get(layer);
          if (existing && existing.length > 0) {
            existing.forEach(p => p.setVisible(true));
          } else {
            const cfg = GIS_LAYERS[layer];
            const polylines = cfg.paths.map(path =>
              new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: cfg.color,
                strokeOpacity: cfg.opacity,
                strokeWeight: cfg.weight,
                map,
              })
            );
            polylinesRef.current.set(layer, polylines);
          }
        }
      }
      return next;
    });
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
        IOT_SENSORS.filter(s => s.type === layer).forEach(s => {
          markersRef.current.get(s.id)?.setVisible(false);
        });
      } else {
        next.add(layer);
        IOT_SENSORS.filter(s => s.type === layer).forEach(s => {
          markersRef.current.get(s.id)?.setVisible(true);
        });
      }
      return next;
    });
  };

  const dispatchWorkOrder = (alert: AlertItem) => {
    const sensor = IOT_SENSORS.find(s => s.id === alert.sensorId);
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dispatched: true } : a));
    toast.success(`Work order dispatched for ${sensor?.name || "sensor"}`);
    setTimeout(() => navigate("/operations"), 800);
  };

  const dispatchAllAlerts = () => {
    const activeAlerts = alerts.filter(a => (a.type === "alert" || a.type === "warning") && !a.dispatched);
    if (activeAlerts.length === 0) {
      toast.info("No active alerts to dispatch.");
      return;
    }
    setAlerts(prev => prev.map(a =>
      (a.type === "alert" || a.type === "warning") && !a.dispatched ? { ...a, dispatched: true } : a
    ));
    toast.success(
      `Batch work order created — ${activeAlerts.length} alert${activeAlerts.length > 1 ? "s" : ""} dispatched to Operations Center.`,
      { duration: 4000 }
    );
    setTimeout(() => navigate("/operations"), 1200);
  };

  const alertCount = alerts.filter(a => a.type === "alert" && !a.dispatched).length;
  const warningCount = alerts.filter(a => a.type === "warning" && !a.dispatched).length;
  const onlineCount = IOT_SENSORS.filter(s => s.status === "online").length;

  return (
    <DashboardLayout title="Spatial Map — West Liberty, IA">
      <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

        {/* ─── Status bar ─────────────────────────────────────────────── */}
        <div
          className="px-4 py-2 border-b flex items-center gap-4 flex-shrink-0"
          style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
        >
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" style={{ color: "oklch(0.40 0.18 240)" }} />
            <span className="text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              West Liberty IoT Network
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "oklch(0.32 0.18 145)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16a34a" }} />
            {onlineCount} sensors online
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "oklch(0.58 0.22 25 / 10%)", border: "1px solid oklch(0.58 0.22 25 / 25%)", color: "oklch(0.45 0.22 25)" }}>
              <AlertTriangle className="w-3 h-3" />
              {alertCount} ALERT{alertCount > 1 ? "S" : ""}
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "oklch(0.72 0.18 75 / 10%)", border: "1px solid oklch(0.72 0.18 75 / 25%)", color: "oklch(0.50 0.18 75)" }}>
              <AlertTriangle className="w-3 h-3" />
              {warningCount} WARNING{warningCount > 1 ? "S" : ""}
            </div>
          )}
          <span className="ml-auto text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
            41.5742°N 91.2635°W · City Hall
          </span>
        </div>

        {/* ─── Main: layers + map + sensor list ──────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Layer controls sidebar */}
          <div
            className="w-44 flex-shrink-0 border-r flex flex-col overflow-y-auto"
            style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
          >
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "oklch(0.52 0.010 250)" }}>
                <Layers className="w-3 h-3" /> IoT Sensors
              </div>
            </div>
            <div className="p-2 space-y-1">
              {Object.entries(LAYER_CONFIG).map(([key, cfg]) => {
                const active = activeLayers.has(key);
                const count = IOT_SENSORS.filter(s => s.type === key).length;
                const alertsInLayer = IOT_SENSORS.filter(s => s.type === key && (s.status === "alert" || s.status === "warning")).length;
                return (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className="w-full flex items-center gap-2 p-2 rounded text-left transition-all"
                    style={{
                      background: active ? `${cfg.color}12` : "transparent",
                      border: `1px solid ${active ? `${cfg.color}30` : "oklch(0 0 0 / 8%)"}`,
                    }}
                  >
                    {active
                      ? <Eye className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />
                      : <EyeOff className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.52 0.010 250)" }} />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold" style={{ color: active ? "oklch(0.22 0.018 250)" : "oklch(0.52 0.010 250)" }}>
                        {cfg.label}
                      </div>
                      <div className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
                        {count} nodes{alertsInLayer > 0 ? ` · ${alertsInLayer}⚠` : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* GIS Infrastructure Layers */}
            <div className="px-3 py-2 border-t" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.52 0.010 250)" }}>
                <GitBranch className="w-3 h-3" /> Infrastructure
              </div>
              <div className="space-y-1">
                {(Object.entries(GIS_LAYERS) as [GisLayerKey, typeof GIS_LAYERS[GisLayerKey]][]).map(([key, cfg]) => {
                  const active = activeGisLayers.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleGisLayer(key)}
                      className="w-full flex items-center gap-2 p-2 rounded text-left transition-all"
                      style={{
                        background: active ? `${cfg.color}12` : "transparent",
                        border: `1px solid ${active ? `${cfg.color}30` : "oklch(0 0 0 / 8%)"}`,
                      }}
                    >
                      {active
                        ? <Eye className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />
                        : <EyeOff className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.52 0.010 250)" }} />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold" style={{ color: active ? "oklch(0.22 0.018 250)" : "oklch(0.52 0.010 250)" }}>
                          {cfg.label}
                        </div>
                        <div className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
                          {cfg.paths.length} segment{cfg.paths.length > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="w-3 h-1 rounded-full flex-shrink-0" style={{ background: active ? cfg.color : "oklch(0.75 0.005 250)" }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active alerts in sidebar */}
            <div className="px-3 py-2 border-t mt-auto" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.52 0.010 250)" }}>Active Alerts</div>
              <div className="space-y-1.5">
                {IOT_SENSORS.filter(s => s.status === "alert" || s.status === "warning").map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSensor(s); mapRef.current?.panTo({ lat: s.lat, lng: s.lng }); }}
                    className="w-full text-left p-1.5 rounded text-[9px]"
                    style={{ background: "oklch(1 0 0)", border: `1px solid ${getStatusColor(s.status)}30` }}
                  >
                    <div className="font-mono font-bold" style={{ color: getStatusColor(s.status) }}>{s.id}</div>
                    <div className="truncate" style={{ color: "oklch(0.42 0.012 250)" }}>{s.alert}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative overflow-hidden">
            <MapView onMapReady={handleMapReady} className="w-full h-full" />

            {/* Map legend */}
            <div
              className="absolute top-3 right-3 p-3 rounded-lg text-[10px] space-y-1.5"
              style={{ background: "oklch(1 0 0 / 92%)", border: "1px solid oklch(0 0 0 / 10%)", backdropFilter: "blur(8px)" }}
            >
              <div className="font-bold text-xs mb-2" style={{ color: "oklch(0.18 0.018 250)" }}>Legend</div>
              {[
                { color: "#dc2626", label: "Alert" },
                { color: "#d97706", label: "Warning" },
                { color: "#16a34a", label: "Normal" },
                { color: "#1e40af", label: "City Hall" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5" style={{ color: "oklch(0.38 0.012 250)" }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Sensor detail popup */}
            {selectedSensor && (
              <div
                className="absolute bottom-4 left-3 w-72 rounded-xl overflow-hidden"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", boxShadow: "0 4px 24px oklch(0 0 0 / 15%)" }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ background: `${selectedSensor.color}18`, border: `1px solid ${selectedSensor.color}30` }}
                    >
                      <selectedSensor.icon className="w-3.5 h-3.5" style={{ color: selectedSensor.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{selectedSensor.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{selectedSensor.id}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSensor(null)} style={{ color: "oklch(0.52 0.010 250)", background: "none", border: "none", cursor: "pointer" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>
                    <span className="font-semibold" style={{ color: "oklch(0.30 0.018 250)" }}>Address: </span>{selectedSensor.address}
                  </div>
                  <div className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>
                    <span className="font-semibold" style={{ color: "oklch(0.30 0.018 250)" }}>Device: </span>{selectedSensor.device}
                  </div>
                  <div
                    className="p-2 rounded text-[10px] font-mono"
                    style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)", color: "oklch(0.30 0.018 250)" }}
                  >
                    {selectedSensor.reading}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                      <Clock className="w-3 h-3" />
                      {selectedSensor.lastSeen}
                    </div>
                    <div
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: `${getStatusColor(selectedSensor.status)}18`,
                        color: getStatusColor(selectedSensor.status),
                        border: `1px solid ${getStatusColor(selectedSensor.status)}30`,
                      }}
                    >
                      {selectedSensor.status.toUpperCase()}
                    </div>
                  </div>
                  {selectedSensor.alert && (
                    <div
                      className="p-2 rounded text-[10px] leading-relaxed"
                      style={{ background: "oklch(0.58 0.22 25 / 8%)", border: "1px solid oklch(0.58 0.22 25 / 20%)", color: "oklch(0.42 0.22 25)" }}
                    >
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {selectedSensor.alert}
                    </div>
                  )}
                  {selectedSensor.alert && (
                    <button
                      onClick={() => {
                        toast.success(`Work order dispatched for ${selectedSensor.name}`);
                        setTimeout(() => navigate("/operations"), 600);
                      }}
                      className="w-full py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: "oklch(0.58 0.22 25)", color: "oklch(0.98 0.004 25)" }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Work Order
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sensor list sidebar */}
          <div
            className="w-52 border-l flex flex-col overflow-hidden flex-shrink-0"
            style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
          >
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "oklch(0.52 0.010 250)" }}>
                All Sensors ({IOT_SENSORS.length})
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {IOT_SENSORS.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => {
                    setSelectedSensor(sensor);
                    mapRef.current?.panTo({ lat: sensor.lat, lng: sensor.lng });
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-start gap-2 transition-all"
                  style={{
                    background: selectedSensor?.id === sensor.id ? "oklch(0.40 0.18 240 / 8%)" : "transparent",
                    borderLeft: selectedSensor?.id === sensor.id ? "2px solid oklch(0.40 0.18 240)" : "2px solid transparent",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${sensor.color}18` }}
                  >
                    <sensor.icon className="w-3 h-3" style={{ color: sensor.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate" style={{ color: "oklch(0.22 0.018 250)" }}>{sensor.name}</div>
                    <div className="text-[9px] font-mono truncate" style={{ color: "oklch(0.52 0.010 250)" }}>{sensor.id}</div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: getStatusColor(sensor.status) }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Live Alert Ticker ─────────────────────────────────────── */}
        <div
          className="border-t flex-shrink-0"
          style={{ background: "oklch(0.12 0.015 250)", borderColor: "oklch(0 0 0 / 20%)" }}
        >
          <div className="px-3 py-1.5 flex items-center gap-0 overflow-hidden">
            <div
              className="flex items-center gap-1.5 flex-shrink-0 pr-3 mr-3 border-r"
              style={{ borderColor: "oklch(1 0 0 / 12%)" }}
            >
              <Activity className="w-3 h-3" style={{ color: "#16a34a" }} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: "#16a34a" }}>LIVE</span>
            </div>
            <button
              onClick={dispatchAllAlerts}
              className="flex items-center gap-1.5 flex-shrink-0 mr-3 pr-3 border-r text-[9px] font-bold px-2 py-1 rounded transition-all"
              style={{ borderColor: "oklch(1 0 0 / 12%)", background: alertCount + warningCount > 0 ? "oklch(0.58 0.22 25 / 25%)" : "oklch(1 0 0 / 5%)", border: `1px solid ${alertCount + warningCount > 0 ? "oklch(0.58 0.22 25 / 40%)" : "oklch(1 0 0 / 10%)"}`, color: alertCount + warningCount > 0 ? "oklch(0.72 0.22 25)" : "oklch(0.50 0.010 250)" }}
            >
              <Send className="w-2.5 h-2.5" />
              DISPATCH ALL ({alertCount + warningCount})
            </button>
          <div className="flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {alerts.map((alert) => {
                const colors = getAlertTypeStyle(alert.type);
                const sensor = IOT_SENSORS.find(s => s.id === alert.sensorId);
                return (
                  <div key={alert.id} className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                    >
                      {alert.type.toUpperCase()}
                    </div>
                    <span className="text-[10px]" style={{ color: "oklch(0.72 0.008 250)" }}>
                      {sensor?.name || alert.sensorId}:
                    </span>
                    <span className="text-[10px]" style={{ color: "oklch(0.85 0.005 250)" }}>{alert.msg}</span>
                    <span className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{alert.time}</span>
                    {(alert.type === "alert" || alert.type === "warning") && !alert.dispatched && (
                      <button
                        onClick={() => dispatchWorkOrder(alert)}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0"
                        style={{ background: "oklch(0.58 0.22 25 / 20%)", border: "1px solid oklch(0.58 0.22 25 / 35%)", color: "oklch(0.72 0.22 25)" }}
                      >
                        <Send className="w-2.5 h-2.5" />
                        DISPATCH
                      </button>
                    )}
                    {alert.dispatched && (
                      <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: "#16a34a" }}>
                        <CheckCircle2 className="w-3 h-3" /> DISPATCHED
                      </span>
                    )}
                    <span className="text-[9px]" style={{ color: "oklch(0.30 0.010 250)" }}>·</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
