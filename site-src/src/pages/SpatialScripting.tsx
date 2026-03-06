import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Play, Square, Save, Download, Upload, Copy, ChevronRight, Zap, Code, BookOpen, Cpu } from "lucide-react";

const LANGUAGES = [
  { id: "python", label: "Python",      icon: "🐍", desc: "Blender Python API + spatial extensions" },
  { id: "swift",  label: "Swift",       icon: "🍎", desc: "visionOS RealityKit scripting" },
  { id: "js",     label: "JavaScript",  icon: "⚡", desc: "Web spatial API" },
  { id: "glsl",   label: "GLSL",        icon: "🎨", desc: "Shader scripting" },
];

const SNIPPETS = [
  {
    id: "create_plasma",
    label: "Create Plasma Column",
    lang: "python",
    code: `import bpy
import spatial_sdk as sp

# Create Z-Pinch plasma column
scene = sp.get_active_scene()

# Add plasma domain
domain = sp.PhysicsDomain(
    name="plasma_column",
    bounds=(128, 128, 384),
    sim_type="plasma_mhd"
)

# Configure Z-Pinch parameters
domain.set_param("magnetic_field", 2.5)  # Tesla
domain.set_param("current_density", 1e6)  # A/m²
domain.set_param("temperature", 1e7)     # Kelvin

# Add to scene and run
scene.add_object(domain)
domain.bake(frames=250)

print(f"Plasma column created: {domain.name}")
print(f"Voxels: {domain.voxel_count:,}")
print(f"Sim speed: {domain.sim_speed:.1f} Mvox/s")`,
  },
  {
    id: "sync_devices",
    label: "Sync All Devices",
    lang: "python",
    code: `import spatial_sdk as sp

# Get all connected devices
devices = sp.DeviceManager.get_connected()

print(f"Found {len(devices)} devices:")
for dev in devices:
    print(f"  {dev.name} ({dev.platform}) — {dev.status}")

# Get active scene
scene = sp.get_active_scene()

# Push scene to all devices
for dev in devices:
    if dev.status == "connected":
        result = dev.push_scene(
            scene,
            format="usdz" if dev.platform == "visionos" else "glb",
            compress=True,
            encrypt=True
        )
        print(f"  ✓ Pushed to {dev.name}: {result.size_mb:.1f} MB")

print("\\nSync complete!")`,
  },
  {
    id: "realitykit_entity",
    label: "RealityKit Entity",
    lang: "swift",
    code: `import RealityKit
import SpatialStudioSDK

// Create a spatial entity with physics
let entity = ModelEntity(
    mesh: .generateSphere(radius: 0.1),
    materials: [SimpleMaterial(
        color: .init(tint: .systemBlue, alpha: 0.8),
        isMetallic: true
    )]
)

// Add physics
entity.components[PhysicsBodyComponent.self] = PhysicsBodyComponent(
    massProperties: .init(mass: 1.0),
    material: .generate(friction: 0.5, restitution: 0.3),
    mode: .dynamic
)

// Add collision
entity.components[CollisionComponent.self] = CollisionComponent(
    shapes: [.generateSphere(radius: 0.1)]
)

// Spatial privacy zone
entity.components[PrivacyZoneComponent.self] = PrivacyZoneComponent(
    radius: 0.5,
    encryptionLevel: .secureEnclave
)

// Add to scene
arView.scene.anchors[0].addChild(entity)
print("Entity added: \\(entity.name)")`,
  },
  {
    id: "ai_generate",
    label: "AI Scene Generation",
    lang: "python",
    code: `import spatial_sdk as sp
from spatial_sdk.ai import TextTo3D, TextToScene

# Initialize AI service
ai = sp.AIService(model="spatial-gen-v3")

# Generate 3D model from text
print("Generating 3D model...")
model = await ai.text_to_3d(
    prompt="Z-Pinch plasma column with electromagnetic field lines",
    style="scientific",
    poly_count=50000,
    format="usdz",
    lod_levels=3
)

print(f"Generated: {model.name}")
print(f"Polygons: {model.poly_count:,}")
print(f"Textures: {len(model.textures)}")

# Add to scene
scene = sp.get_active_scene()
scene.add_object(model, position=(0, 0, 0))

# Generate PBR texture
texture = await ai.text_to_texture(
    prompt="glowing plasma, electromagnetic, scientific",
    resolution=4096,
    channels=["albedo", "normal", "roughness", "metallic"]
)

model.apply_texture(texture)
print("\\nScene generation complete!")`,
  },
];

