import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GitBranch, Zap, Box, Circle, Triangle, Square,
  Plus, Trash2, Copy, Download, Upload, Play,
  Eye, Settings, ChevronDown, Layers, Cpu, RefreshCw
} from "lucide-react";

type NodeType = "input" | "output" | "math" | "mix" | "texture" | "geometry" | "shader" | "vector" | "color";

interface NodeDef {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  inputs: { name: string; type: string; value?: string }[];
  outputs: { name: string; type: string }[];
  color: string;
  blenderNode: string;
}

interface Connection {
  id: string;
  fromNode: string;
  fromOutput: number;
  toNode: string;
  toInput: number;
}

const INITIAL_NODES: NodeDef[] = [
  {
    id: "n1", type: "input", label: "Texture Coordinate", x: 40, y: 80,
    inputs: [],
    outputs: [{ name: "UV", type: "vector" }, { name: "Object", type: "vector" }, { name: "Normal", type: "vector" }],
    color: "from-green-600 to-green-700", blenderNode: "ShaderNodeTexCoord"
  },
  {
    id: "n2", type: "texture", label: "Noise Texture", x: 220, y: 60,
    inputs: [{ name: "Vector", type: "vector" }, { name: "Scale", type: "float", value: "5.0" }, { name: "Detail", type: "float", value: "8.0" }],
    outputs: [{ name: "Fac", type: "float" }, { name: "Color", type: "color" }],
    color: "from-amber-600 to-amber-700", blenderNode: "ShaderNodeTexNoise"
  },
  {
    id: "n3", type: "color", label: "ColorRamp", x: 420, y: 50,
    inputs: [{ name: "Fac", type: "float" }],
    outputs: [{ name: "Color", type: "color" }, { name: "Alpha", type: "float" }],
    color: "from-pink-600 to-pink-700", blenderNode: "ShaderNodeValToRGB"
  },
  {
    id: "n4", type: "shader", label: "Principled BSDF", x: 620, y: 100,
    inputs: [
      { name: "Base Color", type: "color" },
      { name: "Metallic", type: "float", value: "0.0" },
      { name: "Roughness", type: "float", value: "0.5" },
      { name: "Emission", type: "color" },
      { name: "Alpha", type: "float", value: "1.0" },
    ],
    outputs: [{ name: "BSDF", type: "shader" }],
    color: "from-blue-600 to-blue-700", blenderNode: "ShaderNodeBsdfPrincipled"
  },
  {
    id: "n5", type: "output", label: "Material Output", x: 860, y: 140,
    inputs: [{ name: "Surface", type: "shader" }, { name: "Volume", type: "shader" }, { name: "Displacement", type: "vector" }],
    outputs: [],
    color: "from-gray-600 to-gray-700", blenderNode: "ShaderNodeOutputMaterial"
  },
  {
    id: "n6", type: "math", label: "Math: Multiply", x: 220, y: 260,
    inputs: [{ name: "Value", type: "float", value: "1.0" }, { name: "Value", type: "float", value: "2.0" }],
    outputs: [{ name: "Value", type: "float" }],
    color: "from-cyan-600 to-cyan-700", blenderNode: "ShaderNodeMath"
  },
  {
    id: "n7", type: "vector", label: "Vector Math", x: 420, y: 260,
    inputs: [{ name: "Vector", type: "vector" }, { name: "Vector", type: "vector" }],
    outputs: [{ name: "Vector", type: "vector" }, { name: "Value", type: "float" }],
    color: "from-teal-600 to-teal-700", blenderNode: "ShaderNodeVectorMath"
  },
  {
    id: "n8", type: "texture", label: "Image Texture", x: 40, y: 300,
    inputs: [{ name: "Vector", type: "vector" }],
    outputs: [{ name: "Color", type: "color" }, { name: "Alpha", type: "float" }],
    color: "from-amber-600 to-amber-700", blenderNode: "ShaderNodeTexImage"
  },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "c1", fromNode: "n1", fromOutput: 0, toNode: "n2", toInput: 0 },
  { id: "c2", fromNode: "n2", fromOutput: 0, toNode: "n3", toInput: 0 },
  { id: "c3", fromNode: "n3", fromOutput: 0, toNode: "n4", toInput: 0 },
  { id: "c4", fromNode: "n4", fromOutput: 0, toNode: "n5", toInput: 0 },
  { id: "c5", fromNode: "n6", fromOutput: 0, toNode: "n7", toInput: 0 },
  { id: "c6", fromNode: "n8", fromOutput: 0, toNode: "n4", toInput: 3 },
];

