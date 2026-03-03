import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Box, Eye, EyeOff, Lock, Unlock, Plus, Trash2, Copy,
  Move, RotateCw, Maximize2, ChevronRight, ChevronDown,
  Download, Upload, Share2, Play, Pause, SkipBack,
  Activity, Shield, Camera, Sun, Crosshair, Grid3x3, Atom
} from "lucide-react";

// ─── Z-Pinch Plasma Simulation ───────────────────────────────────────────────
function ZPinchPlasma({ playing }: { playing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<(THREE.Mesh | null)[]>([]);
  const coreRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const RING_COUNT = 18;

  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.25;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (t - 0.5) * 5.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      const c = new THREE.Color().setHSL(0.72 - t * 0.15, 0.9, 0.5 + t * 0.4);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const particleMat = useMemo(() => new THREE.PointsMaterial({
    size: 0.035, vertexColors: true, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (!playing) return;
    timeRef.current += delta;
    const t = timeRef.current;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.12;
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const phase = (i / RING_COUNT) * Math.PI * 2;
      const pulse = Math.sin(t * 3 + phase) * 0.5 + 0.5;
      const pinch = Math.sin((i / RING_COUNT) * Math.PI);
      ring.scale.setScalar(0.12 + pinch * 0.55 + pulse * 0.08);
      (ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + pulse * 2;
      ring.rotation.z = t * 2 + phase;
    });
    if (coreRef.current) {
      const pulse = Math.sin(t * 6) * 0.5 + 0.5;
      coreRef.current.scale.setScalar(0.08 + pulse * 0.05);
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + pulse * 3;
    }
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += delta * (0.25 + Math.random() * 0.15);
        if (pos[i * 3 + 1] > 2.75) pos[i * 3 + 1] = -2.75;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.8, 5.5, 1.8)]} />
        <lineBasicMaterial color="#ff69b4" transparent opacity={0.35} />
      </lineSegments>
      {Array.from({ length: RING_COUNT }, (_, i) => {
        const y = -2.5 + (i / (RING_COUNT - 1)) * 5;
        const hue = 0.72 - (i / RING_COUNT) * 0.15;
        return (
          <mesh key={i} position={[0, y, 0]} ref={el => { ringsRef.current[i] = el; }}>
            <torusGeometry args={[1, 0.055, 8, 32]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(hue, 1, 0.6)}
              emissive={new THREE.Color().setHSL(hue, 1, 0.35)}
              emissiveIntensity={1} transparent opacity={0.85}
              blending={THREE.AdditiveBlending} depthWrite={false}
            />
          </mesh>
        );
      })}
      <mesh ref={coreRef} position={[0, -2.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ff4488" emissive="#ff2266" emissiveIntensity={3} transparent opacity={0.9} />
      </mesh>
      <points ref={particlesRef} geometry={particleGeo} material={particleMat} />
      <pointLight position={[0, 0, 0]} intensity={4} color="#9966ff" distance={8} />
      <pointLight position={[0, -2.5, 0]} intensity={3} color="#ff4488" distance={5} />
    </group>
  );
}

function CollabCursor({ color, offset }: { color: string; offset: [number,number,number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const t0 = useRef(Math.random() * 100);
  useFrame((_, delta) => {
    t0.current += delta;
    if (ref.current) {
      ref.current.position.x = offset[0] + Math.sin(t0.current * 0.7) * 0.35;
      ref.current.position.y = offset[1] + Math.cos(t0.current * 0.5) * 0.25;
      ref.current.position.z = offset[2] + Math.sin(t0.current * 0.9) * 0.35;
    }
  });
  return (
    <mesh ref={ref} position={offset}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} />
    </mesh>
  );
}

function SceneEnv({ showGrid, playing }: { showGrid: boolean; playing: boolean }) {
  const { camera } = useThree();
  useEffect(() => { camera.position.set(4.5, 3.5, 6.5); camera.lookAt(0, 0, 0); }, [camera]);
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[5, 8, 5]} intensity={0.5} color="#ffffff" />
      <ZPinchPlasma playing={playing} />
      <CollabCursor color="#00d4ff" offset={[2.2, 1, 0.5]} />
      <CollabCursor color="#ff6b35" offset={[-2, 0.5, 1.2]} />
      {showGrid && <Grid args={[20, 20]} cellColor="#111122" sectionColor="#1a1a33" fadeDistance={18} />}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={["#ff4444", "#44ff44", "#4444ff"]} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

// ─── Scene Graph ──────────────────────────────────────────────────────────────
interface SceneNode {
  id: string; name: string; type: string;
  visible: boolean; locked: boolean;
  children?: SceneNode[]; expanded?: boolean;
}

const SCENE: SceneNode[] = [{
  id: "root", name: "Scene Root", type: "group", visible: true, locked: false, expanded: true,
  children: [
    {
      id: "plasma", name: "Z-Pinch Plasma Column", type: "group", visible: true, locked: false, expanded: true,
      children: [
        { id: "rings", name: "Plasma Rings (×18)", type: "mesh", visible: true, locked: false },
        { id: "core", name: "Core Sphere", type: "mesh", visible: true, locked: false },
        { id: "particles", name: "Particle System (2K)", type: "particle", visible: true, locked: false },
        { id: "bbox", name: "Bounding Box", type: "mesh", visible: true, locked: true },
      ]
    },
    {
      id: "collab", name: "Collaborators", type: "group", visible: true, locked: true, expanded: false,
      children: [
        { id: "c1", name: "Alex — Vision Pro", type: "cursor", visible: true, locked: true },
        { id: "c2", name: "Sam — Quest 3", type: "cursor", visible: true, locked: true },
      ]
    },
    { id: "lights", name: "Lighting Rig", type: "light", visible: true, locked: false },
    { id: "cam", name: "Main Camera", type: "camera", visible: true, locked: false },
  ]
}];

const TYPE_ICON: Record<string, JSX.Element> = {
  group: <Layers size={11} className="text-purple-400" />,
  mesh: <Box size={11} className="text-blue-400" />,
  particle: <Atom size={11} className="text-pink-400" />,
  light: <Sun size={11} className="text-yellow-400" />,
  camera: <Camera size={11} className="text-green-400" />,
  cursor: <Crosshair size={11} className="text-cyan-400" />,
};

function NodeRow({ node, depth, sel, onSel, onToggle }: {
  node: SceneNode; depth: number; sel: string | null;
  onSel: (id: string) => void;
  onToggle: (id: string, f: "visible" | "locked" | "expanded") => void;
}) {
  return (
    <>
      <div
        onClick={() => onSel(node.id)}
        className={`flex items-center gap-1 py-0.5 cursor-pointer rounded text-xs transition-colors group ${sel === node.id ? "bg-purple-500/20 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
        style={{ paddingLeft: `${8 + depth * 13}px`, paddingRight: "6px" }}
      >
        {node.children ? (
          <span onClick={e => { e.stopPropagation(); onToggle(node.id, "expanded"); }} className="text-gray-600 hover:text-gray-300">
            {node.expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        ) : <span className="w-2.5" />}
        {TYPE_ICON[node.type] ?? <Box size={11} />}
        <span className="flex-1 truncate ml-0.5">{node.name}</span>
        <span onClick={e => { e.stopPropagation(); onToggle(node.id, "visible"); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
          {node.visible ? <Eye size={9} /> : <EyeOff size={9} className="text-gray-600" />}
        </span>
        <span onClick={e => { e.stopPropagation(); onToggle(node.id, "locked"); }} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.locked ? <Lock size={9} className="text-yellow-500" /> : <Unlock size={9} />}
        </span>
      </div>
      {node.expanded && node.children?.map(c => (
        <NodeRow key={c.id} node={c} depth={depth + 1} sel={sel} onSel={onSel} onToggle={onToggle} />
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SpatialStudio() {
  const [sel, setSel] = useState<string | null>("plasma");
  const [scene, setScene] = useState<SceneNode[]>(SCENE);
  const [playing, setPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [renderMode, setRenderMode] = useState("Solid");
  const [propTab, setPropTab] = useState<"transform" | "material" | "physics" | "privacy">("transform");
  const [simTime, setSimTime] = useState(0);
  const [simSpeed, setSimSpeed] = useState(947);
  const [fps, setFps] = useState(62);
  const [vram, setVram] = useState(5.9);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setSimTime(t => +(t + 0.1).toFixed(1));
      setSimSpeed(947 + Math.floor((Math.random() - 0.5) * 40));
      setFps(60 + Math.floor((Math.random() - 0.5) * 8));
      setVram(+(5.9 + (Math.random() - 0.5) * 0.3).toFixed(1));
    }, 150);
    return () => clearInterval(id);
  }, [playing]);

  const toggleNode = (id: string, field: "visible" | "locked" | "expanded") => {
    const walk = (nodes: SceneNode[]): SceneNode[] =>
      nodes.map(n => n.id === id ? { ...n, [field]: !n[field] } : { ...n, children: n.children ? walk(n.children) : undefined });
    setScene(walk);
  };

  const COLLABORATORS = [
    { name: "Alex Chen", device: "Vision Pro", color: "#00d4ff", status: "editing" },
    { name: "Sam Rivera", device: "Quest 3", color: "#ff6b35", status: "viewing" },
    { name: "Jordan Kim", device: "Blender", color: "#44ff88", status: "idle" },
  ];

  const RENDER_MODES = ["Solid", "Wireframe", "Material", "X-Ray"];

  const METRICS = [
    { label: "Bounds", value: "128×128×384" },
    { label: "Voxels", value: "6.3 Mvox" },
    { label: "Sim Time", value: `${simTime.toFixed(1)} ms` },
    { label: "Sim Speed", value: `${simSpeed} Mvox/s` },
    { label: "Resolution", value: "1439×889" },
    { label: "Render Time", value: "10.8 ms" },
    { label: "UI Framerate", value: `${fps} fps` },
    { label: "VRAM", value: `${vram} / 9.8 GiB` },
    { label: "Particles", value: "2,000" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#08080F] text-white overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#0C0C1A]/90 backdrop-blur flex-shrink-0">
        {/* Transform tools */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1">
          {[{ I: Move, k: "W" }, { I: RotateCw, k: "E" }, { I: Maximize2, k: "R" }].map(({ I, k }) => (
            <button key={k} title={k} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <I size={13} />
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-white/10" />
        {/* Render modes */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1">
          {RENDER_MODES.map(m => (
            <button key={m} onClick={() => setRenderMode(m)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${renderMode === m ? "bg-purple-500/30 text-purple-300" : "text-gray-500 hover:text-gray-300"}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-white/10" />
        <button onClick={() => setShowGrid(g => !g)} title="Toggle Grid"
          className={`p-1.5 rounded transition-colors ${showGrid ? "text-purple-400 bg-purple-500/10" : "text-gray-500 hover:text-gray-300"}`}>
          <Grid3x3 size={13} />
        </button>
        <div className="flex-1" />
        {/* Collaborators */}
        <div className="flex items-center gap-1.5">
          {COLLABORATORS.map((c, i) => (
            <div key={i} title={`${c.name} — ${c.device} (${c.status})`}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: c.color + "22", borderColor: c.color, color: c.color }}>
              {c.name[0]}
            </div>
          ))}
          <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="w-px h-5 bg-white/10" />
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition-colors">
          <Share2 size={11} /> Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition-colors">
          <Download size={11} /> USDZ
        </button>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Scene Graph */}
        <div className="w-52 border-r border-white/8 flex flex-col bg-[#0A0A18]/70 flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scene</span>
            <div className="flex gap-0.5">
              {[Plus, Trash2, Copy].map((I, i) => (
                <button key={i} className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-white transition-colors"><I size={10} /></button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {scene.map(n => <NodeRow key={n.id} node={n} depth={0} sel={sel} onSel={setSel} onToggle={toggleNode} />)}
          </div>
          {/* Sim metrics */}
          <div className="border-t border-white/8 p-2">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1.5">Simulation</div>
            <div className="space-y-0.5">
              {METRICS.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-300 font-mono text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: 3D Viewport */}
        <div className="flex-1 relative overflow-hidden">
          {/* Viewport header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Crosshair size={10} className="text-purple-400" />
              <span>Perspective</span>
              <span className="text-gray-700">|</span>
              <span className="text-purple-300">{renderMode}</span>
              <span className="text-gray-700">|</span>
              <span>Lit</span>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="text-xs font-mono text-green-400 flex items-center gap-1">
                <Activity size={9} /> {fps} fps
              </span>
              <button onClick={() => setPlaying(p => !p)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${playing ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {playing ? <><Pause size={9} /> Pause</> : <><Play size={9} /> Play</>}
              </button>
            </div>
          </div>

          {/* Render quality overlay */}
          <div className="absolute top-8 right-3 z-10 space-y-1 pointer-events-none">
            {[
              { l: "Render Quality", v: "High" },
              { l: "View Mode", v: "Lit" },
              { l: "Projection", v: "Custom" },
            ].map(({ l, v }) => (
              <div key={l} className="flex items-center gap-2 text-xs bg-black/50 backdrop-blur px-2 py-0.5 rounded">
                <span className="text-gray-600 w-24 text-right">{l}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>

          <Canvas
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            camera={{ fov: 50, near: 0.1, far: 100 }}
            style={{ background: "radial-gradient(ellipse at 50% 40%, #0e0e28 0%, #08080F 100%)" }}
          >
            <SceneEnv showGrid={showGrid} playing={playing} />
          </Canvas>

          {/* Playback bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
            <button className="text-gray-600 hover:text-white transition-colors"><SkipBack size={11} /></button>
            <button onClick={() => setPlaying(p => !p)} className="text-gray-300 hover:text-white transition-colors">
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer">
              <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                animate={{ width: playing ? "100%" : "30%" }}
                transition={{ duration: playing ? 120 : 0.3, ease: "linear" }} />
            </div>
            <span className="text-xs font-mono text-gray-600">{simTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-56 border-l border-white/8 flex flex-col bg-[#0A0A18]/70 flex-shrink-0">
          <div className="px-3 py-2 border-b border-white/8">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Properties</div>
            <div className="text-xs text-purple-300 font-medium truncate">
              {sel === "plasma" ? "Z-Pinch Plasma Column" : sel === "rings" ? "Plasma Rings (×18)" : sel === "core" ? "Core Sphere" : sel ?? "Nothing selected"}
            </div>
          </div>

          {/* Property tabs */}
          <div className="flex border-b border-white/8">
            {(["transform", "material", "physics", "privacy"] as const).map(t => (
              <button key={t} onClick={() => setPropTab(t)}
                className={`flex-1 py-1.5 text-xs capitalize transition-colors ${propTab === t ? "text-purple-300 border-b border-purple-400" : "text-gray-600 hover:text-gray-400"}`}>
                {t.slice(0, 4)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <AnimatePresence mode="wait">
              {propTab === "transform" && (
                <motion.div key="t" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  {[
                    { label: "Position", vals: ["0.000", "0.000", "0.000"] },
                    { label: "Rotation", vals: ["0.000°", "0.000°", "0.000°"] },
                    { label: "Scale", vals: ["1.000", "1.000", "1.000"] },
                  ].map(({ label, vals }) => (
                    <div key={label}>
                      <div className="text-xs text-gray-500 mb-1">{label}</div>
                      <div className="grid grid-cols-3 gap-1">
                        {vals.map((v, i) => (
                          <div key={i} className="bg-white/5 rounded px-1.5 py-1 text-xs font-mono flex items-center gap-1">
                            <span className={["text-red-400","text-green-400","text-blue-400"][i]}>{"XYZ"[i]}</span>
                            <span className="text-gray-300 text-xs">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Bounds</div>
                    <div className="bg-white/5 rounded px-2 py-1 text-xs font-mono text-gray-300">128 × 128 × 384</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">World Space</div>
                    <div className="bg-white/5 rounded px-2 py-1 text-xs font-mono text-gray-300">Y-up (RealityKit)</div>
                  </div>
                </motion.div>
              )}
              {propTab === "material" && (
                <motion.div key="m" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Base Color</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg" style={{ background: "linear-gradient(135deg,#9933ff,#4488ff)" }} />
                      <span className="text-xs font-mono text-gray-300">#9933FF</span>
                    </div>
                  </div>
                  {[["Metallic", 0.0], ["Roughness", 0.15], ["Emissive Intensity", 0.85], ["Opacity", 0.85]].map(([l, v]) => (
                    <div key={String(l)}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{l}</span>
                        <span className="text-gray-300 font-mono">{Number(v).toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Number(v) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Blend Mode</div>
                    <div className="bg-white/5 rounded px-2 py-1 text-xs text-gray-300">Additive</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Shader</div>
                    <div className="bg-white/5 rounded px-2 py-1 text-xs text-gray-300">PhysicallyBased</div>
                  </div>
                </motion.div>
              )}
              {propTab === "physics" && (
                <motion.div key="p" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  {[
                    ["Body Type", "Kinematic"], ["Mass", "0.00 kg"], ["Gravity", "0.00 m/s²"],
                    ["Collider", "None"], ["Sim Mode", "MHD Fluid"], ["Timestep", "6.6 ms"],
                    ["Iterations", "4"], ["Voxel Size", "0.33 m"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-gray-300 font-mono">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/8">
                    <div className="text-xs text-gray-500 mb-1.5">Active Forces</div>
                    {["Lorentz Force", "Magnetic Pinch", "Thermal Pressure", "Viscosity"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-gray-400">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {propTab === "privacy" && (
                <motion.div key="s" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <Shield size={13} className="text-green-400" />
                    <div>
                      <div className="text-xs font-medium text-green-300">E2E Encrypted</div>
                      <div className="text-xs text-gray-500">AES-256-GCM Active</div>
                    </div>
                  </div>
                  {[
                    ["Zone", "Private"], ["Access", "Team Only"], ["Audit Log", "Enabled"],
                    ["Key Store", "Secure Enclave"], ["Sync Mode", "E2E Only"], ["CRDT", "Active"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-gray-300">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/8">
                    <div className="text-xs text-gray-500 mb-1.5">Collaborator Access</div>
                    {COLLABORATORS.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs py-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-gray-400 flex-1">{c.name}</span>
                        <span className="text-gray-600">{c.status === "editing" ? "Edit" : "View"}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="border-t border-white/8 p-2 space-y-1.5">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium transition-colors">
              <Upload size={10} /> Push to Vision Pro
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-medium transition-colors">
              <Download size={10} /> Export USDZ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