const API_DOCS = [
  { module: "sp.Scene",         methods: ["get_active_scene()", "create_scene(name)", "load_scene(path)", "save_scene(path)"] },
  { module: "sp.DeviceManager", methods: ["get_connected()", "push_scene(dev, scene)", "pull_scene(dev)", "get_metrics(dev)"] },
  { module: "sp.PhysicsDomain", methods: ["set_param(key, val)", "bake(frames)", "export_alembic()", "get_voxel_count()"] },
  { module: "sp.AIService",     methods: ["text_to_3d(prompt)", "text_to_texture(prompt)", "image_to_3d(img)", "audio_to_scene(audio)"] },
  { module: "sp.Privacy",       methods: ["create_zone(radius)", "set_encryption(level)", "audit_log()", "rotate_keys()"] },
];

const CONSOLE_HISTORY = [
  { type: "info",    text: "Spatial Scripting Engine v3.0 initialized" },
  { type: "info",    text: "Connected to: Vision Pro, Quest 3, Blender 4.3" },
  { type: "info",    text: "Python 3.11 · Swift 6.0 · spatial_sdk 3.0.1" },
  { type: "success", text: ">>> scene = sp.get_active_scene()" },
  { type: "output",  text: "<Scene 'Z-Pinch Plasma Session' — 5 objects>" },
  { type: "success", text: ">>> scene.objects" },
  { type: "output",  text: "['plasma_column', 'bounding_box', 'emitter', 'camera', 'light']" },
];

