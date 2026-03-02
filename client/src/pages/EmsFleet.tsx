/**
 * EMS / Fire Fleet Map — West Liberty, IA
 * Live GPS positions of all units on Google Maps with status indicators
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ambulance, Flame, Car, Shield, Radio, Activity, RefreshCw,
  MapPin, Clock, Zap, Layers, Eye, EyeOff
} from "lucide-react";

const UNIT_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  ambulance: { icon: "🚑", color: "#ef4444", label: "Ambulance" },
  fire_engine: { icon: "🚒", color: "#f97316", label: "Fire Engine" },
  ladder: { icon: "🚒", color: "#f59e0b", label: "Ladder Truck" },
  command: { icon: "🚗", color: "#3b82f6", label: "Command" },
  hazmat: { icon: "⚠️", color: "#8b5cf6", label: "HazMat" },
  drone: { icon: "🚁", color: "#06b6d4", label: "Drone/UAV" },
  radio_tower: { icon: "📡", color: "#10b981", label: "Radio Tower" },
};

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  dispatched: "#3b82f6",
  on_scene: "#f97316",
  transporting: "#8b5cf6",
  at_hospital: "#ec4899",
  returning: "#06b6d4",
  out_of_service: "#6b7280",
  standby: "#eab308",
};

// West Liberty, IA center
const WL_CENTER = { lat: 41.5715, lng: -91.2634 };

function createUnitMarkerIcon(unitType: string, status: string): google.maps.Symbol {
  const statusColor = STATUS_COLORS[status] ?? "#6b7280";
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 14,
    fillColor: statusColor,
    fillOpacity: 0.9,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

export default function EmsFleet() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [showTypes, setShowTypes] = useState<Set<string>>(new Set(Object.keys(UNIT_TYPE_CONFIG)));

  const { data: units, refetch } = trpc.ems.listUnits.useQuery(undefined, {
    refetchInterval: autoRefresh ? 6000 : false,
  });
  const { data: incidents } = trpc.ems.listIncidents.useQuery({ limit: 20 }, {
    refetchInterval: autoRefresh ? 8000 : false,
  });

  const handleMapReady = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapInstance.setCenter(WL_CENTER);
    mapInstance.setZoom(14);
    infoWindowRef.current = new google.maps.InfoWindow();
  }, []);

  // Update markers when units or map changes
  useEffect(() => {
    if (!map || !units) return;

    const existingIds = new Set(markersRef.current.keys());
    const currentIds = new Set<string>();

    units.forEach(unit => {
      if (!showTypes.has(unit.unitType)) return;
      const lat = parseFloat(unit.lat ?? "0");
      const lng = parseFloat(unit.lng ?? "0");
      if (!lat || !lng) return;

      currentIds.add(unit.unitId);
      const position = { lat, lng };
      const typeCfg = UNIT_TYPE_CONFIG[unit.unitType] ?? UNIT_TYPE_CONFIG.command;

      if (markersRef.current.has(unit.unitId)) {
        const marker = markersRef.current.get(unit.unitId)!;
        marker.setPosition(position);
        marker.setIcon(createUnitMarkerIcon(unit.unitType, unit.status));
      } else {
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${unit.callSign} — ${unit.status}`,
          label: {
            text: typeCfg.icon,
            fontSize: "16px",
          },
          icon: createUnitMarkerIcon(unit.unitType, unit.status),
        });

        marker.addListener("click", () => {
          setSelectedUnit(unit.unitId);
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="font-family:sans-serif;padding:8px;min-width:200px">
                <div style="font-weight:bold;font-size:14px">${unit.callSign}</div>
                <div style="color:#666;font-size:12px;margin-top:2px">${typeCfg.label} · ${unit.vehicle ?? ""}</div>
                <div style="margin-top:6px">
                  <span style="background:${STATUS_COLORS[unit.status]};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">
                    ${unit.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                ${unit.crew ? `<div style="color:#666;font-size:11px;margin-top:4px">Crew: ${unit.crew}</div>` : ""}
                <div style="color:#999;font-size:10px;margin-top:4px">Last ping: ${unit.lastPingTs ? new Date(unit.lastPingTs).toLocaleTimeString() : "N/A"}</div>
              </div>
            `);
            infoWindowRef.current.open(map, marker);
          }
        });

        markersRef.current.set(unit.unitId, marker);
      }
    });

    // Remove markers for units no longer in data or hidden
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current.get(id)?.setMap(null);
        markersRef.current.delete(id);
      }
    });
  }, [map, units, showTypes]);

  // Add incident markers
  useEffect(() => {
    if (!map || !incidents) return;
    const activeIncidents = incidents.filter(i => !["resolved", "cancelled"].includes(i.status));
    activeIncidents.forEach(inc => {
      const lat = parseFloat(inc.lat ?? "0");
      const lng = parseFloat(inc.lng ?? "0");
      if (!lat || !lng) return;
      // Incident markers are red circles
      new google.maps.Marker({
        position: { lat, lng },
        map,
        title: `${inc.incidentNumber}: ${inc.incidentType}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#dc2626",
          fillOpacity: 0.7,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        label: { text: "!", color: "#fff", fontSize: "12px", fontWeight: "bold" },
      });
    });
  }, [map, incidents]);

  const toggleType = (type: string) => {
    setShowTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const selectedUnitData = units?.find(u => u.unitId === selectedUnit);

  const statusCounts = Object.entries(STATUS_COLORS).map(([status]) => ({
    status,
    count: (units ?? []).filter(u => u.status === status).length,
  })).filter(s => s.count > 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-500" />
              EMS / Fire Fleet Map
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Live GPS positions — West Liberty Fire & EMS</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(v => !v)}
              className={autoRefresh ? "border-green-500 text-green-400" : ""}
            >
              <Activity className="w-4 h-4 mr-1" />
              {autoRefresh ? "LIVE" : "PAUSED"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div style={{ height: "600px" }}>
                <MapView onMapReady={handleMapReady} />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fleet Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {statusCounts.map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                      <span className="capitalize text-xs">{status.replace("_", " ")}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Unit Type Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Layers className="w-4 h-4" /> Unit Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(UNIT_TYPE_CONFIG).map(([type, cfg]) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded transition-colors ${showTypes.has(type) ? "bg-accent" : "opacity-40"}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                    <span className="font-semibold">
                      {(units ?? []).filter(u => u.unitType === type).length}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Unit List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {(units ?? []).map(unit => {
                  const typeCfg = UNIT_TYPE_CONFIG[unit.unitType] ?? UNIT_TYPE_CONFIG.command;
                  return (
                    <button
                      key={unit.unitId}
                      className={`w-full text-left text-xs p-2 rounded border transition-colors hover:bg-accent ${selectedUnit === unit.unitId ? "border-blue-500 bg-blue-950/20" : "border-transparent"}`}
                      onClick={() => {
                        setSelectedUnit(unit.unitId);
                        if (map && unit.lat && unit.lng) {
                          map.panTo({ lat: parseFloat(unit.lat), lng: parseFloat(unit.lng) });
                          map.setZoom(16);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{typeCfg.icon} {unit.callSign}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[unit.status] }} />
                      </div>
                      <div className="text-muted-foreground mt-0.5 capitalize">{unit.status.replace("_", " ")}</div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Selected Unit Detail */}
            {selectedUnitData && (
              <Card className="border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {UNIT_TYPE_CONFIG[selectedUnitData.unitType]?.icon} {selectedUnitData.callSign}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{selectedUnitData.unitType.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="text-xs" style={{ backgroundColor: STATUS_COLORS[selectedUnitData.status] }}>
                      {selectedUnitData.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {selectedUnitData.vehicle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="text-right max-w-[120px] truncate">{selectedUnitData.vehicle}</span>
                    </div>
                  )}
                  {selectedUnitData.crew && (
                    <div>
                      <span className="text-muted-foreground">Crew</span>
                      <p className="mt-0.5">{selectedUnitData.crew}</p>
                    </div>
                  )}
                  {selectedUnitData.lat && selectedUnitData.lng && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GPS</span>
                      <span className="font-mono">{parseFloat(selectedUnitData.lat).toFixed(4)}, {parseFloat(selectedUnitData.lng).toFixed(4)}</span>
                    </div>
                  )}
                  {selectedUnitData.lastPingTs && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Ping</span>
                      <span>{new Date(selectedUnitData.lastPingTs).toLocaleTimeString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Active Incidents Summary */}
        {incidents && incidents.filter(i => !["resolved", "cancelled"].includes(i.status)).length > 0 && (
          <Card className="border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-400">Active Incidents on Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {incidents.filter(i => !["resolved", "cancelled"].includes(i.status)).map(inc => (
                  <Badge key={inc.id} variant="outline" className="text-xs border-red-500/50">
                    🔴 {inc.incidentNumber} · {inc.incidentType} · {inc.address}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
