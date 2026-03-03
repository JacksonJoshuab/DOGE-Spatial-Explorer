import { Suspense, useState, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box, Eye, EyeOff, Layers, Lock, Unlock, Plus, Trash2,
  Download, Brain, Shield, ChevronRight, ChevronDown,
  Move, RotateCw, Maximize2, Camera, Sun, Sparkles,
  Play, Pause, Settings, Grid3X3, Crosshair, Zap,
  Users, Wifi, Activity, Cpu, HardDrive, Monitor,
  Video, Mic, MicOff, VideoOff, PhoneCall, PhoneOff,
  Circle, Square, Triangle, Hexagon, Atom, Flame,
  Package, FileJson, Save, FolderOpen, Share2, Copy,
  AlignCenter, Group, Ungroup, ScanLine, Wand2
} from "lucide-react";

/* ─── 3D Scene Objects ───────────────────────────────────────────────────────── */
function PlasmaColumn() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      const t = state.clock.elapsedTime;
      meshRef.current.scale.x = 1 + Math.sin(t * 2) * 0.03;
      meshRef.current.scale.z = 1 + Math.cos(t * 2) * 0.03;
    }
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.y += 0.02 * (i % 2 === 0 ? 1 : -1);
        ring.position.y = -2 + (i / 8) * 5 + Math.sin(state.clock.elapsedTime * 1.5 + i) * 0.1;
      }
    });
  });
  return (
    <group>
      {/* Main column */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.3, 5, 16]} />
        <meshStandardMaterial color="#4A90D9" emissive="#1a3a6a" emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
      {/* Compression rings */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={i}
          ref={el => { if (el) ringRefs.current[i] = el; }}
          position={[0, -2 + (i / 8) * 5, 0]}
        >
          <torusGeometry args={[0.35 + Math.sin(i * 0.8) * 0.1, 0.04, 8, 24]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#8B5CF6" : i % 3 === 1 ? "#4A90D9" : "#EC4899"}
            emissive={i % 3 === 0 ? "#4a1a8a" : i % 3 === 1 ? "#1a3a6a" : "#6a1a4a"}
            emissiveIntensity={1.2}
            transparent opacity={0.85}
          />
        </mesh>
      ))}
      {/* Glow core */}
      <mesh position={[0, -2.2, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      {/* Point light */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#4A90D9" distance={8} />
      <pointLight position={[0, -2.2, 0]} intensity={2} color="#EC4899" distance={5} />
    </group>
  );
}

function BoundingBox() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[3, 5, 3]} />
      <meshBasicMaterial color="#FF69B4" wireframe transparent opacity={0.3} />
    </mesh>
  );
}