export default function SpatialScripting() {
  const [selectedLang, setSelectedLang] = useState("python");
  const [selectedSnippet, setSelectedSnippet] = useState(SNIPPETS[0]);
  const [code, setCode] = useState(SNIPPETS[0].code);
  const [consoleLines, setConsoleLines] = useState(CONSOLE_HISTORY);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"editor" | "docs">("editor");
  const consoleRef = useRef<HTMLDivElement>(null);

  const runScript = () => {
    setRunning(true);
    const lines = [
      { type: "success" as const, text: `>>> Running ${selectedSnippet.label}...` },
      { type: "info" as const,    text: "Connecting to spatial_sdk..." },
    ];
    setConsoleLines(c => [...c, ...lines]);

    setTimeout(() => {
      const output = [
        { type: "output" as const, text: "Found 3 devices: Vision Pro, Quest 3, Blender" },
        { type: "output" as const, text: "Plasma column created: plasma_column" },
        { type: "output" as const, text: "Voxels: 6,291,456" },
        { type: "output" as const, text: "Sim speed: 947.3 Mvox/s" },
        { type: "success" as const, text: "✓ Script completed in 0.84s" },
      ];
      setConsoleLines(c => [...c, ...output]);
      setRunning(false);
    }, 1500);
  };

  const handleInput = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      setConsoleLines(c => [
        ...c,
        { type: "success", text: `>>> ${input}` },
        { type: "output", text: input.includes("scene") ? "<Scene 'Z-Pinch Plasma Session'>" : "None" },
      ]);
      setInput("");
    }
  };

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleLines]);

  const handleSnippetSelect = (s: typeof SNIPPETS[0]) => {
    setSelectedSnippet(s);
    setCode(s.code);
    setSelectedLang(s.lang);
  };

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Spatial Scripting
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Python / Swift scripting console with live scene and device access</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-mono">kernel ready</span>
          </div>
          <button
            onClick={runScript}
            disabled={running}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              running ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-cyan-500 text-white hover:bg-cyan-600"
            }`}
          >
            {running ? <><Square className="w-3.5 h-3.5 fill-current animate-pulse" /> Running…</> : <><Play className="w-3.5 h-3.5 fill-current" /> Run Script</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Snippets & Docs */}
        <div className="w-52 flex-shrink-0 border-r border-white/8 flex flex-col overflow-y-auto">
          {/* Language selector */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Language</p>
            <div className="space-y-1">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLang(l.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${
                    selectedLang === l.id ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
                >
                  <span>{l.icon}</span>
                  <div className="text-left">
                    <p className="font-medium leading-none">{l.label}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{l.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Snippets */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Snippets</p>
            <div className="space-y-1">
              {SNIPPETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSnippetSelect(s)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                    selectedSnippet.id === s.id ? "bg-white/10 border border-white/15 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
                >
                  <p className="font-medium truncate">{s.label}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{s.lang}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API quick ref */}
          <div className="p-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">API Reference</p>
            <div className="space-y-2">
              {API_DOCS.slice(0, 3).map(m => (
                <div key={m.module} className="px-2 py-1.5 bg-white/3 border border-white/6 rounded-lg">
                  <p className="text-[10px] font-mono text-cyan-400 mb-1">{m.module}</p>
                  {m.methods.slice(0, 2).map(method => (
                    <p key={method} className="text-[9px] text-gray-600 font-mono truncate">.{method}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center — Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/8 bg-[#0A0A16] px-4">
            {(["editor", "docs"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 capitalize transition-all ${
                  activeTab === tab ? "border-cyan-500 text-cyan-400" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "editor" ? <><Code className="w-3 h-3 inline mr-1" />Editor</> : <><BookOpen className="w-3 h-3 inline mr-1" />API Docs</>}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 py-1.5">
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><Save className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><Download className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {activeTab === "editor" ? (
            <>
              {/* Code editor */}
              <div className="flex-1 overflow-hidden relative flex">
                {/* Line numbers */}
                <div className="w-10 bg-[#060610] border-r border-white/5 pt-4 flex-shrink-0 overflow-hidden">
                  {code.split("\n").map((_, i) => (
                    <div key={i} className="text-[9px] text-gray-700 font-mono text-right pr-2 leading-relaxed">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="flex-1 bg-[#060610] text-cyan-200 font-mono text-xs p-4 resize-none outline-none border-0 leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Console */}
              <div className="border-t border-white/8 bg-[#060610]" style={{ height: "200px" }}>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Console</span>
                  <button onClick={() => setConsoleLines(CONSOLE_HISTORY)} className="ml-auto text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
                </div>
                <div ref={consoleRef} className="overflow-y-auto px-4 py-2 font-mono text-[10px]" style={{ height: "130px" }}>
                  {consoleLines.map((line, i) => (
                    <div key={i} className={`leading-relaxed ${
                      line.type === "success" ? "text-cyan-400" :
                      line.type === "output"  ? "text-gray-300" :
                      line.type === "error"   ? "text-red-400"  : "text-gray-500"
                    }`}>
                      {line.text}
                    </div>
                  ))}
                  {running && <div className="text-cyan-400 animate-pulse">▌</div>}
                </div>
                {/* Input */}
                <div className="flex items-center gap-2 px-4 py-1.5 border-t border-white/5">
                  <span className="text-cyan-400 font-mono text-[10px]">&gt;&gt;&gt;</span>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleInput}
                    placeholder="Enter Python expression…"
                    className="flex-1 bg-transparent text-[10px] font-mono text-gray-300 outline-none placeholder-gray-700"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-sm font-semibold text-white mb-4">spatial_sdk API Reference</h2>
              <div className="space-y-4">
                {API_DOCS.map(m => (
                  <div key={m.module} className="bg-white/3 border border-white/8 rounded-xl p-4">
                    <p className="text-sm font-mono text-cyan-400 mb-3">{m.module}</p>
                    <div className="space-y-1.5">
                      {m.methods.map(method => (
                        <div key={method} className="flex items-center gap-2 px-2 py-1 rounded bg-white/3">
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                          <span className="text-xs font-mono text-gray-300">{method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Runtime info */}
        <div className="w-56 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Runtime</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Kernel status */}
            <div className="space-y-2">
              {[
                { label: "Kernel",    value: "Python 3.11",    status: "running", color: "text-green-400" },
                { label: "SDK",       value: "spatial 3.0.1",  status: "ready",   color: "text-cyan-400" },
                { label: "GPU",       value: "Apple M3 Ultra", status: "idle",    color: "text-blue-400" },
                { label: "Memory",    value: "2.4 / 8.0 GB",   status: "ok",      color: "text-purple-400" },
              ].map(({ label, value, status, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-[10px] text-gray-500">{label}</span>
                  <div className="text-right">
                    <p className={`text-[10px] font-mono ${color}`}>{value}</p>
                    <p className="text-[9px] text-gray-600">{status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scene variables */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Scene Variables</p>
              <div className="space-y-1">
                {[
                  { name: "scene",   type: "Scene",   val: "'Z-Pinch Plasma'" },
                  { name: "devices", type: "list",    val: "[3 items]" },
                  { name: "domain",  type: "Domain",  val: "plasma_column" },
                  { name: "ai",      type: "AIService",val: "ready" },
                ].map(({ name, type, val }) => (
                  <div key={name} className="px-2 py-1.5 bg-white/3 border border-white/6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400">{name}</span>
                      <span className="text-[9px] text-gray-600">{type}</span>
                    </div>
                    <p className="text-[9px] text-gray-500 mt-0.5 font-mono">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
              <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/15 transition-all">
                <Upload className="w-3.5 h-3.5" />
                Run in Blender
              </button>
              <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/8 transition-all">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Run on Vision Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
