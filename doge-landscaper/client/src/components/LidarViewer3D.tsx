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
  ChevronUp, ChevronDown, Ruler, X, PenLine, Trash2, Check, Share2
} from "lucide-react";
import { useDevice } from "@/hooks/useDevice";
import DualJoystick, { type JoystickState } from "@/components/DualJoystick";

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
}

export default function LidarViewer3D({
  isFullscreen,
  onToggleFullscreen,
  isSprayActive = false,
  completedTaskIds = [],
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
  const [fps, setFps] = useState(0);
  const [polyCount, setPolyCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState<SelectedZone | null>(null);
  const [sunHour, setSunHour] = useState(new Date().getHours() + new Date().getMinutes() / 60);
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
    D: 0.80,  // Fence Line — final edge pass
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
  // Yard: 21.7m wide × 43.9m deep, obstacle: house X=-8.4..9.2, Z=2.2..16.5
  // 152 waypoints, 762m path, ~25min at 0.5m/s
  const buildRobotPath = useCallback((scene: THREE.Scene, center: THREE.Vector3, size: THREE.Vector3) => {
    const y = center.y + 0.12; // slightly above ground
    // Real waypoints derived from LiDAR scan geometry
    const rawWaypoints = [
      // Zone A: upper lawn (Z < 0), full-width boustrophedon
      [-10.36,-21.44],[-10.36,-20.64],[10.36,-20.64],[10.36,-19.84],[-10.36,-19.84],[-10.36,-19.04],
      [10.36,-19.04],[10.36,-18.24],[-10.36,-18.24],[-10.36,-17.44],[10.36,-17.44],[10.36,-16.64],
      [-10.36,-16.64],[-10.36,-15.84],[10.36,-15.84],[10.36,-15.04],[-10.36,-15.04],[-10.36,-14.24],
      [10.36,-14.24],[10.36,-13.44],[-10.36,-13.44],[-10.36,-12.64],[10.36,-12.64],[10.36,-11.84],
      [-10.36,-11.84],[-10.36,-11.04],[10.36,-11.04],[10.36,-10.24],[-10.36,-10.24],[-10.36,-9.44],
      [10.36,-9.44],[10.36,-8.64],[-10.36,-8.64],[-10.36,-7.84],[10.36,-7.84],[10.36,-7.04],
      [-10.36,-7.04],[-10.36,-6.24],[10.36,-6.24],[10.36,-5.44],[-10.36,-5.44],[-10.36,-4.64],
      [10.36,-4.64],[10.36,-3.84],[-10.36,-3.84],[-10.36,-3.04],[10.36,-3.04],[10.36,-2.24],
      [-10.36,-2.24],[-10.36,-1.44],[10.36,-1.44],[10.36,-0.64],[-10.36,-0.64],[-10.36,-0.5],
      // Transit: left corridor around house
      [-8.86,2.22],[-8.86,16.46],
      // Zone C: lower-left (left of house)
      [-8.86,2.22],[-10.36,2.22],[-10.36,3.02],[-8.86,3.02],
      [-10.36,3.82],[-10.36,4.62],[-8.86,4.62],
      [-10.36,5.42],[-10.36,6.22],[-8.86,6.22],
      [-10.36,7.02],[-10.36,7.82],[-8.86,7.82],
      [-10.36,8.62],[-10.36,9.42],[-8.86,9.42],
      [-10.36,10.22],[-10.36,11.02],[-8.86,11.02],
      [-10.36,11.82],[-10.36,12.62],[-8.86,12.62],
      [-10.36,13.42],[-10.36,14.22],[-8.86,14.22],
      [-10.36,15.02],[-10.36,15.82],[-8.86,15.82],
      [-10.36,16.62],[-10.36,17.42],[-3.0,17.42],
      [-10.36,18.22],[-10.36,19.02],[-3.0,19.02],
      [-10.36,19.82],[-10.36,20.62],[-3.0,20.62],
      [-10.36,21.42],[-3.0,21.42],
      // Transit to Zone D
      [9.74,2.22],
      // Zone D: lower-right (right of house)
      [9.74,2.22],[10.36,2.22],[10.36,3.02],[9.74,3.02],
      [10.36,3.82],[10.36,4.62],[9.74,4.62],
      [10.36,5.42],[10.36,6.22],[9.74,6.22],
      [10.36,7.02],[10.36,7.82],[9.74,7.82],
      [10.36,8.62],[10.36,9.42],[9.74,9.42],
      [10.36,10.22],[10.36,11.02],[9.74,11.02],
      [10.36,11.82],[10.36,12.62],[9.74,12.62],
      [10.36,13.42],[10.36,14.22],[9.74,14.22],
      [10.36,15.02],[10.36,15.82],[9.74,15.82],
      [10.36,16.62],[10.36,17.42],[9.74,17.42],
      [10.36,18.22],[10.36,19.02],[9.74,19.02],
      [10.36,19.82],[10.36,20.62],[9.74,20.62],
      [10.36,21.42],[9.74,21.42],
      // Return home
      [0.0,0.0]
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

  // ── Point cloud ───────────────────────────────────────────────────────────
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1a);
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.006);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 500);
    camera.position.set(0, 8, 20);
    cameraRef.current = camera;

    // Ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
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
      const scale = 40 / Math.max(size.x, size.y, size.z);
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

      controls.update();
      renderer.render(scene, camera);
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
  }, [device.isMobile, device.isTouch, buildZoneMarkers, buildRobotPath, buildSprayPlane, buildPointCloud, updateSprayHeatmap, loadAttempt]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleCanvasClick = (e: React.MouseEvent) => {
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
              <span className="text-[9px] font-mono text-white/40">905 Backyard · Wilton IA</span>
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
                  text: "Check out this 3D LiDAR scan of the backyard at 905 Wilton IA — tap zones to inspect treatment status.",
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

      {/* Controls panel — collapsible on mobile */}
      {loadState === "loaded" && (
        <div className="absolute bottom-14 left-2 z-20">
          {/* Toggle button on mobile */}
          {device.isMobile && (
            <button
              onClick={() => setShowControls(v => !v)}
              className="glass rounded-xl p-2 mb-1.5 w-full flex items-center justify-center gap-1.5 text-[10px] text-white/60 pointer-events-auto"
            >
              {showControls ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              <span>{showControls ? "Hide" : "Controls"}</span>
            </button>
          )}

          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="space-y-1.5"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Zone legend */}
      {loadState === "loaded" && showZones && !device.isMobile && (
        <div className="absolute top-10 left-2 z-20 glass rounded-xl p-2 space-y-1 pointer-events-none">
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
        <div className="absolute bottom-10 left-2 z-20 glass rounded-xl p-2 space-y-1 max-w-48">
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
            <p>📍 905 Backyard, Wilton IA</p>
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
