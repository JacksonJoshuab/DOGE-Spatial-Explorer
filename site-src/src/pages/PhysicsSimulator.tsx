import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Zap, Layers, Settings, Download, Upload, Activity, Cpu, Wind } from "lucide-react";

const SIM_TYPES = [
  { id: "rigid",  label: "Rigid Body",  icon: "⬡", color: "text-blue-400",   desc: "Collision, friction, restitution" },
  { id: "soft",   label: "Soft Body",   icon: "◉", color: "text-green-400",  desc: "Cloth, deformation, elasticity" },
  { id: "fluid",  label: "Fluid",       icon: "◎", color: "text-cyan-400",   desc: "SPH, FLIP, volume preservation" },
  { id: "smoke",  label: "Smoke / Gas", icon: "◌", color: "text-purple-400", desc: "Voxel grid, turbulence, buoyancy" },
  { id: "plasma", label: "Plasma",      icon: "✦", color: "text-amber-400",  desc: "Z-Pinch, electromagnetic, MHD" },
];

const OBJECTS = [
  { id: 1, name: "Plasma Column",    type: "plasma", mass: "∞",     vel: "0.0 m/s", pos: "0, 0, 0",     active: true  },
  { id: 2, name: "Bounding Box",     type: "rigid",  mass: "∞",     vel: "0.0 m/s", pos: "0, 0, 0",     active: true  },
  { id: 3, name: "Particle Emitter", type: "fluid",  mass: "0.001", vel: "2.4 m/s", pos: "0, -1.2, 0",  active: true  },
  { id: 4, name: "Cloth Plane",      type: "soft",   mass: "0.5",   vel: "0.0 m/s", pos: "0, 2.0, 0",   active: false },
  { id: 5, name: "Smoke Domain",     type: "smoke",  mass: "0.0",   vel: "0.8 m/s", pos: "0, 1.5, 0",   active: false },
];

const PRESETS = [
  { id: "zpinch",   label: "Z-Pinch Plasma",    icon: "✦", desc: "Electromagnetic plasma column" },
  { id: "waterfall",label: "Waterfall",          icon: "💧", desc: "SPH fluid with gravity" },
  { id: "explosion",label: "Explosion",          icon: "💥", desc: "Rigid + smoke + fire" },
  { id: "cloth",    label: "Cloth Drop",         icon: "🧣", desc: "Soft body cloth simulation" },
  { id: "smoke",    label: "Smoke Plume",        icon: "🌫", desc: "Turbulent smoke simulation" },
  { id: "tornado",  label: "Vortex Field",       icon: "🌀", desc: "Velocity field + particles" },
];

function SimCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; life: number; r: number; hue: number }[] = [];

    const draw = () => {
      tRef.current += 0.016;
      const t = tRef.current;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;

      ctx.fillStyle = "rgba(5,5,15,0.15)";
      ctx.fillRect(0, 0, W, H);

      // Bounding box
      const bw = Math.min(W, H) * 0.55, bh = Math.min(W, H) * 0.7;
      ctx.strokeStyle = "rgba(255,100,200,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
      // Corner markers
      const corners = [[cx-bw/2,cy-bh/2],[cx+bw/2,cy-bh/2],[cx-bw/2,cy+bh/2],[cx+bw/2,cy+bh/2]];
      corners.forEach(([x,y]) => {
        ctx.strokeStyle = "rgba(255,100,200,0.5)";
        ctx.beginPath(); ctx.moveTo(x-6,y); ctx.lineTo(x+6,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y-6); ctx.lineTo(x,y+6); ctx.stroke();
      });

      // Gizmo axes
      ctx.strokeStyle = "rgba(255,50,50,0.7)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+40,cy); ctx.stroke();
      ctx.strokeStyle = "rgba(50,255,50,0.7)";
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx,cy-40); ctx.stroke();
      ctx.strokeStyle = "rgba(50,100,255,0.7)";
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-20,cy+20); ctx.stroke();

      // Plasma column — Z-Pinch style
      const numRings = 14;
      for (let i = 0; i < numRings; i++) {
        const frac = i / numRings;
        const y = cy + bh/2 - frac * bh * 0.9;
        const pinch = 0.15 + 0.35 * Math.sin(frac * Math.PI) * (1 + 0.1 * Math.sin(t * 3 + frac * 8));
        const rx = bw * pinch * 0.5;
        const ry = bw * 0.04;
        const hue = 220 + frac * 60 + Math.sin(t * 2 + frac * 4) * 20;
        const alpha = 0.3 + 0.4 * Math.sin(frac * Math.PI);
        ctx.strokeStyle = `hsla(${hue},80%,65%,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Core plasma beam
      const gradient = ctx.createLinearGradient(cx, cy - bh/2, cx, cy + bh/2);
      gradient.addColorStop(0, "rgba(200,150,255,0)");
      gradient.addColorStop(0.3, `rgba(150,100,255,${0.3 + 0.1*Math.sin(t*4)})`);
      gradient.addColorStop(0.5, `rgba(180,120,255,${0.5 + 0.15*Math.sin(t*3)})`);
      gradient.addColorStop(0.7, `rgba(100,80,200,${0.3 + 0.1*Math.sin(t*4)})`);
      gradient.addColorStop(1, "rgba(80,60,180,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 8 + 3*Math.sin(t*5), bh*0.45, 0, 0, Math.PI*2);
      ctx.fill();

      // Spawn particles
      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 15;
        const spawnY = cy - bh/2 + Math.random() * bh;
        particles.push({
          x: cx + Math.cos(angle) * r,
          y: spawnY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -0.5 - Math.random() * 1.5,
          life: 1,
          r: 1 + Math.random() * 2,
          hue: 200 + Math.random() * 80,
        });
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy -= 0.02; p.life -= 0.015;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.life * 0.8})`;
        ctx.fill();
      }

      // Stats overlay
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px monospace";
      ctx.fillText(`Particles: ${particles.length}`, 12, 20);
      ctx.fillText(`t = ${t.toFixed(2)}s`, 12, 34);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export default function PhysicsSimulator() {
  const [running, setRunning] = useState(true);
  const [simType, setSimType] = useState("plasma");
  const [selectedPreset, setSelectedPreset] = useState("zpinch");
  const [gravity, setGravity] = useState(-9.81);
  const [substeps, setSubsteps] = useState(4);
  const [timeScale, setTimeScale] = useState(1.0);
  const [viscosity, setViscosity] = useState(0.1);
  const [selectedObj, setSelectedObj] = useState(OBJECTS[0]);
  const [simTime, setSimTime] = useState(0);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSimTime(t => t + 0.016 * timeScale);
      setFps(55 + Math.floor(Math.random() * 10));
    }, 16);
    return () => clearInterval(id);
  }, [running, timeScale]);

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Physics Simulator
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time rigid body, soft body, fluid, and plasma simulation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
            <Activity className="w-3.5 h-3.5 text-green-400" />
            <span>{fps} fps</span>
            <span className="text-gray-600">·</span>
            <span>{simTime.toFixed(2)}s</span>
          </div>
          <button onClick={() => setSimTime(0)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(r => !r)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              running ? "bg-amber-500/20 border border-amber-500/40 text-amber-300" : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {running ? <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-current" /> Run</>}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col overflow-y-auto">
          {/* Sim type */}
          <div className="px-3 py-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Simulation Type</p>
            <div className="space-y-1">
              {SIM_TYPES.map(st => (
                <button
                  key={st.id}
                  onClick={() => setSimType(st.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${
                    simType === st.id ? "bg-white/10 border border-white/15 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
                >
                  <span className={`text-base ${st.color}`}>{st.icon}</span>
                  <div className="text-left">
                    <p className="font-medium leading-none">{st.label}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{st.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="px-3 py-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Presets</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedPreset === p.id ? "border-amber-500/40 bg-amber-500/10" : "border-white/8 bg-white/3 hover:bg-white/6"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <p className="text-[9px] text-gray-300 mt-0.5 leading-tight">{p.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Objects */}
          <div className="px-3 py-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Scene Objects</p>
            <div className="space-y-1">
              {OBJECTS.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObj(obj)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                    selectedObj.id === obj.id ? "bg-white/10 border border-white/15" : "hover:bg-white/5"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${obj.active ? "bg-green-400" : "bg-gray-600"}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-300 truncate">{obj.name}</p>
                    <p className="text-[9px] text-gray-600">{obj.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center — Simulation canvas */}
        <div className="flex-1 relative bg-[#05050A] overflow-hidden">
          <SimCanvas />
          {/* Overlay stats */}
          <div className="absolute top-3 right-3 space-y-1.5">
            {[
              { label: "Sim Speed", value: `${(947 * timeScale).toFixed(0)} Mvox/s`, color: "text-green-400" },
              { label: "Sim Time",  value: `${(simTime * 1000).toFixed(1)} ms`,       color: "text-blue-400" },
              { label: "Voxels",    value: "6.3 Mvox",                                color: "text-purple-400" },
              { label: "Bounds",    value: "128×128×384",                             color: "text-amber-400" },
              { label: "VRAM",      value: "5.9 / 9.8 GiB",                          color: "text-red-400" },
              { label: "UI FPS",    value: `${fps} fps`,                              color: "text-cyan-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between gap-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/8">
                <span className="text-[10px] text-gray-500">{label}</span>
                <span className={`text-[10px] font-mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          {/* Bottom controls */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/8">
              <Wind className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Gravity: {gravity.toFixed(2)} m/s²</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/8">
              <Cpu className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-gray-400">Substeps: {substeps}</span>
            </div>
          </div>
        </div>

        {/* Right panel — Properties */}
        <div className="w-64 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Simulation Properties</p>
          </div>
          <div className="p-4 space-y-5">
            {/* Global */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Global Settings</p>
              <div className="space-y-3">
                {[
                  { label: "Gravity Y", value: gravity, min: -20, max: 0, step: 0.1, set: setGravity, unit: "m/s²", color: "blue" },
                  { label: "Time Scale", value: timeScale, min: 0.1, max: 3, step: 0.1, set: setTimeScale, unit: "×", color: "amber" },
                  { label: "Viscosity", value: viscosity, min: 0, max: 1, step: 0.01, set: setViscosity, unit: "", color: "cyan" },
                ].map(({ label, value, min, max, step, set, unit, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-400">{label}</span>
                      <span className={`text-[10px] font-mono text-${color}-400`}>{value.toFixed(2)}{unit}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step} value={value}
                      onChange={e => set(parseFloat(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                    />
                  </div>
                ))}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400">Substeps</span>
                    <span className="text-[10px] font-mono text-purple-400">{substeps}</span>
                  </div>
                  <input type="range" min={1} max={16} step={1} value={substeps}
                    onChange={e => setSubsteps(parseInt(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Selected object */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Selected: {selectedObj.name}</p>
              <div className="space-y-2">
                {[
                  { label: "Type",     value: selectedObj.type },
                  { label: "Mass",     value: `${selectedObj.mass} kg` },
                  { label: "Velocity", value: selectedObj.vel },
                  { label: "Position", value: selectedObj.pos },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-[10px] text-gray-500">{label}</span>
                    <span className="text-[10px] font-mono text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 transition-all">
                <Upload className="w-3.5 h-3.5" />
                Bake to Blender
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Export Alembic
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Export USDZ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
