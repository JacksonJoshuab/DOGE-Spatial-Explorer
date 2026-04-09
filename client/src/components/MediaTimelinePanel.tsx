/*
 * DOGE-LANDSCAPER — Media Timeline Panel v1
 * Design: Spatial Glass Command Deck
 * Features:
 *   - Scrollable horizontal timeline of media events (photos, videos, scans, receipts)
 *   - Each media item: angle-of-view marker, source file info, thumbnail placeholder
 *   - "Enhance Model" upload button to add new media to timeline
 *   - Model quality score updates as media is added
 *   - Camera frustum cone position in 3D (passed to parent for Three.js rendering)
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export interface MediaItem {
  id: string;
  filename: string;
  type: "photo" | "video" | "scan" | "receipt" | "model";
  date: string;
  capturedBy: string;
  device: string;
  resolution: string;
  fileSize: string;
  gps: { lat: number; lon: number; alt: number };
  heading: number;       // degrees from north (camera facing direction)
  pitch: number;         // degrees (0 = horizontal, -90 = down)
  fov: number;           // field of view in degrees
  description: string;
  tags: string[];
  modelContribution: string; // how this media improves the 3D model
  rawUrl: string;        // link to source file
  thumbnail?: string;    // CDN url or null
  quality: number;       // 0–100 contribution to model quality
}

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: "img-0730",
    filename: "IMG_0730.jpeg",
    type: "photo",
    date: "2025-10-08T14:22:00",
    capturedBy: "Jackson Joshua",
    device: "iPhone 15 Pro Max",
    resolution: "48 MP · 8064×6048",
    fileSize: "18.4 MB",
    gps: { lat: 41.57685, lon: -91.26073, alt: 1.6 },
    heading: 180,
    pitch: -15,
    fov: 24,
    description: "South-facing view of main lawn from deck edge. Shows Zone A grass condition and oak tree canopy.",
    tags: ["zone-a", "grass", "oak", "deck", "south-view"],
    modelContribution: "Fills texture gap on south lawn face. Adds oak bark detail.",
    rawUrl: "#img-0730-raw",
    quality: 88,
  },
  {
    id: "img-0731",
    filename: "IMG_0731.jpeg",
    type: "photo",
    date: "2025-10-08T14:24:00",
    capturedBy: "Jackson Joshua",
    device: "iPhone 15 Pro Max",
    resolution: "48 MP · 8064×6048",
    fileSize: "17.9 MB",
    gps: { lat: 41.57681, lon: -91.26073, alt: 1.6 },
    heading: 270,
    pitch: -10,
    fov: 24,
    description: "West-facing view showing fence line and Zone D back strip. Scilla garden visible in foreground.",
    tags: ["zone-c", "zone-d", "scilla", "fence", "west-view"],
    modelContribution: "Adds fence texture and Zone D ground coverage.",
    rawUrl: "#img-0731-raw",
    quality: 82,
  },
  {
    id: "img-3446",
    filename: "IMG_3446.png",
    type: "photo",
    date: "2025-10-08T14:31:00",
    capturedBy: "Jackson Joshua",
    device: "iPhone 15 Pro Max",
    resolution: "48 MP · 8064×6048",
    fileSize: "22.1 MB",
    gps: { lat: 41.57688, lon: -91.26073, alt: 1.8 },
    heading: 135,
    pitch: -5,
    fov: 24,
    description: "Northeast view from corner of yard. Shows full oak canopy, house roofline, and Zone B ring.",
    tags: ["zone-b", "oak", "house", "northeast-view", "canopy"],
    modelContribution: "Primary oak canopy texture source. Roofline geometry reference.",
    rawUrl: "#img-3446-raw",
    quality: 91,
  },
  {
    id: "scan-usdz",
    filename: "905-Backyard-10_8_2025.usdz",
    type: "scan",
    date: "2025-10-08T15:00:00",
    capturedBy: "Jackson Joshua",
    device: "iPhone 15 Pro Max · LiDAR",
    resolution: "LiDAR 4M pts · Photogrammetry 38K tris",
    fileSize: "142 MB",
    gps: { lat: 41.57683, lon: -91.26073, alt: 1.5 },
    heading: 0,
    pitch: 0,
    fov: 360,
    description: "Full yard LiDAR scan. Primary 3D model source. Captured with Record3D app, exported as USDZ.",
    tags: ["lidar", "usdz", "scan", "primary-model", "record3d"],
    modelContribution: "Primary geometry source. All zones, obstacles, and terrain.",
    rawUrl: "#usdz-raw",
    quality: 100,
  },
];

const TYPE_ICONS: Record<MediaItem["type"], string> = {
  photo: "📷",
  video: "🎬",
  scan: "🔬",
  receipt: "🧾",
  model: "🗿",
};

const TYPE_COLORS: Record<MediaItem["type"], string> = {
  photo: "#44ccff",
  video: "#ff88cc",
  scan: "#44ff88",
  receipt: "#ffcc44",
  model: "#cc88ff",
};

const HEADING_LABELS: Record<number, string> = {
  0: "N", 45: "NE", 90: "E", 135: "SE",
  180: "S", 225: "SW", 270: "W", 315: "NW",
};

function getHeadingLabel(deg: number): string {
  const rounded = Math.round(deg / 45) * 45;
  return HEADING_LABELS[rounded] || `${deg}°`;
}

interface MediaTimelinePanelProps {
  onMediaSelect?: (item: MediaItem) => void;
}

export default function MediaTimelinePanel({ onMediaSelect }: MediaTimelinePanelProps) {
  const [media, setMedia] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [selectedId, setSelectedId] = useState<string | null>("scan-usdz");
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelQuality = Math.round(
    media.reduce((s, m) => s + m.quality, 0) / media.length
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach(file => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const type: MediaItem["type"] =
        ["jpg", "jpeg", "png", "heic", "heif"].includes(ext) ? "photo" :
        ["mp4", "mov", "m4v"].includes(ext) ? "video" :
        ["usdz", "glb", "gltf", "obj"].includes(ext) ? "model" :
        ["pdf"].includes(ext) ? "receipt" : "scan";

      const newItem: MediaItem = {
        id: `upload-${Date.now()}-${file.name}`,
        filename: file.name,
        type,
        date: new Date().toISOString(),
        capturedBy: "User upload",
        device: "Unknown",
        resolution: "Analyzing…",
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        gps: { lat: 41.57683, lon: -91.26073, alt: 1.5 },
        heading: 0,
        pitch: 0,
        fov: 60,
        description: `Uploaded ${file.name} — processing for model enhancement`,
        tags: ["upload", "pending"],
        modelContribution: "Analyzing contribution…",
        rawUrl: URL.createObjectURL(file),
        quality: Math.round(50 + Math.random() * 40),
      };
      setMedia(prev => [newItem, ...prev]);
      toast.success(`📎 ${file.name} added to timeline`, {
        description: "Processing for model enhancement…",
        duration: 4000,
      });
    });
    setShowUpload(false);
  };

  const selected = media.find(m => m.id === selectedId);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🎞️</span>
          <h3 className="text-sm font-semibold text-white">Media Timeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${modelQuality}%`,
                  background: modelQuality > 80 ? "#44ff88" : modelQuality > 60 ? "#ffcc44" : "#ff4444",
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-white/50">{modelQuality}% quality</span>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="glass rounded-xl px-2 py-1 text-[9px] text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/10 transition-all"
          >
            + Enhance
          </button>
        </div>
      </div>

      {/* Upload prompt */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-2xl p-4 border border-cyan-400/30"
          >
            <p className="text-[10px] text-white/60 mb-2">
              Add photos, videos, USDZ models, or receipts to enhance the 3D model and timeline.
            </p>
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400/40 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-2xl mb-1">📁</p>
              <p className="text-[10px] text-white/40">Tap to select files</p>
              <p className="text-[8px] text-white/25 mt-0.5">JPEG · PNG · HEIC · MP4 · MOV · USDZ · GLB · PDF</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.usdz,.glb,.gltf,.obj,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => setShowUpload(false)}
              className="mt-2 w-full text-[9px] text-white/30 hover:text-white/60"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal scrollable timeline */}
      <div className="relative">
        <p className="text-[8px] text-white/25 uppercase tracking-wider mb-2">Timeline</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {media.map(item => {
            const isSelected = selectedId === item.id;
            const color = TYPE_COLORS[item.type];
            return (
              <motion.button
                key={item.id}
                onClick={() => { setSelectedId(item.id); onMediaSelect?.(item); }}
                className="flex-shrink-0 rounded-2xl p-2 text-left transition-all"
                style={{
                  width: 80,
                  background: isSelected ? `${color}20` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isSelected ? color + "50" : "rgba(255,255,255,0.08)"}`,
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-xl mb-1 text-center">{TYPE_ICONS[item.type]}</div>
                <p className="text-[8px] font-mono truncate text-center" style={{ color: isSelected ? color : "rgba(255,255,255,0.4)" }}>
                  {item.filename.split(".")[0].slice(0, 8)}
                </p>
                <p className="text-[7px] text-white/25 text-center mt-0.5">
                  {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <div className="mt-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.quality}%`, background: color }} />
                </div>
              </motion.button>
            );
          })}
        </div>
        {/* Timeline line */}
        <div className="absolute bottom-2 left-0 right-0 h-px bg-white/5 pointer-events-none" />
      </div>

      {/* Selected media detail */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-2xl overflow-hidden"
            style={{ borderColor: `${TYPE_COLORS[selected.type]}30`, borderWidth: 1 }}
          >
            {/* Media header */}
            <div className="p-3 flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${TYPE_COLORS[selected.type]}15` }}
              >
                {TYPE_ICONS[selected.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">{selected.filename}</p>
                <p className="text-[9px] text-white/40">{selected.device}</p>
                <p className="text-[8px] text-white/25">{new Date(selected.date).toLocaleString()}</p>
              </div>
              <a
                href={selected.rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] text-cyan-400 hover:text-cyan-300 underline flex-shrink-0"
              >
                Raw ↗
              </a>
            </div>

            <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
              {/* Angle of view */}
              <div className="glass rounded-xl p-2">
                <p className="text-[7px] text-white/25 uppercase tracking-wider mb-1.5">Angle of View</p>
                <div className="flex items-center gap-4">
                  {/* Compass rose */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                      <circle cx="24" cy="24" r="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      <text x="24" y="7" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">N</text>
                      <text x="24" y="45" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">S</text>
                      <text x="5" y="26" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">W</text>
                      <text x="43" y="26" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">E</text>
                      {/* FOV cone */}
                      <g transform={`rotate(${selected.heading}, 24, 24)`}>
                        <path
                          d={`M 24 24 L ${24 + 18 * Math.sin(-selected.fov / 2 * Math.PI / 180)} ${24 - 18 * Math.cos(-selected.fov / 2 * Math.PI / 180)} A 18 18 0 0 1 ${24 + 18 * Math.sin(selected.fov / 2 * Math.PI / 180)} ${24 - 18 * Math.cos(selected.fov / 2 * Math.PI / 180)} Z`}
                          fill={`${TYPE_COLORS[selected.type]}30`}
                          stroke={TYPE_COLORS[selected.type]}
                          strokeWidth="0.8"
                        />
                        <line x1="24" y1="24" x2="24" y2="6" stroke={TYPE_COLORS[selected.type]} strokeWidth="1.5" />
                      </g>
                      <circle cx="24" cy="24" r="2" fill={TYPE_COLORS[selected.type]} />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-3">
                      <div>
                        <p className="text-[7px] text-white/25">Heading</p>
                        <p className="text-[9px] font-mono text-white/70">{selected.heading}° {getHeadingLabel(selected.heading)}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-white/25">Pitch</p>
                        <p className="text-[9px] font-mono text-white/70">{selected.pitch}°</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-white/25">FOV</p>
                        <p className="text-[9px] font-mono text-white/70">{selected.fov}°</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[7px] text-white/25">GPS Origin</p>
                      <p className="text-[8px] font-mono text-white/50">{selected.gps.lat.toFixed(5)}°N {Math.abs(selected.gps.lon).toFixed(5)}°W +{selected.gps.alt}m</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="glass rounded-xl p-2">
                <p className="text-[9px] text-white/60 italic">"{selected.description}"</p>
              </div>

              {/* Model contribution */}
              <div className="glass rounded-xl p-2 flex items-center gap-2">
                <span className="text-[9px]">🗿</span>
                <div>
                  <p className="text-[7px] text-white/25 uppercase tracking-wider">Model Contribution</p>
                  <p className="text-[9px] text-green-400">{selected.modelContribution}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[9px] font-mono" style={{ color: TYPE_COLORS[selected.type] }}>{selected.quality}%</p>
                  <p className="text-[7px] text-white/25">quality</p>
                </div>
              </div>

              {/* Tech specs */}
              <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                <div className="glass rounded-xl p-1.5">
                  <p className="text-[7px] text-white/25">Resolution</p>
                  <p className="font-mono text-white/60">{selected.resolution}</p>
                </div>
                <div className="glass rounded-xl p-1.5">
                  <p className="text-[7px] text-white/25">File Size</p>
                  <p className="font-mono text-white/60">{selected.fileSize}</p>
                </div>
                <div className="glass rounded-xl p-1.5">
                  <p className="text-[7px] text-white/25">Captured By</p>
                  <p className="font-mono text-white/60 truncate">{selected.capturedBy}</p>
                </div>
                <div className="glass rounded-xl p-1.5">
                  <p className="text-[7px] text-white/25">Type</p>
                  <p className="font-mono" style={{ color: TYPE_COLORS[selected.type] }}>{selected.type}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => (
                  <span key={t} className="text-[7px] glass px-1.5 py-0.5 rounded-full text-cyan-300 border border-cyan-400/15">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
