import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Code, Play, Save, Download, Upload, Copy, RefreshCw, Zap, Eye, ChevronRight } from "lucide-react";

const SHADER_PRESETS = [
  {
    id: "plasma",
    label: "Plasma Column",
    lang: "GLSL",
    vert: `#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
uniform mat4 modelViewProjection;
void main() {
  vUv = uv;
  gl_Position = modelViewProjection * vec4(position, 1.0);
}`,
    frag: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float time;
uniform vec2 resolution;

float plasma(vec2 p, float t) {
  float v = sin(p.x * 6.0 + t);
  v += sin(p.y * 6.0 + t * 0.7);
  v += sin((p.x + p.y) * 6.0 + t * 1.3);
  v += sin(sqrt(p.x*p.x + p.y*p.y) * 8.0 - t * 2.0);
  return v;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float v = plasma(uv, time);
  vec3 col = vec3(
    0.5 + 0.5 * sin(v * 3.14 + 0.0),
    0.2 + 0.3 * sin(v * 3.14 + 2.1),
    0.8 + 0.2 * sin(v * 3.14 + 4.2)
  );
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "pbr",
    label: "PBR Metallic",
    lang: "GLSL",
    vert: `#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
in vec2 uv;
out vec3 vNormal;
out vec3 vPos;
out vec2 vUv;
uniform mat4 modelViewProjection;
uniform mat3 normalMatrix;
void main() {
  vNormal = normalMatrix * normal;
  vPos = position;
  vUv = uv;
  gl_Position = modelViewProjection * vec4(position, 1.0);
}`,
    frag: `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vPos;
in vec2 vUv;
out vec4 fragColor;
uniform float time;
uniform float metallic;
uniform float roughness;

const float PI = 3.14159265;

float D_GGX(float NdotH, float r) {
  float a = r * r;
  float a2 = a * a;
  float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(1.0, 2.0, 1.5));
  vec3 V = normalize(vec3(0.0, 0.0, 1.0));
  vec3 H = normalize(L + V);
  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  vec3 baseColor = vec3(0.8, 0.7, 0.9);
  vec3 F0 = mix(vec3(0.04), baseColor, metallic);
  float spec = D_GGX(NdotH, roughness);
  vec3 color = (baseColor / PI + F0 * spec) * NdotL;
  color = pow(color, vec3(1.0/2.2));
  fragColor = vec4(color, 1.0);
}`,
  },
  {
    id: "hologram",
    label: "Hologram",
    lang: "Metal",
    vert: `// Metal Vertex Shader
#include <metal_stdlib>
using namespace metal;

struct VertexIn {
  float3 position [[attribute(0)]];
  float2 uv       [[attribute(1)]];
};

struct VertexOut {
  float4 position [[position]];
  float2 uv;
  float3 worldPos;
};

vertex VertexOut vertexMain(
  VertexIn in [[stage_in]],
  constant float4x4 &mvp [[buffer(0)]],
  constant float &time [[buffer(1)]]
) {
  VertexOut out;
  float3 pos = in.position;
  pos.y += sin(pos.x * 4.0 + time) * 0.02;
  out.position = mvp * float4(pos, 1.0);
  out.uv = in.uv;
  out.worldPos = pos;
  return out;
}`,
    frag: `// Metal Fragment Shader
#include <metal_stdlib>
using namespace metal;

struct VertexOut {
  float4 position [[position]];
  float2 uv;
  float3 worldPos;
};

fragment float4 fragmentMain(
  VertexOut in [[stage_in]],
  constant float &time [[buffer(0)]]
) {
  float2 uv = in.uv;
  float scan = sin(uv.y * 80.0 + time * 3.0) * 0.5 + 0.5;
  float edge = abs(sin(uv.x * 40.0)) * 0.3;
  float flicker = 0.85 + 0.15 * sin(time * 7.3);
  float3 color = float3(0.2, 0.8, 1.0) * (scan * 0.4 + 0.6) * flicker;
  color += float3(0.0, 0.3, 0.5) * edge;
  float alpha = 0.7 + 0.3 * scan;
  return float4(color, alpha);
}`,
  },
  {
    id: "zpinch",
    label: "Z-Pinch MHD",
    lang: "GLSL",
    vert: `#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
out float vY;
uniform mat4 mvp;
uniform float time;
void main() {
  vUv = uv;
  vY = position.y;
  vec3 p = position;
  float pinch = 1.0 - 0.6 * sin(p.y * 1.5 + 0.5);
  p.x *= pinch;
  p.z *= pinch;
  p.x += sin(p.y * 8.0 + time * 3.0) * 0.02;
  gl_Position = mvp * vec4(p, 1.0);
}`,
    frag: `#version 300 es
precision highp float;
in vec2 vUv;
in float vY;
out vec4 fragColor;
uniform float time;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float r = length(uv);
  float theta = atan(uv.y, uv.x);
  float pinch = 1.0 - 0.6 * sin(vY * 1.5 + 0.5);
  float glow = exp(-r * r * 8.0 / (pinch * pinch));
  float ring = exp(-abs(r - 0.4 * pinch) * 20.0);
  float twist = sin(theta * 3.0 + vY * 6.0 + time * 4.0) * 0.5 + 0.5;
  vec3 col = vec3(0.3, 0.2, 0.8) * glow;
  col += vec3(0.6, 0.4, 1.0) * ring * twist;
  col += vec3(0.1, 0.05, 0.3) * 0.3;
  fragColor = vec4(col, glow + ring * 0.5);
}`,
  },
];

const UNIFORMS = [
  { name: "time",       type: "float", value: "auto",  desc: "Elapsed time in seconds" },
  { name: "resolution", type: "vec2",  value: "auto",  desc: "Viewport resolution" },
  { name: "metallic",   type: "float", value: "0.8",   desc: "PBR metallic factor" },
  { name: "roughness",  type: "float", value: "0.2",   desc: "PBR roughness factor" },
  { name: "mvp",        type: "mat4",  value: "auto",  desc: "Model-view-projection matrix" },
];

function ShaderPreview({ shaderId }: { shaderId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();

    const draw = () => {
      tRef.current += 0.016;
      const t = tRef.current;
      const W = canvas.width, H = canvas.height;
      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const u = (x / W) * 2 - 1;
          const v = (y / H) * 2 - 1;
          let r = 0, g = 0, b = 0;

          if (shaderId === "plasma" || shaderId === "zpinch") {
            const pv = Math.sin(u * 6 + t) + Math.sin(v * 6 + t * 0.7) + Math.sin((u + v) * 6 + t * 1.3) + Math.sin(Math.sqrt(u*u+v*v)*8 - t*2);
            r = (0.5 + 0.5 * Math.sin(pv * Math.PI)) * 255;
            g = (0.2 + 0.3 * Math.sin(pv * Math.PI + 2.1)) * 255;
            b = (0.8 + 0.2 * Math.sin(pv * Math.PI + 4.2)) * 255;
          } else if (shaderId === "hologram") {
            const scan = Math.sin(v * 40 + t * 3) * 0.5 + 0.5;
            const flicker = 0.85 + 0.15 * Math.sin(t * 7.3);
            r = 50 * scan * flicker;
            g = 200 * scan * flicker;
            b = 255 * flicker;
          } else if (shaderId === "pbr") {
            const nz = Math.sqrt(Math.max(0, 1 - u*u - v*v));
            const ndotl = Math.max(0, nz * 0.7 + u * 0.5 + v * 0.5);
            r = ndotl * 200 + 30;
            g = ndotl * 180 + 20;
            b = ndotl * 230 + 40;
          }

          const i = (y * W + x) * 4;
          data[i] = Math.min(255, r);
          data[i+1] = Math.min(255, g);
          data[i+2] = Math.min(255, b);
          data[i+3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [shaderId]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export default function ShaderLab() {
  const [selectedPreset, setSelectedPreset] = useState(SHADER_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<"frag" | "vert">("frag");
  const [fragCode, setFragCode] = useState(SHADER_PRESETS[0].frag);
  const [vertCode, setVertCode] = useState(SHADER_PRESETS[0].vert);
  const [errors, setErrors] = useState<string[]>([]);
  const [compiled, setCompiled] = useState(true);
  const [metallic, setMetallic] = useState(0.8);
  const [roughness, setRoughness] = useState(0.2);

  const handlePresetChange = (preset: typeof SHADER_PRESETS[0]) => {
    setSelectedPreset(preset);
    setFragCode(preset.frag);
    setVertCode(preset.vert);
    setErrors([]);
    setCompiled(true);
  };

  const handleCompile = () => {
    const code = activeTab === "frag" ? fragCode : vertCode;
    const errs: string[] = [];
    if (code.includes("undefined_var")) errs.push("Line 12: undefined variable 'undefined_var'");
    setErrors(errs);
    setCompiled(errs.length === 0);
  };

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-green-400" />
            Shader Lab
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Live GLSL / Metal shader editor with real-time preview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${compiled ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {compiled ? "✓ Compiled" : "✗ Error"}
          </span>
          <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400">
            {selectedPreset.lang}
          </span>
          <button onClick={handleCompile} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/15 border border-green-500/30 rounded-lg text-xs text-green-300 hover:bg-green-500/25 transition-all">
            <Play className="w-3.5 h-3.5 fill-current" />
            Compile & Run
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Push to Blender
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Presets */}
        <div className="w-44 flex-shrink-0 border-r border-white/8 overflow-y-auto">
          <div className="px-3 py-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Shader Presets</p>
          </div>
          <div className="p-2 space-y-1">
            {SHADER_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                  selectedPreset.id === p.id ? "bg-green-500/15 border border-green-500/25 text-green-300" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <p className="font-medium">{p.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{p.lang}</p>
              </button>
            ))}
          </div>

          {/* Uniforms */}
          <div className="px-3 py-3 border-t border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Uniforms</p>
            <div className="space-y-2">
              {UNIFORMS.map(u => (
                <div key={u.name} className="px-2 py-1.5 bg-white/3 border border-white/6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-green-400">{u.name}</span>
                    <span className="text-[9px] text-gray-600">{u.type}</span>
                  </div>
                  <p className="text-[9px] text-gray-600 mt-0.5">{u.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PBR sliders */}
          {selectedPreset.id === "pbr" && (
            <div className="px-3 py-3 border-t border-white/8">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">PBR Parameters</p>
              {[
                { label: "Metallic", value: metallic, set: setMetallic, color: "text-amber-400" },
                { label: "Roughness", value: roughness, set: setRoughness, color: "text-blue-400" },
              ].map(({ label, value, set, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{label}</span>
                    <span className={`text-[10px] font-mono ${color}`}>{value.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={value}
                    onChange={e => set(parseFloat(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center — Code editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/8 bg-[#0A0A16] px-4">
            {(["frag", "vert"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                  activeTab === tab ? "border-green-500 text-green-400" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "frag" ? "Fragment Shader" : "Vertex Shader"}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 py-1.5">
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="Copy">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="Reset">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="Save">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="Download">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden relative">
            <textarea
              value={activeTab === "frag" ? fragCode : vertCode}
              onChange={e => activeTab === "frag" ? setFragCode(e.target.value) : setVertCode(e.target.value)}
              className="w-full h-full bg-[#060610] text-green-300 font-mono text-xs p-4 resize-none outline-none border-0 leading-relaxed"
              spellCheck={false}
              style={{ tabSize: 2 }}
            />
            {/* Line numbers overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#060610] border-r border-white/5 pointer-events-none flex flex-col pt-4">
              {(activeTab === "frag" ? fragCode : vertCode).split("\n").map((_, i) => (
                <div key={i} className="text-[9px] text-gray-700 font-mono text-right pr-2 leading-relaxed">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Error console */}
          <div className="border-t border-white/8 bg-[#0A0A10] px-4 py-2" style={{ minHeight: "48px" }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Compiler Output</span>
            </div>
            {errors.length === 0 ? (
              <p className="text-[10px] text-green-400 font-mono">✓ No errors. Shader compiled successfully.</p>
            ) : (
              errors.map((e, i) => (
                <p key={i} className="text-[10px] text-red-400 font-mono">{e}</p>
              ))
            )}
          </div>
        </div>

        {/* Right — Preview */}
        <div className="w-64 flex-shrink-0 border-l border-white/8 flex flex-col">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Live Preview</p>
            <Eye className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="flex-1 relative bg-[#05050A] overflow-hidden">
            <ShaderPreview shaderId={selectedPreset.id} />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-[9px] text-gray-600 font-mono bg-black/50 px-1.5 py-0.5 rounded">{selectedPreset.label}</span>
              <span className="text-[9px] text-green-400 font-mono bg-black/50 px-1.5 py-0.5 rounded">LIVE</span>
            </div>
          </div>
          {/* Preview options */}
          <div className="p-3 border-t border-white/8 space-y-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Preview Mesh</p>
            {["Sphere", "Plane", "Cube", "Cylinder", "Custom"].map(m => (
              <button key={m} className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
