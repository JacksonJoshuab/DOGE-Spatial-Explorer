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
import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sun, Map, Navigation, Activity, Package, BookOpen, User,
  Clock, CheckCircle, AlertTriangle, Leaf, ChevronUp, ChevronDown,
  Droplets, Zap, History, Github, Gamepad2
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
import { useChipVoice } from "@/hooks/useChipVoice";
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
import FleetConnectivityPanel, { type FleetAgent } from "@/components/FleetConnectivityPanel";
import AssetRegistryPanel from "@/components/AssetRegistryPanel";
import MediaTimelinePanel, { type MediaItem } from "@/components/MediaTimelinePanel";

type ActivePanel =
  | "mission" | "weather" | "lidar" | "history" | "avatar"
  | "training" | "recommendations" | "inventory" | "calendar"
  | "voice" | "companion" | "report" | "github"
  | "fleet" | "assets" | "media";
type SheetState = "closed" | "peek" | "half" | "full";

export default function Home() {
  const device = useDevice();
  const [debugVisible, setDebugVisible] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [persona, setPersona] = useState<RobotPersona>(ROBOT_PERSONA_DEFAULT);
  const [robotStatus, setRobotStatus] = useState<"idle" | "working" | "paused" | "error">("working");
  const [currentTask, setCurrentTask] = useState("Apply Scotts Weed & Feed — Zone A");
  const [showPersonaEditor, setShowPersonaEditor] = useState(false);
  const [isSprayActive, setIsSprayActive] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [chipSpeechText, setChipSpeechText] = useState<string | null>(null);
  const { speak: chipSpeak, speakTask: chipSpeakTask, isSupported: voiceSupported } = useChipVoice();
  const [missionComplete, setMissionComplete] = useState(false);
  const [missionCompleteTime, setMissionCompleteTime] = useState<Date | null>(null);
  // Restore sheet state from sessionStorage so panel stays open on refresh
  const [sheetState, setSheetState] = useState<SheetState>(() => {
    try { return (sessionStorage.getItem("doge-sheet-state") as SheetState) || "peek"; } catch { return "peek"; }
  });
  const [activePanel, _setActivePanel] = useState<ActivePanel>(() => {
    try { return (sessionStorage.getItem("doge-active-panel") as ActivePanel) || "mission"; } catch { return "mission"; }
  });
  const setActivePanel = (p: ActivePanel) => {
    _setActivePanel(p);
    try { sessionStorage.setItem("doge-active-panel", p); } catch { /* ignore */ }
  };
  const setSheetStateAndPersist = (s: SheetState | ((prev: SheetState) => SheetState)) => {
    setSheetState(prev => {
      const next = typeof s === "function" ? s(prev) : s;
      try { sessionStorage.setItem("doge-sheet-state", next); } catch { /* ignore */ }
      return next;
    });
  };
  const [sheetDragStart, setSheetDragStart] = useState(0);
  const [sheetSwipeStartX, setSheetSwipeStartX] = useState(0);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [hudExpanded, setHudExpanded] = useState(false);
  // Auto-collapse HUD after 5 seconds
  useEffect(() => {
    if (!hudExpanded) return;
    const t = setTimeout(() => setHudExpanded(false), 5000);
    return () => clearTimeout(t);
  }, [hudExpanded]);
  // One-time swipe hint — shown until user performs first horizontal swipe or 8s elapses
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    try { return !localStorage.getItem("doge-swipe-hint-seen"); } catch { return true; }
  });
  useEffect(() => {
    if (!showSwipeHint) return;
    const t = setTimeout(() => {
      setShowSwipeHint(false);
      try { localStorage.setItem("doge-swipe-hint-seen", "1"); } catch { /* ignore */ }
    }, 8000);
    return () => clearTimeout(t);
  }, [showSwipeHint]);
  // Fleet agents lifted state — shared between FleetConnectivityPanel and LidarViewer3D
  const [fleetAgents, setFleetAgents] = useState<FleetAgent[]>([]);
  // Selected media lifted state — shared between MediaTimelinePanel and LidarViewer3D
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

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
    // Only show the Chip online toast — suppress all other noisy startup notifications
    const t1 = setTimeout(() => toast.success("🌱 Chip McHaymaker is online!", {
      description: `West Liberty, Iowa — Zone 5b — Battery ${Math.round(telemetry.batteryLevel)}%`,
      duration: 4000,
    }), 800);
    // First-visit pinch-to-zoom hint on mobile (shown once, replaces all other hints)
    const hasSeen = localStorage.getItem("doge-pinch-hint-seen");
    let t2: ReturnType<typeof setTimeout> | null = null;
    if (device.isMobile && !hasSeen) {
      t2 = setTimeout(() => {
        toast.info("👌 Pinch to zoom · 2 fingers to pan · tap zones", {
          description: "Swipe up the bottom sheet for mission details",
          duration: 5000,
        });
        localStorage.setItem("doge-pinch-hint-seen", "1");
      }, 2500);
    }
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
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
      // Double-tap haptic: satisfying confirmation distinct from navigation haptic
      try { navigator.vibrate?.([30, 60, 30]); } catch { /* ignore */ }
      const zoneMap: Record<string, string> = {
        "weed-feed-apply": "A", "mow-main": "A", "edge-beds": "D"
      };
      const zoneId = zoneMap[taskId];
      if (zoneId) {
        toast.success(`✅ Zone ${zoneId} marked as treated!`, {
          description: "3D zone marker updated to green",
          duration: 3000,
        });
      }
      // Show Chip speech bubble with task name + speak aloud
      const task = MISSION_TASKS.find(t => t.id === taskId);
      if (task) {
        const bubbleText = task.chipNote || `${task.name} complete!`;
        setChipSpeechText(bubbleText);
        setTimeout(() => setChipSpeechText(null), 4000);
        // Web Speech API — gruff Midwestern voice
        if (voiceSupported) {
          chipSpeakTask(task.name, task.chipNote);
        }
      }
      // Check for mission complete
      if (next.length >= MISSION_TASKS.length) {
        setTimeout(() => {
          setMissionComplete(true);
          setMissionCompleteTime(new Date());
          try { navigator.vibrate?.([50, 100, 50, 100, 200]); } catch { /* ignore */ }
        }, 500);
      }
      return next;
    });
  }, []);

  // Primary tabs (always visible in mobile strip)
  const primaryNavItems: { id: ActivePanel; label: string; icon: React.ReactNode }[] = [
    { id: "mission",  label: "Mission",  icon: <Navigation size={16} /> },
    { id: "weather",  label: "Weather",  icon: <Sun size={16} /> },
    { id: "fleet",    label: "Fleet",    icon: <span className="text-sm">🛰️</span> },
    { id: "assets",   label: "Assets",   icon: <span className="text-sm">🗂️</span> },
    { id: "media",    label: "Media",    icon: <span className="text-sm">🎞️</span> },
  ];
  // All nav items (used on desktop sidebar)
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
    { id: "fleet",           label: "Fleet",         icon: <span className="text-base">🛰️</span> },
    { id: "assets",          label: "Assets",        icon: <span className="text-base">🗂️</span> },
    { id: "media",           label: "Media",         icon: <span className="text-base">🎞️</span> },
  ];
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

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

  // Haptic feedback helper — 10ms pulse, silently ignored on iOS/desktop
  const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };

  const handleSheetDragStart = (e: React.TouchEvent) => {
    setSheetDragStart(e.touches[0].clientY);
    setSheetSwipeStartX(e.touches[0].clientX);
  };
  const handleSheetDragEnd = (e: React.TouchEvent) => {
    const dy = sheetDragStart - e.changedTouches[0].clientY;
    const dx = e.changedTouches[0].clientX - sheetSwipeStartX;
    // Vertical drag: expand/collapse sheet
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy > 60) { haptic(); setSheetStateAndPersist(prev => prev === "peek" ? "half" : "full"); }
      else if (dy < -60) { haptic(); setSheetStateAndPersist(prev => prev === "full" ? "half" : "peek"); }
    } else if (Math.abs(dx) > 50) {
      // Horizontal swipe: cycle primary tabs
      haptic();
      // Dismiss one-time swipe hint
      if (showSwipeHint) {
        setShowSwipeHint(false);
        try { localStorage.setItem("doge-swipe-hint-seen", "1"); } catch { /* ignore */ }
      }
      const tabIds = primaryNavItems.map(t => t.id);
      const currentIdx = tabIds.indexOf(activePanel as typeof tabIds[number]);
      const nextIdx = dx < 0
        ? Math.min(currentIdx + 1, tabIds.length - 1)
        : Math.max(currentIdx - 1, 0);
      if (nextIdx !== currentIdx) {
        setActivePanel(tabIds[nextIdx]);
        if (sheetState === "peek") setSheetStateAndPersist("half");
      }
    }
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
      case "fleet":
        return <FleetConnectivityPanel onFleetChange={setFleetAgents} />;
      case "assets":
        return <AssetRegistryPanel />;
      case "media":
        return <MediaTimelinePanel onMediaSelect={setSelectedMedia} />;
      default:
        return null;
    }
  };

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (device.isMobile) {
    // Bottom sheet height: peek = just the handle bar + status strip
    const PEEK_H = 64; // px
    const HALF_H = Math.round(window.innerHeight * 0.52);
    const FULL_H = Math.round(window.innerHeight * 0.90);
    const sheetPx = sheetState === "peek" ? PEEK_H : sheetState === "half" ? HALF_H : FULL_H;

    return (
      <div
        className="h-screen w-screen bg-[#0a0f1a] overflow-hidden relative"
        style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, oklch(0.15 0.03 260) 0%, oklch(0.09 0.015 260) 60%)' }}
      >
        {/* Slim top nav — sits above the 3D view */}
        <TopNav
          persona={persona}
          batteryLevel={telemetry.batteryLevel}
          signalStrength={signalStrength}
          robotStatus={robotStatus}
          debugVisible={debugVisible}
          onToggleDebug={() => setDebugVisible(v => !v)}
          onToggleStream={() => { setIsStreaming(v => !v); toast.info(isStreaming ? "📷 Paused" : "📷 Resumed"); }}
          isStreaming={isStreaming}
          onClearHints={() => {
            const keys = ["doge-swipe-hint-seen", "doge-pinch-hint-seen", "doge-notify-emails"];
            keys.forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
            toast.success("🔄 All hints reset — they'll reappear on next load");
          }}
        />

        {/* Collapsible Telemetry HUD pill — top-left, below TopNav */}
        <div className="absolute top-14 left-2 z-30">
          <button
            onClick={() => { setHudExpanded(v => !v); try { navigator.vibrate?.(8); } catch { /* ignore */ } }}
            className="glass rounded-xl px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto"
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              wsStatus === "simulated" ? "bg-yellow-400" : "bg-green-400"
            } animate-pulse`} />
            <span className="text-[9px] font-mono text-white/70">
              {hudExpanded ? "▲ HUD" : `GPU ${Math.round(telemetry.gpuUsage)}% · ${wsStatus === "simulated" ? "SIM" : "LIVE"}`}
            </span>
          </button>
          <AnimatePresence>
            {hudExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ type: "spring", damping: 22, stiffness: 320 }}
                className="mt-1 glass rounded-xl px-2.5 py-2 space-y-1 pointer-events-none"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    wsStatus === "simulated" ? "bg-yellow-400" : "bg-green-400"
                  } animate-pulse`} />
                  <span className="text-[9px] font-mono text-white/60">WS:{wsStatus.toUpperCase()} · {telemetry.packetCount.toLocaleString()} pkts</span>
                </div>
                <div><span className="text-[9px] font-mono text-cyan-400">GPU {Math.round(telemetry.gpuUsage)}% · {telemetry.inferenceMs}ms · {Math.round(telemetry.aiConfidence)}% conf</span></div>
                <div><span className="text-[9px] font-mono text-green-400">LiDAR {(telemetry.lidarPoints / 1000).toFixed(0)}K pts · {telemetry.lidarHz}Hz</span></div>
                <div><span className="text-[9px] font-mono text-white/50">{telemetry.lat.toFixed(5)}, {telemetry.lon.toFixed(5)}</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Full-screen 3D POV — fills entire screen behind the sheet */}
        <div className="absolute inset-0">
          <POVViewer
            isStreaming={isStreaming}
            robotStatus={robotStatus}
            currentTask={currentTask}
            persona={persona}
            isSprayActive={isSprayActive}
            completedTaskIds={completedTaskIds}
            fleetAgents={fleetAgents}
            selectedMedia={selectedMedia}
            weatherCondition={weather.current.condition}
            isDay={weather.current.isDay}
            precipitation={weather.current.precipitation}
            uvIndex={weather.current.uvIndex}
            windDir={weather.current.windDir}
            chipSpeechText={chipSpeechText}
            bottomInset={sheetPx}
          />
        </div>

        {/* Status badges — bottom-left corner, above sheet */}
        <div
          className="absolute left-3 z-30 flex flex-col items-start gap-1 pointer-events-none"
          style={{ bottom: sheetPx + 8 }}
        >
          {isSprayActive && (
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5">
              <Droplets size={9} className="text-green-400 animate-pulse" />
              <span className="text-[9px] font-mono text-green-400">SPRAYING</span>
            </div>
          )}
          {sprayLocked && (
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5 border border-red-400/30">
              <AlertTriangle size={9} className="text-red-400" />
              <span className="text-[9px] font-mono text-red-400">WIND {windSpeed.toFixed(0)}mph</span>
            </div>
          )}
        </div>

        {/* Robot controls toggle — bottom right, above sheet */}
        <div
          className="absolute right-3 z-30 flex flex-col items-end gap-2"
          style={{ bottom: sheetPx + 8 }}
        >
          <AnimatePresence>
            {showMobileControls && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <MobileRobotControls
                  robotStatus={robotStatus}
                  isSprayActive={isSprayActive}
                  sprayLocked={sprayLocked}
                  windSpeed={windSpeed}
                  onStatusChange={setRobotStatus}
                  onSprayToggle={handleSprayToggle}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => { setShowMobileControls(v => !v); try { navigator.vibrate?.(10); } catch { /* ignore */ } }}
            className={`glass rounded-2xl p-2.5 flex items-center gap-1.5 text-[10px] font-medium transition-all ${
              showMobileControls ? "border border-yellow-400/40 text-yellow-300" : "text-white/40"
            }`}
          >
            <Gamepad2 size={14} />
            <span>{showMobileControls ? "Hide" : "Controls"}</span>
          </button>
        </div>

        {/* Debug overlay */}
        <AnimatePresence>
          {debugVisible && <DebugOverlay telemetry={telemetry} wsStatus={wsStatus} />}
        </AnimatePresence>

        {/* Live Activity Bar — mission progress fill + status color */}
        <div
          className="absolute left-0 right-0 z-39 overflow-hidden"
          style={{ bottom: sheetPx, height: 3, background: 'oklch(1 0 0 / 0.06)' }}
        >
          {/* Background shimmer when working */}
          {robotStatus === "working" && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, oklch(0.72 0.22 142 / 0.25), transparent)',
                backgroundSize: '50% 100%',
              }}
              animate={{ backgroundPosition: ['-50% 0%', '200% 0%'] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
            />
          )}
          {/* Mission progress fill */}
          <motion.div
            className="h-full relative overflow-visible"
            animate={{ width: `${Math.round(robotProgress * 100)}%` }}
            transition={{ type: 'spring', damping: 28, stiffness: 120 }}
            style={{
              background: robotStatus === "error"
                ? 'oklch(0.65 0.25 25)'
                : robotStatus === "paused"
                  ? 'oklch(0.82 0.18 70)'
                  : 'oklch(0.72 0.22 142)',
            }}
          >
            {/* Progress % label at leading edge */}
            {robotProgress > 0 && (
              <motion.span
                className="absolute right-0 top-0 translate-x-full -translate-y-full pb-0.5 pl-1 text-[8px] font-mono leading-none pointer-events-none"
                style={{
                  color: robotStatus === "error"
                    ? 'oklch(0.65 0.25 25)'
                    : robotStatus === "paused"
                      ? 'oklch(0.82 0.18 70)'
                      : 'oklch(0.72 0.22 142)',
                  textShadow: '0 0 6px currentColor',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {Math.round(robotProgress * 100)}%
              </motion.span>
            )}
          </motion.div>
          {/* Error pulse overlay */}
          {robotStatus === "error" && (
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              style={{ background: 'oklch(0.65 0.25 25)' }}
            />
          )}
        </div>

        {/* ── BOTTOM SHEET ── */}
        <motion.div
          className="absolute left-0 right-0 bottom-0 z-40 flex flex-col rounded-t-3xl overflow-hidden"
          animate={{ height: sheetPx }}
          transition={{ type: "spring", damping: 32, stiffness: 320 }}
          style={{
            background: 'oklch(0.10 0.018 260 / 0.97)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            borderTop: '1px solid oklch(1 0 0 / 0.12)',
          }}
        >
          {/* Drag handle */}
          <div
            className="flex-shrink-0 pt-2.5 pb-1 flex flex-col items-center"
            onTouchStart={handleSheetDragStart}
            onTouchEnd={handleSheetDragEnd}
          >
            {/* Drag pill + one-time swipe hint */}
            <div className="relative flex items-center justify-center w-full">
              <div className="w-10 h-1 rounded-full bg-white/20" />
              <AnimatePresence>
                {showSwipeHint && (
                  <motion.div
                    className="absolute flex items-center gap-1 pointer-events-none"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                  >
                    {/* Left arrow */}
                    <motion.span
                      className="text-[9px] text-white/40"
                      animate={{ x: [-3, 0, -3] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    >←</motion.span>
                    <span className="text-[8px] text-white/30 font-mono tracking-wider">SWIPE</span>
                    {/* Right arrow */}
                    <motion.span
                      className="text-[9px] text-white/40"
                      animate={{ x: [3, 0, 3] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    >→</motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Peek row: status + 5 primary tabs + ⋯ */}
          <div className="flex-shrink-0 px-3 pb-2 flex items-center gap-2">
            {/* Status pill */}
            <button
              onClick={cycleSheet}
              className="flex items-center gap-1.5 glass rounded-xl px-2.5 py-2 flex-shrink-0"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                robotStatus === "working" ? "bg-green-400 animate-pulse" : "bg-yellow-400"
              }`} />
              {sheetState === "peek" && (
                <span className="text-[10px] text-white/60 max-w-[80px] truncate">{currentTask.split("—")[0].trim()}</span>
              )}
              {sheetState !== "peek" && <ChevronDown size={12} className="text-white/40" />}
            </button>

            {/* 5 primary tabs */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {primaryNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActivePanel(item.id); if (sheetState === "peek") setSheetStateAndPersist("half"); }}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[9px] font-medium transition-all flex-shrink-0 min-w-[44px] ${
                    activePanel === item.id && sheetState !== "peek"
                      ? "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30"
                      : "text-white/50"
                  }`}
                >
                  {item.icon}
                  <span className="leading-none">{item.label}</span>
                </button>
              ))}
            </div>

            {/* ⋯ More button */}
            <button
              onClick={() => setShowMoreDrawer(v => !v)}
              className={`glass rounded-xl p-2 flex-shrink-0 ${
                showMoreDrawer ? "border border-white/20 text-white/70" : "text-white/40"
              }`}
            >
              <span className="text-[11px] font-bold">⋯</span>
            </button>
          </div>

          {/* Sheet content — only when open */}
          {sheetState !== "peek" && (
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {renderPanel(activePanel)}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── MORE DRAWER (full-screen overlay) ── */}
        <AnimatePresence>
          {showMoreDrawer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-end"
              style={{ background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowMoreDrawer(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="w-full rounded-t-3xl p-5"
                style={{
                  background: 'oklch(0.12 0.02 260 / 0.98)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                  border: '1px solid oklch(1 0 0 / 0.12)',
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white/80">All Panels</h3>
                  <button onClick={() => setShowMoreDrawer(false)} className="glass rounded-full p-1.5">
                    <ChevronDown size={14} className="text-white/50" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePanel(item.id);
                        setSheetStateAndPersist("half");
                        setShowMoreDrawer(false);
                      }}
                      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl text-[10px] font-medium transition-all ${
                        activePanel === item.id
                          ? "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30"
                          : "glass text-white/60"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="leading-tight text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
        onClearHints={() => {
          const keys = ["doge-swipe-hint-seen", "doge-pinch-hint-seen", "doge-notify-emails"];
          keys.forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
          toast.success("🔄 All hints reset — they'll reappear on next load");
        }}
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
            fleetAgents={fleetAgents}
            selectedMedia={selectedMedia}
            weatherCondition={weather.current.condition}
            isDay={weather.current.isDay}
            precipitation={weather.current.precipitation}
            uvIndex={weather.current.uvIndex}
            windDir={weather.current.windDir}
            chipSpeechText={chipSpeechText}
          />

          {/* Robot Controls — desktop hover-reveal */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 group flex flex-col items-center gap-1">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
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
            {/* Always-visible minimal status pill */}
            <div className={`glass rounded-full px-3 py-1 flex items-center gap-2 text-[9px] font-mono cursor-default select-none ${
              robotStatus === 'working' ? 'border border-green-400/30' :
              robotStatus === 'paused' ? 'border border-yellow-400/30' :
              robotStatus === 'error' ? 'border border-red-400/30' : 'border border-white/10'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                robotStatus === 'working' ? 'bg-green-400 animate-pulse' :
                robotStatus === 'paused' ? 'bg-yellow-400' :
                robotStatus === 'error' ? 'bg-red-400 animate-pulse' : 'bg-white/30'
              }`} />
              <span className="text-white/50">Hover for controls</span>
              <Navigation size={9} className="text-white/30" />
            </div>
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
          <div className="absolute top-2 left-40 z-20 space-y-1 pointer-events-none">
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

      {/* ── Mission Complete Modal ─────────────────────────────────────── */}
      <MissionCompleteModal
        open={missionComplete}
        onClose={() => setMissionComplete(false)}
        completedAt={missionCompleteTime}
        completedTaskIds={completedTaskIds}
        weatherCondition={weather.current.condition}
        temperature={weather.current.temp}
      />
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
            onTouchStart={() => { try { navigator.vibrate?.(8); } catch { /* ignore */ } }}>
            <span className="text-sm">▲</span>
          </button>
          <div />
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => { try { navigator.vibrate?.(8); } catch { /* ignore */ } }}>
            <span className="text-sm">◀</span>
          </button>
          <div className="w-9 h-9 glass rounded-xl flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${robotStatus === "working" ? "bg-green-400 animate-pulse" : robotStatus === "paused" ? "bg-yellow-400" : "bg-red-400"}`} />
          </div>
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => { try { navigator.vibrate?.(8); } catch { /* ignore */ } }}>
            <span className="text-sm">▶</span>
          </button>
          <div />
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 active:bg-white/20"
            onTouchStart={() => { try { navigator.vibrate?.(8); } catch { /* ignore */ } }}>
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
          onTouchStart={() => { onStatusChange("error"); toast.error("🛑 E-STOP ACTIVATED"); try { navigator.vibrate?.([50, 30, 50, 30, 200]); } catch { /* ignore */ } }}
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

// ── Mission Complete Modal ────────────────────────────────────────────────
function MissionCompleteModal({
  open, onClose, completedAt, completedTaskIds, weatherCondition, temperature,
}: {
  open: boolean;
  onClose: () => void;
  completedAt: Date | null;
  completedTaskIds: string[];
  weatherCondition: string;
  temperature: number;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open || firedRef.current) return;
    firedRef.current = true;
    // Multi-burst confetti
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({ origin: { y: 0.6 }, ...opts, particleCount: Math.floor(200 * particleRatio) });
    };
    fire(0.25, { spread: 26, startVelocity: 55, colors: ["#4ade80", "#22d3ee", "#a78bfa"] });
    fire(0.2, { spread: 60, colors: ["#facc15", "#fb923c"] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
    return () => { firedRef.current = false; };
  }, [open]);

  const elapsed = completedAt
    ? (() => {
        const mins = Math.floor((completedAt.getTime() - Date.now() + 3600000) / 60000);
        return `${Math.abs(mins)} min`;
      })()
    : "—";

  const products = MISSION_TASKS
    .filter(t => completedTaskIds.includes(t.id))
    .flatMap(t => t.tools || [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="mission-complete-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{ background: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(12px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: "oklch(0.12 0.02 240)", border: "1px solid oklch(0.4 0.15 145 / 0.5)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header glow */}
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
            style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee, #a78bfa)" }} />

          <div className="p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-1">Mission Complete!</h2>
            <p className="text-sm text-white/50 mb-5">905 N Columbus St · West Liberty, IA</p>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-2xl p-3" style={{ background: "oklch(0.18 0.02 240)" }}>
                <div className="text-xl font-bold text-green-400">{completedTaskIds.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Tasks</div>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "oklch(0.18 0.02 240)" }}>
                <div className="text-xl font-bold text-cyan-400">{temperature}°F</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Temp</div>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "oklch(0.18 0.02 240)" }}>
                <div className="text-xl font-bold text-purple-400">{weatherCondition.split(" ")[0]}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Weather</div>
              </div>
            </div>

            {/* Products used */}
            {products.length > 0 && (
              <div className="rounded-2xl p-3 mb-4 text-left" style={{ background: "oklch(0.18 0.02 240)" }}>
                <p className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Products Applied</p>
                {products.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <Leaf size={10} className="text-green-400 flex-shrink-0" />
                    <span className="text-xs text-white/80">{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Chip quote */}
            <div className="rounded-2xl p-3 mb-5" style={{ background: "oklch(0.15 0.04 145 / 0.5)", border: "1px solid oklch(0.4 0.15 145 / 0.3)" }}>
              <p className="text-xs text-green-300 italic">💬 "Yard's looking crisp. Chip out."</p>
              <p className="text-[10px] text-white/30 mt-1">— Chip McHaymaker</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 145), oklch(0.5 0.2 200))" }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
