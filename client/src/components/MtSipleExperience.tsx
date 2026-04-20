/**
 * MtSipleExperience.tsx
 * Design: Cinematic Antarctic immersion — deep navy/ice palette, dramatic typography,
 * aurora-tinted overlays, scientific data cards, and a Gaussian splat orbit preview.
 * Philosophy: "Remote wilderness meets cutting-edge 3DGS technology"
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const HERO_IMG = "/manus-storage/mtsiple-hero_34932031.jpg";
const SURFACE_IMG = "/manus-storage/mtsiple-surface_f13221da.jpg";
const THERMAL_IMG = "/manus-storage/mtsiple-thermal_8f0ab369.jpg";
const SPLAT_IMG = "/manus-storage/mtsiple-splat-preview_ed32fafb.jpg";

interface MtSipleExperienceProps {
  onClose: () => void;
  onLaunchSplat: () => void;
  splatLoading: boolean;
  isMtSiple: boolean;
}

const FACTS = [
  { label: "Elevation", value: "3,110 m", sub: "10,203 ft above sea level" },
  { label: "Type", value: "Shield Volcano", sub: "1,800 km³ total volume" },
  { label: "Location", value: "76°S 125°W", sub: "Marie Byrd Land, Antarctica" },
  { label: "Age", value: "~2 Ma", sub: "Pleistocene shield edifice" },
  { label: "Ice Shelf", value: "Getz", sub: "Separates island from mainland" },
  { label: "Status", value: "Dormant", sub: "No confirmed eruptions on record" },
];

const TABS = ["Overview", "Thermal", "3DGS Preview", "Data Sources"] as const;
type Tab = (typeof TABS)[number];

export default function MtSipleExperience({
  onClose,
  onLaunchSplat,
  splatLoading,
  isMtSiple,
}: MtSipleExperienceProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [email, setEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const bgImages = [HERO_IMG, SURFACE_IMG];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slowly cycle hero background
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setBgIndex((i) => (i + 1) % bgImages.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    // Store in localStorage as a simple list (no backend needed for static)
    const existing = JSON.parse(localStorage.getItem("mtsiple_notify") || "[]");
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem("mtsiple_notify", JSON.stringify(existing));
    }
    setNotifySubmitted(true);
    toast.success("🗻 You're on the list!", {
      description: `We'll notify ${email} when Mt. Siple launches.`,
      duration: 6000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        {bgImages.map((src, i) => (
          <motion.div
            key={src}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
            animate={{ opacity: i === bgIndex ? 1 : 0 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        ))}
        {/* Deep overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020b18]/70 via-[#020b18]/50 to-[#020b18]/95" />
        {/* Aurora shimmer strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-60"
          style={{
            background:
              "linear-gradient(90deg, transparent, #00ffc8 20%, #7b6fff 50%, #00ffc8 80%, transparent)",
            animation: "aurora-slide 8s linear infinite",
          }}
        />
      </div>

      {/* Aurora animation keyframes */}
      <style>{`
        @keyframes aurora-slide {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes orbit-glow {
          0%, 100% { box-shadow: 0 0 30px 8px rgba(0,255,200,0.15); }
          50% { box-shadow: 0 0 60px 20px rgba(123,111,255,0.25); }
        }
        @keyframes splat-float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
      `}</style>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ background: "rgba(0,255,200,0.12)", border: "1px solid rgba(0,255,200,0.3)" }}
          >
            🗻
          </div>
          <div>
            <p className="text-[10px] text-cyan-400/60 uppercase tracking-[0.2em] font-semibold">
              Upcoming Release · DOGE-Landscaper
            </p>
            <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
              Mt. Siple, Antarctica
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{
              background: "rgba(0,255,200,0.15)",
              border: "1px solid rgba(0,255,200,0.4)",
              color: "#00ffc8",
            }}
          >
            PREVIEW
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex gap-1 px-6 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              activeTab === tab
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "Overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Hero stats grid */}
              <div className="grid grid-cols-3 gap-2">
                {FACTS.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(2,11,24,0.7)",
                      border: "1px solid rgba(0,255,200,0.12)",
                    }}
                  >
                    <p className="text-[8px] text-cyan-400/50 uppercase tracking-wider mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-white font-bold text-sm leading-tight">{f.value}</p>
                    <p className="text-[8px] text-white/30 leading-tight mt-0.5">{f.sub}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(2,11,24,0.75)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Mount Siple is a massive shield volcano forming a remote island off the coast of
                  Marie Byrd Land, West Antarctica. Unlike most Antarctic volcanoes buried under the
                  ice sheet, Siple rises in full view from sea level to 3,110 m — the only
                  free-standing volcanic island on the continent. The Getz Ice Shelf separates it
                  from the mainland. Landsat 9 imagery from February 2024 shows a dramatic
                  orographic cloud plume streaming from its summit.
                </p>
                <p className="text-[10px] text-cyan-400/50 mt-2">
                  Source: NASA Earth Observatory · Smithsonian GVP · REMA Polar Geospatial Center
                </p>
              </div>

              {/* Splat preview card */}
              <div
                className="rounded-xl overflow-hidden relative"
                style={{
                  border: "1px solid rgba(0,255,200,0.2)",
                  animation: "orbit-glow 4s ease-in-out infinite",
                }}
              >
                <img
                  src={SPLAT_IMG}
                  alt="Mt. Siple 3DGS reconstruction preview"
                  className="w-full h-36 object-cover"
                  style={{ animation: "splat-float 6s ease-in-out infinite" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[9px] text-cyan-400/70 font-mono">
                    3DGS RECONSTRUCTION · 5.2M GAUSSIAN SPLATS · ORBITAL VIEW
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Thermal" && (
            <motion.div
              key="thermal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,255,200,0.15)" }}>
                <img src={THERMAL_IMG} alt="Mt. Siple thermal satellite view" className="w-full" />
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(2,11,24,0.75)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] text-cyan-300/80 font-semibold mb-1">
                  VIIRS Brightness Temperature · June 9, 2024
                </p>
                <p className="text-[11px] text-white/65 leading-relaxed">
                  This false-color infrared image from the Suomi NPP satellite's VIIRS instrument
                  shows Mt. Siple during Antarctic winter. Warm tones (orange/pink) indicate
                  relatively warmer surfaces; cool tones (purple/blue) indicate colder ice and
                  clouds. The orographic cloud plume streams southwest from the summit. Overlaid on
                  REMA (Reference Elevation Model of Antarctica) topographic data.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { color: "#ff8c42", label: "Warm (300–320 K)" },
                    { color: "#7b6fff", label: "Cold (180–220 K)" },
                    { color: "#00ffc8", label: "Orographic cloud" },
                    { color: "#4a9eff", label: "Open ocean/ice shelf" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-[9px] text-white/50">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "3DGS Preview" && (
            <motion.div
              key="splat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div
                className="rounded-xl overflow-hidden relative"
                style={{
                  border: "1px solid rgba(0,255,200,0.25)",
                  animation: "orbit-glow 4s ease-in-out infinite",
                }}
              >
                <img
                  src={SPLAT_IMG}
                  alt="Mt. Siple 3DGS"
                  className="w-full"
                  style={{ animation: "splat-float 6s ease-in-out infinite" }}
                />
                <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-1">
                  <p className="text-[8px] text-cyan-400 font-mono">3DGS · ORBITAL VIEW · 5.2M pts</p>
                </div>
              </div>
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: "rgba(2,11,24,0.75)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] text-cyan-300/80 font-semibold">
                  About the Gaussian Splat Reconstruction
                </p>
                <p className="text-[11px] text-white/65 leading-relaxed">
                  The Mt. Siple 3DGS model is reconstructed from multi-source satellite imagery
                  including Landsat 9 OLI-2 (30 cm/px), REMA 0.5 m DEM elevation data, and
                  Copernicus DEM-90 topography. The reconstruction uses 3D Gaussian Splatting to
                  represent the 1,800 km³ shield volcano as 5.2 million Gaussian primitives,
                  capturing the snow/ice surface, exposed basaltic rock near the summit, and the
                  surrounding Getz Ice Shelf.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { k: "Source imagery", v: "Landsat 9 + REMA" },
                    { k: "Resolution", v: "0.5 m/px DEM" },
                    { k: "Splat count", v: "5.2M Gaussians" },
                    { k: "Renderer", v: "Spark / World Labs" },
                    { k: "File format", v: ".spz (compressed)" },
                    { k: "File size", v: "~4.8 MB" },
                  ].map((item) => (
                    <div key={item.k} className="flex flex-col">
                      <span className="text-[8px] text-white/30 uppercase tracking-wider">{item.k}</span>
                      <span className="text-[10px] text-white/70 font-semibold">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch button */}
              <button
                onClick={() => { onLaunchSplat(); onClose(); }}
                disabled={splatLoading}
                className="w-full rounded-xl py-3 font-bold text-sm transition-all disabled:opacity-50"
                style={{
                  background: isMtSiple
                    ? "rgba(0,255,200,0.15)"
                    : "linear-gradient(135deg, rgba(0,255,200,0.2), rgba(123,111,255,0.2))",
                  border: "1px solid rgba(0,255,200,0.4)",
                  color: "#00ffc8",
                }}
              >
                {splatLoading
                  ? "⏳ Loading Gaussian Splat…"
                  : isMtSiple
                  ? "✓ Mt. Siple Active — Close to View"
                  : "🗻 Launch Mt. Siple in 3D Viewer"}
              </button>
            </motion.div>
          )}

          {activeTab === "Data Sources" && (
            <motion.div
              key="sources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {[
                {
                  org: "NASA Earth Observatory",
                  title: "Stately Mount Siple — Image of the Day",
                  date: "June 27, 2024",
                  instrument: "Landsat 9 OLI-2 · Suomi NPP VIIRS",
                  url: "https://science.nasa.gov/earth/earth-observatory/stately-mount-siple-152988/",
                },
                {
                  org: "Polar Geospatial Center, U. Minnesota",
                  title: "Reference Elevation Model of Antarctica (REMA)",
                  date: "2023 update",
                  instrument: "Maxar optical · 0.5 m resolution",
                  url: "https://portal.opentopography.org/datasetMetadata?otCollectionID=OT.082023.3031.1",
                },
                {
                  org: "Smithsonian Global Volcanism Program",
                  title: "Siple Volcano — Bulletin & Activity Reports",
                  date: "Ongoing",
                  instrument: "Field reports · Remote sensing",
                  url: "https://volcano.si.edu/volcano.cfm?vn=390025",
                },
                {
                  org: "Brockmann Consult / Copernicus",
                  title: "Copernicus DEM-90 Topographic Visualization",
                  date: "2022",
                  instrument: "TanDEM-X SAR · 90 m DEM",
                  url: "https://www.brockmann-consult.de/allgemein/mount-siple-volcano-breaks-through-the-clouds/",
                },
                {
                  org: "USGS / LIMA",
                  title: "Landsat Image Mosaic of Antarctica",
                  date: "2007–present",
                  instrument: "Landsat 7/8/9 · True color",
                  url: "https://lima.usgs.gov/limadoc.php",
                },
                {
                  org: "AMRC / UW-Madison",
                  title: "Mount Siple AWS Weather Station",
                  date: "1992–present",
                  instrument: "Automatic Weather Station · 73.2°S",
                  url: "https://amrc.ssec.wisc.edu/aws/index.php?region=West%20Antarctica&station=Mount%20Siple",
                },
              ].map((src) => (
                <div
                  key={src.title}
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(2,11,24,0.7)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] text-cyan-400/50 uppercase tracking-wider">{src.org}</p>
                      <p className="text-[10px] text-white/80 font-semibold leading-tight mt-0.5">
                        {src.title}
                      </p>
                      <p className="text-[8px] text-white/35 mt-0.5">
                        {src.instrument} · {src.date}
                      </p>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[8px] text-cyan-400/70 hover:text-cyan-300 flex-shrink-0 mt-1"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notify Me footer */}
      <div
        className="relative z-10 px-6 pb-6 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {notifySubmitted ? (
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: "rgba(0,255,200,0.08)", border: "1px solid rgba(0,255,200,0.25)" }}
          >
            <p className="text-[11px] text-cyan-300 font-semibold">✓ You're on the early access list</p>
            <p className="text-[9px] text-white/40 mt-0.5">
              We'll email you when the Mt. Siple Gaussian splat launches.
            </p>
          </div>
        ) : (
          <form onSubmit={handleNotify} className="space-y-2">
            <p className="text-[9px] text-white/40 uppercase tracking-wider">
              🔔 Notify me when Mt. Siple launches
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-lg px-3 py-2 text-[11px] text-white placeholder-white/25 outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-[10px] font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,200,0.25), rgba(123,111,255,0.25))",
                  border: "1px solid rgba(0,255,200,0.35)",
                  color: "#00ffc8",
                }}
              >
                Notify Me
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
