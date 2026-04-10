// DOGE Spatial Explorer — Geospatial Monitor
// Live AIS vessel tracking via tRPC with 30-second auto-refresh,
// shipping lane overlays, and Google Maps integration

import { useRef, useState, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ship, Plane, Anchor, Layers, MapPin, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

// ─── Shipping lane polylines ──────────────────────────────────────────────────
const SHIPPING_LANES = [
  {
    id: "lane-1",
    name: "East Coast Corridor",
    color: "#3b82f6",
    path: [
      { lat: 45.0, lng: -66.0 },
      { lat: 40.7, lng: -73.9 },
      { lat: 36.9, lng: -76.3 },
      { lat: 32.1, lng: -80.9 },
      { lat: 25.8, lng: -80.2 },
    ],
  },
  {
    id: "lane-2",
    name: "Gulf Coast Route",
    color: "#10b981",
    path: [
      { lat: 25.8, lng: -80.2 },
      { lat: 29.9, lng: -90.1 },
      { lat: 29.8, lng: -93.9 },
      { lat: 27.8, lng: -97.4 },
    ],
  },
  {
    id: "lane-3",
    name: "Pacific Coast Route",
    color: "#8b5cf6",
    path: [
      { lat: 48.5, lng: -124.7 },
      { lat: 47.6, lng: -122.3 },
      { lat: 37.8, lng: -122.5 },
      { lat: 34.0, lng: -118.3 },
      { lat: 32.7, lng: -117.2 },
    ],
  },
  {
    id: "lane-4",
    name: "Mississippi River System",
    color: "#f59e0b",
    path: [
      { lat: 45.0, lng: -93.2 },
      { lat: 43.0, lng: -91.5 },
      { lat: 40.6, lng: -90.2 },
      { lat: 37.0, lng: -89.1 },
      { lat: 32.3, lng: -90.9 },
      { lat: 29.9, lng: -90.1 },
    ],
  },
];

type Vessel = {
  id: string;
  name: string;
  type: string;
  baseLat: number;
  baseLng: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  flag: string;
  status: string;
  lastUpdated: Date;
};

type LayerState = {
  vessels: boolean;
  lanes: boolean;
  traffic: boolean;
};

export default function Geospatial() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [layers, setLayers] = useState<LayerState>({
    vessels: true,
    lanes: true,
    traffic: false,
  });
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ─── tRPC AIS query with 30-second auto-refresh ───────────────────────────
  const { data: vessels, refetch, isFetching, dataUpdatedAt } = trpc.ais.vessels.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  // Update lastRefresh whenever data changes
  useEffect(() => {
    if (dataUpdatedAt) setLastRefresh(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  // ─── Update markers when vessel data changes ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !vessels || !layers.vessels) return;

    vessels.forEach((vessel) => {
      const color =
        vessel.status === "Underway"
          ? "#34d399"
          : vessel.status === "Anchored"
          ? "#fbbf24"
          : "#94a3b8";

      const existing = markersRef.current.get(vessel.id);

      if (existing) {
        // Smoothly update position
        existing.position = { lat: vessel.lat, lng: vessel.lng };
      } else {
        // Create new marker
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="
            width:28px;height:28px;border-radius:50%;
            background:${color}22;border:2px solid ${color};
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;transition:transform 0.3s ease;
          " class="ais-marker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.06.78L3.95 19z"/>
            </svg>
          </div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: layers.vessels ? map : null,
          position: { lat: vessel.lat, lng: vessel.lng },
          title: vessel.name,
          content: el,
        });

        marker.addListener("click", () => {
          setSelectedVessel(vessel as Vessel);
          if (infoWindowRef.current) infoWindowRef.current.close();
          const iw = new google.maps.InfoWindow({
            content: `
              <div style="font-family:monospace;padding:4px;min-width:200px;">
                <div style="font-weight:bold;font-size:13px;margin-bottom:6px;color:#2563eb">${vessel.name}</div>
                <div style="font-size:11px;line-height:1.8;color:#374151">
                  <b>ID:</b> ${vessel.id}<br/>
                  <b>Type:</b> ${vessel.type}<br/>
                  <b>Flag:</b> ${vessel.flag}<br/>
                  <b>Speed:</b> ${vessel.speed} kn<br/>
                  <b>Heading:</b> ${vessel.heading}°<br/>
                  <b>Status:</b> ${vessel.status}
                </div>
              </div>
            `,
          });
          iw.open({ map, anchor: marker });
          infoWindowRef.current = iw;
        });

        markersRef.current.set(vessel.id, marker);
      }
    });
  }, [vessels, layers.vessels]);

  const addShippingLanes = useCallback((map: google.maps.Map) => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    SHIPPING_LANES.forEach((lane) => {
      const polyline = new google.maps.Polyline({
        path: lane.path,
        geodesic: true,
        strokeColor: lane.color,
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      });
      polylinesRef.current.push(polyline);
    });
  }, []);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setMapReady(true);
      addShippingLanes(map);
      trafficLayerRef.current = new google.maps.TrafficLayer();
    },
    [addShippingLanes]
  );

  const toggleLayer = (layer: keyof LayerState) => {
    const map = mapRef.current;
    if (!map) return;

    setLayers((prev) => {
      const next = { ...prev, [layer]: !prev[layer] };
      if (layer === "vessels") {
        markersRef.current.forEach((m) => (m.map = next.vessels ? map : null));
      }
      if (layer === "lanes") {
        polylinesRef.current.forEach((p) => p.setMap(next.lanes ? map : null));
      }
      if (layer === "traffic") {
        trafficLayerRef.current?.setMap(next.traffic ? map : null);
      }
      return next;
    });
  };

  const handleManualRefresh = async () => {
    await refetch();
    toast.success("AIS data refreshed", {
      description: `${vessels?.length ?? 0} vessels updated`,
    });
  };

  const vesselList = vessels ?? [];
  const underwayCount = vesselList.filter((v) => v.status === "Underway").length;

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Geospatial Monitor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time AIS vessel tracking with 30-second auto-refresh
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(lastRefresh, { addSuffix: true })}
          </span>
          <Badge
            variant="outline"
            className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 font-mono text-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse inline-block" />
            LIVE · 30s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={!mapReady || isFetching}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Layer controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Layers:
        </span>
        <Button
          variant={layers.vessels ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => toggleLayer("vessels")}
        >
          <Ship className="w-3 h-3" /> AIS Vessels ({vesselList.length})
        </Button>
        <Button
          variant={layers.lanes ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => toggleLayer("lanes")}
        >
          <Anchor className="w-3 h-3" /> Shipping Lanes ({SHIPPING_LANES.length})
        </Button>
        <Button
          variant={layers.traffic ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => toggleLayer("traffic")}
        >
          <MapPin className="w-3 h-3" /> Traffic Layer
        </Button>
      </div>

      {/* Map + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map */}
        <div className="xl:col-span-3">
          <Card className="bg-card border-border overflow-hidden">
            <MapView
              className="w-full h-[520px]"
              initialCenter={{ lat: 37.5, lng: -95.0 }}
              initialZoom={4}
              onMapReady={handleMapReady}
            />
          </Card>
        </div>

        {/* Vessel list sidebar */}
        <div className="space-y-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Ship className="w-4 h-4 text-primary" />
                Active Vessels
                {isFetching && (
                  <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <div className="space-y-1 max-h-[460px] overflow-y-auto">
                {vesselList.map((vessel) => {
                  const color =
                    vessel.status === "Underway"
                      ? "text-emerald-400"
                      : vessel.status === "Anchored"
                      ? "text-amber-400"
                      : "text-slate-400";
                  const isSelected = selectedVessel?.id === vessel.id;
                  return (
                    <button
                      key={vessel.id}
                      onClick={() => {
                        setSelectedVessel(vessel as Vessel);
                        mapRef.current?.panTo({ lat: vessel.lat, lng: vessel.lng });
                        mapRef.current?.setZoom(8);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-xs ${
                        isSelected
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">{vessel.name}</span>
                        <span className={`${color} whitespace-nowrap font-mono`}>
                          {vessel.speed}kn
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-muted-foreground">{vessel.type}</span>
                        <span className={`${color} font-mono`}>{vessel.status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Shipping lanes legend */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Anchor className="w-4 h-4 text-primary" />
                Shipping Lanes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {SHIPPING_LANES.map((lane) => (
                  <div key={lane.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-6 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: lane.color }}
                    />
                    <span className="text-muted-foreground">{lane.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vessels Tracked", value: vesselList.length, icon: Ship, color: "text-primary" },
          {
            label: "Underway",
            value: underwayCount,
            icon: Plane,
            color: "text-emerald-400",
          },
          { label: "Shipping Lanes", value: SHIPPING_LANES.length, icon: Anchor, color: "text-blue-400" },
          { label: "Refresh Interval", value: "30s", icon: Clock, color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