const TYPE_COLOR: Record<string, string> = {
  float: "#a0a0a0",
  vector: "#6060ff",
  color: "#ffaa00",
  shader: "#00cc66",
  int: "#80c0ff",
};

const NODE_PRESETS = [
  { label: "Principled BSDF", icon: "🔵", category: "Shader" },
  { label: "Noise Texture", icon: "🌊", category: "Texture" },
  { label: "Image Texture", icon: "🖼️", category: "Texture" },
  { label: "ColorRamp", icon: "🌈", category: "Color" },
  { label: "Math", icon: "➕", category: "Math" },
  { label: "Mix Shader", icon: "🔀", category: "Shader" },
  { label: "Fresnel", icon: "💎", category: "Input" },
  { label: "Geometry", icon: "📐", category: "Input" },
  { label: "Emission", icon: "✨", category: "Shader" },
  { label: "Bump", icon: "⛰️", category: "Vector" },
  { label: "Normal Map", icon: "🗺️", category: "Vector" },
  { label: "Voronoi", icon: "🔷", category: "Texture" },
];

function getNodeOutputPos(node: NodeDef, outputIdx: number): [number, number] {
  const nodeWidth = 160;
  const headerH = 28;
  const rowH = 20;
  return [node.x + nodeWidth, node.y + headerH + outputIdx * rowH + 10];
}

function getNodeInputPos(node: NodeDef, inputIdx: number): [number, number] {
  const headerH = 28;
  const rowH = 20;
  return [node.x, node.y + headerH + inputIdx * rowH + 10];
}

