/* LidarMap — Animated LiDAR point cloud map view + Google Maps satellite */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Layers, Navigation, Map as MapIcon } from "lucide-react";
import { MapView } from "@/components/Map";

const ZONES = [
  { id: "A", label: "Zone A — Main Lawn", x: 30, y: 40, w: 120, h: 90, color: "oklch(0.55 0.15 145)", coverage: 87 },
  { id: "B", label: "Zone B — Side Yard", x: 165, y: 55, w: 70, h: 65, color: "oklch(0.82 0.18 85)", coverage: 72 },
  { id: "C", label: "Zone C — Garden Beds", x: 30, y: 145, w: 60, h: 40, color: "oklch(0.65 0.15 280)", coverage: 95 },
  { id: "D", label: "Zone D — Tree Ring", x: 100, y: 145, w: 55, h: 45, color: "oklch(0.65 0.22 25)", coverage: 45 },
];

const POINTS = Array.from({ length: 120 }, (_, i) => ({
  x: Math.random() * 240 + 10,
  y: Math.random() * 160 + 10,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.6 + 0.2,
  color: Math.random() > 0.7 ? "oklch(0.55 0.15 145)" : "oklch(0.85 0.18 195)",
}));

// Wilton, Iowa coordinates
const WILTON_IA = { lat: 41.5897, lng: -91.0249 };

export default function LidarMap() {
  const [scanAngle, setScanAngle] = useState(0);
  const [selectedZone, setSelectedZone] = useState<string | null>("A");
  const [mapMode, setMapMode] = useState<"lidar" | "satellite">("lidar");
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanAngle(a => (a + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setMapTypeId("satellite");
    map.setTilt(45);
    // Add robot position marker
    new (window as any).google.maps.marker.AdvancedMarkerElement({
      map,
      position: WILTON_IA,
      title: "Chip McHaymaker — Current Position",
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Property Map — Wilton, IA</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-status-pulse" />
            <span className="text-[10px] telemetry text-cyan-400">SCANNING</span>
          </div>
        </div>
      </div>

      {/* Map mode toggle */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setMapMode("lidar")}
          className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            mapMode === "lidar" ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/50 hover:text-white/80"
          }`}
        >
          <Layers size={11} />
          LiDAR View
        </button>
        <button
          onClick={() => setMapMode("satellite")}
          className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            mapMode === "satellite" ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/50 hover:text-white/80"
          }`}
        >
          <MapIcon size={11} />
          Satellite
        </button>
      </div>

      {/* Map views */}
      {mapMode === "lidar" ? (
        <div className="relative rounded-xl overflow-hidden" style={{ height: 220 }}>
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/116029439/cao3qXUUr9zrMdetSxxjdj/lidar_topdown_7a0d6a4b.png"
            alt="LiDAR Map — 905 Backyard, Wilton IA · 10/8/2025"
            className="w-full h-full object-cover opacity-95"
          />
          
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 200" preserveAspectRatio="xMidYMid slice">
            {POINTS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={p.opacity} />
            ))}
            {ZONES.map(zone => (
              <g key={zone.id} onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)} style={{ cursor: 'pointer' }}>
                <rect
                  x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                  fill={zone.color.replace(')', ' / 0.15)')}
                  stroke={zone.color}
                  strokeWidth={selectedZone === zone.id ? 1.5 : 0.8}
                  rx={3}
                  opacity={0.8}
                />
                <text x={zone.x + 4} y={zone.y + 12} fill={zone.color} fontSize={7} fontFamily="monospace" fontWeight="bold">
                  ZONE {zone.id}
                </text>
              </g>
            ))}
            <g transform="translate(130, 100)">
              <circle r={6} fill="oklch(0.82 0.18 85 / 0.3)" stroke="oklch(0.82 0.18 85)" strokeWidth={1.5} />
              <circle r={2} fill="oklch(0.82 0.18 85)" />
              <line
                x1={0} y1={0}
                x2={Math.cos((scanAngle * Math.PI) / 180) * 80}
                y2={Math.sin((scanAngle * Math.PI) / 180) * 80}
                stroke="oklch(0.85 0.18 195 / 0.6)"
                strokeWidth={0.8}
              />
              <path
                d={`M 0 0 L ${Math.cos(((scanAngle - 30) * Math.PI) / 180) * 80} ${Math.sin(((scanAngle - 30) * Math.PI) / 180) * 80} A 80 80 0 0 1 ${Math.cos((scanAngle * Math.PI) / 180) * 80} ${Math.sin((scanAngle * Math.PI) / 180) * 80} Z`}
                fill="oklch(0.85 0.18 195 / 0.08)"
              />
            </g>
            <text x={248} y={12} fill="oklch(0.82 0.18 85)" fontSize={7} fontFamily="monospace" textAnchor="middle">N</text>
          </svg>

          <div className="absolute inset-0 pointer-events-none">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
          </div>
          <div className="absolute bottom-2 right-2 glass rounded px-1.5 py-0.5">
            <span className="text-[9px] telemetry">21.7m × 43.9m · SCAN 10/8/2025</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ height: 220 }}>
          <MapView
            className="w-full h-full"
            initialCenter={WILTON_IA}
            initialZoom={18}
            onMapReady={handleMapReady}
          />
        </div>
      )}

      {/* Zone details */}
      <div className="grid grid-cols-2 gap-2">
        {ZONES.map(zone => (
          <motion.button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
            className={`glass rounded-xl p-3 text-left transition-all ${selectedZone === zone.id ? "border border-cyan-400/40" : ""}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold" style={{ color: zone.color }}>Zone {zone.id}</span>
              <span className="text-[10px] telemetry">{zone.coverage}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${zone.coverage}%`, background: zone.color }} />
            </div>
            <p className="text-[9px] text-white/40 mt-1 leading-tight">{zone.label.split("—")[1]?.trim()}</p>
          </motion.button>
        ))}
      </div>

      {/* Stats */}
      <div className="glass rounded-xl p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-white/40">Total Area</p>
            <p className="text-sm font-bold text-white">9,515 ft²</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">Scan Points</p>
            <p className="text-sm font-bold text-cyan-400">404,354</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">Coverage</p>
            <p className="text-sm font-bold text-green-400">91.2%</p>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="glass rounded-xl p-3 flex items-center gap-2">
        <Navigation size={14} className="text-yellow-400 flex-shrink-0" />
        <div>
          <p className="text-[10px] text-white/60">Current Location</p>
          <p className="text-xs text-white font-medium">Wilton, Iowa 52776</p>
          <p className="text-[9px] telemetry text-cyan-400">41.5897°N, 91.0249°W · Zone 5b</p>
        </div>
      </div>
    </div>
  );
}
