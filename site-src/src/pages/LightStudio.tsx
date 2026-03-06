import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sun, Upload, Download, Plus, Trash2, Eye, EyeOff, Sliders, Zap } from "lucide-react";

const LIGHT_TYPES = [
  { id: "area",        label: "Area",        icon: "⬜", desc: "Rectangular soft light" },
  { id: "point",       label: "Point",       icon: "●",  desc: "Omnidirectional point" },
  { id: "spot",        label: "Spot",        icon: "▼",  desc: "Directional cone" },
  { id: "directional", label: "Directional", icon: "→",  desc: "Parallel sun rays" },
  { id: "hdr",         label: "HDRI",        icon: "🌐", desc: "Environment map" },
];

const HDR_PRESETS = [
  { id: "studio",    label: "Studio",        temp: 5500 },
  { id: "outdoor",   label: "Outdoor Day",   temp: 6500 },
  { id: "sunset",    label: "Golden Hour",   temp: 3200 },
  { id: "night",     label: "Night City",    temp: 4000 },
  { id: "plasma",    label: "Plasma Lab",    temp: 8000 },
  { id: "space",     label: "Deep Space",    temp: 9500 },
];

interface Light {
  id: string;
  name: string;
  type: string;
  color: string;
  intensity: number;
  temperature: number;
  radius: number;
  visible: boolean;
  x: number;
  y: number;
  z: number;
  castShadow: boolean;
  volumetric: boolean;
}

const DEFAULT_LIGHTS: Light[] = [
  { id: "key",   name: "Key Light",   type: "area",  color: "#FFF5E0", intensity: 85, temperature: 5500, radius: 1.2, visible: true, x: 2, y: 3, z: 1, castShadow: true, volumetric: false },
  { id: "fill",  name: "Fill Light",  type: "area",  color: "#E0F0FF", intensity: 40, temperature: 6500, radius: 0.8, visible: true, x: -2, y: 2, z: 1, castShadow: false, volumetric: false },
  { id: "rim",   name: "Rim Light",   type: "spot",  color: "#C0D0FF", intensity: 60, temperature: 7000, radius: 0.5, visible: true, x: 0, y: 2, z: -2, castShadow: true, volumetric: true },
  { id: "hdr",   name: "HDRI Sky",    type: "hdr",   color: "#FFFFFF", intensity: 30, temperature: 6000, radius: 0, visible: true, x: 0, y: 0, z: 0, castShadow: false, volumetric: false },
];

