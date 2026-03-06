import{j as e}from"./framer-CQvazNpH.js";import{a as s}from"./react-y5SCQdqY.js";import{C as M}from"./code-Bu13pzNA.js";import{P as S}from"./play-D5p631ny.js";import{U as R}from"./upload-BaBg1cOq.js";import{C as L}from"./copy-Ba5UAKE2.js";import{R as k}from"./refresh-cw-jXmR2BHj.js";import{S as V}from"./save-DxktIGid.js";import{D as U}from"./download-BJd4ciyy.js";import{Z as H}from"./zap-C8hA3Ep8.js";import{E as _,C as z}from"./index-BKywVNQG.js";import"./react-three-PjJ30pGH.js";import"./three-CLEub1Hg.js";const P=[{id:"plasma",label:"Plasma Column",lang:"GLSL",vert:`#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
uniform mat4 modelViewProjection;
void main() {
  vUv = uv;
  gl_Position = modelViewProjection * vec4(position, 1.0);
}`,frag:`#version 300 es
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
}`},{id:"pbr",label:"PBR Metallic",lang:"GLSL",vert:`#version 300 es
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
}`,frag:`#version 300 es
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
}`},{id:"hologram",label:"Hologram",lang:"Metal",vert:`// Metal Vertex Shader
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
}`,frag:`// Metal Fragment Shader
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
}`},{id:"zpinch",label:"Z-Pinch MHD",lang:"GLSL",vert:`#version 300 es
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
}`,frag:`#version 300 es
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
}`}],E=[{name:"time",type:"float",value:"auto",desc:"Elapsed time in seconds"},{name:"resolution",type:"vec2",value:"auto",desc:"Viewport resolution"},{name:"metallic",type:"float",value:"0.8",desc:"PBR metallic factor"},{name:"roughness",type:"float",value:"0.2",desc:"PBR roughness factor"},{name:"mvp",type:"mat4",value:"auto",desc:"Model-view-projection matrix"}];function F({shaderId:o}){const y=s.useRef(null),n=s.useRef(0),w=s.useRef(0);return s.useEffect(()=>{const r=y.current;if(!r)return;const p=r.getContext("2d");if(!p)return;(()=>{r.width=r.offsetWidth,r.height=r.offsetHeight})();const N=()=>{w.current+=.016;const c=w.current,d=r.width,v=r.height,j=p.createImageData(d,v),f=j.data;for(let h=0;h<v;h++)for(let u=0;u<d;u++){const m=u/d*2-1,i=h/v*2-1;let g=0,t=0,a=0;if(o==="plasma"||o==="zpinch"){const l=Math.sin(m*6+c)+Math.sin(i*6+c*.7)+Math.sin((m+i)*6+c*1.3)+Math.sin(Math.sqrt(m*m+i*i)*8-c*2);g=(.5+.5*Math.sin(l*Math.PI))*255,t=(.2+.3*Math.sin(l*Math.PI+2.1))*255,a=(.8+.2*Math.sin(l*Math.PI+4.2))*255}else if(o==="hologram"){const l=Math.sin(i*40+c*3)*.5+.5,x=.85+.15*Math.sin(c*7.3);g=50*l*x,t=200*l*x,a=255*x}else if(o==="pbr"){const l=Math.sqrt(Math.max(0,1-m*m-i*i)),x=Math.max(0,l*.7+m*.5+i*.5);g=x*200+30,t=x*180+20,a=x*230+40}const b=(h*d+u)*4;f[b]=Math.min(255,g),f[b+1]=Math.min(255,t),f[b+2]=Math.min(255,a),f[b+3]=255}p.putImageData(j,0,0),n.current=requestAnimationFrame(N)};return n.current=requestAnimationFrame(N),()=>cancelAnimationFrame(n.current)},[o]),e.jsx("canvas",{ref:y,className:"w-full h-full"})}function J(){const[o,y]=s.useState(P[0]),[n,w]=s.useState("frag"),[r,p]=s.useState(P[0].frag),[C,N]=s.useState(P[0].vert),[c,d]=s.useState([]),[v,j]=s.useState(!0),[f,h]=s.useState(.8),[u,m]=s.useState(.2),i=t=>{y(t),p(t.frag),N(t.vert),d([]),j(!0)},g=()=>{const t=n==="frag"?r:C,a=[];t.includes("undefined_var")&&a.push("Line 12: undefined variable 'undefined_var'"),d(a),j(a.length===0)};return e.jsxs("div",{className:"h-full flex flex-col bg-[#08080F] text-white overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-lg font-semibold text-white flex items-center gap-2",children:[e.jsx(M,{className:"w-5 h-5 text-green-400"}),"Shader Lab"]}),e.jsx("p",{className:"text-xs text-gray-500 mt-0.5",children:"Live GLSL / Metal shader editor with real-time preview"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:`px-2.5 py-1 rounded-full text-[10px] font-medium border ${v?"bg-green-500/10 border-green-500/20 text-green-400":"bg-red-500/10 border-red-500/20 text-red-400"}`,children:v?"✓ Compiled":"✗ Error"}),e.jsx("span",{className:"px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400",children:o.lang}),e.jsxs("button",{onClick:g,className:"flex items-center gap-1.5 px-3 py-2 bg-green-500/15 border border-green-500/30 rounded-lg text-xs text-green-300 hover:bg-green-500/25 transition-all",children:[e.jsx(S,{className:"w-3.5 h-3.5 fill-current"}),"Compile & Run"]}),e.jsxs("button",{className:"flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 transition-all",children:[e.jsx(R,{className:"w-3.5 h-3.5"}),"Push to Blender"]})]})]}),e.jsxs("div",{className:"flex flex-1 overflow-hidden",children:[e.jsxs("div",{className:"w-44 flex-shrink-0 border-r border-white/8 overflow-y-auto",children:[e.jsx("div",{className:"px-3 py-3 border-b border-white/8",children:e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider",children:"Shader Presets"})}),e.jsx("div",{className:"p-2 space-y-1",children:P.map(t=>e.jsxs("button",{onClick:()=>i(t),className:`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${o.id===t.id?"bg-green-500/15 border border-green-500/25 text-green-300":"text-gray-400 hover:bg-white/5 hover:text-gray-200"}`,children:[e.jsx("p",{className:"font-medium",children:t.label}),e.jsx("p",{className:"text-[9px] text-gray-600 mt-0.5",children:t.lang})]},t.id))}),e.jsxs("div",{className:"px-3 py-3 border-t border-white/8",children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"Uniforms"}),e.jsx("div",{className:"space-y-2",children:E.map(t=>e.jsxs("div",{className:"px-2 py-1.5 bg-white/3 border border-white/6 rounded-lg",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-[10px] font-mono text-green-400",children:t.name}),e.jsx("span",{className:"text-[9px] text-gray-600",children:t.type})]}),e.jsx("p",{className:"text-[9px] text-gray-600 mt-0.5",children:t.value})]},t.name))})]}),o.id==="pbr"&&e.jsxs("div",{className:"px-3 py-3 border-t border-white/8",children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"PBR Parameters"}),[{label:"Metallic",value:f,set:h,color:"text-amber-400"},{label:"Roughness",value:u,set:m,color:"text-blue-400"}].map(({label:t,value:a,set:b,color:l})=>e.jsxs("div",{className:"mb-3",children:[e.jsxs("div",{className:"flex justify-between mb-1",children:[e.jsx("span",{className:"text-[10px] text-gray-400",children:t}),e.jsx("span",{className:`text-[10px] font-mono ${l}`,children:a.toFixed(2)})]}),e.jsx("input",{type:"range",min:0,max:1,step:.01,value:a,onChange:x=>b(parseFloat(x.target.value)),className:"w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer"})]},t))]})]}),e.jsxs("div",{className:"flex-1 flex flex-col overflow-hidden",children:[e.jsxs("div",{className:"flex items-center border-b border-white/8 bg-[#0A0A16] px-4",children:[["frag","vert"].map(t=>e.jsx("button",{onClick:()=>w(t),className:`px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${n===t?"border-green-500 text-green-400":"border-transparent text-gray-500 hover:text-gray-300"}`,children:t==="frag"?"Fragment Shader":"Vertex Shader"},t)),e.jsxs("div",{className:"ml-auto flex items-center gap-2 py-1.5",children:[e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",title:"Copy",children:e.jsx(L,{className:"w-3.5 h-3.5"})}),e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",title:"Reset",children:e.jsx(k,{className:"w-3.5 h-3.5"})}),e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",title:"Save",children:e.jsx(V,{className:"w-3.5 h-3.5"})}),e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",title:"Download",children:e.jsx(U,{className:"w-3.5 h-3.5"})})]})]}),e.jsxs("div",{className:"flex-1 overflow-hidden relative",children:[e.jsx("textarea",{value:n==="frag"?r:C,onChange:t=>n==="frag"?p(t.target.value):N(t.target.value),className:"w-full h-full bg-[#060610] text-green-300 font-mono text-xs p-4 resize-none outline-none border-0 leading-relaxed",spellCheck:!1,style:{tabSize:2}}),e.jsx("div",{className:"absolute left-0 top-0 bottom-0 w-8 bg-[#060610] border-r border-white/5 pointer-events-none flex flex-col pt-4",children:(n==="frag"?r:C).split(`
`).map((t,a)=>e.jsx("div",{className:"text-[9px] text-gray-700 font-mono text-right pr-2 leading-relaxed",children:a+1},a))})]}),e.jsxs("div",{className:"border-t border-white/8 bg-[#0A0A10] px-4 py-2",style:{minHeight:"48px"},children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(H,{className:"w-3 h-3 text-gray-500"}),e.jsx("span",{className:"text-[10px] text-gray-600 uppercase tracking-wider",children:"Compiler Output"})]}),c.length===0?e.jsx("p",{className:"text-[10px] text-green-400 font-mono",children:"✓ No errors. Shader compiled successfully."}):c.map((t,a)=>e.jsx("p",{className:"text-[10px] text-red-400 font-mono",children:t},a))]})]}),e.jsxs("div",{className:"w-64 flex-shrink-0 border-l border-white/8 flex flex-col",children:[e.jsxs("div",{className:"px-4 py-3 border-b border-white/8 flex items-center justify-between",children:[e.jsx("p",{className:"text-xs text-gray-500 uppercase tracking-wider",children:"Live Preview"}),e.jsx(_,{className:"w-3.5 h-3.5 text-gray-500"})]}),e.jsxs("div",{className:"flex-1 relative bg-[#05050A] overflow-hidden",children:[e.jsx(F,{shaderId:o.id}),e.jsxs("div",{className:"absolute bottom-2 left-2 right-2 flex items-center justify-between",children:[e.jsx("span",{className:"text-[9px] text-gray-600 font-mono bg-black/50 px-1.5 py-0.5 rounded",children:o.label}),e.jsx("span",{className:"text-[9px] text-green-400 font-mono bg-black/50 px-1.5 py-0.5 rounded",children:"LIVE"})]})]}),e.jsxs("div",{className:"p-3 border-t border-white/8 space-y-2",children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"Preview Mesh"}),["Sphere","Plane","Cube","Cylinder","Custom"].map(t=>e.jsxs("button",{className:"w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors flex items-center gap-2",children:[e.jsx(z,{className:"w-3 h-3"}),t]},t))]})]})]})]})}export{J as default};
