/**
 * DOGE-LANDSCAPER — Main POV Command Interface v8
 * Design: Spatial Glass Command Deck
 * Layout:
 *   Mobile (iPhone): Full-screen 3D POV + bottom sheet panels + large touch controls
 *   Tablet (iPad): Split 55/45 with swipe-able panels
 *   Desktop: Full split-panel 60/40 with tab navigation
 * Features:
 *   - Device-adaptive layout via useDevice hook
 *   - Live Open-Meteo weather with wind spray lock (>10 mph disables spray)
 *   - Spray state propagated to 3D LiDAR viewer for heatmap
 *   - Mission task completion synced to zone sphere colors
 *   - Persistent zone treatment log via localStorage
 *   - GitHub mission log export to DOGE-Spatial-Explorer
 *   - Bottom sheet navigation on mobile (iOS 27 style)
 *   - Large touch targets (min 44pt) on all interactive elements
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sun, Map, Navigation, Activity, Package, BookOpen, User,
  Clock, CheckCircle, AlertTriangle, Leaf, ChevronUp, ChevronDown,
  Droplets, Zap, History, Github
} from "lucide-react";
import {
  ROBOT_PERSONA_DEFAULT, IOWA_LAWN_CALENDAR, PRODUCTS_INVENTORY,
  MISSION_TASKS, TRAINING_SCENARIOS, AI_RECOMMENDATIONS,
  type RobotPersona
} from "@/lib/data";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useDevice } from "@/hooks/useDevice";
import { useWeather } from "@/hooks/useWeather";
import { useChipNotifications } from "@/hooks/useChipNotifications";
import POVViewer from "@/components/POVViewer";
import LidarMap from "@/components/LidarMap";
import WeatherPanel from "@/components/WeatherPanel";
import MissionPanel from "@/components/MissionPanel";
import AvatarPanel from "@/components/AvatarPanel";
import TrainingSimulator from "@/components/TrainingSimulator";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import DebugOverlay from "@/components/DebugOverlay";
import ProductInventory from "@/components/ProductInventory";
import TopNav from "@/components/TopNav";
import RobotControls from "@/components/RobotControls";
import { RobotAvatarSVG } from "@/components/RobotAvatarSVG";
import ChipVoicePanel from "@/components/ChipVoicePanel";
import CompanionQRPanel from "@/components/CompanionQRPanel";
import { DailyReportButton } from "@/components/DailyReport";
import GitHubExportPanel from "@/components/GitHubExportPanel";
import ZoneTreatmentHistoryPanel from "@/components/ZoneTreatmentHistoryPanel";

type ActivePanel =
  | "mission" | "weather" | "lidar" | "history" | "avatar"
  | "training" | "recommendations" | "inventory" | "calendar"
  | "voice" | "companion" | "report" | "github";
type SheetState = "closed" | "peek" | "half" | "full";

export default function Home() {
  const device = useDevice();
  const [activePanel, setActivePanel] = useState<ActivePanel>("mission");
  const [debugVisible, setDebugVisible] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [persona, setPersona] = useState<RobotPersona>(ROBOT_PERSONA_DEFAULT);
  const [robotStatus, setRobotStatus] = useState<"idle" | "working" | "paused" | "error">("working");
  const [currentTask, setCurrentTask] = useState("Apply Scotts Weed & Feed — Zone A");
  const [showPersonaEditor, setShowPersonaEditor] = useState(false);
  const [isSprayActive, setIsSprayActive] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [sheetDragStart, setSheetDragStart] = useState(0);

  const { data: telemetry, wsStatus } = useTelemetry();
  const weather = useWeather();
  const signalStrength = Math.round(Math.max(0, Math.min(100, ((telemetry.wifiRssi + 80) / 55) * 100)));

  // Wind spray lock — disable spray when wind > 10 mph
  const windSpeed = weather.current.wind;
  const sprayLocked = windSpeed > 10;

  // Chip's push notifications — hourly quips during active missions
  useChipNotifications(robotStatus === "working");

  // Robot path progress (0–1) — drives spray zone coverage bars
  const robotProgress = (completedTaskIds.length / Math.max(MISSION_TASKS.length, 1));

  // Welcome toasts
  useEffect(() => {
    const t1 = setTimeout(() => toast.success("🌱 Chip McHaymaker is online!", {
      description: `Wilton, Iowa — Zone 5b — Battery ${Math.round(telemetry.batteryLevel)}%`,
      duration: 5000,
    }), 1000);
    const t2 = setTimeout(() => toast.info(`🛰️ Telemetry: ${wsStatus.toUpperCase()}`, {
      description: `Jetson Orin AGX · GPU ${Math.round(telemetry.gpuUsage)}%`,
      duration: 3000,
    }), 2500);
    const t3 = setTimeout(() => {
      if (device.isMobile) toast.info("📱 Touch optimized for iPhone Pro Max", {
        description: "1 finger: orbit · 2 fingers: zoom/pan · tap zones",
        duration: 4000,
      });
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wind lock toast
  useEffect(() => {
    if (sprayLocked && isSprayActive) {
      setIsSprayActive(false);
      toast.warning("💨 Wind too high — Spray locked!", {
        description: `${windSpeed.toFixed(0)} mph gusts detected. Safe limit: 10 mph.`,
        duration: 5000,
      });
    }
  }, [sprayLocked, isSprayActive, windSpeed]);

  // Handle spray toggle — propagates to 3D viewer for heatmap
  const handleSprayToggle = useCallback(() => {
    if (sprayLocked) {
      toast.error("💨 Spray locked — wind too high!", {
        description: `Current: ${windSpeed.toFixed(0)} mph · Limit: 10 mph`,
        duration: 4000,
      });
      return;
    }
    const next = !isSprayActive;
    setIsSprayActive(next);
    if (next) {
      setRobotStatus("working");
      toast.success("💧 Spray activated — minimum overspray mode", {
        description: "Heatmap coverage tracking enabled in 3D view",
        duration: 3000,
      });
    } else {
      toast.info("💧 Spray deactivated");
    }
  }, [isSprayActive, sprayLocked, windSpeed]);

  // Handle mission task completion — syncs zone colors in 3D viewer
  const handleTaskComplete = useCallback((taskId: string) => {
    setCompletedTaskIds(prev => {
      if (prev.includes(taskId)) return prev;
      const next = [...prev, taskId];
      const zoneMap: Record<string, string> = {
        "task-2": "A", "task-3": "B", "task-4": "D"
      };
      const zoneId = zoneMap[taskId];
      if (zoneId) {
        toast.success(`✅ Zone ${zoneId} marked as treated!`, {
          description: "3D zone marker updated to green",
          duration: 3000,
        });
      }
      return next;
    });
  }, []);

  const navItems: { id: ActivePanel; label: string; icon: React.ReactNode }[] = [
    { id: "mission",         label: "Mission",       icon: <Navigation size={16} /> },
    { id: "weather",         label: "Weather",       icon: <Sun size={16} /> },
    { id: "lidar",           label: "LiDAR Map",     icon: <Map size={16} /> },
    { id: "history",         label: "Zone Log",      icon: <History size={16} /> },
    { id: "avatar",          label: "Avatar",        icon: <User size={16} /> },
    { id: "voice",           label: "Chip's Voice",  icon: <Activity size={16} /> },
    { id: "training",        label: "Training",      icon: <BookOpen size={16} /> },
    { id: "recommendations", label: "AI Recs",       icon: <Leaf size={16} /> },
    { id: "inventory",       label: "Products",      icon: <Package size={16} /> },
    { id: "calendar",        label: "Calendar",      icon: <Clock size={16} /> },
    { id: "companion",       label: "Companion",     icon: <Zap size={16} /> },
    { id: "report",          label: "Daily Report",  icon: <CheckCircle size={16} /> },
    { id: "github",          label: "GitHub Log",    icon: <Github size={16} /> },
  ];

  const sheetHeights: Record<SheetState, string> = {
    closed: "0%", peek: "12%", half: "55%", full: "92%",
  };

  const cycleSheet = () => {
    setSheetState(prev => {
      if (prev === "closed" || prev === "peek") return "half";
      if (prev === "half") return "full";
      return "peek";
    });
  };

  const handleSheetDragStart = (e: React.TouchEvent) => {
    setSheetDragStart(e.touches[0].clientY);
  };
  const handleSheetDragEnd = (e: React.TouchEvent) => {
    const dy = sheetDragStart - e.changedTouches[0].clientY;
    if (dy > 60) setSheetState(prev => prev === "peek" ? "half" : "full");
    else if (dy < -60) setSheetState(prev => prev === "full" ? "half" : "peek");
  };

  // Shared panel renderer
  const renderPanel = (panel: ActivePanel) => {
    switch (panel) {
      case "mission":
        return <MissionPanel tasks={MISSION_TASKS} persona={persona} onTaskComplete={handleTaskComplete} robotProgress={robotProgress} />;
      case "weather":
        return <WeatherPanel />;
      case "lidar":
        return <LidarMap />;
      case "history":
        return (
          <div className="p-4">
            <ZoneTreatmentHistoryPanel
              windSpeed={windSpeed}
              temperature={weather.current.temp}
              humidity={weather.current.humidity}
              weatherCondition={weather.current.condition}
            />
          </div>
        );
      case "avatar":
        return <AvatarPanel persona={persona} onUpdate={setPersona} showEditor={showPersonaEditor} onToggleEditor={() => setShowPersonaEditor(v => !v)} />;
      case "voice":
        return <ChipVoicePanel persona={persona} currentTask={currentTask} />;
      case "training":
        return <TrainingSimulator scenarios={TRAINING_SCENARIOS} persona={persona} />;
      case "recommendations":
        return <RecommendationsPanel recommendations={AI_RECOMMENDATIONS} persona={persona} />;
      case "inventory":
        return <ProductInventory products={PRODUCTS_INVENTORY} />;
      case "calendar":
        return <CalendarPanel />;
      case "companion":
        return (
          <div className="p-4">
            <CompanionQRPanel
              robotStatus={robotStatus}
              currentTask={currentTask}
              isSprayActive={isSprayActive}
              batteryLevel={Math.round(telemetry.batteryLevel)}
              signalStrength={signalStrength}
              chipMood={persona.mood}
            />
          </div>
        );
      case "report":
        return (
          <div className="p-4">
            <DailyReportButton
              persona={persona}
              completedTaskIds={completedTaskIds}
              isSprayActive={isSprayActive}
            />
          </div>
        );
      case "github":
        return (
          <div className="p-4">
            <GitHubExportPanel
              persona={persona}
              completedTaskIds={completedTaskIds}
              isSprayActive={isSprayActive}
              windSpeed={windSpeed}
              temperature={weather.current.temp}
              humidity={weather.current.humidity}
              weatherCondition={weather.current.condition}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (device.isMobile) {
    return (
      <div
        className="h-screen w-screen bg-[#0a0f1a] overflow-hidden relative flex flex-col"
        style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, oklch(0.15 0.03 260) 0%, oklch(0.09 0.015 260) 60%)' }}
      >
        {/* Compact top nav */}
        <TopNav
          persona={persona}
          batteryLevel={telemetry.batteryLevel}
          signalStrength={signalStrength}
          robotStatus={robotStatus}
          debugVisible={debugVisible}
          onToggleDebug={() => setDebugVisible(v => !v)}
          onToggleStream={() => { setIsStreaming(v => !v); toast.info(isStreaming ? "📷 Paused" : "📷 Resumed"); }}
          isStreaming={isStreaming}
        />

        {/* Full-screen 3D POV */}
        <div className="flex-1 relative overflow-hidden" style={{ paddingBottom: sheetState === "peek" ? "48px" : "0" }}>
          <POVViewer
            isStreaming={isStreaming}
            robotStatus={robotStatus}
            currentTask={currentTask}
            persona={persona}
            isSprayActive={isSprayActive}
            completedTaskIds={completedTaskIds}
          />

          {/* Telemetry HUD */}
          <div className="absolute top-2 left-2 z-20 space-y-1 pointer-events-none">
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === "simulated" ? "bg-yellow-400" : "bg-green-400"} animate-pulse`} />
              <span className="text-[9px] font-mono text-white/60">
                GPU {Math.round(telemetry.gpuUsage)}% · {telemetry.inferenceMs}ms
              </span>
            </div>
            {isSprayActive && (
              <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5">
                <Droplets size={9} className="text-green-400 animate-pulse" />
                <span className="text-[9px] font-mono text-green-400">SPRAYING</span>
              </div>
            )}
            {sprayLocked && (
              <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5 border border-red-400/30">
                <AlertTriangle size={9} className="text-red-400" />
                <span className="text-[9px] font-mono text-red-400">WIND LOCK {windSpeed.toFixed(0)}mph</span>
              </div>
            )}
          </div>

          {/* Avatar — bottom left */}
          <motion.div
            className="absolute bottom-4 left-3 z-20 cursor-pointer"
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActivePanel("avatar"); setSheetState("half"); setShowPersonaEditor(true); }}
          >
            <div className="glass rounded-2xl p-1.5 relative overflow-hidden" style={{ width: 64, height: 96 }}>
              <div className="hud-corner hud-corner-tl" /><div className="hud-corner hud-corner-tr" />
              <div className="hud-corner hud-corner-bl" /><div className="hud-corner hud-corner-br" />
              <div className="flex items-center justify-center w-full h-full">
                <RobotAvatarSVG persona={persona} size={48} animated={false} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl p-1">
                <p className="text-[7px] text-center font-medium text-yellow-300">{persona.name.split(" ")[0]}</p>
              </div>
            </div>
          </motion.div>

          {/* Large touch robot controls — bottom right */}
          <div className="absolute bottom-4 right-3 z-20">
            <MobileRobotControls
              robotStatus={robotStatus}
              isSprayActive={isSprayActive}
              sprayLocked={sprayLocked}
              windSpeed={windSpeed}
              onStatusChange={setRobotStatus}
              onSprayToggle={handleSprayToggle}
            />
          </div>

          {/* Debug overlay */}
          <AnimatePresence>
            {debugVisible && <DebugOverlay telemetry={telemetry} wsStatus={wsStatus} />}
          </AnimatePresence>
        </div>

        {/* Bottom Sheet — iOS 27 style */}
        <motion.div
          className="absolute left-0 right-0 bottom-0 z-40 flex flex-col"
          animate={{ height: sheetHeights[sheetState] }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          style={{ height: sheetHeights[sheetState] }}
        >
          {/* Sheet handle + nav tabs */}
          <div
            className="glass rounded-t-3xl border-t border-white/15 flex-shrink-0"
            onTouchStart={handleSheetDragStart}
            onTouchEnd={handleSheetDragEnd}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            {sheetState === "peek" && (
              <div className="px-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${robotStatus === "working" ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
                  <span className="text-xs text-white/70 font-medium truncate max-w-48">{currentTask}</span>
                </div>
                <button onClick={cycleSheet} className="glass rounded-full p-1.5">
                  <ChevronUp size={14} className="text-white/60" />
                </button>
              </div>
            )}

            {sheetState !== "peek" && (
              <div className="px-3 pb-2 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActivePanel(item.id)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all min-w-[52px] ${
                        activePanel === item.id
                          ? "glass-gold text-yellow-300 border border-yellow-400/30"
                          : "glass text-white/50"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sheet content */}
          {sheetState !== "peek" && (
            <div className="flex-1 bg-[#0d1220]/95 backdrop-blur-xl overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  {navItems.find(n => n.id === activePanel)?.label}
                </span>
                <button onClick={() => setSheetState("peek")} className="text-white/40 p-1">
                  <ChevronDown size={16} />
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderPanel(activePanel)}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── DESKTOP / TABLET LAYOUT ───────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-background overflow-hidden relative"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, oklch(0.15 0.03 260) 0%, oklch(0.09 0.015 260) 60%)' }}
    >
      <TopNav
        persona={persona}
        batteryLevel={telemetry.batteryLevel}
        signalStrength={signalStrength}
        robotStatus={robotStatus}
        debugVisible={debugVisible}
        onToggleDebug={() => setDebugVisible(v => !v)}
        onToggleStream={() => { setIsStreaming(v => !v); toast.info(isStreaming ? "📷 Stream paused" : "📷 Stream resumed"); }}
        isStreaming={isStreaming}
      />

      <div className="flex h-[calc(100vh-56px)] pt-14">
        {/* LEFT: POV Viewer — 60% */}
        <div className="relative flex-1 min-w-0">
          <POVViewer
            isStreaming={isStreaming}
            robotStatus={robotStatus}
            currentTask={currentTask}
            persona={persona}
            isSprayActive={isSprayActive}
            completedTaskIds={completedTaskIds}
          />

          {/* Robot Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <RobotControls
              robotStatus={robotStatus}
              onStatusChange={setRobotStatus}
              currentTask={currentTask}
              isSprayActive={isSprayActive}
              onSprayToggle={handleSprayToggle}
              windSpeed={windSpeed}
              sprayLocked={sprayLocked}
            />
          </div>

          {/* Avatar overlay */}
          <motion.div
            className="absolute bottom-4 left-4 z-20 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => { setActivePanel("avatar"); setShowPersonaEditor(true); }}
          >
            <div className="glass rounded-2xl p-1.5 relative overflow-hidden" style={{ width: 80, height: 120 }}>
              <div className="hud-corner hud-corner-tl" /><div className="hud-corner hud-corner-tr" />
              <div className="hud-corner hud-corner-bl" /><div className="hud-corner hud-corner-br" />
              <div className="flex items-center justify-center w-full h-full">
                <RobotAvatarSVG persona={persona} size={60} animated={false} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl p-1">
                <p className="text-[8px] text-center font-medium text-yellow-300 leading-tight">{persona.name.split(" ")[0]}</p>
              </div>
            </div>
          </motion.div>

          {/* Telemetry HUD */}
          <div className="absolute top-2 left-2 z-20 space-y-1 pointer-events-none">
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === "simulated" ? "bg-yellow-400" : "bg-green-400"} animate-pulse`} />
              <span className="text-[9px] font-mono text-white/60">WS:{wsStatus.toUpperCase()} · {telemetry.packetCount.toLocaleString()} pkts</span>
            </div>
            <div className="glass rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-cyan-400">GPU {Math.round(telemetry.gpuUsage)}% · {telemetry.inferenceMs}ms · {Math.round(telemetry.aiConfidence)}% conf</span>
            </div>
            <div className="glass rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-green-400">LiDAR {(telemetry.lidarPoints / 1000).toFixed(0)}K pts · {telemetry.lidarHz}Hz</span>
            </div>
            <div className="glass rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-white/50">{telemetry.lat.toFixed(5)}, {telemetry.lon.toFixed(5)}</span>
            </div>
            {isSprayActive && (
              <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5">
                <Droplets size={9} className="text-green-400 animate-pulse" />
                <span className="text-[9px] font-mono text-green-400">SPRAY ACTIVE · HEATMAP ON</span>
              </div>
            )}
            {sprayLocked && (
              <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5 border border-red-400/30">
                <AlertTriangle size={9} className="text-red-400" />
                <span className="text-[9px] font-mono text-red-400">SPRAY LOCKED · {windSpeed.toFixed(0)} MPH</span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {debugVisible && <DebugOverlay telemetry={telemetry} wsStatus={wsStatus} />}
          </AnimatePresence>
        </div>

        {/* RIGHT: Panel Stack — 40% */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-l border-white/10 overflow-hidden">
          <div className="flex-shrink-0 px-2 pt-2 pb-1 border-b border-white/10 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {navItems.map(item => (
                <motion.button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activePanel === item.id
                      ? "glass-gold text-yellow-300 border border-yellow-400/30"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {item.icon}{item.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
              >
                {renderPanel(activePanel)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Robot Controls — large touch targets ───────────────────────────
function MobileRobotControls({
  robotStatus,
  isSprayActive,
  sprayLocked,
  windSpeed,
  onStatusChange,
  onSprayToggle,
}: {
  robotStatus: "idle" | "working" | "paused" | "error";
  isSprayActive: boolean;
  sprayLocked: boolean;
  windSpeed: number;
  onStatusChange: (s: "idle" | "working" | "paused" | "error") => void;
  onSprayToggle: () => void;
}) {
  const isPaused = robotStatus === "paused";
  return (
    <div className="flex flex-col gap-2">
      {/* D-pad */}
      <div className="glass rounded-2xl p-2">
        <div className="grid grid-cols-3 gap-1" style={{ width: 108 }}>
          <div />
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => toast.info("⬆️ Forward")}>
            <span className="text-sm">▲</span>
          </button>
          <div />
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => toast.info("⬅️ Left")}>
            <span className="text-sm">◀</span>
          </button>
          <div className="w-9 h-9 glass rounded-xl flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${robotStatus === "working" ? "bg-green-400 animate-pulse" : robotStatus === "paused" ? "bg-yellow-400" : "bg-red-400"}`} />
          </div>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => toast.info("➡️ Right")}>
            <span className="text-sm">▶</span>
          </button>
          <div />
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => toast.info("⬇️ Back")}>
            <span className="text-sm">▼</span>
          </button>
          <div />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5">
        <button
          onTouchStart={() => onStatusChange(isPaused ? "working" : "paused")}
          className={`h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
            isPaused ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-black"
          }`}
          style={{ width: 108 }}
        >
          {isPaused ? <><Zap size={12} />Resume</> : <><span>⏸</span>Pause</>}
        </button>
        <button
          onTouchStart={onSprayToggle}
          disabled={sprayLocked && !isSprayActive}
          className={`h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
            sprayLocked ? "bg-red-500/30 text-red-400 border border-red-400/30" :
            isSprayActive ? "bg-blue-500/80 text-white" : "glass text-white/70"
          }`}
          style={{ width: 108 }}
        >
          {sprayLocked ? (
            <><AlertTriangle size={10} />{windSpeed.toFixed(0)}mph</>
          ) : (
            <><Droplets size={12} />{isSprayActive ? "Stop" : "Spray"}</>
          )}
        </button>
        <button
          onTouchStart={() => { onStatusChange("error"); toast.error("🛑 E-STOP ACTIVATED"); }}
          className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold bg-red-600/90 text-white"
          style={{ width: 108 }}
        >
          ⛔ E-STOP
        </button>
      </div>
    </div>
  );
}

// ── Calendar Panel ────────────────────────────────────────────────────────
function CalendarPanel() {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentData = IOWA_LAWN_CALENDAR.find(m => m.month === currentMonth) || IOWA_LAWN_CALENDAR[3];
  const [selected, setSelected] = useState(currentData);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} className="text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">Iowa Lawn Calendar — Zone 5b</h3>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {IOWA_LAWN_CALENDAR.map(m => (
          <button key={m.month} onClick={() => setSelected(m)}
            className={`text-[10px] py-2 px-1 rounded-md font-medium transition-all ${
              selected.month === m.month ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"
            }`}
          >{m.month.slice(0, 3)}</button>
        ))}
      </div>
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white">{selected.month}</h4>
          {selected.month === currentMonth && (
            <span className="text-[10px] glass-gold text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400/30">Current</span>
          )}
        </div>
        <div className="space-y-1.5">
          {selected.tasks.map((task, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-white/80">{task}</span>
            </div>
          ))}
        </div>
        {selected.products.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] text-white/50 mb-1.5 uppercase tracking-wider">Products Needed</p>
            {selected.products.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Package size={10} className="text-yellow-400" />
                <span className="text-xs text-yellow-300">{p}</span>
              </div>
            ))}
          </div>
        )}
        <div className="glass-red rounded-lg p-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{selected.warning}</p>
          </div>
        </div>
        <div className="glass-green rounded-lg p-2.5">
          <p className="text-[11px] text-green-300 italic">💬 "{selected.chipQuip}"</p>
          <p className="text-[10px] text-white/40 mt-1">— Chip McHaymaker</p>
        </div>
      </div>
    </div>
  );
}
