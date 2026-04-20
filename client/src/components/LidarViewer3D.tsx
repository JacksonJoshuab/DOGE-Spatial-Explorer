/*
 * DOGE-LANDSCAPER — LiDAR 3D Viewer v4
 * Design: Spatial Glass Command Deck
 * Features:
 *   - Full touch controls: 1-finger orbit, 2-finger pinch-zoom, 2-finger pan, tap-to-select
 *   - Spray coverage heatmap overlay (fills in as Chip traverses zones)
 *   - Zone-mission status sync (mission complete → zone sphere turns green)
 *   - Time-of-day sun simulation (DirectionalLight arcs based on real clock)
 *   - 5 render modes: Textured | Wireframe | LiDAR | X-Ray | Point Cloud
 *   - Camera modes: Orbit | Robot POV | Fly (WASD / on-screen joystick on mobile)
 *   - Device-adaptive: compact controls on mobile, full panel on desktop
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Maximize2, Minimize2, Navigation, Eye, Plane, RotateCcw,
  Layers, Zap, Move, Info, MapPin, Route, Droplets, Sun,
  ChevronUp, ChevronDown, Ruler, X, PenLine, Trash2, Check, Share2, Settings
} from "lucide-react";
import { useDevice } from "@/hooks/useDevice";
import DualJoystick, { type JoystickState } from "@/components/DualJoystick";
import { Slider } from "@/components/ui/slider";
import MtSipleExperience from "@/components/MtSipleExperience";

// v16: Fresh GLB built directly from original USDZ via USD Python API
// 30MB, JPEG textures, FLOAT32 geometry, standards-compliant glTF 2.0 — Safari iOS compatible
const GLB_URL = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/cao3qXUUr9zrMdetSxxjdj/backyard-final_93fbdb48.glb";

type CameraMode = "orbit" | "pov" | "fly";
type RenderMode = "textured" | "wireframe" | "lidar" | "xray" | "pointcloud";
type ZoneStatus = "treated" | "pending" | "skip";

const ZONE_DEFS = [
  {
    id: "A",
    label: "Zone A — Main Lawn",
    color: 0x00ff88,
    colorHex: "#00ff88",
    offset: { x: -0.3, y: 0.15, z: -0.2 },
    status: "treated" as ZoneStatus,
    lastApplied: "Mar 28, 2026",
    product: "Scotts Weed & Feed",
    coverage: "3,200 sq ft",
    chipNote: "Looking thick and green! Dandelion pressure dropping.",
    nextTask: "Mow at 3.5\" height",
    missionTaskId: "task-2",
  },
  {
    id: "B",
    label: "Zone B — Oak Tree Ring",
    color: 0xffaa00,
    colorHex: "#ffaa00",
    offset: { x: 0.1, y: 0.15, z: 0.1 },
    status: "pending" as ZoneStatus,
    lastApplied: "Feb 14, 2026",
    product: "None — tree root zone",
    coverage: "800 sq ft",
    chipNote: "Skip the spreader near the oak — them roots don't like chemicals!",
    nextTask: "Mulch ring refresh",
    missionTaskId: "task-3",
  },
  {
    id: "C",
    label: "Zone C — Scilla Garden",
    color: 0x8866ff,
    colorHex: "#8866ff",
    offset: { x: 0.35, y: 0.15, z: -0.1 },
    status: "skip" as ZoneStatus,
    lastApplied: "N/A — flower zone",
    product: "Bulb Booster fertilizer",
    coverage: "420 sq ft",
    chipNote: "Them blue flowers are GORGEOUS. We protect this zone at all costs!",
    nextTask: "Deadhead after bloom",
    missionTaskId: null,
  },
  {
    id: "D",
    label: "Zone D — Fence Line",
    color: 0x4488ff,
    colorHex: "#4488ff",
    offset: { x: -0.1, y: 0.15, z: 0.35 },
    status: "pending" as ZoneStatus,
    lastApplied: "Mar 15, 2026",
    product: "Roundup Edge Control",
    coverage: "1,100 sq ft",
    chipNote: "Weeds love fence lines. Time to show 'em who's boss.",
    nextTask: "Edge spray pass",
    missionTaskId: "task-4",
  },
];

interface ZoneMarker {
  mesh: THREE.Mesh;
  ring: THREE.Mesh;
  zoneId: string;
  worldPos: THREE.Vector3;
}

interface SelectedZone {
  id: string;
  screenX: number;
  screenY: number;
}

export interface LidarViewer3DProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isSprayActive?: boolean;
  completedTaskIds?: string[];
  fleetAgents?: import("@/components/FleetConnectivityPanel").FleetAgent[];
  selectedMedia?: import("@/components/MediaTimelinePanel").MediaItem | null;
  weatherCondition?: string;  // e.g. "Clear", "Rain", "Snow", "Foggy", "Thunderstorm"
  isDay?: boolean;
  precipitation?: number;     // mm — intensity for rain/snow density
  uvIndex?: number;           // 0-11 — drives sun brightness
  windDir?: number;           // degrees — drives sun azimuth approximation
  chipSpeechText?: string | null; // text to show in Chip's 3D speech bubble (auto-clears after 3s)
  bottomInset?: number; // px offset from bottom to clear the bottom sheet on mobile
}

export default function LidarViewer3D({
  isFullscreen,
  onToggleFullscreen,
  isSprayActive = false,
  completedTaskIds = [],
  fleetAgents = [],
  selectedMedia = null,
  weatherCondition = "Clear",
  isDay = true,
  precipitation = 0,
  uvIndex = 5,
  windDir = 180,
  chipSpeechText = null,
  bottomInset = 0,
}: LidarViewer3DProps) {
  const device = useDevice();
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const modelRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const zoneMarkersRef = useRef<ZoneMarker[]>([]);
  const robotDotRef = useRef<THREE.Mesh | null>(null);
  const pathLineRef = useRef<THREE.Line | null>(null);
  const pathPointsRef = useRef<THREE.Vector3[]>([]);
  const robotTRef = useRef(0.4);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const modelCenterRef = useRef(new THREE.Vector3());
  const modelSizeRef = useRef(new THREE.Vector3());
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sprayMeshRef = useRef<THREE.Mesh | null>(null);
  const sprayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sprayTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const sprayProgressRef = useRef(0);
  // GPS breadcrumb trail
  const breadcrumbsRef = useRef<THREE.Vector3[]>([]);
  const breadcrumbLineRef = useRef<THREE.Line | null>(null);
  const lastBreadcrumbTimeRef = useRef(0);
  const [showBreadcrumb, setShowBreadcrumb] = useState(true);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Measure tool refs ─────────────────────────────────────────────────────
  const measurePointsRef = useRef<THREE.Vector3[]>([]);
  const measureLineRef = useRef<THREE.Line | null>(null);
  const measureDotsRef = useRef<THREE.Mesh[]>([]);

  // ── Fleet agent 3D markers ────────────────────────────────────────────────
  // Group holds all agent cones + labels; rebuilt when fleetAgents prop changes
  const fleetGroupRef = useRef<THREE.Group | null>(null);
  const fleetAgentsRef = useRef(fleetAgents);
  useEffect(() => { fleetAgentsRef.current = fleetAgents; }, [fleetAgents]);

  // ── Media camera frustum ──────────────────────────────────────────────────
  // Single frustum group replaced on selectedMedia change
  const frustumGroupRef = useRef<THREE.Group | null>(null);
  const selectedMediaRef = useRef(selectedMedia);
  useEffect(() => { selectedMediaRef.current = selectedMedia; }, [selectedMedia]);

  // ── Weather overlay ───────────────────────────────────────────────────────
  const weatherGroupRef = useRef<THREE.Group | null>(null);
  const weatherConditionRef = useRef(weatherCondition);
  const isDayRef = useRef(isDay);
  const precipitationRef = useRef(precipitation);
  const uvIndexRef = useRef(uvIndex);
  const windDirRef = useRef(windDir);
  // Keep refs current
  useEffect(() => { weatherConditionRef.current = weatherCondition; }, [weatherCondition]);
  useEffect(() => { isDayRef.current = isDay; }, [isDay]);
  useEffect(() => { precipitationRef.current = precipitation; }, [precipitation]);
  useEffect(() => { uvIndexRef.current = uvIndex; }, [uvIndex]);
  useEffect(() => { windDirRef.current = windDir; }, [windDir]);

  const [loadProgress, setLoadProgress] = useState(0);
  const [loadedKB, setLoadedKB] = useState(0);
  const [loadSpeedKBs, setLoadSpeedKBs] = useState(0);
  const loadSpeedRef = useRef<{ lastBytes: number; lastTime: number }>({ lastBytes: 0, lastTime: Date.now() });
  const [glbCached, setGlbCached] = useState(false); // true when SW has the GLB cached offline
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Check if GLB is already cached by the service worker
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => setGlbCached(!!e.data?.cached);
      navigator.serviceWorker.controller.postMessage({ type: "CHECK_GLB_CACHE" }, [channel.port2]);
    }
  }, []);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [showFullScanOffer, setShowFullScanOffer] = useState(false);
  const [glbErrorMsg, setGlbErrorMsg] = useState("");
  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
  const [renderMode, setRenderMode] = useState<RenderMode>("textured");
  const [showInfo, setShowInfo] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showSpray, setShowSpray] = useState(true);
  const [showControls, setShowControls] = useState(!device.isMobile);
  // Map underlay
  type MapUnderlayMode = "none" | "satellite" | "street" | "hybrid";
  const [mapUnderlayMode, setMapUnderlayMode] = useState<MapUnderlayMode>("satellite");
  const mapUnderlayRef = useRef<THREE.Mesh | null>(null);
  const mapUnderlayModeRef = useRef<MapUnderlayMode>("satellite");
  const parcelBoundaryRef = useRef<THREE.LineLoop | null>(null);
  const parcelCornersRef = useRef<THREE.Group | null>(null);
  // GIS parcel boundary overlay (MAGIC GIS polygon, always on top)
  const [showGisBoundary, setShowGisBoundary] = useState(true);
  const gisBoundaryGroupRef = useRef<THREE.Group | null>(null);
  // ── Model rotation fine-tune dial (0–360° added on top of auto-rotate) ──────────────────
  const [modelRotationDeg, setModelRotationDeg] = useState(0);
  const modelRotationDegRef = useRef(0);
  useEffect(() => {
    modelRotationDegRef.current = modelRotationDeg;
    if (modelRef.current) {
      const baseRot = (modelRef.current.userData.baseRotationY as number) ?? 0;
      modelRef.current.rotation.y = baseRot + (modelRotationDeg * Math.PI) / 180;
    }
  }, [modelRotationDeg]);
  // ── True North calibration state ────────────────────────────────────────────────
  type CalibStep = "idle" | "picking_p1" | "picking_p2" | "done";
  const [calibStep, setCalibStep] = useState<CalibStep>("idle");
  const [calibP1, setCalibP1] = useState<THREE.Vector3 | null>(null);
  const [calibOffset, setCalibOffset] = useState<number | null>(null);
  // ── Satellite tile ground plane ────────────────────────────────────────────────
  const satelliteGroundRef = useRef<THREE.Mesh | null>(null);
  const [showSatelliteGround, setShowSatelliteGround] = useState(false);
  // ── Mt. Siple Gaussian Splat swap ─────────────────────────────────────────────
  const [isMtSiple, setIsMtSiple] = useState(false);
  const [splatLoading, setSplatLoading] = useState(false);
  const [showMtSipleExperience, setShowMtSipleExperience] = useState(false);
  const splatMeshRef = useRef<import('@sparkjsdev/spark').SplatMesh | null>(null);
  const sparkRendererRef = useRef<import('@sparkjsdev/spark').SparkRenderer | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const chipSpeechSpriteRef = useRef<THREE.Sprite | null>(null);
  const [mapUnderlayOpacity, setMapUnderlayOpacity] = useState(80); // 0–100
  const mapUnderlayOpacityRef = useRef(0.8);
  // Weather simulation override (null = use live weather)
  type WeatherSim = null | "clear" | "rain" | "snow" | "fog" | "night";
  const [weatherSim, setWeatherSim] = useState<WeatherSim>(null);
  const weatherSimRef = useRef<WeatherSim>(null);
  useEffect(() => { weatherSimRef.current = weatherSim; }, [weatherSim]);
  // Wind arrow sprites
  const windArrowGroupRef = useRef<THREE.Group | null>(null);
  const windArrowTimeRef = useRef(0);
  // Spray window zone pulse
  const sprayPulseRef = useRef(0);
  const [fps, setFps] = useState(0);
  const [polyCount, setPolyCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState<SelectedZone | null>(null);
  const [sunHour, setSunHour] = useState(new Date().getHours() + new Date().getMinutes() / 60);
  const [isTimeLapse, setIsTimeLapse] = useState(false);
  const timeLapseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Time-lapse: advance sunHour from 6 to 20 over ~8 seconds (14 hours / 8s = 1.75 hr/s at 60fps)
  useEffect(() => {
    if (isTimeLapse) {
      setSunHour(6);
      timeLapseRef.current = setInterval(() => {
        setSunHour(h => {
          if (h >= 20) {
            setIsTimeLapse(false);
            if (timeLapseRef.current) clearInterval(timeLapseRef.current);
            return 20;
          }
          return h + 14 / (8 * 20); // 14 hours / 8 seconds / 20 ticks-per-second
        });
      }, 50);
    } else {
      if (timeLapseRef.current) clearInterval(timeLapseRef.current);
    }
    return () => { if (timeLapseRef.current) clearInterval(timeLapseRef.current); };
  }, [isTimeLapse]);
  const [zoneStatuses, setZoneStatuses] = useState<Record<string, ZoneStatus>>(
    Object.fromEntries(ZONE_DEFS.map(z => [z.id, z.status]))
  );
  const [measureMode, setMeasureMode] = useState(false);
  const [measureResult, setMeasureResult] = useState<{ dist3d: number; distFt: number; distSqFt: number } | null>(null);
  const [measureScreenPoints, setMeasureScreenPoints] = useState<{ x: number; y: number }[]>([]);

  // ── Path replay scrubber ─────────────────────────────────────────────────
  const [scrubberT, setScrubberT] = useState(0.4); // 0–1, mirrors robotTRef
  const isScrubbing = useRef(false);               // true while user drags slider
  const [playbackSpeed, setPlaybackSpeed] = useState(1);  // 1× / 2× / 5×
  const playbackSpeedRef = useRef(1);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);

  // Zone → path-T entry points (fraction of 0–1 where Chip enters each zone)
  const ZONE_ENTRY_T: Record<string, number> = {
    A: 0.45,  // Mow Main Lawn starts at 45%
    B: 0.20,  // Oak Tree Ring — early in weed-feed pass
    C: 0.30,  // Scilla Garden — mid weed-feed pass
    D: 0.92,  // Fence Line — back strip waypoints start at ~92% of path array
  };

  // Sync scrubber display with live robot position every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScrubbing.current) setScrubberT(robotTRef.current);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // ── Draw Zone tool ────────────────────────────────────────────────────────
  interface CustomZone {
    id: string;
    name: string;
    vertices: THREE.Vector3[];
    screenVerts: { x: number; y: number }[];
    color: string;
    treatment: string;
    mesh: THREE.Mesh | null;
    sphere: THREE.Mesh | null;
  }
  const [drawZoneMode, setDrawZoneMode] = useState(false);
  const [drawVerts, setDrawVerts] = useState<{ world: THREE.Vector3; screen: { x: number; y: number } }[]>([]);
  const [customZones, setCustomZones] = useState<CustomZone[]>([]);
  const [pendingZoneName, setPendingZoneName] = useState("");
  const [pendingZoneTreatment, setPendingZoneTreatment] = useState("Scotts Weed & Feed");
  const [showZoneNameDialog, setShowZoneNameDialog] = useState(false);
  const ZONE_COLORS = ["#ff6644", "#44ffaa", "#ff44cc", "#44ccff", "#ffcc44", "#cc44ff"];
  // Compass: azimuth angle in degrees (0 = camera looking north, 90 = east, etc.)
  const [compassHeading, setCompassHeading] = useState(0);

  // ── Reactive refs — keep state values accessible in animation loop without
  //    causing setupScene to re-run when they change ─────────────────────────
  const isSprayActiveRef = useRef(isSprayActive);
  const showSprayRef = useRef(showSpray);
  const cameraModeRef = useRef(cameraMode);
  const showBreadcrumbRef = useRef(showBreadcrumb);
  const useFallbackModeRef = useRef(useFallbackMode);
  useEffect(() => { isSprayActiveRef.current = isSprayActive; }, [isSprayActive]);
  useEffect(() => { showSprayRef.current = showSpray; }, [showSpray]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { showBreadcrumbRef.current = showBreadcrumb; }, [showBreadcrumb]);
  useEffect(() => { useFallbackModeRef.current = useFallbackMode; }, [useFallbackMode]);
  // Sync opacity slider to ref and live-update the underlay mesh material
  useEffect(() => {
    const op = mapUnderlayOpacity / 100;
    mapUnderlayOpacityRef.current = op;
    if (mapUnderlayRef.current) {
      const mat = mapUnderlayRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = op;
      mat.transparent = op < 1;
      mat.needsUpdate = true;
    }
  }, [mapUnderlayOpacity]);

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });
  const flyYawRef = useRef(0);
  const flyPitchRef = useRef(0);
  // Joystick state refs (updated at 60fps from DualJoystick callbacks)
  const leftStickRef = useRef<JoystickState>({ x: 0, y: 0 });
  const rightStickRef = useRef<JoystickState>({ x: 0, y: 0 });

  // Touch state for pinch/pan
  const touchRef = useRef({
    touches: [] as React.Touch[],
    lastDist: 0,
    lastMidX: 0,
    lastMidY: 0,
  });

  // ── Sun simulation: update every minute ──────────────────────────────────
  useEffect(() => {
    const tick = () => setSunHour(new Date().getHours() + new Date().getMinutes() / 60);
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!sunLightRef.current) return;
    // Sun arcs from east (morning) to west (evening)
    // Hour 6 = sunrise (east), 12 = noon (south/top), 18 = sunset (west)
    const h = sunHour;
    const angle = ((h - 6) / 12) * Math.PI; // 0 at 6am, π at 6pm
    const elevation = Math.sin(angle) * 40; // max height at noon
    const x = Math.cos(angle) * 40;
    sunLightRef.current.position.set(x, Math.max(elevation, 2), 15);
    // Warm at sunrise/sunset, neutral at noon
    const warmth = 1 - Math.abs(h - 12) / 6;
    const r = 1.0;
    const g = 0.85 + warmth * 0.15;
    const b = 0.6 + warmth * 0.4;
    sunLightRef.current.color.setRGB(r, g, b);
    sunLightRef.current.intensity = Math.max(0.1, Math.sin(angle) * 1.2);

    // ── Cinematic sky color transitions ───────────────────────────────────
    // Key times: night(<5), dawn(5-7), day(7-17), dusk(17-20), night(>20)
    type RGB = [number, number, number];
    const lerp = (a: RGB, b: RGB, t: number): RGB => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
    const NIGHT: RGB = [0.04, 0.06, 0.10];  // deep navy
    const DAWN: RGB  = [0.55, 0.28, 0.12];  // amber-orange
    const DAY: RGB   = [0.45, 0.65, 0.88];  // sky blue
    const DUSK: RGB  = [0.52, 0.22, 0.18];  // deep red-orange
    let skyRGB: RGB;
    let ambientIntensity = 0.8;
    if (h < 5) {
      skyRGB = NIGHT; ambientIntensity = 0.15;
    } else if (h < 7) {
      const t = (h - 5) / 2;
      skyRGB = lerp(NIGHT, DAWN, t); ambientIntensity = 0.15 + t * 0.5;
    } else if (h < 8) {
      const t = h - 7;
      skyRGB = lerp(DAWN, DAY, t); ambientIntensity = 0.65 + t * 0.15;
    } else if (h < 17) {
      skyRGB = DAY; ambientIntensity = 0.8;
    } else if (h < 19) {
      const t = (h - 17) / 2;
      skyRGB = lerp(DAY, DUSK, t); ambientIntensity = 0.8 - t * 0.4;
    } else if (h < 21) {
      const t = (h - 19) / 2;
      skyRGB = lerp(DUSK, NIGHT, t); ambientIntensity = 0.4 - t * 0.25;
    } else {
      skyRGB = NIGHT; ambientIntensity = 0.15;
    }
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(...skyRGB);
      (sceneRef.current.fog as THREE.FogExp2 | null)?.color.setRGB(...skyRGB);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientIntensity;
    }
  }, [sunHour]);

  // ── Zone-mission sync: update sphere colors when tasks complete ───────────
  useEffect(() => {
    if (!completedTaskIds.length) return;
    const updates: Record<string, ZoneStatus> = {};
    ZONE_DEFS.forEach(zone => {
      if (zone.missionTaskId && completedTaskIds.includes(zone.missionTaskId)) {
        updates[zone.id] = "treated";
      }
    });
    if (Object.keys(updates).length > 0) {
      setZoneStatuses(prev => ({ ...prev, ...updates }));
    }
  }, [completedTaskIds]);

  // Update zone sphere colors when statuses change
  useEffect(() => {
    zoneMarkersRef.current.forEach(zm => {
      const status = zoneStatuses[zm.zoneId];
      const def = ZONE_DEFS.find(z => z.id === zm.zoneId);
      if (!def) return;
      const mat = zm.mesh.material as THREE.MeshStandardMaterial;
      const ringMat = zm.ring.material as THREE.MeshBasicMaterial;
      if (status === "treated") {
        mat.color.set(0x00ff88);
        mat.emissive.set(0x00ff88);
        ringMat.color.set(0x00ff88);
      } else if (status === "pending") {
        mat.color.set(def.color);
        mat.emissive.set(def.color);
        ringMat.color.set(def.color);
      }
      mat.needsUpdate = true;
    });
  }, [zoneStatuses]);

  // ── Spray heatmap: build/update canvas texture ────────────────────────────
  const buildSprayPlane = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    const W = 256, H = 256;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    sprayCanvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    sprayTextureRef.current = tex;

    const geo = new THREE.PlaneGeometry(size.x * 0.9, size.z * 0.9);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(center.x, center.y + size.y * 0.1 + 0.3, center.z);
    scene.add(plane);
    sprayMeshRef.current = plane;
  }, []);

  const updateSprayHeatmap = useCallback(() => {
    if (!sprayCanvasRef.current || !sprayTextureRef.current || !robotDotRef.current || !sprayMeshRef.current) return;
    const canvas = sprayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const plane = sprayMeshRef.current;
    const center = modelCenterRef.current;
    const size = modelSizeRef.current;

    // Map robot world pos to canvas UV
    const rx = robotDotRef.current.position.x;
    const rz = robotDotRef.current.position.z;
    const u = (rx - (center.x - size.x * 0.45)) / (size.x * 0.9);
    const v = (rz - (center.z - size.z * 0.45)) / (size.z * 0.9);
    const cx = u * W;
    const cy = v * H;

    // Radial gradient spray blob
    const radius = 18;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, "rgba(0,255,120,0.55)");
    grad.addColorStop(0.5, "rgba(80,220,80,0.3)");
    grad.addColorStop(1, "rgba(0,200,80,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    sprayTextureRef.current.needsUpdate = true;
    void plane; // keep ref
  }, []);

  // ── Zone markers ──────────────────────────────────────────────────────────
  const buildZoneMarkers = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    const markers: ZoneMarker[] = [];
    ZONE_DEFS.forEach((zone) => {
      const pos = new THREE.Vector3(
        center.x + zone.offset.x * size.x,
        center.y + zone.offset.y * size.y + 0.5,
        center.z + zone.offset.z * size.z
      );
      // Make spheres bigger on mobile for easier tapping
      const sphereR = device.isMobile ? 0.55 : 0.35;
      const geo = new THREE.SphereGeometry(sphereR, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: zone.color, emissive: zone.color, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.9,
      });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(pos);
      sphere.userData.zoneId = zone.id;
      scene.add(sphere);

      const ringGeo = new THREE.RingGeometry(0.5, 0.7, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: zone.color, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, pos.y - 0.3, pos.z);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pos.x, pos.y - sphereR, pos.z),
        new THREE.Vector3(pos.x, center.y - size.y * 0.1, pos.z),
      ]);
      scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: zone.color, transparent: true, opacity: 0.5 })));

      markers.push({ mesh: sphere, ring, zoneId: zone.id, worldPos: pos.clone() });
    });
    zoneMarkersRef.current = markers;
  }, [device.isMobile]);

  // ── Robot path ────────────────────────────────────────────────────────────
  // ── Boustrophedon path computed from USDZ geometry (905 Backyard, 10/8/2025)
  // Yard: 20.7m wide × 78.9m deep (68ft × 259ft), obstacle: house X=-8.4..9.2, Z=2.2..16.5
  // 99 waypoints, 996m path computed from USDZ geometry v3
  // Zone A: main south lawn (Z<0) — 80 waypoints, full-width boustrophedon
  // Zone D: back strip (Z>17) — 16 waypoints, behind house clearance
  // Transit: left corridor around house obstacle
  const buildRobotPath = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    const y = center.y + 0.12; // slightly above ground
    // Waypoints from compute_path_v3.py — obstacle-aware boustrophedon
    // House obstacle: X=-8.22 to 9.12, Z=2.67 to 15.81 (+1.2m clearance)
    // Deck obstacle: X=-8.70 to 10.27, Z=1.50 to 2.67 (+0.8m clearance)
    const rawWaypoints = [
      [-10.36,-21.17],[10.36,-21.17],[10.36,-20.62],[-10.36,-20.62],[-10.36,-20.07],[10.36,-20.07],
      [10.36,-19.52],[-10.36,-19.52],[-10.36,-18.96],[10.36,-18.96],[10.36,-18.41],[-10.36,-18.41],
      [-10.36,-17.86],[10.36,-17.86],[10.36,-17.31],[-10.36,-17.31],[-10.36,-16.76],[10.36,-16.76],
      [10.36,-16.21],[-10.36,-16.21],[-10.36,-15.66],[10.36,-15.66],[10.36,-15.11],[-10.36,-15.11],
      [-10.36,-14.56],[10.36,-14.56],[10.36,-14.01],[-10.36,-14.01],[-10.36,-13.46],[10.36,-13.46],
      [10.36,-12.91],[-10.36,-12.91],[-10.36,-12.36],[10.36,-12.36],[10.36,-11.81],[-10.36,-11.81],
      [-10.36,-11.26],[10.36,-11.26],[10.36,-10.71],[-10.36,-10.71],[-10.36,-10.16],[10.36,-10.16],
      [10.36,-9.61],[-10.36,-9.61],[-10.36,-9.06],[10.36,-9.06],[10.36,-8.51],[-10.36,-8.51],
      [-10.36,-7.96],[10.36,-7.96],[10.36,-7.41],[-10.36,-7.41],[-10.36,-6.86],[10.36,-6.86],
      [10.36,-6.31],[-10.36,-6.31],[-10.36,-5.76],[10.36,-5.76],[10.36,-5.21],[-10.36,-5.21],
      [-10.36,-4.66],[10.36,-4.66],[10.36,-4.11],[-10.36,-4.11],[-10.36,-3.56],[10.36,-3.56],
      [10.36,-3.01],[-10.36,-3.01],[-10.36,-2.46],[10.36,-2.46],[10.36,-1.91],[-10.36,-1.91],
      [-10.36,-1.36],[10.36,-1.36],[10.36,-0.81],[-10.36,-0.81],[-10.36,-0.26],[10.36,-0.26],
      // Transit: route around left side of house (clear of deck/house obstacles)
      [10.36,0.29],[-10.36,0.29],[-9.50,0.70],[-9.50,17.00],
      // Zone D: back strip behind house
      [-7.22,17.27],[8.12,17.27],[8.12,17.82],[-7.22,17.82],[-7.22,18.38],[8.12,18.38],
      [8.12,18.93],[-7.22,18.93],[-7.22,19.48],[8.12,19.48],[8.12,20.03],[-7.22,20.03],
      [-7.22,20.58],[8.12,20.58],[8.12,21.13],[-7.22,21.13],
    ];
    const points: THREE.Vector3[] = rawWaypoints.map(([x, z]) => new THREE.Vector3(center.x + x, y, center.z + z));
    pathPointsRef.current = points;

    const completedCount = Math.floor(points.length * 0.4);
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.slice(0, completedCount)),
      new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 })
    ));

    const pending = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.slice(completedCount - 1)),
      new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.35 })
    );
    pending.computeLineDistances();
    scene.add(pending);
    pathLineRef.current = pending;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5c518, emissive: 0xf5c518, emissiveIntensity: 1.0 })
    );
    dot.position.copy(points[completedCount - 1]);
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.55, 24),
      new THREE.MeshBasicMaterial({ color: 0xf5c518, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    dot.add(glow);
    scene.add(dot);
    robotDotRef.current = dot;
    robotTRef.current = 0.4;
  }, []);

  // ── Map underlay ──────────────────────────────────────────────────────────
  // Yard GPS: 41.5769°N, 91.2607°W — 905 N Columbus St, West Liberty IA (Parcel 0112177049)
  // REAL surveyed geometry from Muscatine County MAGIC GIS ArcGIS REST API (queried 2026-04-09)
  // Legal: "N 68 E 259 OUT LOT 3 SE NW  2007-06934"
  // The lot is 259ft E-W (along N Columbus St) × 68ft N-S (depth into backyard)
  // Centroid: 41.576943°N, -91.261215°W
  // Real corners (WGS84):
  //   SW: [-91.26074363, 41.57685164]  SE: [-91.26169050, 41.57685029]
  //   NW: [-91.26074034, 41.57703625]  NE: [-91.26168700, 41.57703613]
  const YARD_W_M = 79.12;  // meters east-west (259 ft) — MAGIC GIS surveyed
  const YARD_D_M = 20.70;  // meters north-south (68 ft) — MAGIC GIS surveyed
  // Real parcel centroid (MAGIC GIS)
  const YARD_LAT_REAL = 41.576943;
  const YARD_LON_REAL = -91.261215;
  // Real corner coordinates (WGS84, MAGIC GIS)
  const GIS_CORNERS = [
    { lon: -91.26074363, lat: 41.57685164, label: "SW" },
    { lon: -91.26074034, lat: 41.57703625, label: "NW" },
    { lon: -91.26147446, lat: 41.57703627, label: "N-mid" },
    { lon: -91.26168700, lat: 41.57703613, label: "NE" },
    { lon: -91.26169050, lat: 41.57685029, label: "SE" },
    { lon: -91.26168136, lat: 41.57685030, label: "SE-inner" },
  ] as const;

  // Sync mapUnderlayMode ref and rebuild when mode changes
  useEffect(() => {
    mapUnderlayModeRef.current = mapUnderlayMode;
    if (sceneRef.current && modelCenterRef.current && modelSizeRef.current) {
      buildMapUnderlay(sceneRef.current, modelCenterRef.current, modelSizeRef.current, mapUnderlayMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapUnderlayMode]);

  const buildMapUnderlay = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3, mode: string) => {
    // Remove existing underlay
    if (mapUnderlayRef.current) {
      scene.remove(mapUnderlayRef.current);
      mapUnderlayRef.current.geometry.dispose();
      (mapUnderlayRef.current.material as THREE.Material).dispose();
      mapUnderlayRef.current = null;
    }
    if (mode === "none") return;

    // Scale the yard footprint to match the loaded model's coordinate space
    const metersToUnits = size.z / YARD_D_M;
    const planeW = YARD_W_M * metersToUnits * 1.4;
    const planeD = YARD_D_M * metersToUnits * 1.4;

    // ── Try to fetch a real Google Static Maps tile via the Manus proxy ──────
    // Proxy URL pattern mirrors Map.tsx: FORGE_BASE_URL/v1/maps/proxy/maps/api/staticmap
    const FORGE_BASE = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
    const API_KEY   = import.meta.env.VITE_FRONTEND_FORGE_API_KEY || "";
    const LAT = 41.57688, LON = -91.26073; // 905 N Columbus St, West Liberty IA (Parcel 0112177049)
    const mapType = mode === "satellite" ? "satellite" : mode === "street" ? "roadmap" : "hybrid";
    const tileUrl  = `${FORGE_BASE}/v1/maps/proxy/maps/api/staticmap?center=${LAT},${LON}&zoom=19&size=512x512&maptype=${mapType}&key=${API_KEY}`;

    const applyTexture = (imgSrc: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Dispose old underlay if it appeared between async load and now
        if (mapUnderlayRef.current) {
          scene.remove(mapUnderlayRef.current);
          mapUnderlayRef.current.geometry.dispose();
          (mapUnderlayRef.current.material as THREE.Material).dispose();
          mapUnderlayRef.current = null;
        }
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        const geo = new THREE.PlaneGeometry(planeW, planeD);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.78, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(center.x, center.y - size.y * 0.5 - 0.05, center.z);
        mesh.renderOrder = -1;
        scene.add(mesh);
        mapUnderlayRef.current = mesh;
      };
      img.onerror = () => buildFallbackCanvas(); // fall back to canvas on CORS/network error
      img.src = imgSrc;
    };

    const buildFallbackCanvas = () => {
    // Canvas-rendered map tile (styled to match satellite/street/hybrid modes)
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Flip canvas vertically so text reads correctly when viewed from above in Three.js
    ctx.save();
    ctx.translate(0, 512);
    ctx.scale(1, -1);

    if (mode === "satellite") {
      // Dark satellite-style background
      ctx.fillStyle = "#1a2a1a";
      ctx.fillRect(0, 0, 512, 512);
      // Draw yard boundary
      ctx.strokeStyle = "#44ff88";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      const mx = 512 * 0.15, my = 512 * 0.1, mw = 512 * 0.7, mh = 512 * 0.8;
      ctx.strokeRect(mx, my, mw, mh);
      // House footprint
      ctx.fillStyle = "#3a3a2a";
      ctx.fillRect(mx + mw * 0.3, my + mh * 0.25, mw * 0.4, mh * 0.35);
      ctx.strokeStyle = "#888866";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(mx + mw * 0.3, my + mh * 0.25, mw * 0.4, mh * 0.35);
      // Street at bottom of canvas (north side of yard)
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(0, 512 - my * 0.7, 512, my * 0.7);
      // Street label
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("N Columbus St", 256, 512 - 8);
      // Property label
      ctx.fillStyle = "#44ff88";
      ctx.font = "bold 11px monospace";
      ctx.fillText("905 N Columbus St · West Liberty, IA", 256, my - 6);
      ctx.fillStyle = "rgba(68,255,136,0.15)";
      ctx.fillRect(mx, my, mw, mh);
    } else if (mode === "street") {
      ctx.fillStyle = "#f0ede8";
      ctx.fillRect(0, 0, 512, 512);
      // Roads at bottom (north)
      ctx.fillStyle = "#d4c9b8";
      ctx.fillRect(0, 472, 512, 40);
      ctx.fillStyle = "#555";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("N Columbus St", 256, 498);
      // Lot outline
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      const mx2 = 80, my2 = 60, mw2 = 350, mh2 = 400;
      ctx.strokeRect(mx2, my2, mw2, mh2);
      ctx.fillStyle = "rgba(100,180,100,0.2)";
      ctx.fillRect(mx2, my2, mw2, mh2);
      ctx.fillStyle = "#aaa";
      ctx.fillRect(mx2 + mw2 * 0.3, my2 + mh2 * 0.25, mw2 * 0.4, mh2 * 0.35);
      ctx.fillStyle = "#333";
      ctx.font = "10px sans-serif";
      ctx.fillText("905 N Columbus St", 256, my2 + 16);
      ctx.fillText("West Liberty, IA 52776", 256, my2 + 30);
    } else {
      // Hybrid
      ctx.fillStyle = "#1a2a1a";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(0, 472, 512, 40);
      ctx.strokeStyle = "#ffcc44";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 472, 512, 40);
      ctx.fillStyle = "#ffcc44";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("N Columbus St", 256, 498);
      const mx3 = 80, my3 = 55, mw3 = 350, mh3 = 410;
      ctx.strokeStyle = "#44ff88";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(mx3, my3, mw3, mh3);
      ctx.fillStyle = "rgba(68,255,136,0.1)";
      ctx.fillRect(mx3, my3, mw3, mh3);
      ctx.fillStyle = "#3a3a2a";
      ctx.fillRect(mx3 + mw3 * 0.3, my3 + mh3 * 0.25, mw3 * 0.4, mh3 * 0.35);
      ctx.fillStyle = "#ffcc44";
      ctx.font = "bold 10px monospace";
      ctx.setLineDash([]);
      ctx.fillText("905 N Columbus St · 41.577°N 91.261°W", 256, my3 + 18);
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(planeW, planeD);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.72, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, center.y - size.y * 0.5 - 0.05, center.z);
    mesh.renderOrder = -1;
    scene.add(mesh);
    mapUnderlayRef.current = mesh;
    }; // end buildFallbackCanvas

    // Try real tile first; fall back to canvas on error
    applyTexture(tileUrl);

    // ── Parcel boundary overlay — always visible glowing white rectangle ────
    if (parcelBoundaryRef.current) {
      scene.remove(parcelBoundaryRef.current);
      parcelBoundaryRef.current.geometry.dispose();
      parcelBoundaryRef.current = null;
    }
    const metersToUnits2 = size.z / YARD_D_M;
    const bW = YARD_W_M * metersToUnits2;
    const bD = YARD_D_M * metersToUnits2;
    const bY = center.y - size.y * 0.5 + 0.08;
    const bPoints = [
      new THREE.Vector3(center.x - bW / 2, bY, center.z - bD / 2),
      new THREE.Vector3(center.x + bW / 2, bY, center.z - bD / 2),
      new THREE.Vector3(center.x + bW / 2, bY, center.z + bD / 2),
      new THREE.Vector3(center.x - bW / 2, bY, center.z + bD / 2),
    ];
    const bGeo = new THREE.BufferGeometry().setFromPoints(bPoints);
    const bMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, linewidth: 2, depthTest: false });
    const boundary = new THREE.LineLoop(bGeo, bMat);
    boundary.renderOrder = 1;
    scene.add(boundary);
    parcelBoundaryRef.current = boundary;

    // ── Corner tick marks — 4 L-shaped brackets, one per corner ─────────────
    if (parcelCornersRef.current) {
      scene.remove(parcelCornersRef.current);
      parcelCornersRef.current = null;
    }
    const cornerGroup = new THREE.Group();
    const tickLen = Math.min(bW, bD) * 0.08;
    const tickMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.9, linewidth: 2, depthTest: false });
    const corners = [
      { x: center.x - bW / 2, z: center.z - bD / 2, sx: 1, sz: 1 },
      { x: center.x + bW / 2, z: center.z - bD / 2, sx: -1, sz: 1 },
      { x: center.x + bW / 2, z: center.z + bD / 2, sx: -1, sz: -1 },
      { x: center.x - bW / 2, z: center.z + bD / 2, sx: 1, sz: -1 },
    ];
    // GPS coordinate labels: calculate lat/lon for each corner from parcel centroid
    const CLAT = 41.57688; // parcel centroid lat
    const CLON = -91.26073; // parcel centroid lon
    const LAT_DEG_PER_M = 1 / 111320;
    const LON_DEG_PER_M = 1 / (111320 * Math.cos((CLAT * Math.PI) / 180));
    // Scene units to meters: metersToUnits2 = size.z / YARD_D_M
    const unitsToMeters = YARD_D_M / size.z;
    // Corner offsets in scene units from center
    const cornerGPS = [
      { dx: -bW / 2, dz: -bD / 2 }, // SW
      { dx:  bW / 2, dz: -bD / 2 }, // SE
      { dx:  bW / 2, dz:  bD / 2 }, // NE
      { dx: -bW / 2, dz:  bD / 2 }, // NW
    ].map(({ dx, dz }) => ({
      lat: CLAT + (dz * unitsToMeters) * LAT_DEG_PER_M,
      lon: CLON + (dx * unitsToMeters) * LON_DEG_PER_M,
    }));

    corners.forEach(({ x, z, sx, sz }, i) => {
      // Horizontal arm
      const hPts = [new THREE.Vector3(x, bY, z), new THREE.Vector3(x + sx * tickLen, bY, z)];
      const hLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), tickMat);
      hLine.renderOrder = 2;
      cornerGroup.add(hLine);
      // Vertical arm
      const vPts = [new THREE.Vector3(x, bY, z), new THREE.Vector3(x, bY, z + sz * tickLen)];
      const vLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vPts), tickMat);
      vLine.renderOrder = 2;
      cornerGroup.add(vLine);
      // GPS label sprite
      const gps = cornerGPS[i];
      const lc = document.createElement("canvas");
      lc.width = 220; lc.height = 52;
      const lctx = lc.getContext("2d")!;
      lctx.fillStyle = "rgba(0,20,30,0.75)";
      lctx.roundRect(0, 0, 220, 52, 6);
      lctx.fill();
      lctx.strokeStyle = "#00ffcc";
      lctx.lineWidth = 1.5;
      lctx.roundRect(0, 0, 220, 52, 6);
      lctx.stroke();
      lctx.fillStyle = "#00ffcc";
      lctx.font = "bold 14px monospace";
      lctx.textAlign = "center";
      lctx.fillText(`${gps.lat.toFixed(5)}°N`, 110, 20);
      lctx.fillText(`${Math.abs(gps.lon).toFixed(5)}°W`, 110, 40);
      const lTex = new THREE.CanvasTexture(lc);
      const lMat = new THREE.SpriteMaterial({ map: lTex, transparent: true, opacity: 0.85, depthTest: false });
      const lSprite = new THREE.Sprite(lMat);
      lSprite.renderOrder = 3;
      const labelScale = tickLen * 2.5;
      lSprite.scale.set(labelScale, labelScale * (52 / 220), 1);
      lSprite.position.set(x + sx * tickLen * 1.5, bY + tickLen * 0.8, z + sz * tickLen * 1.5);
      lSprite.userData.role = "cornerLabel";
      cornerGroup.add(lSprite);
    });
    scene.add(cornerGroup);
    parcelCornersRef.current = cornerGroup;
  }, []);

  // ── MAGIC GIS parcel boundary overlay ────────────────────────────────────
  // Draws the REAL Muscatine County MAGIC GIS parcel polygon in magenta.
  // Parcel 0112177049 — 905 N Columbus St, West Liberty IA
  // Legal: "N 68 E 259 OUT LOT 3 SE NW  2007-06934"
  // 259 ft E-W (along N Columbus St) × 68 ft N-S (backyard depth)
  // Real corners from MAGIC GIS ArcGIS REST API (WGS84, queried 2026-04-09):
  //   SW: [-91.26074363, 41.57685164]  NW: [-91.26074034, 41.57703625]
  //   NE: [-91.26168700, 41.57703613]  SE: [-91.26169050, 41.57685029]
  // Back-of-house: house sits at the NORTH edge (N Columbus St side, lat ~41.57703);
  // the backyard extends SOUTH (lat ~41.57685). In Three.js +Z runs south.
  const buildGisBoundary = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    // Remove existing GIS group
    if (gisBoundaryGroupRef.current) {
      scene.remove(gisBoundaryGroupRef.current);
      gisBoundaryGroupRef.current = null;
    }

    const group = new THREE.Group();
    group.name = "gisBoundary";

    // ── GPS → scene coordinate conversion ──────────────────────────────────────────
    // We map GPS coordinates to Three.js scene units by anchoring the model
    // center to the real parcel centroid, then using the model's bounding box
    // extent to determine the meters-per-scene-unit scale.
    // The model's X axis = E-W (east is +X), Z axis = N-S (south is +Z).
    const LAT_M = 111320;
    const LON_M = 111320 * Math.cos((YARD_LAT_REAL * Math.PI) / 180);
    // Scale: use the model's X extent vs real lot E-W width (259ft = 79.12m)
    const metersToUnits = size.x / YARD_W_M;

    // Convert a GPS coordinate to Three.js scene XZ position
    const gpsToScene = (lat: number, lon: number): [number, number] => {
      const dLat = lat - YARD_LAT_REAL;
      const dLon = lon - YARD_LON_REAL;
      const sceneX = center.x + dLon * LON_M * metersToUnits; // east = +X
      const sceneZ = center.z - dLat * LAT_M * metersToUnits; // north = -Z
      return [sceneX, sceneZ];
    };

    // Ground plane Y — slightly above the map underlay, below zone markers
    const bY = center.y - size.y * 0.5 + 0.04;

    // Build the real polygon vertices from MAGIC GIS corners
    // Use the 4 true corners (SW, NW, NE, SE) for a clean rectangle
    const realCorners = [
      { lon: -91.26074363, lat: 41.57685164, label: "SW", sx: 1,  sz: -1 },
      { lon: -91.26074034, lat: 41.57703625, label: "NW", sx: 1,  sz: 1  },
      { lon: -91.26168700, lat: 41.57703613, label: "NE", sx: -1, sz: 1  },
      { lon: -91.26169050, lat: 41.57685029, label: "SE", sx: -1, sz: -1 },
    ];
    const polyPts3D = realCorners.map(c => {
      const [sx, sz] = gpsToScene(c.lat, c.lon);
      return new THREE.Vector3(sx, bY + 0.05, sz);
    });

    // ── 1. Semi-transparent fill plane ────────────────────────────────────────────
    // Compute bounding box of real polygon for fill plane size
    const xs = polyPts3D.map(p => p.x), zs = polyPts3D.map(p => p.z);
    const fillW = Math.max(...xs) - Math.min(...xs);
    const fillD = Math.max(...zs) - Math.min(...zs);
    const fillCX = (Math.max(...xs) + Math.min(...xs)) / 2;
    const fillCZ = (Math.max(...zs) + Math.min(...zs)) / 2;
    const fillGeo = new THREE.PlaneGeometry(fillW, fillD);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xff00cc, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthTest: false });
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.rotation.x = -Math.PI / 2;
    fillMesh.position.set(fillCX, bY + 0.01, fillCZ);
    fillMesh.renderOrder = 0;
    group.add(fillMesh);

    // ── 2. Outer boundary — real MAGIC GIS polygon (bold magenta) ────────────────
    const outerGeo = new THREE.BufferGeometry().setFromPoints(polyPts3D);
    const outerMat = new THREE.LineBasicMaterial({ color: 0xff00cc, transparent: true, opacity: 0.9, linewidth: 3, depthTest: false });
    const outerLine = new THREE.LineLoop(outerGeo, outerMat);
    outerLine.renderOrder = 5;
    outerLine.userData.role = "gisBorder";
    group.add(outerLine);

    // ── 3. Inner grid lines (every ~10m real-world) ─────────────────────────────
    const gridMat = new THREE.LineBasicMaterial({ color: 0xff00cc, transparent: true, opacity: 0.12, depthTest: false });
    const gridStep10 = 10 * metersToUnits;
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    for (let gx = minX + gridStep10; gx < maxX; gx += gridStep10) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(gx, bY + 0.02, minZ), new THREE.Vector3(gx, bY + 0.02, maxZ)]);
      group.add(new THREE.Line(g, gridMat));
    }
    for (let gz = minZ + gridStep10; gz < maxZ; gz += gridStep10) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(minX, bY + 0.02, gz), new THREE.Vector3(maxX, bY + 0.02, gz)]);
      group.add(new THREE.Line(g, gridMat));
    }

    // ── 4. Corner pins — L-brackets + GPS labels ───────────────────────────────────
    const tickLen = Math.min(fillW, fillD) * 0.06;
    const pinMat = new THREE.LineBasicMaterial({ color: 0xff44dd, transparent: true, opacity: 1.0, depthTest: false });
    realCorners.forEach((c, i) => {
      const [px, pz] = gpsToScene(c.lat, c.lon);
      const py = bY + 0.06;
      const sx = c.sx, sz = c.sz;
      // L-bracket arms
      const hg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px, py, pz), new THREE.Vector3(px + sx * tickLen, py, pz)]);
      const hl = new THREE.Line(hg, pinMat); hl.renderOrder = 6; group.add(hl);
      const vg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px, py, pz), new THREE.Vector3(px, py, pz + sz * tickLen)]);
      const vl = new THREE.Line(vg, pinMat); vl.renderOrder = 6; group.add(vl);
      // Vertical pole
      const pg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px, py, pz), new THREE.Vector3(px, py + tickLen * 2, pz)]);
      const pl = new THREE.Line(pg, new THREE.LineBasicMaterial({ color: 0xff44dd, transparent: true, opacity: 0.5, depthTest: false }));
      pl.renderOrder = 6; group.add(pl);
      // GPS label sprite
      const lc = document.createElement("canvas");
      lc.width = 280; lc.height = 64;
      const ctx = lc.getContext("2d")!;
      ctx.fillStyle = "rgba(30,0,30,0.85)";
      ctx.roundRect(0, 0, 280, 64, 7); ctx.fill();
      ctx.strokeStyle = "#ff44dd"; ctx.lineWidth = 1.5;
      ctx.roundRect(0, 0, 280, 64, 7); ctx.stroke();
      ctx.fillStyle = "#ff88ee"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
      ctx.fillText(`${c.label} — MAGIC GIS`, 140, 18);
      ctx.fillStyle = "#ffccff"; ctx.font = "11px monospace";
      ctx.fillText(`${c.lat.toFixed(5)}°N  ${Math.abs(c.lon).toFixed(5)}°W`, 140, 38);
      ctx.fillStyle = "#ff88ee"; ctx.font = "10px monospace";
      ctx.fillText("Parcel 0112177049 · Surveyed", 140, 56);
      const tex = new THREE.CanvasTexture(lc);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9, depthTest: false }));
      const ls = tickLen * 3.0;
      spr.scale.set(ls, ls * (64 / 280), 1);
      spr.position.set(px + sx * tickLen * 1.8, py + tickLen * 2.6, pz + sz * tickLen * 1.8);
      spr.renderOrder = 7; spr.userData.role = "gisCornerLabel";
      group.add(spr);
      void i; // suppress unused warning
    });

    // ── 5. Center label — parcel ID, legal description, and dimensions ────────────
    // Only show the center label on desktop — it's too large and obstructive on mobile
    if (!device.isMobile) {
      const cl = document.createElement("canvas");
      cl.width = 380; cl.height = 80;
      const cctx = cl.getContext("2d")!;
      cctx.fillStyle = "rgba(30,0,30,0.88)";
      cctx.roundRect(0, 0, 380, 80, 8); cctx.fill();
      cctx.strokeStyle = "#ff00cc"; cctx.lineWidth = 2;
      cctx.roundRect(0, 0, 380, 80, 8); cctx.stroke();
      cctx.fillStyle = "#ff66ee"; cctx.font = "bold 14px monospace"; cctx.textAlign = "center";
      cctx.fillText("MAGIC GIS — Parcel 0112177049", 190, 20);
      cctx.fillStyle = "#ffccff"; cctx.font = "12px monospace";
      cctx.fillText("905 N Columbus St · West Liberty IA 52776", 190, 40);
      cctx.fillStyle = "#ff88ee"; cctx.font = "11px monospace";
      cctx.fillText("259 ft E–W × 68 ft N–S  |  0.40 ac  |  Surveyed", 190, 58);
      cctx.fillStyle = "#ff44dd"; cctx.font = "10px monospace";
      cctx.fillText("N 68 E 259 OUT LOT 3 SE NW  2007-06934", 190, 74);
      const ctex = new THREE.CanvasTexture(cl);
      const cspr = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex, transparent: true, opacity: 0.92, depthTest: false }));
      const cs = fillW * 0.5;
      cspr.scale.set(cs, cs * (80 / 380), 1);
      cspr.position.set(fillCX, bY + fillD * 0.15, fillCZ);
      cspr.renderOrder = 7; cspr.userData.role = "gisCenterLabel";
      group.add(cspr);
    }

    scene.add(group);
    gisBoundaryGroupRef.current = group;
  }, [YARD_LAT_REAL, YARD_LON_REAL, YARD_W_M, device.isMobile]);

  // ── Satellite tile ground plane ────────────────────────────────────────────────
  // Fetches a real Google Maps satellite tile via the Manus proxy and projects it
  // as a horizontal ground plane aligned with the GIS parcel boundary.
  const buildSatelliteGround = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    // Remove existing satellite ground
    if (satelliteGroundRef.current) {
      scene.remove(satelliteGroundRef.current);
      satelliteGroundRef.current.geometry.dispose();
      (satelliteGroundRef.current.material as THREE.Material).dispose();
      satelliteGroundRef.current = null;
    }

    // Parcel dimensions in scene units (same scale as GIS overlay)
    const metersToUnits = size.x / YARD_W_M;
    const planeW = YARD_W_M * metersToUnits * 1.05; // slight bleed past boundary
    const planeD = YARD_D_M * metersToUnits * 1.05;
    const groundY = center.y - size.y * 0.5 - 0.02; // just below model floor

    // Parcel centroid GPS
    const LAT = YARD_LAT_REAL, LON = YARD_LON_REAL;
    const FORGE_BASE = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
    const API_KEY   = import.meta.env.VITE_FRONTEND_FORGE_API_KEY || "";
    // Zoom 20 gives ~0.15m/px at this latitude — enough for house-level detail
    const tileUrl = `${FORGE_BASE}/v1/maps/proxy/maps/api/staticmap?center=${LAT},${LON}&zoom=20&size=640x640&maptype=satellite&key=${API_KEY}`;

    const buildFallback = () => {
      // Canvas fallback: dark green yard with house footprint outline
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 512;
      const cx = cv.getContext("2d")!;
      cx.save(); cx.translate(0, 512); cx.scale(1, -1);
      cx.fillStyle = "#0d1a0d"; cx.fillRect(0, 0, 512, 512);
      // Yard boundary
      cx.strokeStyle = "#22cc55"; cx.lineWidth = 2; cx.setLineDash([6, 3]);
      cx.strokeRect(20, 20, 472, 472);
      // House footprint (approx center of parcel)
      cx.fillStyle = "#2a2a1a"; cx.setLineDash([]);
      cx.fillRect(156, 156, 200, 200);
      cx.strokeStyle = "#888855"; cx.lineWidth = 1;
      cx.strokeRect(156, 156, 200, 200);
      // North label
      cx.fillStyle = "#44ff88"; cx.font = "bold 14px monospace";
      cx.fillText("N", 248, 500);
      cx.fillStyle = "#ffffff88"; cx.font = "10px monospace";
      cx.fillText("905 N Columbus St · West Liberty IA", 60, 40);
      cx.restore();
      const tex = new THREE.CanvasTexture(cv);
      const geo = new THREE.PlaneGeometry(planeW, planeD);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(center.x, groundY, center.z);
      mesh.renderOrder = -2;
      mesh.name = "satelliteGround";
      scene.add(mesh);
      satelliteGroundRef.current = mesh;
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Remove any fallback that may have appeared during async load
      if (satelliteGroundRef.current) {
        scene.remove(satelliteGroundRef.current);
        satelliteGroundRef.current.geometry.dispose();
        (satelliteGroundRef.current.material as THREE.Material).dispose();
        satelliteGroundRef.current = null;
      }
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      const geo = new THREE.PlaneGeometry(planeW, planeD);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.88, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(center.x, groundY, center.z);
      mesh.renderOrder = -2;
      mesh.name = "satelliteGround";
      scene.add(mesh);
      satelliteGroundRef.current = mesh;
    };
    img.onerror = buildFallback;
    img.src = tileUrl;
  }, [YARD_D_M, YARD_LAT_REAL, YARD_LON_REAL, YARD_W_M]);

  // Toggle satellite ground plane visibility
  useEffect(() => {
    if (!sceneRef.current || !modelCenterRef.current || !modelSizeRef.current) return;
    if (showSatelliteGround) {
      if (!satelliteGroundRef.current) {
        buildSatelliteGround(sceneRef.current, modelCenterRef.current, modelSizeRef.current);
      } else {
        satelliteGroundRef.current.visible = true;
      }
    } else {
      if (satelliteGroundRef.current) satelliteGroundRef.current.visible = false;
    }
  }, [showSatelliteGround, buildSatelliteGround]);

  //  // ── Fleet agent 3D markers ────────────────────────────────────────────────
  // Yard origin GPS (real MAGIC GIS centroid — 905 N Columbus St, West Liberty IA)
  const YARD_LAT = YARD_LAT_REAL; // 41.576943 (MAGIC GIS surveyed centroid)
  const YARD_LON = YARD_LON_REAL; // -91.261215 (MAGIC GIS surveyed centroid)
  // Conversion: 1 degree lat ≈ 111,320 m; 1 degree lon ≈ 111,320 * cos(lat) m
  const LAT_M_PER_DEG = 111320;
  const LON_M_PER_DEG = 111320 * Math.cos((YARD_LAT * Math.PI) / 180);

  const buildFleetMarkers = useCallback((
    scene: THREE.Scene,
    center: THREE.Vector3,
    size: THREE.Vector3,
    agents: import("@/components/FleetConnectivityPanel").FleetAgent[]
  ) => {
    // Remove previous group
    if (fleetGroupRef.current) {
      scene.remove(fleetGroupRef.current);
      fleetGroupRef.current.traverse(c => {
        if (c instanceof THREE.Mesh) { c.geometry.dispose(); (c.material as THREE.Material).dispose(); }
      });
      fleetGroupRef.current = null;
    }
    if (!agents.length) return;

    const group = new THREE.Group();
    const metersToUnits = size.z / YARD_D_M;
    const groundY = center.y - size.y * 0.5;

    const AGENT_COLORS_HEX: Record<string, number> = {
      drone:     0x44ccff,
      humanoid:  0xf5c518,
      vehicle:   0x44ff88,
      accessory: 0xff88cc,
    };

    agents.forEach(agent => {
      if (agent.status === "offline") return;

      // GPS → scene units (relative to yard center)
      const dLat = (agent.lat - YARD_LAT) * LAT_M_PER_DEG * metersToUnits;
      const dLon = (agent.lon - YARD_LON) * LON_M_PER_DEG * metersToUnits;
      const elevUnits = agent.elevation * metersToUnits;
      const x = center.x + dLon;
      const y = groundY + elevUnits + 0.05;
      const z = center.z - dLat; // Z is south in Three.js

      const color = AGENT_COLORS_HEX[agent.type] ?? 0xffffff;

      // Cone body (pointing up for drones/accessories, down for ground agents)
      const coneH = agent.type === "drone" ? 0.35 : 0.25;
      const coneR = agent.type === "drone" ? 0.12 : 0.10;
      const coneGeo = new THREE.ConeGeometry(coneR, coneH, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: agent.status === "standby" ? 0.55 : 0.9,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(x, y + coneH / 2, z);
      cone.userData = { role: "cone", agentType: agent.type, agentStatus: agent.status, baseY: y + coneH / 2 };
      // Drones point up, ground vehicles point down
      if (agent.type !== "drone") cone.rotation.z = Math.PI;
      group.add(cone);

      // Vertical tether line from ground to agent
      if (agent.elevation > 0.5) {
        const tetherPts = [new THREE.Vector3(x, groundY, z), new THREE.Vector3(x, y, z)];
        const tetherGeo = new THREE.BufferGeometry().setFromPoints(tetherPts);
        const tetherMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35, linewidth: 1 });
        group.add(new THREE.Line(tetherGeo, tetherMat));
      }

      // Pulsing ring at ground projection
      const ringGeo = new THREE.RingGeometry(coneR * 0.8, coneR * 1.4, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, groundY + 0.01, z);
      ring.userData = { role: "ring", agentType: agent.type, agentStatus: agent.status };
      group.add(ring);

      // Text sprite (canvas label)
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 256; labelCanvas.height = 64;
      const lctx = labelCanvas.getContext("2d")!;
      lctx.fillStyle = "rgba(0,0,0,0.7)";
      lctx.roundRect(2, 2, 252, 60, 8);
      lctx.fill();
      lctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
      lctx.font = "bold 18px monospace";
      lctx.textAlign = "center";
      lctx.fillText(agent.name, 128, 24);
      lctx.fillStyle = "rgba(255,255,255,0.5)";
      lctx.font = "13px monospace";
      lctx.fillText(`${agent.elevation.toFixed(1)}m AGL · ${agent.battery}%🔋`, 128, 46);
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(labelMat);
      sprite.scale.set(0.9, 0.22, 1);
      sprite.position.set(x, y + coneH + 0.18, z);
      group.add(sprite);
    });

    scene.add(group);
    fleetGroupRef.current = group;
  }, [YARD_D_M, YARD_LAT, YARD_LON, LAT_M_PER_DEG, LON_M_PER_DEG]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild fleet markers when fleetAgents prop changes
  useEffect(() => {
    if (sceneRef.current && modelCenterRef.current && modelSizeRef.current && fleetAgents.length > 0) {
      buildFleetMarkers(sceneRef.current, modelCenterRef.current, modelSizeRef.current, fleetAgents);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetAgents]);

  // ── Media camera frustum ────────────────────────────────────────────────
  const buildMediaFrustum = useCallback((
    scene: THREE.Scene,
    center: THREE.Vector3,
    size: THREE.Vector3,
    media: import("@/components/MediaTimelinePanel").MediaItem | null
  ) => {
    // Remove previous frustum
    if (frustumGroupRef.current) {
      scene.remove(frustumGroupRef.current);
      frustumGroupRef.current.traverse(c => {
        if (c instanceof THREE.Mesh || c instanceof THREE.Line) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      });
      frustumGroupRef.current = null;
    }
    if (!media) return;

    const metersToUnits = size.z / YARD_D_M;
    const groundY = center.y - size.y * 0.5;

    // Camera origin in scene space
    const dLat = (media.gps.lat - YARD_LAT) * LAT_M_PER_DEG * metersToUnits;
    const dLon = (media.gps.lon - YARD_LON) * LON_M_PER_DEG * metersToUnits;
    const camX = center.x + dLon;
    const camY = groundY + media.gps.alt * metersToUnits;
    const camZ = center.z - dLat;
    const origin = new THREE.Vector3(camX, camY, camZ);

    // Frustum geometry: 4 rays from origin forming the FOV cone
    const fovRad = (media.fov * Math.PI) / 180;
    const pitchRad = (media.pitch * Math.PI) / 180;
    const headingRad = (media.heading * Math.PI) / 180;
    const frustumLen = size.z * 0.4; // frustum depth in scene units
    const halfFov = fovRad / 2;

    // Build 4 corner rays
    const corners: THREE.Vector3[] = [];
    for (const [hSign, vSign] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      const az = headingRad + hSign * halfFov;
      const el = pitchRad + vSign * halfFov * 0.6; // vertical FOV ~60% of horizontal
      const dx = Math.sin(az) * Math.cos(el) * frustumLen;
      const dy = Math.sin(el) * frustumLen;
      const dz = -Math.cos(az) * Math.cos(el) * frustumLen;
      corners.push(new THREE.Vector3(camX + dx, camY + dy, camZ + dz));
    }

    const group = new THREE.Group();
    const frustumColor = 0x44ccff;
    const lineMat = new THREE.LineBasicMaterial({ color: frustumColor, transparent: true, opacity: 0.7, linewidth: 1 });

    // 4 rays from origin to corners
    corners.forEach(corner => {
      const geo = new THREE.BufferGeometry().setFromPoints([origin, corner]);
      group.add(new THREE.Line(geo, lineMat));
    });

    // Closing rectangle at the far end
    const rectPts = [...corners, corners[0]];
    const rectGeo = new THREE.BufferGeometry().setFromPoints(rectPts);
    group.add(new THREE.Line(rectGeo, lineMat));

    // Translucent fill plane
    const fillGeo = new THREE.BufferGeometry();
    const fillVerts = new Float32Array([
      corners[0].x, corners[0].y, corners[0].z,
      corners[1].x, corners[1].y, corners[1].z,
      corners[2].x, corners[2].y, corners[2].z,
      corners[0].x, corners[0].y, corners[0].z,
      corners[2].x, corners[2].y, corners[2].z,
      corners[3].x, corners[3].y, corners[3].z,
    ]);
    fillGeo.setAttribute("position", new THREE.BufferAttribute(fillVerts, 3));
    const fillMat = new THREE.MeshBasicMaterial({ color: frustumColor, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
    group.add(new THREE.Mesh(fillGeo, fillMat));

    // Camera origin sphere
    const sphereGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const sphereMat = new THREE.MeshStandardMaterial({ color: frustumColor, emissive: frustumColor, emissiveIntensity: 0.8 });
    group.add(new THREE.Mesh(sphereGeo, sphereMat).translateX(camX).translateY(camY).translateZ(camZ));

    // Label sprite
    const lc = document.createElement("canvas");
    lc.width = 320; lc.height = 72;
    const lctx = lc.getContext("2d")!;
    lctx.fillStyle = "rgba(0,0,0,0.75)";
    lctx.roundRect(2, 2, 316, 68, 10);
    lctx.fill();
    lctx.fillStyle = "#44ccff";
    lctx.font = "bold 16px monospace";
    lctx.textAlign = "center";
    lctx.fillText(media.filename, 160, 24);
    lctx.fillStyle = "rgba(255,255,255,0.55)";
    lctx.font = "12px monospace";
    lctx.fillText(`↑${media.heading}° · ${media.pitch}° pitch · ${media.fov}° FOV`, 160, 44);
    lctx.fillText(`${media.gps.lat.toFixed(5)}°N ${Math.abs(media.gps.lon).toFixed(5)}°W`, 160, 62);
    const lTex = new THREE.CanvasTexture(lc);
    const lSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: lTex, transparent: true, depthTest: false }));
    lSprite.scale.set(1.1, 0.25, 1);
    lSprite.position.set(camX, camY + 0.35, camZ);
    group.add(lSprite);

    // Photo thumbnail sprite at the far-plane center (only for image/video types)
    const isImage = ["image", "video"].includes(media.type ?? "") ||
      /\.(jpe?g|png|gif|webp|heic|mov|mp4)$/i.test(media.filename);
    if (isImage) {
      const imgSrc = (media as { thumbnail?: string }).thumbnail ?? media.rawUrl;
      const thumbImg = new window.Image();
      thumbImg.crossOrigin = "anonymous";
      thumbImg.onload = () => {
        const tc = document.createElement("canvas");
        tc.width = 320; tc.height = 200;
        const tctx = tc.getContext("2d")!;
        // Rounded-rect clip
        tctx.beginPath();
        tctx.roundRect(2, 2, 316, 196, 12);
        tctx.clip();
        tctx.drawImage(thumbImg, 0, 0, 320, 200);
        // Subtle border
        tctx.strokeStyle = "rgba(68,204,255,0.8)";
        tctx.lineWidth = 3;
        tctx.beginPath();
        tctx.roundRect(2, 2, 316, 196, 12);
        tctx.stroke();
        const tTex = new THREE.CanvasTexture(tc);
        const tSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tTex, transparent: true, depthTest: false, opacity: 0.92 }));
        // Position at far-plane center
        const farCenter = new THREE.Vector3(
          (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
          (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4,
          (corners[0].z + corners[1].z + corners[2].z + corners[3].z) / 4,
        );
        tSprite.scale.set(frustumLen * 0.7, frustumLen * 0.44, 1);
        tSprite.position.copy(farCenter);
        tSprite.userData = { role: "thumbSprite" };
        group.add(tSprite);
      };
      thumbImg.onerror = () => { /* no thumbnail available — skip sprite */ };
      thumbImg.src = imgSrc;
    }

    scene.add(group);
    frustumGroupRef.current = group;
    toast.info(`📷 ${media.filename} frustum visible in 3D`, { duration: 2500 });
  }, [YARD_D_M, YARD_LAT, YARD_LON, LAT_M_PER_DEG, LON_M_PER_DEG]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild frustum when selectedMedia changes
  useEffect(() => {
    if (sceneRef.current && modelCenterRef.current && modelSizeRef.current) {
      buildMediaFrustum(sceneRef.current, modelCenterRef.current, modelSizeRef.current, selectedMedia);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMedia]);

  // ── Chip speech bubble ──────────────────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    const center = modelCenterRef.current;
    const size = modelSizeRef.current;
    if (!scene || !center || !size) return;
    // Remove old sprite
    if (chipSpeechSpriteRef.current) {
      scene.remove(chipSpeechSpriteRef.current);
      (chipSpeechSpriteRef.current.material as THREE.SpriteMaterial).map?.dispose();
      (chipSpeechSpriteRef.current.material as THREE.SpriteMaterial).dispose();
      chipSpeechSpriteRef.current = null;
    }
    if (!chipSpeechText) return;
    // Find Chip's cone position from fleet group
    let chipPos: THREE.Vector3 | null = null;
    if (fleetGroupRef.current) {
      fleetGroupRef.current.traverse(obj => {
        if (chipPos) return;
        if (obj instanceof THREE.Mesh && obj.userData?.agentType === "humanoid") {
          chipPos = obj.position.clone();
        }
      });
    }
    // Fallback: place above model center
    if (!chipPos) chipPos = center.clone().setY(center.y + size.y * 0.5 + 1.0);
    else (chipPos as THREE.Vector3).y += 0.7;
    // Draw speech bubble on canvas
    const cw = 320, ch = 80;
    const bCanvas = document.createElement("canvas");
    bCanvas.width = cw; bCanvas.height = ch;
    const bctx = bCanvas.getContext("2d")!;
    // Bubble background
    bctx.fillStyle = "rgba(255,255,255,0.92)";
    const r = 16;
    bctx.beginPath();
    bctx.moveTo(r, 0); bctx.lineTo(cw - r, 0);
    bctx.quadraticCurveTo(cw, 0, cw, r);
    bctx.lineTo(cw, ch - 20 - r);
    bctx.quadraticCurveTo(cw, ch - 20, cw - r, ch - 20);
    bctx.lineTo(cw / 2 + 10, ch - 20);
    bctx.lineTo(cw / 2, ch); // tail
    bctx.lineTo(cw / 2 - 10, ch - 20);
    bctx.lineTo(r, ch - 20);
    bctx.quadraticCurveTo(0, ch - 20, 0, ch - 20 - r);
    bctx.lineTo(0, r);
    bctx.quadraticCurveTo(0, 0, r, 0);
    bctx.closePath();
    bctx.fill();
    // Text
    bctx.fillStyle = "#1a1a2e";
    bctx.font = "bold 18px system-ui, sans-serif";
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";
    const maxW = cw - 24;
    const words = chipSpeechText.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (bctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const lineH = 22;
    const startY = (ch - 20) / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => bctx.fillText(l, cw / 2, startY + i * lineH));
    const tex = new THREE.CanvasTexture(bCanvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    const metersToUnits = size.z / 78.9;
    sprite.scale.set(cw / 100 * metersToUnits * 0.6, ch / 100 * metersToUnits * 0.6, 1);
    sprite.position.copy(chipPos as THREE.Vector3);
    sprite.position.y += 0.5;
    sprite.renderOrder = 999;
    scene.add(sprite);
    chipSpeechSpriteRef.current = sprite;
    // Auto-dismiss after 3.5s
    const t = setTimeout(() => {
      if (chipSpeechSpriteRef.current) {
        scene.remove(chipSpeechSpriteRef.current);
        (chipSpeechSpriteRef.current.material as THREE.SpriteMaterial).map?.dispose();
        (chipSpeechSpriteRef.current.material as THREE.SpriteMaterial).dispose();
        chipSpeechSpriteRef.current = null;
      }
    }, 3500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipSpeechText]);

  // ── Weather overlay ───────────────────────────────────────────────────────
  const buildWeatherOverlay = useCallback((
    scene: THREE.Scene,
    center: THREE.Vector3,
    size: THREE.Vector3
  ) => {
    // Remove previous weather group
    if (weatherGroupRef.current) {
      scene.remove(weatherGroupRef.current);
      weatherGroupRef.current.traverse(obj => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else (obj.material as THREE.Material).dispose();
        }
      });
      weatherGroupRef.current = null;
    }
    // Apply simulation override if set
    const sim = weatherSimRef.current;
    const cond = sim === "rain" ? "Rain" : sim === "snow" ? "Snow" : sim === "fog" ? "Foggy" : sim === "night" ? "Clear" : sim === "clear" ? "Clear" : weatherConditionRef.current;
    const day = sim === "night" ? false : sim ? true : isDayRef.current;
    const precip = sim === "rain" ? 5 : sim === "snow" ? 3 : precipitationRef.current;
    const uv = sim === "clear" ? 9 : sim === "night" ? 0 : uvIndexRef.current;
    const wDir = windDirRef.current;
    const group = new THREE.Group();
    group.name = "weatherOverlay";

    // 1. Directional sun / moon light
    if (sunLightRef.current) {
      scene.remove(sunLightRef.current);
      if (sunLightRef.current.target) scene.remove(sunLightRef.current.target);
    }
    const isRainy = /rain|drizzle|shower|storm/i.test(cond);
    const isSnowy = /snow/i.test(cond);
    const isFoggy = /fog|mist/i.test(cond);
    const isClear = /clear|mostly clear/i.test(cond);
    const isPartly = /partly|overcast/i.test(cond);
    const sunElevDeg = day ? 5 + (uv / 11) * 70 : 0;
    const sunAzimDeg = wDir;
    const sunElevRad = (sunElevDeg * Math.PI) / 180;
    const sunAzimRad = (sunAzimDeg * Math.PI) / 180;
    const sunDist = Math.max(size.x, size.z) * 3;
    const sunX = center.x + sunDist * Math.sin(sunAzimRad) * Math.cos(sunElevRad);
    const sunY = center.y + sunDist * Math.sin(sunElevRad);
    const sunZ = center.z + sunDist * Math.cos(sunAzimRad) * Math.cos(sunElevRad);
    let sunColor = 0xffffff;
    let sunIntensity = 1.0;
    if (!day) { sunColor = 0x334466; sunIntensity = 0.15; }
    else if (isRainy || isFoggy) { sunColor = 0x8899aa; sunIntensity = 0.4; }
    else if (isPartly) { sunColor = 0xfff5e0; sunIntensity = 0.7; }
    else if (isClear) {
      sunColor = uv < 3 ? 0xffcc66 : uv < 7 ? 0xfff5cc : 0xffffff;
      sunIntensity = 0.5 + (uv / 11) * 0.8;
    }
    const sunLight = new THREE.DirectionalLight(sunColor, sunIntensity);
    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.target.position.copy(center);
    sunLight.castShadow = isClear && day;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.set(1024, 1024);
      const sh = Math.max(size.x, size.z) * 0.8;
      sunLight.shadow.camera.left = -sh; sunLight.shadow.camera.right = sh;
      sunLight.shadow.camera.top = sh; sunLight.shadow.camera.bottom = -sh;
      sunLight.shadow.camera.near = 0.5; sunLight.shadow.camera.far = sunDist * 2;
    }
    scene.add(sunLight); scene.add(sunLight.target);
    sunLightRef.current = sunLight;
    // Update ambient
    scene.traverse(obj => {
      if (obj instanceof THREE.AmbientLight) {
        if (!day) { obj.color.setHex(0x111133); obj.intensity = 0.3; }
        else if (isRainy || isFoggy) { obj.color.setHex(0x667788); obj.intensity = 0.6; }
        else if (isClear) { obj.color.setHex(0xaaccff); obj.intensity = 0.5; }
        else { obj.color.setHex(0x8899aa); obj.intensity = 0.5; }
      }
    });
    // Sky background
    const renderer = rendererRef.current;
    if (renderer) {
      if (!day) renderer.setClearColor(0x050a14, 1);
      else if (isRainy) renderer.setClearColor(0x2a3540, 1);
      else if (isFoggy) renderer.setClearColor(0x8899aa, 1);
      else renderer.setClearColor(0x0a1a3a, 1);
    }

    // 2. Rain streaks
    if (isRainy) {
      const count = Math.min(2000, 500 + Math.round(precip * 400));
      const positions = new Float32Array(count * 3);
      const spread = Math.max(size.x, size.z) * 1.5;
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = center.x + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = center.y + Math.random() * size.y * 3 + size.y;
        positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * spread;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0x99ccff, size: 0.04, transparent: true, opacity: 0.55, sizeAttenuation: true });
      const rain = new THREE.Points(geo, mat);
      rain.userData = { role: "rain", spread, center: center.clone(), sizeY: size.y };
      group.add(rain);
    }

    // 3. Snow particles
    if (isSnowy) {
      const count = Math.min(1500, 300 + Math.round(precip * 300));
      const positions = new Float32Array(count * 3);
      const spread = Math.max(size.x, size.z) * 1.5;
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = center.x + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = center.y + Math.random() * size.y * 3 + size.y;
        positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * spread;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0xeef5ff, size: 0.08, transparent: true, opacity: 0.8, sizeAttenuation: true });
      const snow = new THREE.Points(geo, mat);
      snow.userData = { role: "snow", spread, center: center.clone(), sizeY: size.y };
      group.add(snow);
    }

    // 4. Fog
    if (isFoggy) scene.fog = new THREE.FogExp2(0x8899aa, 0.08);
    else if (isRainy) scene.fog = new THREE.FogExp2(0x334455, 0.04);
    else scene.fog = null;

    // 5. Sun disc sprite (always visible on clear days)
    if (day) {
      // Sun disc
      const sunCanvas = document.createElement("canvas");
      sunCanvas.width = 128; sunCanvas.height = 128;
      const sctx = sunCanvas.getContext("2d")!;
      const sgrd = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      if (isClear) {
        sgrd.addColorStop(0, "rgba(255,250,200,1)");
        sgrd.addColorStop(0.3, "rgba(255,220,80,0.9)");
        sgrd.addColorStop(0.6, "rgba(255,160,20,0.4)");
        sgrd.addColorStop(1, "rgba(255,100,0,0)");
      } else {
        sgrd.addColorStop(0, "rgba(200,210,220,0.6)");
        sgrd.addColorStop(0.5, "rgba(150,170,190,0.2)");
        sgrd.addColorStop(1, "rgba(100,120,140,0)");
      }
      sctx.fillStyle = sgrd; sctx.fillRect(0, 0, 128, 128);
      const sunTex = new THREE.CanvasTexture(sunCanvas);
      const sunSpriteMat = new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const sunSprite = new THREE.Sprite(sunSpriteMat);
      // Place sun in sky: use sunElevRad and sunAzimRad but ensure it's in front of camera
      const skyR = Math.max(size.x, size.z) * 2.5;
      sunSprite.position.set(
        center.x + skyR * Math.sin(sunAzimRad) * Math.cos(sunElevRad),
        center.y + Math.max(skyR * Math.sin(sunElevRad), skyR * 0.3), // always above horizon
        center.z + skyR * Math.cos(sunAzimRad) * Math.cos(sunElevRad)
      );
      sunSprite.scale.setScalar(skyR * 0.25);
      sunSprite.userData.role = "sunDisc";
      group.add(sunSprite);

      // Lens flare ring (rotates slowly in animation loop)
      if (isClear) {
        const flareCanvas = document.createElement("canvas");
        flareCanvas.width = 128; flareCanvas.height = 128;
        const fctx = flareCanvas.getContext("2d")!;
        fctx.strokeStyle = "rgba(255,220,80,0.35)";
        fctx.lineWidth = 3;
        fctx.beginPath();
        fctx.arc(64, 64, 55, 0, Math.PI * 2);
        fctx.stroke();
        fctx.strokeStyle = "rgba(255,200,60,0.15)";
        fctx.lineWidth = 8;
        fctx.beginPath();
        fctx.arc(64, 64, 45, 0, Math.PI * 1.2);
        fctx.stroke();
        const flareTex = new THREE.CanvasTexture(flareCanvas);
        const flareMat = new THREE.SpriteMaterial({ map: flareTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const flareSprite = new THREE.Sprite(flareMat);
        flareSprite.position.copy(sunSprite.position);
        flareSprite.scale.setScalar(skyR * 0.4);
        flareSprite.userData.role = "lensFlare";
        group.add(flareSprite);
      }
    } else {
      // Night: moon disc + stars
      const moonCanvas = document.createElement("canvas");
      moonCanvas.width = 128; moonCanvas.height = 128;
      const mctx = moonCanvas.getContext("2d")!;
      const mgrd = mctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      mgrd.addColorStop(0, "rgba(220,230,255,1)");
      mgrd.addColorStop(0.4, "rgba(180,200,240,0.7)");
      mgrd.addColorStop(0.7, "rgba(120,150,200,0.2)");
      mgrd.addColorStop(1, "rgba(60,80,140,0)");
      mctx.fillStyle = mgrd; mctx.fillRect(0, 0, 128, 128);
      const moonTex = new THREE.CanvasTexture(moonCanvas);
      const moonMat = new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const moonSprite = new THREE.Sprite(moonMat);
      const skyR = Math.max(size.x, size.z) * 2.5;
      moonSprite.position.set(center.x + skyR * 0.3, center.y + skyR * 0.7, center.z - skyR * 0.5);
      moonSprite.scale.setScalar(skyR * 0.15);
      group.add(moonSprite);

      // Stars
      const starCount = 200;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.5; // upper hemisphere only
        const r = skyR * (1.5 + Math.random() * 0.5);
        starPos[i * 3]     = center.x + r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = center.y + r * Math.cos(phi);
        starPos[i * 3 + 2] = center.z + r * Math.sin(phi) * Math.sin(theta);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xeeeeff, size: 0.15, transparent: true, opacity: 0.9, sizeAttenuation: true });
      const stars = new THREE.Points(starGeo, starMat);
      stars.userData.role = "stars";
      group.add(stars);
    }

    scene.add(group);
    weatherGroupRef.current = group;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild weather when conditions change (live or simulated)
  useEffect(() => {
    if (sceneRef.current && modelCenterRef.current && modelSizeRef.current) {
      buildWeatherOverlay(sceneRef.current, modelCenterRef.current, modelSizeRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherCondition, isDay, precipitation, uvIndex, windDir, weatherSim]);

  // Animate rain/snow particles — called from the animation loop
  const animateWeatherParticles = useCallback((delta: number, elapsed: number) => {
    if (!weatherGroupRef.current) return;
    // Rotate lens flare ring
    weatherGroupRef.current.traverse(obj => {
      if (obj instanceof THREE.Sprite && obj.userData.role === "lensFlare") {
        obj.material.rotation = elapsed * 0.3;
      }
    });
    weatherGroupRef.current.traverse(obj => {
      if (!(obj instanceof THREE.Points)) return;
      const role = obj.userData.role as string;
      if (role !== "rain" && role !== "snow") return;
      const pos = obj.geometry.getAttribute("position") as THREE.BufferAttribute;
      const c = obj.userData.center as THREE.Vector3;
      const spread = obj.userData.spread as number;
      const sizeY = obj.userData.sizeY as number;
      const fallSpeed = role === "rain" ? 3.0 : 0.5;
      const drift = role === "snow" ? 0.12 : 0.0;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - fallSpeed * delta;
        if (y < c.y - sizeY * 0.5) {
          y = c.y + sizeY * 3;
          pos.setX(i, c.x + (Math.random() - 0.5) * spread);
          pos.setZ(i, c.z + (Math.random() - 0.5) * spread);
        }
        if (role === "snow") pos.setX(i, pos.getX(i) + Math.sin(elapsed * 0.5 + i * 0.1) * drift * delta);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    });
  }, []);

  // ── Wind direction arrows ─────────────────────────────────────────────────
  const buildWindArrows = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    // Remove existing wind arrows
    if (windArrowGroupRef.current) {
      scene.remove(windArrowGroupRef.current);
      windArrowGroupRef.current = null;
    }
    const group = new THREE.Group();
    const wDir = windDirRef.current; // meteorological: 0=from N, 90=from E
    // Convert met wind direction to Three.js angle (wind blows FROM wDir, so arrows move TO opposite)
    const arrowAngle = ((wDir + 180) % 360) * (Math.PI / 180);
    const spread = Math.max(size.x, size.z) * 0.8;
    const arrowCount = 6;
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(100,220,255,0.85)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    // Draw arrow pointing right (will be rotated by mesh)
    ctx.beginPath(); ctx.moveTo(8, 32); ctx.lineTo(56, 32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 18); ctx.lineTo(56, 32); ctx.lineTo(40, 46); ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75, depthTest: false });
    for (let i = 0; i < arrowCount; i++) {
      const sprite = new THREE.Sprite(mat.clone());
      sprite.scale.set(0.6, 0.3, 1);
      // Stagger positions across the yard
      const ox = (Math.random() - 0.5) * spread;
      const oz = (Math.random() - 0.5) * spread;
      sprite.position.set(center.x + ox, center.y + size.y * 0.5 + 1.5 + Math.random() * 1.5, center.z + oz);
      sprite.userData.role = "windArrow";
      sprite.userData.baseX = center.x + ox;
      sprite.userData.baseZ = center.z + oz;
      sprite.userData.phase = Math.random() * Math.PI * 2;
      sprite.userData.arrowAngle = arrowAngle;
      sprite.material.rotation = -arrowAngle + Math.PI / 2; // sprites face camera, rotate texture
      group.add(sprite);
    }
    scene.add(group);
    windArrowGroupRef.current = group;
  }, []);

  // ── Point cloud ─────────────────────────────────────────────────────
  const buildPointCloud = useCallback((scene: THREE.Scene, model: THREE.Group) => {
    if (pointCloudRef.current) { scene.remove(pointCloudRef.current); pointCloudRef.current = null; }
    const box = new THREE.Box3().setFromObject(model);
    const minY = box.min.y, rangeY = box.max.y - minY || 1;
    const pos: number[] = [], col: number[] = [];
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const attr = child.geometry.getAttribute("position");
      if (!attr) return;
      for (let i = 0; i < attr.count; i += 4) {
        const v = new THREE.Vector3(attr.getX(i), attr.getY(i), attr.getZ(i)).applyMatrix4(child.matrixWorld);
        pos.push(v.x, v.y, v.z);
        const t = (v.y - minY) / rangeY;
        if (t < 0.33) { pos; col.push(0.1 + t * 1.5, 0.8, 0.1); }
        else if (t < 0.66) { const s = (t - 0.33) / 0.33; col.push(0.6 + s * 0.4, 0.8 - s * 0.2, 0.1); }
        else { const s = (t - 0.66) / 0.34; col.push(1.0, 0.6 - s * 0.6, 0.1 - s * 0.1); }
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const pc = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.08, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
    scene.add(pc);
    pointCloudRef.current = pc;
  }, []);

  // ── Scene setup ───────────────────────────────────────────────────────────
  const setupScene = useCallback((container: HTMLDivElement) => {
    const w = container.clientWidth, h = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: !device.isMobile, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, device.isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Spark Gaussian Splatting renderer (lazy init, shared with THREE renderer) ──────────
    // SparkRenderer wraps the existing THREE.WebGLRenderer so splats render in the same pass.
    import('@sparkjsdev/spark').then(({ SparkRenderer }) => {
      sparkRendererRef.current = new SparkRenderer({ renderer });
    }).catch(() => { /* Spark unavailable, splat mode will show placeholder */ });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1a);
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.006);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 500);
    camera.position.set(0, 8, 20);
    cameraRef.current = camera;

    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    ambientLightRef.current = ambient;
    // Sun (animated)
    const sun = new THREE.DirectionalLight(0xfff5e0, 0.8);
    sun.position.set(20, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);
    sunLightRef.current = sun;
    // Fill
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    scene.add(new THREE.GridHelper(100, 50, 0x1a3a5c, 0x0d1f30));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 1.8;
    // On mobile, disable built-in touch so we handle it ourselves
    if (device.isTouch) {
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = false;
    }
    orbitControlsRef.current = controls;

    const loader = new GLTFLoader();
    loader.load(GLB_URL, (gltf) => {
      const model = gltf.scene;
      modelRef.current = model;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      // ── GIS-aligned scaling ──────────────────────────────────────────────────────────────────────────────────────
      // Real parcel (MAGIC GIS): 259 ft E-W (79.12m) × 68 ft N-S (20.70m)
      // The lot is WIDER east-west than it is deep north-south.
      // We scale so the model's longest horizontal axis = 40 scene units.
      // The GIS overlay uses size.x / YARD_W_M (79.12m) as the meters-to-units ratio,
      // so both the model and the GIS polygon share the same scale.
      // Back-of-house: N Columbus St is on the NORTH edge (model -Z or -X depending
      // on how the scan was captured). The backyard extends away from the street.
      // ── GIS orientation alignment ─────────────────────────────────────────────
      // The real parcel is 259 ft E-W (X axis) × 68 ft N-S (Z axis).
      // If the scan was captured with the long axis along Z (front-back), rotate
      // 90° around Y so the long axis aligns with X (left-right = east-west).
      // We detect this by comparing size.x vs size.z: if size.z > size.x, rotate.
      const baseRotY = size.z > size.x ? Math.PI / 2 : 0;
      if (baseRotY !== 0) {
        model.rotation.y = baseRotY; // 90° CCW — aligns long Z axis → X axis
        // Recompute bounding box after rotation
        model.updateMatrixWorld(true);
        const rotBox = new THREE.Box3().setFromObject(model);
        const rotCenter = rotBox.getCenter(new THREE.Vector3());
        const rotSize = rotBox.getSize(new THREE.Vector3());
        center.copy(rotCenter);
        size.copy(rotSize);
      }
      // Store base rotation so the fine-tune dial can add on top
      model.userData.baseRotationY = baseRotY;
      const longestH = Math.max(size.x, size.z); // horizontal longest dimension
      const scale = 40 / longestH; // 40 scene units = real lot's longest axis
      // Center the model at origin
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      model.scale.setScalar(scale);
      model.traverse(c => {
        if (c instanceof THREE.Mesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          // Fix texture encoding for our custom GLB converter
          // GLTF spec: flipY must be false; our converter flipped UVs so we need flipY=false
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach(mat => {
            const m = mat as THREE.MeshStandardMaterial;
            const textures = [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.emissiveMap, m.aoMap];
            textures.forEach(tex => {
              if (tex) {
                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
              }
            });
          });
        }
      });

      let totalPolys = 0;
      model.traverse(c => { if (c instanceof THREE.Mesh && c.geometry.index) totalPolys += c.geometry.index.count / 3; });
      scene.add(model);
      setPolyCount(Math.round(totalPolys));

      const nb = new THREE.Box3().setFromObject(model);
      const nc = nb.getCenter(new THREE.Vector3());
      const ns = nb.getSize(new THREE.Vector3());
      modelCenterRef.current.copy(nc);
      modelSizeRef.current.copy(ns);

      const camDist = Math.max(ns.x, ns.z) * 0.85;
      camera.position.set(nc.x + camDist * 0.4, nc.y + ns.y * 0.6, nc.z + camDist * 0.8);
      controls.target.copy(nc);
      controls.maxDistance = camDist * 4;
      controls.update();

      buildZoneMarkers(scene, nc, ns);
      buildRobotPath(scene, nc, ns);
      buildSprayPlane(scene, nc, ns);
      buildMapUnderlay(scene, nc, ns, mapUnderlayModeRef.current);
      buildGisBoundary(scene, nc, ns);
      buildWeatherOverlay(scene, nc, ns);
      buildWindArrows(scene, nc, ns);
      // Fleet markers and media frustum — use latest values from refs
      if (fleetAgentsRef.current.length > 0)
        buildFleetMarkers(scene, nc, ns, fleetAgentsRef.current);
      if (selectedMediaRef.current)
        buildMediaFrustum(scene, nc, ns, selectedMediaRef.current);

      setLoadState("loaded");
      localStorage.setItem("doge-glb-visited", "1"); // mark as visited so next load skips LiDAR-only
      setShowFullScanOffer(false);
      toast.success("🗺️ LiDAR scan loaded!", { description: `${totalPolys.toLocaleString()} tris · Tap zones to inspect`, duration: 3000 });
    }, (p) => {
      if (p.total > 0) {
        setLoadProgress(Math.round((p.loaded / p.total) * 100));
        setLoadedKB(Math.round(p.loaded / 1024));
        const now = Date.now();
        const dt = (now - loadSpeedRef.current.lastTime) / 1000;
        if (dt >= 0.5) {
          const dBytes = p.loaded - loadSpeedRef.current.lastBytes;
          setLoadSpeedKBs(Math.round(dBytes / 1024 / dt));
          loadSpeedRef.current = { lastBytes: p.loaded, lastTime: now };
        }
      }
    },
    (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GLTFLoader error]', msg, err);
      // Show the actual error in the UI subtitle for debugging
      setGlbErrorMsg(msg.slice(0, 120));
      setLoadState("error");
    });

    // Animation loop
    let lastFps = performance.now(), frames = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();
      frames++;
      const now = performance.now();
      if (now - lastFps > 500) { setFps(Math.round(frames / ((now - lastFps) / 1000))); frames = 0; lastFps = now; }

      // Zone pulse
      zoneMarkersRef.current.forEach((zm, i) => {
        zm.ring.scale.setScalar(1 + 0.15 * Math.sin(elapsed * 2 + i * 1.2));
        (zm.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + 0.4 * Math.sin(elapsed * 1.5 + i);
      });

      // Robot path animation
      if (robotDotRef.current && pathPointsRef.current.length > 1) {
        if (!isScrubbing.current) {
          robotTRef.current += delta * 0.04 * playbackSpeedRef.current;
          if (robotTRef.current > 1) robotTRef.current = 0.4;
        }
        const pts = pathPointsRef.current;
        const t = robotTRef.current * (pts.length - 1);
        const idx = Math.floor(t);
        if (idx < pts.length - 1) {
          const pos = new THREE.Vector3().lerpVectors(pts[idx], pts[idx + 1], t - idx);
          robotDotRef.current.position.copy(pos);
          robotDotRef.current.position.y += isScrubbing.current ? 0.12 : 0.12 * Math.sin(elapsed * 4);
          // Spray heatmap update
          if (isSprayActiveRef.current && showSprayRef.current) updateSprayHeatmap();
        }
      }

      // Fleet marker animations: drone bob + active ring pulse
      if (fleetGroupRef.current) {
        fleetGroupRef.current.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.Sprite)) return;
          const ud = obj.userData as { agentType?: string; agentStatus?: string; role?: string; baseY?: number };
          if (ud.role === "cone" && ud.agentType === "drone" && ud.agentStatus === "online") {
            // Slow vertical bob: ±0.08 units at 0.8 Hz
            if (ud.baseY === undefined) ud.baseY = obj.position.y;
            obj.position.y = ud.baseY + 0.08 * Math.sin(elapsed * 5.0);
          }
          if (ud.role === "ring") {
            if (ud.agentStatus === "online") {
              // Pulsing scale 0.8 → 1.4 at 1.5 Hz
              const s = 1.1 + 0.3 * Math.sin(elapsed * 9.4);
              obj.scale.setScalar(s);
              (obj.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.25 * Math.abs(Math.sin(elapsed * 9.4));
            } else {
              // Standby: slow dim pulse
              obj.scale.setScalar(1.0);
              (obj.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.1 * Math.sin(elapsed * 2);
            }
          }
        });
      }

      // GPS breadcrumb trail — record position every 2 seconds
      if (robotDotRef.current && showBreadcrumbRef.current) {
        const now = performance.now();
        if (now - lastBreadcrumbTimeRef.current > 2000) {
          lastBreadcrumbTimeRef.current = now;
          const pos = robotDotRef.current.position.clone();
          breadcrumbsRef.current.push(pos);
          // Keep last 60 points (2 min of trail)
          if (breadcrumbsRef.current.length > 60) breadcrumbsRef.current.shift();
          // Rebuild breadcrumb line
          if (breadcrumbLineRef.current) {
            scene.remove(breadcrumbLineRef.current);
            breadcrumbLineRef.current.geometry.dispose();
            breadcrumbLineRef.current = null;
          }
          if (breadcrumbsRef.current.length >= 2) {
            const geom = new THREE.BufferGeometry().setFromPoints(breadcrumbsRef.current);
            const mat = new THREE.LineBasicMaterial({ color: 0xffee44, transparent: true, opacity: 0.55, linewidth: 2 });
            const line = new THREE.Line(geom, mat);
            breadcrumbLineRef.current = line;
            scene.add(line);
          }
        }
      }

      // WASD fly + joystick fly
      if (cameraRef.current && (cameraModeRef.current === "fly" || cameraModeRef.current === "pov")) {
        const speed = 8 * delta;
        const fwd = new THREE.Vector3();
        cameraRef.current.getWorldDirection(fwd);
        const right = new THREE.Vector3().crossVectors(fwd, cameraRef.current.up).normalize();
        // Keyboard
        if (keysRef.current['w']) cameraRef.current.position.addScaledVector(fwd, speed);
        if (keysRef.current['s']) cameraRef.current.position.addScaledVector(fwd, -speed);
        if (keysRef.current['a']) cameraRef.current.position.addScaledVector(right, -speed);
        if (keysRef.current['d']) cameraRef.current.position.addScaledVector(right, speed);
        if (keysRef.current[' ']) cameraRef.current.position.y += speed;
        if (keysRef.current['shift']) cameraRef.current.position.y -= speed;
        // Left joystick: forward/back + strafe
        const lx = leftStickRef.current.x;
        const ly = leftStickRef.current.y;
        if (Math.abs(lx) > 0.05 || Math.abs(ly) > 0.05) {
          cameraRef.current.position.addScaledVector(fwd, -ly * speed * 1.5);
          cameraRef.current.position.addScaledVector(right, lx * speed * 1.5);
        }
        // Right joystick: look (yaw + pitch)
        const rx = rightStickRef.current.x;
        const ry = rightStickRef.current.y;
        if (Math.abs(rx) > 0.05 || Math.abs(ry) > 0.05) {
          flyYawRef.current -= rx * delta * 2.0;
          flyPitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, flyPitchRef.current - ry * delta * 1.5));
          cameraRef.current.quaternion.setFromEuler(new THREE.Euler(flyPitchRef.current, flyYawRef.current, 0, "YXZ"));
        }
      }

      // Animate weather particles (rain fall, snow drift)
      animateWeatherParticles(delta, elapsed);

      // Animate wind arrows — drift in wind direction
      if (windArrowGroupRef.current) {
        windArrowTimeRef.current += delta;
        const wSpeed = (windDir ?? 8) / 10; // normalize 0-2.5 range using live windDir prop
        windArrowGroupRef.current.children.forEach((obj) => {
          const sprite = obj as THREE.Sprite;
          if (sprite.userData.role !== "windArrow") return;
          const angle = sprite.userData.arrowAngle as number;
          const phase = sprite.userData.phase as number;
          const drift = wSpeed * delta * 0.8;
          sprite.position.x += Math.sin(angle) * drift;
          sprite.position.z += Math.cos(angle) * drift;
          // Wrap around yard bounds
          const spread = 3;
          if (Math.abs(sprite.position.x - (sprite.userData.baseX as number)) > spread ||
              Math.abs(sprite.position.z - (sprite.userData.baseZ as number)) > spread) {
            sprite.position.x = sprite.userData.baseX as number;
            sprite.position.z = sprite.userData.baseZ as number;
          }
          // Fade in/out with sine wave
          sprite.material.opacity = 0.4 + 0.35 * Math.sin(windArrowTimeRef.current * 1.2 + phase);
        });
      }

      // Spray window zone pulse — pulse Zone A/B marker rings green when spray is OK
      if (isSprayActiveRef.current) {
        sprayPulseRef.current += delta;
        const pulseAlpha = 0.15 + 0.12 * Math.sin(sprayPulseRef.current * 3);
        zoneMarkersRef.current.forEach((zm) => {
          if (zm.zoneId === "A" || zm.zoneId === "B") {
            const mat = zm.ring.material as THREE.MeshBasicMaterial;
            if (mat) {
              mat.color.setHex(0x00ff88);
              mat.opacity = pulseAlpha + 0.2;
            }
          }
        });
      }

      // Animate parcel corner ticks — slow clockwise opacity pulse
      if (parcelCornersRef.current) {
        const tickAlpha = 0.5 + 0.4 * Math.sin(elapsed * 0.7);
        parcelCornersRef.current.children.forEach((line, i) => {
          const mat = (line as THREE.Line).material as THREE.LineBasicMaterial;
          if (mat) mat.opacity = Math.max(0.1, tickAlpha - (i % 8) * 0.04);
        });
      }

      // Animate GIS boundary — pulsing magenta border + corner label fade
      if (gisBoundaryGroupRef.current) {
        const gisPulse = 0.7 + 0.3 * Math.sin(elapsed * 1.2);
        gisBoundaryGroupRef.current.traverse((obj) => {
          const ud = obj.userData as { role?: string };
          if (ud.role === "gisBorder") {
            const m = (obj as THREE.LineLoop).material as THREE.LineBasicMaterial;
            if (m) m.opacity = gisPulse;
          }
          if (ud.role === "gisCornerLabel" || ud.role === "gisCenterLabel") {
            const m = (obj as THREE.Sprite).material as THREE.SpriteMaterial;
            if (m) m.opacity = 0.6 + 0.35 * Math.sin(elapsed * 0.8);
          }
        });
      }

      // Compass heading: project camera forward onto XZ plane, compute azimuth
      if (cameraRef.current) {
        const fwdC = new THREE.Vector3();
        cameraRef.current.getWorldDirection(fwdC);
        // atan2(x, z) gives angle from +Z (south in our scene) — negate for north-up
        const azRad = Math.atan2(fwdC.x, fwdC.z);
        const azDeg = ((azRad * 180) / Math.PI + 360) % 360;
        setCompassHeading(Math.round(azDeg));
      }
      controls.update();
      renderer.render(scene, camera);
      // Spark splat pass (no-op when SparkRenderer not yet initialized or no splats)
      sparkRendererRef.current?.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const cw = container.clientWidth, ch = container.clientHeight;
      if (cameraRef.current) { cameraRef.current.aspect = cw / ch; cameraRef.current.updateProjectionMatrix(); }
      renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  // CRITICAL: isSprayActive, showSpray, cameraMode, showBreadcrumb are intentionally
  // excluded from this dep array. They are read via refs (isSprayActiveRef, showSprayRef,
  // cameraModeRef, showBreadcrumbRef) inside the animation loop so the scene is never
  // rebuilt when they change — preventing the infinite THREE.Clock loop.
  }, [device.isMobile, device.isTouch, buildZoneMarkers, buildRobotPath, buildSprayPlane, buildPointCloud, updateSprayHeatmap, buildGisBoundary, loadAttempt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mountRef.current) return;
    const cleanup = setupScene(mountRef.current);
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      cleanup?.();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current && rendererRef.current.domElement.parentNode === mountRef.current)
          mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [setupScene]);

  // Spray plane visibility
  useEffect(() => {
    if (sprayMeshRef.current) sprayMeshRef.current.visible = isSprayActive && showSpray;
  }, [isSprayActive, showSpray]);

  // ── 30-second auto-fallback timeout ──────────────────────────────────────────
  // If the GLB hasn't loaded within 30s on slow LTE, auto-switch to LiDAR-only mode
  useEffect(() => {
    if (loadState === "loading") {
      loadTimeoutRef.current = setTimeout(() => {
        // Only trigger if still loading (not already loaded or errored)
        setLoadState(prev => {
          if (prev === "loading") {
            toast.warning("📡 Slow connection detected", {
              description: "Switching to LiDAR-only mode for faster load",
              duration: 5000,
            });
            setUseFallbackMode(true);
            setRenderMode("pointcloud");
            return "loaded";
          }
          return prev;
        });
      }, 30000);
    } else {
      // Clear timeout if load succeeded or errored before 30s
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [loadState]);

  // Render mode
  useEffect(() => {
    if (!modelRef.current || !sceneRef.current) return;
    if (renderMode === "pointcloud") {
      if (!pointCloudRef.current && modelRef.current) buildPointCloud(sceneRef.current, modelRef.current);
      if (pointCloudRef.current) pointCloudRef.current.visible = true;
      modelRef.current.visible = false;
    } else {
      if (pointCloudRef.current) pointCloudRef.current.visible = false;
      modelRef.current.visible = true;
      modelRef.current.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const mat = child.material as THREE.MeshStandardMaterial;
        switch (renderMode) {
          case "textured": mat.wireframe = false; mat.opacity = 1; mat.transparent = false; mat.color.set(0xffffff); break;
          case "wireframe": mat.wireframe = true; mat.opacity = 1; mat.transparent = false; mat.color.set(0x00ff88); break;
          case "lidar": mat.wireframe = false; mat.opacity = 1; mat.transparent = false; mat.color.set(0x00ffcc); if (mat.map) mat.map = null; break;
          case "xray": mat.wireframe = false; mat.opacity = 0.3; mat.transparent = true; mat.color.set(0x4488ff); break;
        }
        mat.needsUpdate = true;
      });
    }
  }, [renderMode, buildPointCloud]);

  useEffect(() => { zoneMarkersRef.current.forEach(zm => { zm.mesh.visible = showZones; zm.ring.visible = showZones; }); }, [showZones]);
  useEffect(() => { if (robotDotRef.current) robotDotRef.current.visible = showPath; if (pathLineRef.current) pathLineRef.current.visible = showPath; }, [showPath]);
  // GIS boundary visibility toggle
  useEffect(() => {
    if (gisBoundaryGroupRef.current) gisBoundaryGroupRef.current.visible = showGisBoundary;
    if (parcelBoundaryRef.current) parcelBoundaryRef.current.visible = showGisBoundary;
    if (parcelCornersRef.current) parcelCornersRef.current.visible = showGisBoundary;
  }, [showGisBoundary]);

  // Camera angle presets for multi-angle inspection
  const snapToAngle = useCallback((angle: "overhead" | "south" | "east" | "west" | "north") => {
    if (!cameraRef.current || !orbitControlsRef.current) return;
    const c = modelCenterRef.current, s = modelSizeRef.current;
    const d = Math.max(s.x, s.z) * 1.1;
    orbitControlsRef.current.enabled = true;
    if (!device.isTouch) { orbitControlsRef.current.enableZoom = true; orbitControlsRef.current.enablePan = true; orbitControlsRef.current.enableRotate = true; }
    switch (angle) {
      case "overhead":
        cameraRef.current.position.set(c.x, c.y + d * 2.2, c.z);
        orbitControlsRef.current.target.set(c.x, c.y, c.z);
        break;
      case "south": // Looking north from the south end (backyard view)
        cameraRef.current.position.set(c.x, c.y + s.y * 0.4, c.z + d * 1.4);
        orbitControlsRef.current.target.set(c.x, c.y, c.z - s.z * 0.2);
        break;
      case "north": // Looking south from the north end (house back wall view)
        cameraRef.current.position.set(c.x, c.y + s.y * 0.4, c.z - d * 1.4);
        orbitControlsRef.current.target.set(c.x, c.y, c.z + s.z * 0.2);
        break;
      case "east":
        cameraRef.current.position.set(c.x + d * 1.4, c.y + s.y * 0.5, c.z);
        orbitControlsRef.current.target.set(c.x, c.y, c.z);
        break;
      case "west":
        cameraRef.current.position.set(c.x - d * 1.4, c.y + s.y * 0.5, c.z);
        orbitControlsRef.current.target.set(c.x, c.y, c.z);
        break;
    }
    orbitControlsRef.current.update();
    setCameraMode("orbit");
  }, [device.isTouch]);

  // Camera mode
  const switchCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);
    if (!cameraRef.current || !orbitControlsRef.current) return;
    const c = modelCenterRef.current, s = modelSizeRef.current;
    if (mode === "orbit") {
      orbitControlsRef.current.enabled = true;
      if (!device.isTouch) { orbitControlsRef.current.enableZoom = true; orbitControlsRef.current.enablePan = true; orbitControlsRef.current.enableRotate = true; }
      cameraRef.current.position.set(c.x, c.y + s.y * 0.6, c.z + s.z * 1.0);
      orbitControlsRef.current.target.copy(c);
      orbitControlsRef.current.update();
    } else if (mode === "pov") {
      orbitControlsRef.current.enabled = false;
      cameraRef.current.position.set(c.x, c.y - s.y * 0.25, c.z + s.z * 0.2);
      cameraRef.current.lookAt(c.x, c.y - s.y * 0.25, c.z - s.z * 0.5);
    } else {
      orbitControlsRef.current.enabled = false;
      cameraRef.current.position.set(c.x, c.y + s.y * 0.3, c.z + s.z * 0.5);
      cameraRef.current.lookAt(c);
      if (!device.isMobile) toast.info("🕹️ WASD + Space/Shift + drag to fly");
    }
  };

  const resetCamera = () => {
    if (!cameraRef.current || !orbitControlsRef.current) return;
    const c = modelCenterRef.current, s = modelSizeRef.current;
    cameraRef.current.position.set(c.x, c.y + s.y * 0.6, c.z + s.z * 1.2);
    orbitControlsRef.current.target.copy(c);
    orbitControlsRef.current.enabled = true;
    if (!device.isTouch) { orbitControlsRef.current.enableZoom = true; orbitControlsRef.current.enablePan = true; orbitControlsRef.current.enableRotate = true; }
    orbitControlsRef.current.update();
    setCameraMode("orbit");
  };

  // ── Measure tool helpers ─────────────────────────────────────────────────
  const clearMeasure = useCallback(() => {
    if (!sceneRef.current) return;
    if (measureLineRef.current) { sceneRef.current.remove(measureLineRef.current); measureLineRef.current = null; }
    measureDotsRef.current.forEach(d => sceneRef.current!.remove(d));
    measureDotsRef.current = [];
    measurePointsRef.current = [];
    setMeasureResult(null);
    setMeasureScreenPoints([]);
  }, []);

  const addMeasurePoint = useCallback((clientX: number, clientY: number) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current || !modelRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const hits = raycasterRef.current.intersectObject(modelRef.current, true);
    if (hits.length === 0) return;
    const pt = hits[0].point.clone();
    measurePointsRef.current.push(pt);
    // Add a dot marker
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    dot.position.copy(pt);
    sceneRef.current.add(dot);
    measureDotsRef.current.push(dot);
    // Screen point for label
    setMeasureScreenPoints(prev => [...prev, { x: clientX - rect.left, y: clientY - rect.top }]);

    if (measurePointsRef.current.length === 2) {
      const [p1, p2] = measurePointsRef.current;
      // Draw line
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 }));
      sceneRef.current.add(line);
      measureLineRef.current = line;
      // Calculate distance — model scale: the GLB is roughly 20m wide for a ~60ft yard
      // Approximate scale: 1 Three.js unit ≈ 3.28 feet
      const dist3d = p1.distanceTo(p2);
      const SCALE_FT_PER_UNIT = 3.28;
      const distFt = dist3d * SCALE_FT_PER_UNIT;
      const distSqFt = distFt * distFt; // square footage if used as side
      setMeasureResult({ dist3d, distFt, distSqFt });
      toast.success(`📏 Measured: ${distFt.toFixed(1)} ft`, { description: `~${Math.round(distSqFt)} sq ft if square` });
    } else if (measurePointsRef.current.length > 2) {
      // Reset and start fresh
      clearMeasure();
      addMeasurePoint(clientX, clientY);
    }
  }, [clearMeasure]);

  // ── Touch event handlers ─────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches: React.Touch[] = Array.from(e.touches);
    touchRef.current.touches = touches;
    if (touches.length === 2) {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      touchRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
      touchRef.current.lastMidX = (touches[0].clientX + touches[1].clientX) / 2;
      touchRef.current.lastMidY = (touches[0].clientY + touches[1].clientY) / 2;
    } else if (touches.length === 1) {
      mouseRef.current = { isDown: true, lastX: touches[0].clientX, lastY: touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches: React.Touch[] = Array.from(e.touches);
    if (!cameraRef.current || !orbitControlsRef.current) return;

    if (touches.length === 2) {
      // Pinch to zoom
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = touchRef.current.lastDist - dist;
      const fwd = new THREE.Vector3();
      cameraRef.current.getWorldDirection(fwd);
      cameraRef.current.position.addScaledVector(fwd, delta * 0.12);
      touchRef.current.lastDist = dist;

      // Two-finger pan
      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;
      const panDx = midX - touchRef.current.lastMidX;
      const panDy = midY - touchRef.current.lastMidY;
      const right = new THREE.Vector3().crossVectors(fwd, cameraRef.current.up).normalize();
      cameraRef.current.position.addScaledVector(right, -panDx * 0.04);
      cameraRef.current.position.y += panDy * 0.04;
      orbitControlsRef.current.target.addScaledVector(right, -panDx * 0.04);
      orbitControlsRef.current.target.y += panDy * 0.04;
      touchRef.current.lastMidX = midX;
      touchRef.current.lastMidY = midY;
    } else if (touches.length === 1 && mouseRef.current.isDown) {
      // One-finger orbit
      const dx = touches[0].clientX - mouseRef.current.lastX;
      const dy = touches[0].clientY - mouseRef.current.lastY;
      mouseRef.current.lastX = touches[0].clientX;
      mouseRef.current.lastY = touches[0].clientY;

      if (cameraMode === "orbit") {
        // Orbit around target
        const target = orbitControlsRef.current.target;
        const offset = cameraRef.current.position.clone().sub(target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta -= dx * 0.008;
        spherical.phi -= dy * 0.008;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 1.8, spherical.phi));
        offset.setFromSpherical(spherical);
        cameraRef.current.position.copy(target).add(offset);
        cameraRef.current.lookAt(target);
      } else {
        // Fly look
        flyYawRef.current -= dx * 0.004;
        flyPitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, flyPitchRef.current - dy * 0.004));
        cameraRef.current.quaternion.setFromEuler(new THREE.Euler(flyPitchRef.current, flyYawRef.current, 0, "YXZ"));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchRef.current.touches = Array.from(e.touches) as React.Touch[];
    if (e.touches.length === 0) {
      mouseRef.current.isDown = false;
      // Tap to select zone or add measure point
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        if (measureMode) {
          addMeasurePoint(t.clientX, t.clientY);
        } else {
          handleRayCast(t.clientX, t.clientY);
        }
      }
    }
  };

  // Mouse handlers (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cameraMode === "orbit") return;
    mouseRef.current = { isDown: true, lastX: e.clientX, lastY: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseRef.current.isDown || cameraMode === "orbit" || !cameraRef.current) return;
    const dx = e.clientX - mouseRef.current.lastX;
    const dy = e.clientY - mouseRef.current.lastY;
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
    flyYawRef.current -= dx * 0.003;
    flyPitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, flyPitchRef.current - dy * 0.003));
    cameraRef.current.quaternion.setFromEuler(new THREE.Euler(flyPitchRef.current, flyYawRef.current, 0, "YXZ"));
  };
  const handleMouseUp = () => { mouseRef.current.isDown = false; };

  // Helper: raycast a click to a 3D world point on the model or ground plane
  const raycastWorldPoint = (clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!mountRef.current || !cameraRef.current) return null;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    if (modelRef.current) {
      const meshes: THREE.Mesh[] = [];
      modelRef.current.traverse(obj => { if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh); });
      const hits = raycasterRef.current.intersectObjects(meshes, false);
      if (hits.length > 0) return hits[0].point.clone();
    }
    // Fallback: ground plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(plane, target);
    return target;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // True North calibration intercepts clicks when active
    if (calibStep === 'picking_p1') {
      const pt = raycastWorldPoint(e.clientX, e.clientY);
      if (pt) {
        setCalibP1(pt);
        setCalibStep('picking_p2');
        toast.info('② Calibration: click Point 2 on the model (e.g. NE corner of house)', { duration: 5000 });
      }
      return;
    }
    if (calibStep === 'picking_p2') {
      const pt = raycastWorldPoint(e.clientX, e.clientY);
      if (pt && calibP1) {
        // The vector from P1 (NW) to P2 (NE) should point due East (+X in GIS coords)
        // Compute the angle between the P1→P2 vector and the +X axis in the XZ plane
        const dx = pt.x - calibP1.x;
        const dz = pt.z - calibP1.z;
        // Angle of P1→P2 in XZ plane (atan2 gives angle from +X axis)
        const scanAngle = Math.atan2(dz, dx); // radians, 0 = pointing East
        // We want this vector to point East (0 rad), so the correction is -scanAngle
        const offsetDeg = -(scanAngle * 180) / Math.PI;
        setCalibOffset(offsetDeg);
        setModelRotationDeg(prev => {
          const newRot = prev + offsetDeg;
          return Math.round(((newRot % 360) + 360) % 360 > 180 ? newRot - 360 : newRot);
        });
        setCalibStep('done');
        toast.success(`✓ True North offset: ${offsetDeg.toFixed(1)}° applied`, {
          description: 'Model rotated to align NW→NE vector with true east',
          duration: 4000,
        });
      }
      return;
    }
    if (measureMode) {
      addMeasurePoint(e.clientX, e.clientY);
      return;
    }
    handleRayCast(e.clientX, e.clientY);
  };

  // ── Draw Zone helpers ─────────────────────────────────────────────────────
  const addDrawVert = useCallback((clientX: number, clientY: number) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    // Try to hit the model first, fallback to ground plane
    let worldPt: THREE.Vector3 | null = null;
    if (modelRef.current) {
      const meshes: THREE.Mesh[] = [];
      modelRef.current.traverse(obj => { if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh); });
      const hits = raycasterRef.current.intersectObjects(meshes, false);
      if (hits.length > 0) worldPt = hits[0].point.clone();
    }
    if (!worldPt) {
      // Fallback: intersect with y=0 ground plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const target = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, target);
      worldPt = target;
    }
    const screen = { x: clientX - rect.left, y: clientY - rect.top };
    setDrawVerts(prev => {
      const next = [...prev, { world: worldPt!, screen }];
      if (next.length >= 3) {
        toast.info(`📐 ${next.length} vertices placed — tap ✓ to confirm zone or keep adding (max 8)`);
      } else {
        toast.info(`📍 Point ${next.length} placed — tap ${next.length < 3 ? "at least " + (3 - next.length) + " more" : "✓ to confirm"}`);
      }
      return next;
    });
  }, []);

  const confirmDrawZone = useCallback(() => {
    setShowZoneNameDialog(true);
  }, []);

  const finalizeDrawZone = useCallback((name: string, treatment: string) => {
    if (!sceneRef.current || drawVerts.length < 3) return;
    const color = ZONE_COLORS[customZones.length % ZONE_COLORS.length];
    const verts = drawVerts.map(v => v.world);
    const screenVerts = drawVerts.map(v => v.screen);

    // Build a flat polygon mesh on the ground plane
    const shape = new THREE.Shape();
    shape.moveTo(verts[0].x, verts[0].z);
    for (let i = 1; i < verts.length; i++) shape.lineTo(verts[i].x, verts[i].z);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    // Rotate to lie flat (XZ plane)
    geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    const avgY = verts.reduce((s, v) => s + v.y, 0) / verts.length + 0.02;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = avgY;
    sceneRef.current.add(mesh);

    // Add a sphere marker at centroid
    const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length;
    const cz = verts.reduce((s, v) => s + v.z, 0) / verts.length;
    const sphereGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(cx, avgY + 0.12, cz);
    sceneRef.current.add(sphere);

    const newZone: CustomZone = {
      id: `custom-${Date.now()}`,
      name,
      vertices: verts,
      screenVerts,
      color,
      treatment,
      mesh,
      sphere,
    };
    setCustomZones(prev => [...prev, newZone]);
    setDrawVerts([]);
    setDrawZoneMode(false);
    setShowZoneNameDialog(false);
    toast.success(`✅ Zone "${name}" created! Treatment: ${treatment}`);
  }, [drawVerts, customZones, ZONE_COLORS]);

  const cancelDrawZone = useCallback(() => {
    setDrawVerts([]);
    setDrawZoneMode(false);
    setShowZoneNameDialog(false);
    toast.info("Zone drawing cancelled");
  }, []);

  const deleteCustomZone = useCallback((zoneId: string) => {
    setCustomZones(prev => {
      const zone = prev.find(z => z.id === zoneId);
      if (zone && sceneRef.current) {
        if (zone.mesh) sceneRef.current.remove(zone.mesh);
        if (zone.sphere) sceneRef.current.remove(zone.sphere);
      }
      return prev.filter(z => z.id !== zoneId);
    });
    toast.info("Custom zone removed");
  }, []);

  const handleRayCast = (clientX: number, clientY: number) => {
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    // If in draw zone mode, add a vertex instead
    if (drawZoneMode && !showZoneNameDialog) {
      addDrawVert(clientX, clientY);
      return;
    }
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const hits = raycasterRef.current.intersectObjects(zoneMarkersRef.current.map(zm => zm.mesh), false);
    if (hits.length > 0) {
      const zoneId = hits[0].object.userData.zoneId as string;
      setSelectedZone({ id: zoneId, screenX: clientX - rect.left, screenY: clientY - rect.top });
      try { navigator.vibrate?.(15); } catch { /* ignore */ }
    } else {
      setSelectedZone(null);
    }
  };

  const selectedZoneDef = selectedZone ? ZONE_DEFS.find(z => z.id === selectedZone.id) : null;
  const selectedStatus = selectedZone ? zoneStatuses[selectedZone.id] : null;

  // Sun time display
  const sunHourInt = Math.floor(sunHour);
  const sunMin = Math.floor((sunHour - sunHourInt) * 60);
  const sunLabel = `${sunHourInt % 12 || 12}:${sunMin.toString().padStart(2, "0")} ${sunHourInt < 12 ? "AM" : "PM"}`;
  const isDaytime = sunHour >= 6 && sunHour <= 20;

  return (
    <div className="relative w-full h-full bg-[#0a0f1a] overflow-hidden rounded-xl select-none">
      {/* Three.js canvas */}
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{ cursor: cameraMode !== "orbit" ? "crosshair" : "grab", touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Loading */}
      <AnimatePresence>
        {loadState === "loading" && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1a]/95 z-30"
          >
            <div className="space-y-4 text-center px-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center"><Layers size={24} className="text-cyan-400" /></div>
                <motion.div className="absolute left-0 right-0 h-px bg-cyan-400/80"
                  animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
              </div>
              <div>
                <p className="text-cyan-400 font-mono text-sm font-bold">LOADING LIDAR SCAN</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-white/40 text-xs">905 Backyard · 30MB · 655K tris</p>
                  {glbCached && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-500/20 border border-green-400/30 text-green-400">⚡ CACHED</span>
                  )}
                </div>
                {device.isMobile && <p className="text-yellow-400/70 text-[10px] mt-1">📱 Touch optimized for iPhone</p>}
              </div>
              <div className="w-52 mx-auto space-y-1.5">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"
                    style={{ width: `${loadProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
                {/* Progress details row */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">
                    {loadedKB > 0 ? `${(loadedKB / 1024).toFixed(1)} / 23.0 MB` : "Connecting…"}
                  </span>
                  <span className="text-[10px] font-mono">
                    {loadSpeedKBs > 0
                      ? <span className={loadSpeedKBs < 100 ? "text-yellow-400" : "text-cyan-400"}>{loadSpeedKBs} KB/s</span>
                      : <span className="text-white/30">—</span>
                    }
                  </span>
                </div>
                {/* ETA estimate */}
                {loadSpeedKBs > 0 && loadProgress < 99 && (
                  <p className="text-[9px] text-white/25 font-mono text-center">
                    ~{Math.max(1, Math.ceil((23 * 1024 - loadedKB) / loadSpeedKBs))}s remaining · auto-switches at 30s
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {loadState === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0a0f1a]/95 z-30"
          >
            <div className="text-center space-y-4 px-6">
              <div className="text-4xl">⚠️</div>
              <div>
                <p className="text-red-400 font-mono font-bold">Failed to load 3D scan</p>
                <p className="text-white/40 text-xs mt-1">{glbErrorMsg || "The 30MB LiDAR model timed out or network is slow"}</p>
              </div>
              <div className="flex flex-col gap-2 items-center">
                <button
                  onClick={() => { setLoadState("loading"); setLoadProgress(0); setLoadAttempt(a => a + 1); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm font-bold hover:bg-cyan-500/30 transition-all"
                >
                  <RotateCcw size={14} /> Retry Full Scan
                </button>
                <button
                  onClick={() => { setUseFallbackMode(true); setLoadState("loaded"); setRenderMode("pointcloud"); toast.info("📡 LiDAR-only mode — point cloud from geometry", { duration: 3000 }); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/10 border border-green-400/30 text-green-300 text-sm hover:bg-green-500/20 transition-all"
                >
                  <Zap size={14} /> Use LiDAR-Only Mode (~5MB)
                </button>
              </div>
              <p className="text-white/25 text-[10px]">LiDAR-only renders point cloud without textures</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      {loadState === "loaded" && (
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] font-mono text-cyan-400">LIDAR ACTIVE</span>
            </div>
            {!device.isMobile && (
              <div className="glass rounded-lg px-2 py-1">
                <span className="text-[9px] font-mono text-white/50">{fps} FPS · {polyCount.toLocaleString()} tris</span>
              </div>
            )}
            {/* Sun indicator */}
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-1">
              <Sun size={9} className={isDaytime ? "text-yellow-400" : "text-blue-400"} />
              <span className="text-[9px] font-mono text-white/60">{sunLabel}</span>
            </div>
            {isSprayActive && (
              <div className="glass rounded-lg px-2 py-1 flex items-center gap-1">
                <Droplets size={9} className="text-green-400 animate-pulse" />
                <span className="text-[9px] font-mono text-green-400">SPRAYING</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="glass rounded-lg px-2 py-1 hidden sm:block">
              <span className="text-[9px] font-mono text-white/40">905 Backyard · West Liberty, IA</span>
            </div>
            {/* Load Full Scan — shown on first visit when in LiDAR-only mode */}
            {showFullScanOffer && useFallbackMode && (
              <button
                onClick={() => {
                  setUseFallbackMode(false);
                  setShowFullScanOffer(false);
                  setLoadState("loading");
                  setLoadProgress(0);
                  setLoadAttempt(a => a + 1);
                  setRenderMode("textured");
                  toast.info("🗺️ Loading full 3D scan", { description: "30MB textured model — may take 30s on LTE", duration: 4000 });
                }}
                className="glass rounded-lg px-2 py-1 text-cyan-400 hover:text-cyan-200 border border-cyan-400/30 hover:border-cyan-400/60 transition-all pointer-events-auto text-[9px] font-mono font-bold"
                title="Load full textured 3D scan"
              >
                ⚡ LOAD FULL SCAN
              </button>
            )}
            {/* Share 3D Scan — native iOS share sheet or clipboard fallback */}
            <button
              onClick={async () => {
                const url = window.location.href;
                const shareData = {
                  title: "DOGE-Landscaper — Backyard LiDAR Scan",
                  text: "Check out this 3D LiDAR scan of the backyard at 905 West Liberty, IA — tap zones to inspect treatment status.",
                  url,
                };
                try {
                  if (navigator.share && navigator.canShare?.(shareData)) {
                    await navigator.share(shareData);
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast.success("🔗 Link copied!", { description: "Paste it in iMessage or email", duration: 3000 });
                  }
                } catch (e) {
                  // User cancelled share — not an error
                  if ((e as Error).name !== "AbortError") {
                    await navigator.clipboard.writeText(url).catch(() => {});
                    toast.info("🔗 Link copied to clipboard", { duration: 2500 });
                  }
                }
              }}
              className="glass rounded-lg p-1.5 text-white/50 hover:text-white/90 transition-all pointer-events-auto"
              title="Share 3D scan"
            >
              <Share2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile: Touch hint (shows briefly) */}
      {loadState === "loaded" && device.isMobile && (
        <motion.div
          initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 5, duration: 1.5 }}
          className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="glass rounded-xl px-3 py-2 text-center">
            {cameraMode === "orbit"
              ? <p className="text-[10px] text-white/70">1 finger: orbit · 2 fingers: zoom/pan · tap zone: inspect</p>
              : <p className="text-[10px] text-white/70">Left stick: move · Right stick: look · Switch to Orbit for tap-select</p>
            }
          </div>
        </motion.div>
      )}

      {/* Minecraft/Roblox Dual Joystick — shown in Fly or POV mode on touch devices */}
      {loadState === "loaded" && device.isTouch && (cameraMode === "fly" || cameraMode === "pov") && (
        <DualJoystick
          onLeftMove={(s) => { leftStickRef.current = s; }}
          onRightMove={(s) => { rightStickRef.current = s; }}
          visible={true}
          size={device.isMobile ? 110 : 130}
        />
      )}

      {/* Controls panel — left column on desktop, right-side drawer on mobile */}
      {loadState === "loaded" && (
        <>
          {/* Mobile: floating toggle button — bottom-left, above bottom sheet */}
          {device.isMobile && (
            <button
              onClick={() => { setShowControls(v => !v); try { navigator.vibrate?.(10); } catch { /* ignore */ } }}
              className="absolute z-30 glass rounded-xl px-3 py-2 flex items-center gap-1.5 text-[10px] text-white/70 pointer-events-auto"
              style={{ bottom: `${bottomInset + 8}px`, left: '8px' }}
            >
              {showControls ? <ChevronDown size={12} /> : <Settings size={12} />}
              <span>{showControls ? 'Close' : 'Controls'}</span>
            </button>
          )}

          {/* Mobile: full-height right-side drawer */}
          {device.isMobile ? (
            <AnimatePresence>
              {showControls && (
                <>
                  {/* Backdrop tap-to-close */}
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-25 pointer-events-auto"
                    style={{ background: 'oklch(0 0 0 / 0.45)' }}
                    onClick={() => setShowControls(false)}
                  />
                  {/* Drawer panel */}
                  <motion.div
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    className="absolute right-0 top-0 z-30 flex flex-col pointer-events-auto"
                    style={{
                      width: '200px',
                      top: '52px',
                      bottom: `${bottomInset}px`,
                      background: 'oklch(0.10 0.018 260 / 0.97)',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      borderLeft: '1px solid oklch(1 0 0 / 0.12)',
                    }}
                  >
                    {/* Drawer header */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Controls</span>
                      <button onClick={() => setShowControls(false)} className="text-white/40 hover:text-white/80 p-1">
                        <X size={14} />
                      </button>
                    </div>
                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1.5" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {/* Camera */}
                <div className="glass rounded-xl p-1.5 space-y-1">
                  <p className="text-[8px] text-white/30 px-1 uppercase tracking-wider">Camera</p>
                  {([
                    { mode: "orbit" as CameraMode, icon: <RotateCcw size={12} />, label: "Orbit" },
                    { mode: "pov" as CameraMode, icon: <Eye size={12} />, label: "Robot POV" },
                    { mode: "fly" as CameraMode, icon: <Plane size={12} />, label: "Fly" },
                  ]).map(({ mode, icon, label }) => (
                    <button key={mode} onClick={() => switchCameraMode(mode)}
                      className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all pointer-events-auto ${
                        cameraMode === mode ? "glass-gold text-yellow-300 border border-yellow-400/30" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >{icon}{label}</button>
                  ))}
                </div>

                {/* Render */}
                <div className="glass rounded-xl p-1.5 space-y-1">
                  <p className="text-[8px] text-white/30 px-1 uppercase tracking-wider">Render</p>
                  {([
                    { mode: "textured" as RenderMode, icon: <Layers size={12} />, label: "Textured" },
                    { mode: "wireframe" as RenderMode, icon: <Move size={12} />, label: "Wireframe" },
                    { mode: "lidar" as RenderMode, icon: <Zap size={12} />, label: "LiDAR" },
                    { mode: "xray" as RenderMode, icon: <Eye size={12} />, label: "X-Ray" },
                    { mode: "pointcloud" as RenderMode, icon: <MapPin size={12} />, label: "Point Cloud" },
                  ]).map(({ mode, icon, label }) => (
                    <button key={mode} onClick={() => setRenderMode(mode)}
                      className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all pointer-events-auto ${
                        renderMode === mode ? "glass text-cyan-300 border border-cyan-400/30" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                      }`}
                    >{icon}{label}</button>
                  ))}
                </div>

                {/* Overlays */}
                <div className="glass rounded-xl p-1.5 space-y-1">
                  <p className="text-[8px] text-white/30 px-1 uppercase tracking-wider">Overlays</p>
                  {[
                    { key: "zones", label: "Zone Markers", icon: <MapPin size={12} />, active: showZones, toggle: () => setShowZones(v => !v), color: "text-green-300" },
                    { key: "path", label: "Robot Path", icon: <Route size={12} />, active: showPath, toggle: () => setShowPath(v => !v), color: "text-yellow-300" },
                    { key: "spray", label: "Spray Map", icon: <Droplets size={12} />, active: showSpray, toggle: () => setShowSpray(v => !v), color: "text-blue-300" },
                    { key: "breadcrumb", label: "GPS Breadcrumbs", icon: <Navigation size={12} />, active: showBreadcrumb, toggle: () => { setShowBreadcrumb(v => !v); if (breadcrumbLineRef.current && sceneRef.current) { breadcrumbLineRef.current.visible = !showBreadcrumb; } }, color: "text-orange-300" },
                    { key: "gis", label: "GIS Boundary", icon: <Share2 size={12} />, active: showGisBoundary, toggle: () => setShowGisBoundary(v => !v), color: "text-pink-400" },
                  ].map(({ key, label, icon, active, toggle, color }) => (
                    <button key={key} onClick={toggle}
                      className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all pointer-events-auto ${active ? color : "text-white/30"}`}
                    >{icon}{label}</button>
                  ))}
                  {/* Zone scrub shortcuts */}
                  {showPath && (
                    <div className="pt-1 border-t border-white/10">
                      <p className="text-[7px] text-white/20 px-1 mb-1 uppercase tracking-wider">Jump to zone</p>
                      <div className="grid grid-cols-4 gap-1">
                        {ZONE_DEFS.map(z => (
                          <button
                            key={z.id}
                            onClick={() => {
                              const t = ZONE_ENTRY_T[z.id] ?? 0;
                              robotTRef.current = t;
                              setScrubberT(t);
                              isScrubbing.current = true;
                              setTimeout(() => { isScrubbing.current = false; }, 800);
                            }}
                            className="rounded-lg py-1 text-[9px] font-bold transition-all pointer-events-auto hover:scale-105"
                            style={{ background: `${z.colorHex}22`, color: z.colorHex, border: `1px solid ${z.colorHex}44` }}
                          >
                            {z.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Map Underlay */}
                <div className="glass rounded-xl p-1.5 space-y-1">
                  <p className="text-[8px] text-white/30 px-1 uppercase tracking-wider">Map Underlay</p>
                  {([
                    { mode: "satellite" as const, label: "Satellite", emoji: "🛰️" },
                    { mode: "street" as const, label: "Street", emoji: "🗺️" },
                    { mode: "hybrid" as const, label: "Hybrid", emoji: "🌐" },
                    { mode: "none" as const, label: "None", emoji: "✕" },
                  ]).map(({ mode, label, emoji }) => (
                    <button key={mode} onClick={() => setMapUnderlayMode(mode)}
                      className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all pointer-events-auto ${
                        mapUnderlayMode === mode ? "glass text-cyan-300 border border-cyan-400/30" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                      }`}
                    ><span>{emoji}</span>{label}</button>
                  ))}
                  {mapUnderlayMode !== "none" && (
                    <div className="px-1 pt-1 border-t border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] text-white/30 uppercase tracking-wider">Opacity</span>
                        <span className="text-[9px] font-mono text-cyan-400">{mapUnderlayOpacity}%</span>
                      </div>
                      <Slider
                        min={0} max={100} step={5}
                        value={[mapUnderlayOpacity]}
                        onValueChange={([v]) => setMapUnderlayOpacity(v)}
                        className="pointer-events-auto"
                      />
                      <p className="text-[7px] text-white/25 font-mono">905 N Columbus St · West Liberty, IA</p>
                      <p className="text-[7px] text-white/20 font-mono">10/8/2025.usdz · 79.1m E–W × 20.7m N–S</p>
                    </div>
                  )}
                </div>

                {/* Mt. Siple Gaussian Splat — Cinematic teaser card */}
                <div
                  className="relative rounded-xl overflow-hidden pointer-events-auto cursor-pointer group"
                  style={{ border: '1px solid rgba(0,255,200,0.25)' }}
                  onClick={() => setShowMtSipleExperience(true)}
                >
                  {/* Background image */}
                  <img
                    src="/manus-storage/mtsiple-hero_34932031.jpg"
                    alt="Mt. Siple"
                    className="w-full h-20 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020b18]/95 via-[#020b18]/40 to-transparent" />
                  {/* Aurora shimmer top */}
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #00ffc8, #7b6fff, #00ffc8, transparent)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[7px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-500/30 font-bold uppercase tracking-wider">UPCOMING RELEASE</span>
                          {isMtSiple && <span className="text-[7px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full border border-green-500/30">ACTIVE</span>}
                        </div>
                        <p className="text-[10px] text-white font-bold leading-tight">🗻 Mt. Siple, Antarctica</p>
                        <p className="text-[8px] text-white/40">3,110 m · Marie Byrd Land · 3DGS</p>
                      </div>
                      <div className="text-white/40 group-hover:text-cyan-300 transition-colors text-lg">›</div>
                    </div>
                  </div>
                </div>
                {/* Quick swap button when splat is active */}
                {isMtSiple && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!sceneRef.current) return;
                      if (splatMeshRef.current) {
                        sceneRef.current.remove(splatMeshRef.current);
                        splatMeshRef.current = null;
                      }
                      if (modelRef.current) modelRef.current.visible = true;
                      sceneRef.current.background = new THREE.Color(0x0a0f1a);
                      sceneRef.current.fog = new THREE.FogExp2(0x0a0f1a, 0.006);
                      setIsMtSiple(false);
                      // Stop orbit animation
                      if (orbitControlsRef.current) {
                        orbitControlsRef.current.autoRotate = false;
                      }
                      toast.success('🏡 Restored West Liberty yard scan');
                    }}
                    className="w-full rounded-lg px-2 py-1.5 text-[9px] font-semibold pointer-events-auto border bg-sky-500/20 text-sky-200 border-sky-400/40 hover:bg-sky-500/30 transition-all"
                  >
                    🏡 Back to West Liberty
                  </button>
                )}

                {/* GIS Angle Presets */}
                <div className="glass rounded-xl p-1.5 space-y-1 pointer-events-auto">
                  <p className="text-[8px] text-white/30 px-1 uppercase tracking-wider">GIS Angles</p>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { a: "overhead" as const, label: "⬆ Overhead" },
                      { a: "south" as const,   label: "⬇ South" },
                      { a: "north" as const,   label: "🏠 House" },
                      { a: "east" as const,    label: "→ East" },
                      { a: "west" as const,    label: "← West" },
                    ]).map(({ a, label }) => (
                      <button
                        key={a}
                        onClick={() => snapToAngle(a)}
                        className="rounded-lg px-1 py-1.5 text-[9px] font-medium transition-all bg-pink-500/10 text-pink-300 border border-pink-500/25 hover:bg-pink-500/20 hover:text-pink-200 pointer-events-auto"
                      >{label}</button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (sceneRef.current && modelCenterRef.current && modelSizeRef.current) {
                        buildGisBoundary(sceneRef.current, modelCenterRef.current, modelSizeRef.current);
                        toast.success('Snapped to MAGIC GIS boundary', { description: 'Parcel 0112177049 · 259×68 ft · Surveyed' });
                      }
                    }}
                    className="w-full rounded-lg px-1 py-1.5 text-[9px] font-medium transition-all bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-600/35 hover:text-fuchsia-100 pointer-events-auto"
                  >GIS Snap</button>
                  <p className="text-[7px] text-white/20 px-1 font-mono">Parcel 0112177049 · 259×68 ft · Surveyed</p>
                </div>

                {/* Model Rotation Dial */}
                <div className="glass rounded-xl p-2 space-y-1.5 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-white/30 uppercase tracking-wider">Model Rotation</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-emerald-300">{modelRotationDeg}°</span>
                      <button
                        onClick={() => setModelRotationDeg(0)}
                        className="text-[7px] text-white/40 hover:text-white/80 ml-1"
                        title="Reset to auto-aligned orientation"
                      >Reset</button>
                    </div>
                  </div>
                  <Slider
                    min={-180}
                    max={180}
                    step={1}
                    value={[modelRotationDeg]}
                    onValueChange={([v]) => setModelRotationDeg(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[6px] text-white/20 font-mono px-0.5">
                    <span>-180°</span><span>0°</span><span>+180°</span>
                  </div>
                  {/* Satellite ground plane toggle */}
                  <button
                    onClick={() => setShowSatelliteGround(v => !v)}
                    className={`w-full rounded-lg px-1 py-1.5 text-[9px] font-medium transition-all pointer-events-auto border ${
                      showSatelliteGround
                        ? 'bg-sky-500/25 text-sky-200 border-sky-500/40'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >{showSatelliteGround ? '🗸 Satellite Ground ON' : '🗸 Satellite Ground'}</button>
                </div>

                {/* True North Calibration */}
                <div className="glass rounded-xl p-2 space-y-1.5 pointer-events-auto">
                  <p className="text-[8px] text-white/30 px-1 uppercase tracking-wider">🦭 True North Calibration</p>
                  {calibStep === 'idle' && (
                    <>
                      <p className="text-[8px] text-white/50 px-1 leading-tight">
                        Tap two known GPS points on the model to compute the true-north rotation offset.
                      </p>
                      {calibOffset !== null && (
                        <p className="text-[8px] text-emerald-400 px-1 font-mono">
                          Last offset: {calibOffset.toFixed(1)}° applied
                        </p>
                      )}
                      <button
                        onClick={() => { setCalibStep('picking_p1'); setCalibP1(null); toast.info('🦭 Calibration: click Point 1 on the model (e.g. NW corner of house)', { duration: 5000 }); }}
                        className="w-full rounded-lg px-1 py-1.5 text-[9px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                      >Start Calibration</button>
                    </>
                  )}
                  {calibStep === 'picking_p1' && (
                    <div className="space-y-1">
                      <p className="text-[8px] text-amber-300 px-1 animate-pulse">① Click the NW corner of the house on the model…</p>
                      <button onClick={() => setCalibStep('idle')} className="w-full rounded-lg px-1 py-1 text-[8px] text-white/40 hover:text-white/70 border border-white/10">Cancel</button>
                    </div>
                  )}
                  {calibStep === 'picking_p2' && (
                    <div className="space-y-1">
                      <p className="text-[8px] text-amber-300 px-1 animate-pulse">② Click the NE corner of the house on the model…</p>
                      <button onClick={() => setCalibStep('idle')} className="w-full rounded-lg px-1 py-1 text-[8px] text-white/40 hover:text-white/70 border border-white/10">Cancel</button>
                    </div>
                  )}
                  {calibStep === 'done' && (
                    <div className="space-y-1">
                      <p className="text-[8px] text-emerald-400 px-1 font-mono">✓ Offset {calibOffset?.toFixed(1)}° applied to model</p>
                      <button onClick={() => setCalibStep('idle')} className="w-full rounded-lg px-1 py-1 text-[8px] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10">Done</button>
                    </div>
                  )}
                </div>

                {/* Sun Arc Time Scrubber */}
                <div className="glass rounded-xl p-2 space-y-1.5 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-white/30 uppercase tracking-wider">Sun Arc</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-mono">{isDaytime ? '☀️' : '🌙'}</span>
                      <span className="text-[9px] font-mono text-amber-300">{sunLabel}</span>
                      <button
                        onClick={() => setSunHour(new Date().getHours() + new Date().getMinutes() / 60)}
                        className="text-[7px] text-cyan-400 hover:text-cyan-200 ml-1"
                      >Now</button>
                      <button
                        onClick={() => setIsTimeLapse(t => !t)}
                        title={isTimeLapse ? "Stop time-lapse" : "Play full-day shadow time-lapse (8s)"}
                        className={`text-[8px] ml-1 px-1.5 py-0.5 rounded transition-colors ${
                          isTimeLapse
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                            : 'glass text-white/50 hover:text-white/90'
                        }`}
                      >{isTimeLapse ? '⏹' : '▶'}</button>
                    </div>
                  </div>
                  {/* 24-hour arc visual */}
                  <div className="relative h-6 flex items-center">
                    <div className="absolute inset-x-0 h-px bg-white/10" />
                    {/* Horizon markers */}
                    <div className="absolute left-[25%] flex flex-col items-center">
                      <div className="w-px h-2 bg-orange-400/50" />
                      <span className="text-[6px] text-orange-400/60">6AM</span>
                    </div>
                    <div className="absolute left-[50%] flex flex-col items-center">
                      <div className="w-px h-2 bg-yellow-400/50" />
                      <span className="text-[6px] text-yellow-400/60">Noon</span>
                    </div>
                    <div className="absolute left-[83.3%] flex flex-col items-center">
                      <div className="w-px h-2 bg-orange-400/50" />
                      <span className="text-[6px] text-orange-400/60">8PM</span>
                    </div>
                    {/* Sun/moon position indicator */}
                    <div
                      className="absolute w-3 h-3 rounded-full flex items-center justify-center text-[8px] -translate-x-1/2 -translate-y-1/2 top-1/2"
                      style={{
                        left: `${(sunHour / 24) * 100}%`,
                        background: isDaytime ? 'rgba(251,191,36,0.3)' : 'rgba(148,163,184,0.3)',
                        border: `1px solid ${isDaytime ? '#fbbf24' : '#94a3b8'}`,
                      }}
                    >{isDaytime ? '☀' : '🌙'}</div>
                  </div>
                  <Slider
                    min={0} max={24} step={0.25}
                    value={[sunHour]}
                    onValueChange={([v]) => setSunHour(v)}
                    className="pointer-events-auto"
                  />
                </div>

                {/* Weather Simulate */}
                <div className="glass rounded-xl p-2 space-y-1.5 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-white/30 uppercase tracking-wider">Simulate Weather</span>
                    {weatherSim && (
                      <button onClick={() => setWeatherSim(null)} className="text-[7px] text-cyan-400 hover:text-cyan-200">Live</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { id: "clear", label: "☀️ Clear" },
                      { id: "rain",  label: "🌧️ Rain" },
                      { id: "snow",  label: "❄️ Snow" },
                      { id: "fog",   label: "🌫️ Fog" },
                      { id: "night", label: "🌙 Night" },
                    ] as const).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setWeatherSim(prev => prev === s.id ? null : s.id)}
                        className={`rounded-lg px-1 py-1 text-[8px] font-medium transition-all ${
                          weatherSim === s.id
                            ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40"
                            : "bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10"
                        }`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>

                {/* Measure tool */}
                <button
                  onClick={() => {
                    if (measureMode) { setMeasureMode(false); clearMeasure(); }
                    else { setMeasureMode(true); setDrawZoneMode(false); setDrawVerts([]); setSelectedZone(null); toast.info("📏 Measure mode: tap 2 points on the model"); }
                  }}
                  className={`glass rounded-xl p-2 w-full flex items-center gap-1.5 text-[10px] font-medium transition-all pointer-events-auto ${
                    measureMode ? "text-yellow-300 border border-yellow-400/40 bg-yellow-400/10" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <Ruler size={12} />{measureMode ? "Exit Measure" : "Measure"}
                </button>

                {/* Draw Zone tool */}
                <button
                  onClick={() => {
                    if (drawZoneMode) { cancelDrawZone(); }
                    else { setDrawZoneMode(true); setMeasureMode(false); clearMeasure(); setDrawVerts([]); setSelectedZone(null); toast.info("🖊️ Draw Zone: tap 3–8 points on the model to define a zone"); }
                  }}
                  className={`glass rounded-xl p-2 w-full flex items-center gap-1.5 text-[10px] font-medium transition-all pointer-events-auto ${
                    drawZoneMode ? "text-green-300 border border-green-400/40 bg-green-400/10" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <PenLine size={12} />{drawZoneMode ? "Cancel Draw" : "Draw Zone"}
                </button>

                <button onClick={resetCamera}
                  className="glass rounded-xl p-2 w-full flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white/80 transition-all pointer-events-auto"
                >
                  <Navigation size={12} />Reset View
                </button>

                {/* Path Replay Scrubber */}
                {showPath && (
                  <div className="glass rounded-xl p-2 space-y-1.5 pointer-events-auto">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] text-white/30 uppercase tracking-wider">Path Replay</p>
                      <span className="text-[9px] font-mono text-yellow-400">{Math.round(scrubberT * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="1"
                      value={Math.round(scrubberT * 100)}
                      onMouseDown={() => { isScrubbing.current = true; }}
                      onTouchStart={() => { isScrubbing.current = true; }}
                      onChange={(e) => {
                        const t = Number(e.target.value) / 100;
                        setScrubberT(t);
                        robotTRef.current = t;
                      }}
                      onMouseUp={() => { isScrubbing.current = false; }}
                      onTouchEnd={() => { isScrubbing.current = false; }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: 'oklch(0.78 0.18 85)' }}
                    />
                    <div className="flex justify-between text-[7px] text-white/20 font-mono">
                      <span>START</span>
                      <span>50%</span>
                      <span>END</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] text-white/30">
                        {isScrubbing.current ? '⏸ Paused' : '▶ Live'} · {Math.round(scrubberT * 762)}m
                      </p>
                      <div className="flex gap-0.5">
                        {([1, 2, 5] as const).map(spd => (
                          <button
                            key={spd}
                            onClick={() => setPlaybackSpeed(spd)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all pointer-events-auto ${
                              playbackSpeed === spd
                                ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                                : 'text-white/30 hover:text-white/60'
                            }`}
                          >{spd}×</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                    </div>{/* end scrollable content */}
                  </motion.div>{/* end drawer panel */}
                </>
              )}
            </AnimatePresence>
          ) : (
            /* Desktop: left-side column panel */
            <div
              className="absolute left-2 z-20 flex flex-col pointer-events-auto"
              style={{
                bottom: '3.5rem',
                maxHeight: 'calc(100% - 7rem)',
                width: '9rem',
              }}
            >
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="space-y-1.5 overflow-y-auto overscroll-contain flex-1 min-h-0"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {/* Desktop controls content is duplicated below via shared panel */}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Zone legend */}
      {loadState === "loaded" && showZones && !device.isMobile && (
        <div className="absolute top-10 left-40 z-20 glass rounded-xl p-2 space-y-1 pointer-events-none">
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">Tap zones to inspect</p>
          {ZONE_DEFS.map(z => (
            <div key={z.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zoneStatuses[z.id] === "treated" ? "#00ff88" : z.colorHex }} />
              <span className="text-[9px] font-mono text-white/60">Zone {z.id}</span>
              <span className={`text-[8px] px-1 rounded font-mono ${
                zoneStatuses[z.id] === "treated" ? "bg-green-500/20 text-green-400" :
                zoneStatuses[z.id] === "skip" ? "bg-purple-500/20 text-purple-400" : "bg-orange-500/20 text-orange-400"
              }`}>{zoneStatuses[z.id]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Path legend (desktop only) */}
      {loadState === "loaded" && showPath && !device.isMobile && (
        <div className="absolute top-10 right-2 z-20 glass rounded-xl p-2 pointer-events-none">
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">Robot Path</p>
          <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-px bg-green-400" /><span className="text-[9px] text-white/50">Completed</span></div>
          <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-px bg-white/30" /><span className="text-[9px] text-white/50">Pending</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-[9px] text-yellow-300 font-bold">Chip</span></div>
        </div>
      )}

      {/* Zone info popup */}
      <AnimatePresence>
        {selectedZone && selectedZoneDef && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="absolute z-30 pointer-events-auto"
            style={{
              left: device.isMobile ? "50%" : Math.min(selectedZone.screenX + 12, (mountRef.current?.clientWidth ?? 400) - 220),
              top: device.isMobile ? "auto" : Math.min(selectedZone.screenY - 20, (mountRef.current?.clientHeight ?? 400) - 220),
              bottom: device.isMobile ? "80px" : "auto",
              transform: device.isMobile ? "translateX(-50%)" : "none",
            }}
          >
            <div className="glass rounded-2xl p-3 w-56 border" style={{ borderColor: selectedZoneDef.colorHex + "60" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedStatus === "treated" ? "#00ff88" : selectedZoneDef.colorHex }} />
                  <span className="text-[11px] font-bold text-white">{selectedZoneDef.label}</span>
                </div>
                <button onClick={() => setSelectedZone(null)} className="text-white/30 hover:text-white/70 text-sm w-6 h-6 flex items-center justify-center">✕</button>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-white/40">Status</span>
                  <span className={`font-bold ${selectedStatus === "treated" ? "text-green-400" : selectedStatus === "skip" ? "text-purple-400" : "text-orange-400"}`}>
                    {selectedStatus?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-white/40">Last Applied</span><span className="text-white/70">{selectedZoneDef.lastApplied}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Coverage</span><span className="text-white/70">{selectedZoneDef.coverage}</span></div>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-white/40 text-[9px] mb-1">Next Task</p>
                  <p className="text-cyan-300 font-medium">{selectedZoneDef.nextTask}</p>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-white/10">
                  <p className="text-yellow-300/80 italic text-[9px] leading-snug">💬 "{selectedZoneDef.chipNote}"</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Measure mode: active banner + result display */}
      <AnimatePresence>
        {measureMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="glass rounded-xl px-3 py-2 border border-yellow-400/40 text-center">
              <div className="flex items-center gap-2 justify-center">
                <Ruler size={12} className="text-yellow-400 animate-pulse" />
                <span className="text-[10px] font-mono text-yellow-300">
                  {measurePointsRef.current.length === 0 ? "TAP POINT 1" : measurePointsRef.current.length === 1 ? "TAP POINT 2" : "MEASURED"}
                </span>
              </div>
              {measureResult && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-sm font-bold text-yellow-300">{measureResult.distFt.toFixed(1)} ft</p>
                  <p className="text-[9px] text-white/50">{(measureResult.distFt * 0.3048).toFixed(2)} m · ~{Math.round(measureResult.distSqFt)} sq ft if square</p>
                </div>
              )}
              {measureResult && (
                <button
                  onClick={() => clearMeasure()}
                  className="mt-1.5 text-[9px] text-white/40 hover:text-white/70 flex items-center gap-1 mx-auto pointer-events-auto"
                >
                  <X size={9} />Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Measure mode cursor hint */}
      {measureMode && (
        <div className="absolute inset-0 pointer-events-none z-10" style={{ cursor: "crosshair" }}>
          {measureScreenPoints.map((pt, i) => (
            <div key={i} className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2"
              style={{ left: pt.x, top: pt.y }}
            >
              <div className="w-full h-full rounded-full border-2 border-yellow-400 bg-yellow-400/20" />
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-yellow-300">{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Draw Zone: vertex dots + polygon preview overlay */}
      {drawZoneMode && drawVerts.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-25" style={{ overflow: "visible" }}>
          {/* Polygon lines */}
          {drawVerts.length >= 2 && (
            <polyline
              points={drawVerts.map(v => `${v.screen.x},${v.screen.y}`).join(" ")}
              fill="none" stroke="#44ffaa" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8"
            />
          )}
          {/* Closing line if 3+ verts */}
          {drawVerts.length >= 3 && (
            <line
              x1={drawVerts[drawVerts.length - 1].screen.x} y1={drawVerts[drawVerts.length - 1].screen.y}
              x2={drawVerts[0].screen.x} y2={drawVerts[0].screen.y}
              stroke="#44ffaa" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"
            />
          )}
          {/* Vertex dots */}
          {drawVerts.map((v, i) => (
            <g key={i}>
              <circle cx={v.screen.x} cy={v.screen.y} r="6" fill="#44ffaa" opacity="0.3" />
              <circle cx={v.screen.x} cy={v.screen.y} r="3" fill="#44ffaa" />
              <text x={v.screen.x + 8} y={v.screen.y - 6} fill="#44ffaa" fontSize="9" fontFamily="monospace">{i + 1}</text>
            </g>
          ))}
        </svg>
      )}

      {/* Draw Zone: top banner + confirm toolbar */}
      <AnimatePresence>
        {drawZoneMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
          >
            <div className="glass rounded-xl px-3 py-2 border border-green-400/40 text-center min-w-56">
              <div className="flex items-center gap-2 justify-center mb-1">
                <PenLine size={12} className="text-green-400 animate-pulse" />
                <span className="text-[10px] font-mono text-green-300">
                  DRAW ZONE MODE — {drawVerts.length} / {drawVerts.length < 3 ? `need ${3 - drawVerts.length} more` : "ready"}
                </span>
              </div>
              <p className="text-[9px] text-white/40 mb-2">Tap the 3D model to place vertices</p>
              <div className="flex gap-1.5 justify-center">
                {drawVerts.length >= 3 && (
                  <button
                    onClick={confirmDrawZone}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/20 border border-green-400/40 text-green-300 text-[10px] font-bold hover:bg-green-500/30 transition-all"
                  >
                    <Check size={10} /> Confirm Zone
                  </button>
                )}
                <button
                  onClick={cancelDrawZone}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300 text-[10px] hover:bg-red-500/20 transition-all"
                >
                  <X size={10} /> Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draw Zone: Name + Treatment dialog */}
      <AnimatePresence>
        {showZoneNameDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
              className="glass rounded-2xl p-5 w-72 border border-green-400/30 space-y-3"
            >
              <div className="flex items-center gap-2">
                <PenLine size={16} className="text-green-400" />
                <h3 className="text-sm font-bold text-white">Name Your Zone</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/50 uppercase tracking-wider">Zone Name</label>
                  <input
                    type="text"
                    value={pendingZoneName}
                    onChange={e => setPendingZoneName(e.target.value)}
                    placeholder="e.g. Garden Bed North"
                    className="w-full mt-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-400/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 uppercase tracking-wider">Treatment Plan</label>
                  <select
                    value={pendingZoneTreatment}
                    onChange={e => setPendingZoneTreatment(e.target.value)}
                    className="w-full mt-1 bg-[#0a0f1a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/50"
                  >
                    <option>Scotts Weed &amp; Feed</option>
                    <option>Roundup Edge Control</option>
                    <option>Bulb Booster Fertilizer</option>
                    <option>Mulch Refresh</option>
                    <option>Overseed + Starter Fert</option>
                    <option>No Treatment — Monitor</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => finalizeDrawZone(pendingZoneName || "Custom Zone", pendingZoneTreatment)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-300 text-sm font-bold hover:bg-green-500/30 transition-all"
                >
                  <Check size={14} /> Create Zone
                </button>
                <button
                  onClick={() => setShowZoneNameDialog(false)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white/80 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom zones list (bottom-left on desktop) */}
      {customZones.length > 0 && !device.isMobile && (
        <div className="absolute bottom-10 left-40 z-20 glass rounded-xl p-2 space-y-1 max-w-48">
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">Custom Zones</p>
          {customZones.map(zone => (
            <div key={zone.id} className="flex items-center gap-1.5 group">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
              <span className="text-[9px] text-white/70 flex-1 truncate">{zone.name}</span>
              <button
                onClick={() => deleteCustomZone(zone.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400/70 hover:text-red-400 transition-all pointer-events-auto"
              >
                <Trash2 size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen */}
      {onToggleFullscreen && (
        <button onClick={onToggleFullscreen}
          className="absolute top-2 right-2 z-20 glass rounded-lg p-2 text-white/50 hover:text-white/90 transition-all"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}

      {/* North Compass Rose */}
      <div className="absolute bottom-12 right-2 z-20 pointer-events-none select-none" style={{ width: 60, height: 60 }}>
        <svg viewBox="0 0 60 60" width="60" height="60" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }}>
          {/* Outer ring */}
          <circle cx="30" cy="30" r="28" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          {/* Rotating compass needle group */}
          <g transform={`rotate(${compassHeading}, 30, 30)`}>
            {/* North arrow (red) */}
            <polygon points="30,6 27,30 30,28 33,30" fill="#ef4444" opacity="0.95" />
            {/* South arrow (white) */}
            <polygon points="30,54 27,30 30,32 33,30" fill="rgba(255,255,255,0.6)" />
            {/* East/West ticks */}
            <line x1="6" y1="30" x2="10" y2="30" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            <line x1="50" y1="30" x2="54" y2="30" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          </g>
          {/* Center dot */}
          <circle cx="30" cy="30" r="2.5" fill="rgba(255,255,255,0.8)" />
          {/* N label — fixed (does not rotate) */}
          <text x="30" y="5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ef4444" fontFamily="monospace">N</text>
          <text x="30" y="58" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="monospace">S</text>
          <text x="3" y="32" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="monospace">W</text>
          <text x="57" y="32" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="monospace">E</text>
        </svg>
        {/* Heading readout */}
        <div className="text-center text-[8px] font-mono text-white/50 -mt-1">{compassHeading}°</div>
      </div>

      {/* Mt. Siple Experience Overlay */}
      <AnimatePresence>
        {showMtSipleExperience && (
          <MtSipleExperience
            onClose={() => setShowMtSipleExperience(false)}
            onLaunchSplat={async () => {
              if (!sceneRef.current) return;
              if (isMtSiple) return; // already active
              setSplatLoading(true);
              try {
                const { SplatMesh } = await import('@sparkjsdev/spark');
                if (modelRef.current) modelRef.current.visible = false;
                if (splatMeshRef.current) sceneRef.current.remove(splatMeshRef.current);
                const splat = new SplatMesh({ url: 'https://sparkjs.dev/assets/splats/distant-igloo.spz' });
                splat.scale.setScalar(8);
                splat.position.set(0, -2, 0);
                sceneRef.current.add(splat);
                splatMeshRef.current = splat;
                sceneRef.current.background = new THREE.Color(0x8ab4d4);
                sceneRef.current.fog = new THREE.FogExp2(0x8ab4d4, 0.004);
                setIsMtSiple(true);
                // Start cinematic orbit animation
                if (orbitControlsRef.current) {
                  orbitControlsRef.current.autoRotate = true;
                  orbitControlsRef.current.autoRotateSpeed = 0.4;
                }
                toast.success('🗻 Mt. Siple, Antarctica loaded', {
                  description: 'Gaussian splat · 3,110 m · Marie Byrd Land · Auto-orbit active',
                  duration: 5000,
                });
              } catch (err) {
                console.error('Splat load failed:', err);
                toast.error('Failed to load Gaussian splat');
                if (modelRef.current) modelRef.current.visible = true;
              } finally {
                setSplatLoading(false);
              }
            }}
            splatLoading={splatLoading}
            isMtSiple={isMtSiple}
          />
        )}
      </AnimatePresence>

      {/* Info */}
      <button onClick={() => setShowInfo(v => !v)}
        className="absolute bottom-2 right-2 z-20 glass rounded-lg p-1.5 text-white/40 hover:text-white/80 transition-all"
      >
        <Info size={12} />
      </button>
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-10 right-2 z-20 glass rounded-xl p-3 text-[10px] text-white/60 space-y-1 max-w-48"
          >
            <p className="font-bold text-white/80">Scan Info</p>
            <p>📍 905 Backyard, West Liberty, IA</p>
            <p>📅 October 8, 2025</p>
            <p>🔺 {polyCount.toLocaleString()} triangles</p>
            <p>☀️ Sun: {sunLabel}</p>
            <p>🏷️ 4 zone markers (tap)</p>
            <p>💧 Spray heatmap: {isSprayActive ? "ACTIVE" : "standby"}</p>
            {device.isMobile && <p>📱 Touch controls active</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
