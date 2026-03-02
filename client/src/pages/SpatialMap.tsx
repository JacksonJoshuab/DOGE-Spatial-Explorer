/**
 * SpatialMap — /map (dashboard)
 * Real West Liberty, IA coordinates centered on City Hall (41.5742° N, 91.2635° W)
 * Clickable IoT sensor pins, live alert ticker, click-to-dispatch to Operations Center
 * Design: Civic Intelligence Light
 *
 * Live IoT data: useIoTSensors hook polls every 4s (sensor telemetry) and 6s (alert ticker).
 * In production, replace the hook's setInterval with a WebSocket connection to
 * ws://iot.westlibertyia.gov/sensors or a REST polling endpoint.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Droplets, Zap, Shield, Wrench, TreePine, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, Radio, X,
  Layers, Activity, Send, Eye, EyeOff, Wifi, WifiOff, GitBranch, Mountain, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useIoTSensors, type SensorReading } from "@/hooks/useIoTSensors";
import { useAuth } from "@/contexts/AuthContext";

// ─── Icon map (cannot serialize React components through the hook) ─────────────
const SENSOR_ICONS: Record<string, React.ElementType> = {
  "WL-VALVE-001": Droplets,
  "WL-VALVE-002": Droplets,
  "WL-WATER-003": Zap,
  "WL-GAS-001": Zap,
  "WL-STORM-001": Wrench,
  "WL-STORM-002": Wrench,
  "WL-ROAD-001": Wrench,
  "WL-PARK-001": TreePine,
  "WL-PARK-002": TreePine,
  "WL-PD-001": Shield,
};

const LAYER_CONFIG: Record<string, { label: string; color: string }> = {
  water: { label: "Water Utility", color: "#2563eb" },
  sewer: { label: "Sewer / Gas", color: "#7c3aed" },
  roads: { label: "Public Works", color: "#059669" },
  parks: { label: "Parks & Rec", color: "#16a34a" },
  le: { label: "Law Enforcement", color: "#dc2626" },
};

// ─── GIS Infrastructure Layers ───────────────────────────────────────────────
type GisLayerKey = "waterMains" | "sewerLines" | "fiberRoutes";
const GIS_LAYERS: Record<GisLayerKey, { label: string; color: string; opacity: number; weight: number; paths: { lat: number; lng: number }[][] }> = {
  waterMains: {
    label: "Water Mains", color: "#2563eb", opacity: 0.7, weight: 3,
    paths: [
      [{ lat: 41.5762, lng: -91.2618 }, { lat: 41.5750, lng: -91.2635 }, { lat: 41.5740, lng: -91.2642 }, { lat: 41.5720, lng: -91.2658 }],
      [{ lat: 41.5750, lng: -91.2635 }, { lat: 41.5742, lng: -91.2635 }, { lat: 41.5733, lng: -91.2620 }],
    ],
  },
  sewerLines: {
    label: "Sewer Lines", color: "#7c3aed", opacity: 0.6, weight: 2,
    paths: [
      [{ lat: 41.5720, lng: -91.2658 }, { lat: 41.5730, lng: -91.2645 }, { lat: 41.5742, lng: -91.2635 }, { lat: 41.5752, lng: -91.2635 }],
      [{ lat: 41.5742, lng: -91.2635 }, { lat: 41.5733, lng: -91.2620 }, { lat: 41.5748, lng: -91.2601 }],
    ],
  },
  fiberRoutes: {
    label: "Fiber Routes", color: "#f59e0b", opacity: 0.65, weight: 2,
    paths: [
      [{ lat: 41.5742, lng: -91.2635 }, { lat: 41.5748, lng: -91.2601 }, { lat: 41.5758, lng: -91.2650 }],
      [{ lat: 41.5742, lng: -91.2635 }, { lat: 41.5730, lng: -91.2645 }, { lat: 41.5720, lng: -91.2658 }],
      // Last-mile to park sensors
      [{ lat: 41.5758, lng: -91.2650 }, { lat: 41.5730, lng: -91.2645 }],
    ],
  },
};

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
  const [selectedSensor, setSelectedSensor] = useState<SensorReading | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["water", "sewer", "roads", "parks", "le"]));
  const [activeGisLayers, setActiveGisLayers] = useState<Set<GisLayerKey>>(new Set());
  const [is3D, setIs3D] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, google.maps.Polyline[]>>(new Map());

  // ── Auth context for audit log ─────────────────────────────────────────────────
  const { appendAudit } = useAuth();

  // ── IoT alert → audit pipeline ────────────────────────────────────────────────
  const handleSensorAlert = useCallback((sensor: SensorReading, prevStatus: SensorReading["status"]) => {
    const isAlert = sensor.status === "alert";
    appendAudit({
      action: isAlert ? "SENSOR_ALERT" : "SENSOR_WARNING",
      target: `${sensor.name} (${sensor.id}) — ${sensor.reading}`,
      category: "iot",
      severity: isAlert ? "critical" : "warning",
      detail: sensor.alert ?? `Status changed ${prevStatus} → ${sensor.status}`,
    });
  }, [appendAudit]);

  // ── Live IoT sensor hook ───────────────────────────────────────────────────────
  const {
    sensors,
    alerts,
    isLive,
    lastUpdated,
    wsStatus,
    alertCount,
    warningCount,
    onlineCount,
    alertSensorCount,
    dispatchAlert,
    dispatchAll,
    toggleLive,
  } = useIoTSensors({ sensorInterval: 4000, alertInterval: 6000, onAlert: handleSensorAlert }); const wsStatusLabel = wsStatus === "connected" ? "WS CONNECTED"
    : wsStatus === "reconnecting" ? "WS RECONNECTING…"
    : wsStatus === "failed" ? "WS FAILED"
    : wsStatus === "simulation" ? "SIMULATION MODE"
    : "WS CONNECTING…";
  const wsStatusColor = wsStatus === "connected" ? "oklch(0.32 0.18 145)"
    : wsStatus === "simulation" ? "oklch(0.65 0.20 55)"
    : wsStatus === "failed" ? "oklch(0.55 0.22 25)"
    : "oklch(0.52 0.010 250)";

  // Sync selected sensor with live data updates
  useEffect(() => {
    if (!selectedSensor) return;
    const updated = sensors.find(s => s.id === selectedSensor.id);
    if (updated) setSelectedSensor(updated);
  }, [sensors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map marker colors when sensor statuses change
  useEffect(() => {
    sensors.forEach(sensor => {
      const marker = markersRef.current.get(sensor.id);
      if (!marker) return;
      const color = getStatusColor(sensor.status);
      marker.setIcon({
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: sensor.status === "alert" ? 1.8 : 1.4,
        anchor: new google.maps.Point(12, 22),
      });
      if (sensor.status === "alert") {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      } else if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      }
    });
  }, [sensors]);

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

    // IoT sensor markers (initial render from seed data)
    sensors.forEach((sensor) => {
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
        const live = sensors.find(s => s.id === sensor.id) ?? sensor;
        setSelectedSensor(live);
        map.panTo({ lat: sensor.lat, lng: sensor.lng });
      });

      markersRef.current.set(sensor.id, marker);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        sensors.filter(s => s.type === layer).forEach(s => {
          markersRef.current.get(s.id)?.setVisible(false);
        });
      } else {
        next.add(layer);
        sensors.filter(s => s.type === layer).forEach(s => {
          markersRef.current.get(s.id)?.setVisible(true);
        });
      }
      return next;
    });
  };

  const dispatchWorkOrder = (alert: ReturnType<typeof useIoTSensors>["alerts"][0]) => {
    const sensor = sensors.find(s => s.id === alert.sensorId);
    dispatchAlert(alert.id);
    toast.success(`Work order dispatched for ${sensor?.name || "sensor"}`);
    setTimeout(() => navigate("/operations"), 800);
  };

  const dispatchAllAlerts = () => {
    const activeAlerts = alerts.filter(a => (a.type === "alert" || a.type === "warning") && !a.dispatched);
    if (activeAlerts.length === 0) {
      toast.info("No active alerts to dispatch.");
      return;
    }
    dispatchAll();
    toast.success(
      `Batch work order created — ${activeAlerts.length} alert${activeAlerts.length > 1 ? "s" : ""} dispatched to Operations Center.`,
      { duration: 4000 }
    );
    setTimeout(() => navigate("/operations"), 1200);
  };

  const toggle3D = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!is3D) {
      map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
      map.setTilt(45);
      map.setZoom(16);
      setIs3D(true);
      toast.success("3D Satellite / Terrain view enabled — tilt: 45°");
    } else {
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      map.setTilt(0);
      map.setZoom(15);
      setIs3D(false);
      toast.success("Returned to 2D roadmap view");
    }
  };

  return (
    <DashboardLayout title="Spatial Map — West Liberty, IA">
      <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

        {/* ─── Status bar ─────────────────────────────────────────────── */}
        <div
          className="px-4 py-2 border-b flex items-center gap-4 flex-shrink-0 flex-wrap"
          style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
        >
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" style={{ color: "oklch(0.40 0.18 240)" }} />
            <span className="text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              West Liberty IoT Network
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "oklch(0.32 0.18 145)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isLive ? "#16a34a" : "#6b7280" }} />
            {onlineCount} sensors online
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${wsStatusColor}12`, border: `1px solid ${wsStatusColor}30`, color: wsStatusColor }}>
            {wsStatusLabel}
          </div>
          {alertSensorCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "oklch(0.58 0.22 25 / 10%)", border: "1px solid oklch(0.58 0.22 25 / 25%)", color: "oklch(0.45 0.22 25)" }}>
              <AlertTriangle className="w-3 h-3" />
              {alertSensorCount} ALERT{alertSensorCount > 1 ? "S" : ""}
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "oklch(0.72 0.18 75 / 10%)", border: "1px solid oklch(0.72 0.18 75 / 25%)", color: "oklch(0.50 0.18 75)" }}>
              <AlertTriangle className="w-3 h-3" />
              {warningCount} WARNING{warningCount > 1 ? "S" : ""}
            </div>
          )}

          {/* Live / Pause toggle */}
          <button
            onClick={() => { toggleLive(); toast.info(isLive ? "IoT feed paused" : "IoT feed resumed"); }}
            className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-all"
            style={{
              background: isLive ? "oklch(0.32 0.18 145 / 12%)" : "oklch(0.52 0.010 250 / 12%)",
              border: `1px solid ${isLive ? "oklch(0.32 0.18 145 / 30%)" : "oklch(0.52 0.010 250 / 30%)"}`,
              color: isLive ? "oklch(0.32 0.18 145)" : "oklch(0.52 0.010 250)",
            }}
          >
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive ? "LIVE" : "PAUSED"}
          </button>

          <span className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
            <RefreshCw className="w-2.5 h-2.5 inline mr-1" />
            {lastUpdated.toLocaleTimeString()}
          </span>

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
                const count = sensors.filter(s => s.type === key).length;
                const alertsInLayer = sensors.filter(s => s.type === key && (s.status === "alert" || s.status === "warning")).length;
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
                {sensors.filter(s => s.status === "alert" || s.status === "warning").map(s => (
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
                {sensors.filter(s => s.status === "alert" || s.status === "warning").length === 0 && (
                  <div className="text-[9px] flex items-center gap-1" style={{ color: "oklch(0.45 0.18 145)" }}>
                    <CheckCircle2 className="w-3 h-3" /> All clear
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative overflow-hidden">
            <MapView onMapReady={handleMapReady} className="w-full h-full" />

            {/* 3D Terrain Toggle */}
            <button
              onClick={toggle3D}
              className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: is3D ? "oklch(0.40 0.18 240)" : "oklch(1 0 0 / 92%)",
                border: `1px solid ${is3D ? "oklch(0.40 0.18 240)" : "oklch(0 0 0 / 10%)"}`,
                color: is3D ? "#fff" : "oklch(0.22 0.018 250)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px oklch(0 0 0 / 12%)",
              }}
            >
              <Mountain className="w-3.5 h-3.5" />
              {is3D ? "3D ON" : "3D / Satellite"}
            </button>

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
              <div className="border-t pt-1.5 mt-1.5" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="flex items-center gap-1" style={{ color: isLive ? "oklch(0.32 0.18 145)" : "oklch(0.52 0.010 250)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isLive ? "#16a34a" : "#6b7280" }} />
                  <span className="font-mono">{isLive ? "LIVE FEED" : "PAUSED"}</span>
                </div>
              </div>
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
                      {(() => {
                        const Icon = SENSOR_ICONS[selectedSensor.id] ?? Wrench;
                        return <Icon className="w-3.5 h-3.5" style={{ color: selectedSensor.color }} />;
                      })()}
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{selectedSensor.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{selectedSensor.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="text-[9px] font-mono flex items-center gap-1" style={{ color: "oklch(0.32 0.18 145)" }}>
                        <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#16a34a" }} />
                        LIVE
                      </span>
                    )}
                    <button onClick={() => setSelectedSensor(null)} style={{ color: "oklch(0.52 0.010 250)", background: "none", border: "none", cursor: "pointer" }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
                All Sensors ({sensors.length})
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {sensors.map((sensor) => (
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
                    {(() => {
                      const Icon = SENSOR_ICONS[sensor.id] ?? Wrench;
                      return <Icon className="w-3 h-3" style={{ color: sensor.color }} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate" style={{ color: "oklch(0.22 0.018 250)" }}>{sensor.name}</div>
                    <div className="text-[9px] font-mono truncate" style={{ color: "oklch(0.52 0.010 250)" }}>{sensor.reading.slice(0, 28)}{sensor.reading.length > 28 ? "…" : ""}</div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 transition-colors"
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
              <Activity className="w-3 h-3" style={{ color: isLive ? "#16a34a" : "#6b7280" }} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: isLive ? "#16a34a" : "#6b7280" }}>
                {isLive ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <button
              onClick={dispatchAllAlerts}
              className="flex items-center gap-1.5 flex-shrink-0 mr-3 pr-3 text-[9px] font-bold px-2 py-1 rounded transition-all"
              style={{ background: alertCount + warningCount > 0 ? "oklch(0.58 0.22 25 / 25%)" : "oklch(1 0 0 / 5%)", border: `1px solid ${alertCount + warningCount > 0 ? "oklch(0.58 0.22 25 / 40%)" : "oklch(1 0 0 / 10%)"}`, color: alertCount + warningCount > 0 ? "oklch(0.72 0.22 25)" : "oklch(0.50 0.010 250)" }}
            >
              <Send className="w-2.5 h-2.5" />
              DISPATCH ALL ({alertCount + warningCount})
            </button>
            <div className="flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {alerts.map((alert) => {
                const colors = getAlertTypeStyle(alert.type);
                const sensor = sensors.find(s => s.id === alert.sensorId);
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