function LightPreview({ lights }: { lights: Light[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const draw = () => {
      tRef.current += 0.01;
      const t = tRef.current;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, W, H);

      // Draw sphere
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.3;

      // Accumulate light contributions
      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const dx = (px - cx) / r, dy = (py - cy) / r;
          const d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;

          const nz = Math.sqrt(1 - d2);
          const nx = dx, ny = -dy;
          let totalR = 0, totalG = 0, totalB = 0;

          for (const light of lights) {
            if (!light.visible) continue;
            const lx = light.x / 4, ly = light.y / 4, lz = light.z / 4;
            const len = Math.sqrt(lx*lx + ly*ly + lz*lz) || 1;
            const ndotl = Math.max(0, nx*(lx/len) + ny*(ly/len) + nz*(lz/len));
            const spec = Math.pow(Math.max(0, ndotl), 32) * (light.intensity / 100);
            const diff = ndotl * (light.intensity / 100) * 0.7;
            const cr = parseInt(light.color.slice(1,3), 16) / 255;
            const cg = parseInt(light.color.slice(3,5), 16) / 255;
            const cb = parseInt(light.color.slice(5,7), 16) / 255;
            totalR += (diff + spec) * cr;
            totalG += (diff + spec) * cg;
            totalB += (diff + spec) * cb;
          }

          // Volumetric glow for rim
          const rimLight = lights.find(l => l.id === "rim" && l.visible && l.volumetric);
          if (rimLight) {
            const rim = Math.pow(Math.max(0, 1 - nz), 3) * (rimLight.intensity / 100) * 0.5;
            totalR += rim * 0.5;
            totalG += rim * 0.7;
            totalB += rim * 1.0;
          }

          const i = (py * W + px) * 4;
          data[i]   = Math.min(255, totalR * 255);
          data[i+1] = Math.min(255, totalG * 255);
          data[i+2] = Math.min(255, totalB * 255);
          data[i+3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Draw light gizmos
      for (const light of lights) {
        if (!light.visible || light.type === "hdr") continue;
        const lx = cx + (light.x / 4) * r;
        const ly = cy - (light.y / 4) * r;
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fillStyle = light.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "9px monospace";
        ctx.fillText(light.name.split(" ")[0], lx + 8, ly + 3);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [lights]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export default function LightStudio() {
  const [lights, setLights] = useState<Light[]>(DEFAULT_LIGHTS);
  const [selectedLight, setSelectedLight] = useState<Light>(DEFAULT_LIGHTS[0]);
  const [selectedHDR, setSelectedHDR] = useState("studio");
  const [exposure, setExposure] = useState(0);
  const [gamma, setGamma] = useState(2.2);
  const [bloom, setBloom] = useState(0.3);

  const updateLight = (id: string, updates: Partial<Light>) => {
    setLights(ls => ls.map(l => l.id === id ? { ...l, ...updates } : l));
    if (selectedLight.id === id) setSelectedLight(l => ({ ...l, ...updates }));
  };

  const addLight = () => {
    const newLight: Light = {
      id: `light_${Date.now()}`,
      name: `Light ${lights.length + 1}`,
      type: "area",
      color: "#FFFFFF",
      intensity: 50,
      temperature: 5500,
      radius: 0.5,
      visible: true,
      x: 0, y: 2, z: 0,
      castShadow: true,
      volumetric: false,
    };
    setLights(ls => [...ls, newLight]);
    setSelectedLight(newLight);
  };

  const removeLight = (id: string) => {
    setLights(ls => ls.filter(l => l.id !== id));
    if (selectedLight.id === id && lights.length > 1) setSelectedLight(lights[0]);
  };

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-yellow-400" />
            Light Studio
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">HDR environment and area light editor with real-time PBR preview</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Push to Blender
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export HDRI
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Light list */}
        <div className="w-52 flex-shrink-0 border-r border-white/8 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Lights ({lights.length})</p>
            <button onClick={addLight} className="p-1 rounded-md bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/25 transition-all">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-2 space-y-1 flex-1">
            {lights.map(light => (
              <div
                key={light.id}
                onClick={() => setSelectedLight(light)}
                className={`flex items-center gap-2 px-2.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                  selectedLight.id === light.id ? "bg-yellow-500/12 border border-yellow-500/25" : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: light.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{light.name}</p>
                  <p className="text-[9px] text-gray-600">{light.type} · {light.intensity}%</p>
                </div>
                <button onClick={e => { e.stopPropagation(); updateLight(light.id, { visible: !light.visible }); }}
                  className="text-gray-600 hover:text-gray-300 transition-colors">
                  {light.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                {light.id !== "hdr" && (
                  <button onClick={e => { e.stopPropagation(); removeLight(light.id); }}
                    className="text-gray-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* HDRI presets */}
          <div className="border-t border-white/8 p-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">HDRI Preset</p>
            <div className="space-y-1">
              {HDR_PRESETS.map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHDR(h.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    selectedHDR === h.id ? "bg-yellow-500/12 border border-yellow-500/20 text-yellow-300" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
                >
                  <span>{h.label}</span>
                  <span className="text-[9px] text-gray-600">{h.temp}K</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center — Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative bg-[#05050A]">
            <LightPreview lights={lights} />
            {/* Overlay stats */}
            <div className="absolute top-3 right-3 space-y-1">
              {[
                { label: "Lights",   value: lights.filter(l => l.visible).length },
                { label: "Exposure", value: `${exposure > 0 ? "+" : ""}${exposure.toFixed(1)} EV` },
                { label: "Gamma",    value: gamma.toFixed(1) },
                { label: "Bloom",    value: `${(bloom * 100).toFixed(0)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-white/8">
                  <span className="text-[9px] text-gray-500">{label}</span>
                  <span className="text-[9px] text-yellow-400 font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post-processing bar */}
          <div className="border-t border-white/8 bg-[#0A0A14] px-6 py-3">
            <div className="flex items-center gap-8">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider flex-shrink-0">Post Processing</p>
              {[
                { label: "Exposure", value: exposure, set: setExposure, min: -3, max: 3, step: 0.1, color: "text-yellow-400" },
                { label: "Gamma",    value: gamma,    set: setGamma,    min: 1,  max: 3, step: 0.1, color: "text-orange-400" },
                { label: "Bloom",    value: bloom,    set: setBloom,    min: 0,  max: 1, step: 0.01, color: "text-pink-400" },
              ].map(({ label, value, set, min, max, step, color }) => (
                <div key={label} className="flex items-center gap-3 flex-1">
                  <span className="text-[10px] text-gray-400 w-16 flex-shrink-0">{label}</span>
                  <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => set(parseFloat(e.target.value))}
                    className="flex-1 h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                  <span className={`text-[10px] font-mono w-10 text-right ${color}`}>{value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Light properties */}
        <div className="w-60 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: selectedLight.color }} />
            <p className="text-xs font-medium text-gray-300 truncate">{selectedLight.name}</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Type */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Type</p>
              <div className="grid grid-cols-3 gap-1">
                {LIGHT_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => updateLight(selectedLight.id, { type: t.id })}
                    className={`p-1.5 rounded-lg border text-center transition-all ${
                      selectedLight.type === t.id ? "border-yellow-500/40 bg-yellow-500/10" : "border-white/8 bg-white/3 hover:bg-white/6"
                    }`}
                  >
                    <p className="text-base">{t.icon}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            {[
              { label: "Intensity",    key: "intensity",    min: 0, max: 100, step: 1, color: "text-yellow-400", unit: "%" },
              { label: "Temperature",  key: "temperature",  min: 1000, max: 12000, step: 100, color: "text-orange-400", unit: "K" },
              { label: "Radius",       key: "radius",       min: 0, max: 5, step: 0.1, color: "text-blue-400", unit: "m" },
            ].map(({ label, key, min, max, step, color, unit }) => (
              <div key={key}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400">{label}</span>
                  <span className={`text-[10px] font-mono ${color}`}>{(selectedLight as any)[key]}{unit}</span>
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={(selectedLight as any)[key]}
                  onChange={e => updateLight(selectedLight.id, { [key]: parseFloat(e.target.value) } as any)}
                  className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                />
              </div>
            ))}

            {/* Color */}
            <div>
              <p className="text-[10px] text-gray-400 mb-2">Color</p>
              <div className="flex gap-1.5 flex-wrap">
                {["#FFF5E0","#FFFFFF","#E0F0FF","#FFD700","#FF6B6B","#6BFFB8","#6B9FFF","#C0D0FF"].map(c => (
                  <button
                    key={c}
                    onClick={() => updateLight(selectedLight.id, { color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${selectedLight.color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              {[
                { label: "Cast Shadows", key: "castShadow" },
                { label: "Volumetric",   key: "volumetric" },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <button
                    onClick={() => updateLight(selectedLight.id, { [key]: !(selectedLight as any)[key] } as any)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${(selectedLight as any)[key] ? "bg-yellow-500" : "bg-gray-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(selectedLight as any)[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Position */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Position</p>
              {["x","y","z"].map(axis => (
                <div key={axis} className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-mono w-3 ${axis === "x" ? "text-red-400" : axis === "y" ? "text-green-400" : "text-blue-400"}`}>{axis.toUpperCase()}</span>
                  <input type="range" min={-5} max={5} step={0.1}
                    value={(selectedLight as any)[axis]}
                    onChange={e => updateLight(selectedLight.id, { [axis]: parseFloat(e.target.value) } as any)}
                    className="flex-1 h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{(selectedLight as any)[axis].toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