export default function NodeGraph() {
  const [nodes, setNodes] = useState<NodeDef[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [selectedNode, setSelectedNode] = useState<string | null>("n4");
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const [showPresets, setShowPresets] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "pending">("synced");
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNodeDef = nodes.find(n => n.id === selectedNode);

  // Simulate sync pulses
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus("syncing");
      setTimeout(() => setSyncStatus("synced"), 600);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
    const node = nodes.find(n => n.id === nodeId)!;
    setDragging({ id: nodeId, ox: e.clientX - node.x * zoom, oy: e.clientY - node.y * zoom });
  }, [nodes, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setNodes(prev => prev.map(n =>
      n.id === dragging.id
        ? { ...n, x: (e.clientX - dragging.ox) / zoom, y: (e.clientY - dragging.oy) / zoom }
        : n
    ));
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  // Build SVG path for connection
  const buildPath = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Node Graph Editor</h1>
          <p className="text-[10px] text-gray-500">Shader · Geometry Nodes · Compositing · Blender sync</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all ${
            syncStatus === "synced" ? "bg-green-500/10 border-green-500/20 text-green-400" :
            syncStatus === "syncing" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
            "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === "synced" ? "bg-green-400" :
              syncStatus === "syncing" ? "bg-blue-400 animate-pulse" : "bg-amber-400"
            }`} />
            {syncStatus === "synced" ? "Synced to Blender" : syncStatus === "syncing" ? "Syncing…" : "Pending"}
          </div>
          <button
            onClick={() => setShowPresets(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/25 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/25 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Node
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/10 transition-colors">
            <Upload className="w-3 h-3" /> Push to Blender
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/8 bg-[#09090E] flex-shrink-0">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          {["Shader", "Geometry", "Compositing", "Texture"].map((mode, i) => (
            <button
              key={mode}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                i === 0 ? "bg-cyan-500/20 text-cyan-300" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-[10px] text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(0.9)} className="text-[10px] text-gray-600 hover:text-gray-400">Reset</button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-600">
          <span>{nodes.length} nodes</span>
          <span>{connections.length} links</span>
          <span className="text-cyan-500">Plasma Ring Mat</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Node preset panel */}
        {showPresets && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 160, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/8 bg-[#0A0A14] flex-shrink-0 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/8">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Node Library</p>
            </div>
            <div className="p-2 space-y-0.5">
              {NODE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
                >
                  <span className="text-sm">{preset.icon}</span>
                  <div>
                    <div className="text-[10px] text-gray-300">{preset.label}</div>
                    <div className="text-[8px] text-gray-600">{preset.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-default select-none"
          style={{ background: "radial-gradient(circle at 50% 50%, #0d0d1a 0%, #08080F 100%)" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
            <defs>
              <pattern id="grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4040ff" strokeWidth="0.3" />
              </pattern>
              <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#grid-small)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#4040ff" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-large)" />
          </svg>

          {/* Connections SVG */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.fromNode);
              const toNode = nodes.find(n => n.id === conn.toNode);
              if (!fromNode || !toNode) return null;
              const [x1, y1] = getNodeOutputPos(fromNode, conn.fromOutput);
              const [x2, y2] = getNodeInputPos(toNode, conn.toInput);
              const outputType = fromNode.outputs[conn.fromOutput]?.type ?? "float";
              const color = TYPE_COLOR[outputType] ?? "#888";
              const isSelected = selectedNode === conn.fromNode || selectedNode === conn.toNode;
              return (
                <g key={conn.id}>
                  <path
                    d={buildPath(x1, y1, x2, y2)}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isSelected ? 0.9 : 0.5}
                    filter={isSelected ? `drop-shadow(0 0 4px ${color})` : undefined}
                  />
                  {/* Animated dot along path */}
                  {isSelected && (
                    <circle r="3" fill={color} opacity="0.8">
                      <animateMotion dur="1.5s" repeatCount="indefinite" path={buildPath(x1, y1, x2, y2)} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            {nodes.map(node => (
              <div
                key={node.id}
                className={`absolute rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
                  selectedNode === node.id
                    ? "border-white/40 shadow-lg shadow-white/10 ring-1 ring-white/20"
                    : "border-white/12 hover:border-white/25"
                }`}
                style={{ left: node.x, top: node.y, width: 160, userSelect: "none" }}
                onMouseDown={e => handleMouseDown(e, node.id)}
              >
                {/* Node header */}
                <div className={`flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r ${node.color}`}>
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <span className="text-[10px] font-bold text-white truncate flex-1">{node.label}</span>
                  <span className="text-[8px] text-white/50">{node.blenderNode.replace("ShaderNode", "")}</span>
                </div>

                {/* Body */}
                <div className="bg-[#141420] px-0">
                  {/* Outputs */}
                  {node.outputs.map((out, i) => (
                    <div key={i} className="flex items-center justify-end gap-1.5 px-2 h-5">
                      <span className="text-[9px] text-gray-400">{out.name}</span>
                      <div
                        className="w-2.5 h-2.5 rounded-full border-2 border-[#141420] flex-shrink-0 -mr-1.5"
                        style={{ backgroundColor: TYPE_COLOR[out.type] ?? "#888" }}
                      />
                    </div>
                  ))}
                  {/* Divider */}
                  {node.inputs.length > 0 && node.outputs.length > 0 && (
                    <div className="h-px bg-white/8 mx-2 my-0.5" />
                  )}
                  {/* Inputs */}
                  {node.inputs.map((inp, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 h-5">
                      <div
                        className="w-2.5 h-2.5 rounded-full border-2 border-[#141420] flex-shrink-0 -ml-1.5"
                        style={{ backgroundColor: TYPE_COLOR[inp.type] ?? "#888" }}
                      />
                      <span className="text-[9px] text-gray-400 flex-1 truncate">{inp.name}</span>
                      {inp.value && (
                        <span className="text-[8px] text-gray-600 font-mono">{inp.value}</span>
                      )}
                    </div>
                  ))}
                  <div className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-56 flex-shrink-0 border-l border-white/8 bg-[#0A0A14] flex flex-col overflow-y-auto">
          <div className="px-3 py-2 border-b border-white/8">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Node Properties</p>
          </div>

          {selectedNodeDef ? (
            <div className="p-3 space-y-3">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r ${selectedNodeDef.color} mb-2`}>
                  <span className="text-[10px] font-bold text-white">{selectedNodeDef.label}</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono">{selectedNodeDef.blenderNode}</div>
              </div>

              {selectedNodeDef.inputs.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Inputs</p>
                  <div className="space-y-2">
                    {selectedNodeDef.inputs.map((inp, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[inp.type] ?? "#888" }} />
                          <span className="text-[9px] text-gray-400">{inp.name}</span>
                          <span className="ml-auto text-[8px] text-gray-600">{inp.type}</span>
                        </div>
                        {inp.value && (
                          <input
                            type="text"
                            defaultValue={inp.value}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-cyan-500/50"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeDef.outputs.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Outputs</p>
                  <div className="space-y-1">
                    {selectedNodeDef.outputs.map((out, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[out.type] ?? "#888" }} />
                        <span className="text-[9px] text-gray-400">{out.name}</span>
                        <span className="ml-auto text-[8px] text-gray-600">{out.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/8 space-y-1.5">
                <button className="w-full py-1.5 bg-cyan-500/15 border border-cyan-500/25 rounded-lg text-[10px] text-cyan-300 hover:bg-cyan-500/25 transition-colors">
                  Push Node to Blender
                </button>
                <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button className="w-full py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete Node
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] text-gray-600 text-center px-4">Click a node to view and edit its properties</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-auto p-3 border-t border-white/8">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Socket Types</p>
            <div className="space-y-1">
              {Object.entries(TYPE_COLOR).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] text-gray-500 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
