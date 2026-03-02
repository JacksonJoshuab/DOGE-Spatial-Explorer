/**
 * SpatialMap — Civic Intelligence Dark
 * Google Maps with IoT asset overlays for West Liberty, IA
 */
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { useState, useCallback } from "react";
import { Wifi, AlertTriangle, Droplets, Wrench, TreePine, Shield, Layers, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// West Liberty, IA coordinates
const WEST_LIBERTY_CENTER = { lat: 41.5703, lng: -91.2629 };

const IOT_ASSETS = [
  { id: "SV-07", type: "water", name: "SmartValve #07", lat: 41.5715, lng: -91.2641, status: "alert", alert: "Pressure drop 42 PSI" },
  { id: "SV-12", type: "water", name: "SmartValve #12", lat: 41.5698, lng: -91.2618, status: "online", alert: null },
  { id: "AS-03", type: "water", name: "AquaSentinel #03", lat: 41.5722, lng: -91.2655, status: "online", alert: null },
  { id: "GP-03", type: "sewer", name: "GasPulse #03", lat: 41.5688, lng: -91.2598, status: "alert", alert: "Pump offline 4h 12m" },
  { id: "RS-14", type: "roads", name: "RoadSense #14", lat: 41.5710, lng: -91.2670, status: "warning", alert: "IRI score 8.2" },
  { id: "SN-02", type: "roads", name: "StormNet #02", lat: 41.5695, lng: -91.2635, status: "warning", alert: "87% capacity" },
  { id: "PP-05", type: "parks", name: "ParkPulse #05", lat: 41.5730, lng: -91.2610, status: "online", alert: null },
  { id: "IS-05", type: "parks", name: "IrriSmart #05", lat: 41.5725, lng: -91.2605, status: "warning", alert: "Soil moisture 18%" },
  { id: "TC-08", type: "parks", name: "TrailCam #08", lat: 41.5740, lng: -91.2590, status: "offline", alert: "Offline 72h" },
  { id: "DS-01", type: "le", name: "DOGE Sentinel #01", lat: 41.5705, lng: -91.2625, status: "online", alert: null },
  { id: "SE-01", type: "le", name: "SecureEntry #01", lat: 41.5702, lng: -91.2628, status: "online", alert: null },
];

const LAYER_CONFIG = {
  water: { label: "Water Utility", icon: Droplets, color: "oklch(0.45 0.20 240)" },
  sewer: { label: "Sewer/Wastewater", icon: Wrench, color: "oklch(0.55 0.18 75)" },
  roads: { label: "Public Works", icon: Wrench, color: "oklch(0.45 0.18 145)" },
  parks: { label: "Parks & Rec", icon: TreePine, color: "oklch(0.45 0.18 145)" },
  le: { label: "Law Enforcement", icon: Shield, color: "oklch(0.50 0.22 25)" },
};

const STATUS_COLOR = {
  online: "oklch(0.45 0.18 145)",
  warning: "oklch(0.55 0.18 75)",
  alert: "oklch(0.50 0.22 25)",
  offline: "oklch(0.52 0.010 250)",
};

export default function SpatialMap() {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["water", "sewer", "roads", "parks", "le"]));
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer); else next.add(layer);
      return next;
    });
  };

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    map.setCenter(WEST_LIBERTY_CENTER);
    map.setZoom(14);

    // Add markers for each IoT asset
    IOT_ASSETS.forEach((asset) => {
      const color = STATUS_COLOR[asset.status as keyof typeof STATUS_COLOR];
      const marker = new google.maps.Marker({
        position: { lat: asset.lat, lng: asset.lng },
        map,
        title: asset.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: asset.status === "alert" ? 10 : 7,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="background:#1a1f2e;color:#c8d0e0;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;min-width:160px">
          <div style="font-weight:bold;margin-bottom:4px;color:#7eb8f7">${asset.name}</div>
          <div style="color:#8892a4">Status: <span style="color:${color}">${asset.status.toUpperCase()}</span></div>
          ${asset.alert ? `<div style="color:#f97316;margin-top:4px;font-size:10px">⚠ ${asset.alert}</div>` : ""}
        </div>`,
      });

      marker.addListener("click", () => {
        setSelectedAsset(asset.id);
        infoWindow.open(map, marker);
      });
    });
  }, []);

  const visibleAssets = IOT_ASSETS.filter(a => activeLayers.has(a.type));
  const alertCount = visibleAssets.filter(a => a.status === "alert").length;
  const warningCount = visibleAssets.filter(a => a.status === "warning").length;
  const offlineCount = visibleAssets.filter(a => a.status === "offline").length;

  return (
    <DashboardLayout title="Spatial Map — West Liberty, IA">
      <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Status bar */}
        <div className="flex items-center gap-4 px-6 py-2.5 border-b text-xs" style={{ background: "oklch(0.965 0.005 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" style={{ color: "oklch(0.45 0.18 145)" }} />
            <span style={{ color: "oklch(0.45 0.18 145)" }}>{visibleAssets.filter(a => a.status === "online").length} Online</span>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="status-dot red" />
              <span style={{ color: "oklch(0.50 0.22 25)" }}>{alertCount} Alert{alertCount > 1 ? "s" : ""}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="status-dot amber" />
              <span style={{ color: "oklch(0.55 0.18 75)" }}>{warningCount} Warning{warningCount > 1 ? "s" : ""}</span>
            </div>
          )}
          {offlineCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="status-dot" style={{ background: "oklch(0.52 0.010 250)" }} />
              <span style={{ color: "oklch(0.52 0.010 250)" }}>{offlineCount} Offline</span>
            </div>
          )}
          <span className="ml-auto font-mono" style={{ color: "oklch(0.48 0.012 250)" }}>West Liberty, IA · 41.5703°N 91.2629°W</span>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Layer controls */}
          <div className="w-48 flex-shrink-0 border-r overflow-y-auto p-3 space-y-4" style={{ background: "oklch(0.965 0.005 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
            <div className="section-label flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Layers
            </div>
            {Object.entries(LAYER_CONFIG).map(([key, cfg]) => {
              const active = activeLayers.has(key);
              const layerAssets = IOT_ASSETS.filter(a => a.type === key);
              const layerAlerts = layerAssets.filter(a => a.status === "alert" || a.status === "warning").length;
              return (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className="w-full flex items-center gap-2 p-2.5 rounded text-left transition-all"
                  style={{
                    background: active ? `${cfg.color.replace(")", " / 10%)")}` : "transparent",
                    border: `1px solid ${active ? cfg.color.replace(")", " / 25%)") : "oklch(0 0 0 / 8%)"}`,
                  }}
                >
                  {active ? <Eye className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} /> : <EyeOff className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.45 0.012 250)" }} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: active ? "oklch(0.22 0.018 250)" : "oklch(0.48 0.012 250)" }}>{cfg.label}</div>
                    <div className="text-[9px]" style={{ color: "oklch(0.48 0.012 250)" }}>{layerAssets.length} nodes{layerAlerts > 0 ? ` · ${layerAlerts} alert` : ""}</div>
                  </div>
                </button>
              );
            })}

            {/* Asset list */}
            <div>
              <div className="section-label mb-2">Active Alerts</div>
              <div className="space-y-1.5">
                {IOT_ASSETS.filter(a => (a.status === "alert" || a.status === "warning" || a.status === "offline") && activeLayers.has(a.type)).map(a => (
                  <div key={a.id} className="p-2 rounded text-[10px]" style={{ background: "oklch(1 0 0)", border: `1px solid ${STATUS_COLOR[a.status as keyof typeof STATUS_COLOR].replace(")", " / 20%)")}` }}>
                    <div className="font-mono font-bold" style={{ color: STATUS_COLOR[a.status as keyof typeof STATUS_COLOR] }}>{a.id}</div>
                    <div style={{ color: "oklch(0.48 0.012 250)" }}>{a.alert}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapView onMapReady={handleMapReady} className="w-full h-full" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