function SensorArray() {
  const sensors = [
    { pos: [-3, -2, 2] as [number,number,number], color: "#E74C3C", label: "Temp A" },
    { pos: [3, -2, -2] as [number,number,number], color: "#2ECC71", label: "Pressure B" },
    { pos: [0, 0, 4] as [number,number,number], color: "#F39C12", label: "RF Antenna C" },
  ];
  return (
    <group>
      {sensors.map((s, i) => (
        <mesh key={i} position={s.pos}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CoordinateAxes() {
  return (
    <group>
      <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshBasicMaterial color="#E74C3C" />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshBasicMaterial color="#2ECC71" />
      </mesh>
      <mesh position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshBasicMaterial color="#4A90D9" />
      </mesh>
    </group>
  );
}

function CollaboratorCursor({ position, color, name }: { position: [number,number,number]; color: string; name: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      <pointLight intensity={0.5} color={color} distance={2} />
    </group>
  );
}

function Scene3D({ showGrid, showAxes }: { showGrid: boolean; showAxes: boolean }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0.5} fade />
      <PlasmaColumn />
      <BoundingBox />
      <SensorArray />
      {showAxes && <CoordinateAxes />}
      {showGrid && <Grid args={[20, 20]} cellColor="rgba(255,255,255,0.05)" sectionColor="rgba(255,255,255,0.1)" fadeDistance={25} />}
      <CollaboratorCursor position={[2, 1, 0]} color="#8B5CF6" name="Alex (Vision Pro)" />
      <CollaboratorCursor position={[-2, 0, 1]} color="#EC4899" name="Sam (Quest 3)" />
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={["#E74C3C", "#2ECC71", "#4A90D9"]} labelColor="white" />
      </GizmoHelper>
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </>
  );
}

/* ─── Scene Node Tree ────────────────────────────────────────────────────────── */
interface SceneNode { id: string; name: string; type: string; visible: boolean; locked: boolean; children?: SceneNode[] }

const INITIAL_SCENE: SceneNode[] = [
  { id: "root", name: "Scene Root", type: "group", visible: true, locked: false, children: [
    { id: "plasma", name: "Z-Pinch Plasma Column", type: "volumetric", visible: true, locked: false },
    { id: "bounds", name: "Simulation Bounds", type: "mesh", visible: true, locked: true },
    { id: "sensors", name: "IoT Sensor Array", type: "group", visible: true, locked: false, children: [
      { id: "s1", name: "Temp Sensor A", type: "mesh", visible: true, locked: false },
      { id: "s2", name: "Pressure Sensor B", type: "mesh", visible: true, locked: false },
      { id: "s3", name: "RF Antenna C", type: "mesh", visible: true, locked: false },
    ]},
    { id: "lights", name: "Lighting Rig", type: "group", visible: true, locked: false, children: [
      { id: "l1", name: "Key Light", type: "light", visible: true, locked: false },
      { id: "l2", name: "Fill Light", type: "light", visible: true, locked: false },
    ]},
    { id: "cam", name: "Main Camera", type: "camera", visible: true, locked: false },
  ]},
];

const TYPE_COLORS: Record<string, string> = {
  group: "text-blue-400", mesh: "text-gray-300", volumetric: "text-purple-400",
  light: "text-amber-400", camera: "text-green-400",
};

function SceneNodeRow({ node, depth = 0, selected, onSelect }: {
  node: SceneNode; depth?: number; selected: string | null; onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors text-xs ${
          selected === node.id ? "bg-blue-500/20 text-blue-200" : "hover:bg-white/5 text-gray-400"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="flex-shrink-0">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : <span className="w-3 flex-shrink-0" />}
        <span className={`flex-shrink-0 ${TYPE_COLORS[node.type] || "text-gray-400"}`}>
          {node.type === "group" ? <Group className="w-3 h-3" /> :
           node.type === "volumetric" ? <Atom className="w-3 h-3" /> :
           node.type === "light" ? <Sun className="w-3 h-3" /> :
           node.type === "camera" ? <Camera className="w-3 h-3" /> :
           <Box className="w-3 h-3" />}
        </span>
        <span className="truncate flex-1">{node.name}</span>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100">
          {node.locked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
          {!node.visible && <EyeOff className="w-2.5 h-2.5 text-gray-600" />}
        </div>
      </div>
      {expanded && hasChildren && node.children!.map(child => (
        <SceneNodeRow key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function SpatialStudio() {
  const [selectedNode, setSelectedNode] = useState<string | null>("plasma");
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [renderMode, setRenderMode] = useState<"solid" | "wireframe" | "xray">("solid");
  const [isPlaying, setIsPlaying] = useState(true);
  const [rightTab, setRightTab] = useState<"props" | "ai" | "security">("props");
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [isCalling, setIsCalling] = useState(false);

  const COLLABORATORS = [
    { id: "c1", name: "Alex", platform: "Vision Pro", color: "#8B5CF6", status: "active" as const },
    { id: "c2", name: "Sam", platform: "Quest 3", color: "#EC4899", status: "active" as const },
    { id: "c3", name: "Taylor", platform: "iPad", color: "#10B981", status: "idle" as const },
  ];

  return (
    <div className="flex h-full bg-[#08080F] text-white overflow-hidden">
      {/* Left panel — Scene Graph */}
      <div className="w-52 flex-shrink-0 border-r border-white/8 flex flex-col bg-[#0A0A16]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Scene Graph</span>
          <div className="flex gap-1">
            <button className="p-1 hover:bg-white/8 rounded text-gray-500 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
            <button className="p-1 hover:bg-white/8 rounded text-gray-500 hover:text-white transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {INITIAL_SCENE.map(node => (
            <SceneNodeRow key={node.id} node={node} selected={selectedNode} onSelect={setSelectedNode} />
          ))}
        </div>
        {/* Collaborators */}
        {showCollaborators && (
          <div className="border-t border-white/8 p-2">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5 px-1">Live Collaborators</p>
            {COLLABORATORS.map(c => (
              <div key={c.id} className="flex items-center gap-2 px-1 py-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] text-gray-300 truncate">{c.name}</span>
                <span className="text-[9px] text-gray-600 ml-auto">{c.platform}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center — 3D Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Viewport toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
          {/* View mode */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
            {(["PERSP", "TOP", "FRONT", "RIGHT"] as const).map(v => (
              <button key={v} className="px-2 py-0.5 rounded text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-mono">{v}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-white/10" />
          {/* Render mode */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
            {(["SOLID", "WIRE", "XRAY"] as const).map(m => (
              <button key={m} onClick={() => setRenderMode(m.toLowerCase() as any)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${renderMode === m.toLowerCase() ? "bg-blue-500/30 text-blue-300" : "text-gray-400 hover:text-white"}`}>{m}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button onClick={() => setShowGrid(!showGrid)} className={`p-1 rounded transition-colors ${showGrid ? "text-blue-400 bg-blue-500/15" : "text-gray-500 hover:text-white"}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setShowAxes(!showAxes)} className={`p-1 rounded transition-colors ${showAxes ? "text-blue-400 bg-blue-500/15" : "text-gray-500 hover:text-white"}`}><Crosshair className="w-3.5 h-3.5" /></button>
          <div className="ml-auto flex items-center gap-2">
            {/* Render stats */}
            <div className="hidden md:flex items-center gap-2 text-[9px] font-mono text-gray-500">
              <span className="text-green-400">62 fps</span>
              <span>128×128×384</span>
              <span>6.3 Mvox</span>
              <span>947 Mvox/s</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400 font-medium">LIVE</span>
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`p-1.5 rounded-lg transition-colors ${isPlaying ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [6, 4, 8], fov: 50 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: "linear-gradient(180deg, #0A0A1A 0%, #050510 100%)" }}
          >
            <Suspense fallback={null}>
              <Scene3D showGrid={showGrid} showAxes={showAxes} />
            </Suspense>
          </Canvas>

          {/* Collaborator overlays */}
          {showCollaborators && (
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {COLLABORATORS.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium"
                  style={{ backgroundColor: `${c.color}20`, border: `1px solid ${c.color}40`, color: c.color }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: c.color }} />
                  {c.name} · {c.platform}
                </div>
              ))}
            </div>
          )}

          {/* FaceTime call bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <button onClick={() => setIsCalling(!isCalling)} className={`p-2 rounded-full transition-colors ${isCalling ? "bg-red-500 text-white" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}>
              {isCalling ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
            </button>
            <button className="p-2 rounded-full bg-white/8 hover:bg-white/15 text-gray-300 transition-colors"><Mic className="w-3.5 h-3.5" /></button>
            <button className="p-2 rounded-full bg-white/8 hover:bg-white/15 text-gray-300 transition-colors"><Video className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-white/15" />
            <span className="text-[10px] text-gray-400 font-mono">3 collaborators · E2EE</span>
          </div>
        </div>
      </div>

      {/* Right panel — Properties */}
      <div className="w-56 flex-shrink-0 border-l border-white/8 flex flex-col bg-[#0A0A16]">
        {/* Tab bar */}
        <div className="flex border-b border-white/8">
          {(["props", "ai", "security"] as const).map(tab => (
            <button key={tab} onClick={() => setRightTab(tab)}
              className={`flex-1 py-2 text-[10px] font-medium capitalize transition-colors ${rightTab === tab ? "text-blue-300 border-b border-blue-400" : "text-gray-500 hover:text-gray-300"}`}>
              {tab === "props" ? "Props" : tab === "ai" ? "AI" : "Security"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {rightTab === "props" && (
            <div className="space-y-4">
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Transform</p>
                {[["X", "0.00"], ["Y", "2.50"], ["Z", "0.00"]].map(([axis, val]) => (
                  <div key={axis} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] text-gray-500 w-3 font-mono">{axis}</span>
                    <input type="number" defaultValue={val} className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Rotation</p>
                {[["X", "0.00"], ["Y", "0.00"], ["Z", "0.00"]].map(([axis, val]) => (
                  <div key={axis} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] text-gray-500 w-3 font-mono">{axis}</span>
                    <input type="number" defaultValue={val} className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Scale</p>
                {[["X", "1.00"], ["Y", "5.00"], ["Z", "1.00"]].map(([axis, val]) => (
                  <div key={axis} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] text-gray-500 w-3 font-mono">{axis}</span>
                    <input type="number" defaultValue={val} className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider">Render Info</p>
                {[["Render Quality", "High"], ["Bounds", "128×128×384"], ["Voxels", "6.3 Mvox"], ["Sim Speed", "947 Mvox/s"], ["Render Time", "10.8 ms"], ["UI Framerate", "62 fps"]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-300 font-mono">{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-white/8">
                <div className="grid grid-cols-3 gap-1">
                  {["USDZ", "GLB", "FBX"].map(fmt => (
                    <button key={fmt} className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] text-gray-400 font-mono transition-colors">{fmt}</button>
                  ))}
                </div>
                <button className="w-full py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-[10px] text-white font-medium transition-colors flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3" /> Push to All Devices
                </button>
              </div>
            </div>
          )}

          {rightTab === "ai" && (
            <div className="space-y-3">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">AI Generation</p>
              {[
                { label: "Text → 3D", icon: Box, color: "text-blue-400" },
                { label: "Text → Texture", icon: Package, color: "text-purple-400" },
                { label: "Image → 3D", icon: Camera, color: "text-green-400" },
                { label: "Audio → Scene", icon: Wand2, color: "text-amber-400" },
              ].map(({ label, icon: Icon, color }) => (
                <button key={label} className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-xs text-gray-300 transition-colors text-left">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                  {label}
                </button>
              ))}
              <div className="mt-3">
                <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500/50 h-16" placeholder="Describe what to generate…" />
                <button className="w-full mt-1.5 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-lg text-[10px] text-white font-medium transition-colors flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Generate
                </button>
              </div>
            </div>
          )}

          {rightTab === "security" && (
            <div className="space-y-2">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">OSI Security Stack</p>
              {[
                { layer: "L7", name: "Application", protocol: "TLS 1.3 + E2EE", status: "secure" },
                { layer: "L6", name: "Presentation", protocol: "AES-256-GCM", status: "secure" },
                { layer: "L5", name: "Session", protocol: "JWT + SharePlay", status: "secure" },
                { layer: "L4", name: "Transport", protocol: "TLS 1.3 / QUIC", status: "secure" },
                { layer: "L3", name: "Network", protocol: "IPv6 + Private Relay", status: "warning" },
                { layer: "L2", name: "Data Link", protocol: "802.11ax WPA3", status: "secure" },
                { layer: "L1", name: "Physical", protocol: "Secure Enclave", status: "secure" },
              ].map(l => (
                <div key={l.layer} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${l.status === "secure" ? "bg-green-500/5 border-green-500/15" : "bg-amber-500/5 border-amber-500/20"}`}>
                  <span className="text-[9px] font-mono text-gray-500 w-5">{l.layer}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-300 font-medium">{l.name}</p>
                    <p className="text-[8px] text-gray-600 truncate">{l.protocol}</p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${l.status === "secure" ? "bg-green-400" : "bg-amber-400"}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
