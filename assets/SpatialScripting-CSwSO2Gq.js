import{j as e}from"./framer-CQvazNpH.js";import{a}from"./react-y5SCQdqY.js";import{c as k,T as f,C as A,h as R}from"./index-BKywVNQG.js";import{S as I}from"./square-Dqmzpp22.js";import{P as D}from"./play-D5p631ny.js";import{C as T}from"./code-Bu13pzNA.js";import{C as E}from"./copy-Ba5UAKE2.js";import{S as B}from"./save-DxktIGid.js";import{D as G}from"./download-BJd4ciyy.js";import{U as M}from"./upload-BaBg1cOq.js";import"./react-three-PjJ30pGH.js";import"./three-CLEub1Hg.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=k("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]),z=[{id:"python",label:"Python",icon:"🐍",desc:"Blender Python API + spatial extensions"},{id:"swift",label:"Swift",icon:"🍎",desc:"visionOS RealityKit scripting"},{id:"js",label:"JavaScript",icon:"⚡",desc:"Web spatial API"},{id:"glsl",label:"GLSL",icon:"🎨",desc:"Shader scripting"}],c=[{id:"create_plasma",label:"Create Plasma Column",lang:"python",code:`import bpy
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
print(f"Sim speed: {domain.sim_speed:.1f} Mvox/s")`},{id:"sync_devices",label:"Sync All Devices",lang:"python",code:`import spatial_sdk as sp

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

print("\\nSync complete!")`},{id:"realitykit_entity",label:"RealityKit Entity",lang:"swift",code:`import RealityKit
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
print("Entity added: \\(entity.name)")`},{id:"ai_generate",label:"AI Scene Generation",lang:"python",code:`import spatial_sdk as sp
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
print("\\nScene generation complete!")`}],v=[{module:"sp.Scene",methods:["get_active_scene()","create_scene(name)","load_scene(path)","save_scene(path)"]},{module:"sp.DeviceManager",methods:["get_connected()","push_scene(dev, scene)","pull_scene(dev)","get_metrics(dev)"]},{module:"sp.PhysicsDomain",methods:["set_param(key, val)","bake(frames)","export_alembic()","get_voxel_count()"]},{module:"sp.AIService",methods:["text_to_3d(prompt)","text_to_texture(prompt)","image_to_3d(img)","audio_to_scene(audio)"]},{module:"sp.Privacy",methods:["create_zone(radius)","set_encryption(level)","audit_log()","rotate_keys()"]}],b=[{type:"info",text:"Spatial Scripting Engine v3.0 initialized"},{type:"info",text:"Connected to: Vision Pro, Quest 3, Blender 4.3"},{type:"info",text:"Python 3.11 · Swift 6.0 · spatial_sdk 3.0.1"},{type:"success",text:">>> scene = sp.get_active_scene()"},{type:"output",text:"<Scene 'Z-Pinch Plasma Session' — 5 objects>"},{type:"success",text:">>> scene.objects"},{type:"output",text:"['plasma_column', 'bounding_box', 'emitter', 'camera', 'light']"}];function Y(){const[j,d]=a.useState("python"),[p,N]=a.useState(c[0]),[m,x]=a.useState(c[0].code),[h,i]=a.useState(b),[r,u]=a.useState(!1),[l,y]=a.useState(""),[g,w]=a.useState("editor"),o=a.useRef(null),_=()=>{u(!0);const t=[{type:"success",text:`>>> Running ${p.label}...`},{type:"info",text:"Connecting to spatial_sdk..."}];i(s=>[...s,...t]),setTimeout(()=>{const s=[{type:"output",text:"Found 3 devices: Vision Pro, Quest 3, Blender"},{type:"output",text:"Plasma column created: plasma_column"},{type:"output",text:"Voxels: 6,291,456"},{type:"output",text:"Sim speed: 947.3 Mvox/s"},{type:"success",text:"✓ Script completed in 0.84s"}];i(n=>[...n,...s]),u(!1)},1500)},S=t=>{t.key==="Enter"&&l.trim()&&(i(s=>[...s,{type:"success",text:`>>> ${l}`},{type:"output",text:l.includes("scene")?"<Scene 'Z-Pinch Plasma Session'>":"None"}]),y(""))};a.useEffect(()=>{o.current&&(o.current.scrollTop=o.current.scrollHeight)},[h]);const P=t=>{N(t),x(t.code),d(t.lang)};return e.jsxs("div",{className:"h-full flex flex-col bg-[#08080F] text-white overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-lg font-semibold text-white flex items-center gap-2",children:[e.jsx(f,{className:"w-5 h-5 text-cyan-400"}),"Spatial Scripting"]}),e.jsx("p",{className:"text-xs text-gray-500 mt-0.5",children:"Python / Swift scripting console with live scene and device access"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("div",{className:"flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full",children:[e.jsx("div",{className:"w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"}),e.jsx("span",{className:"text-[10px] text-cyan-400 font-mono",children:"kernel ready"})]}),e.jsx("button",{onClick:_,disabled:r,className:`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${r?"bg-cyan-500/20 border border-cyan-500/40 text-cyan-300":"bg-cyan-500 text-white hover:bg-cyan-600"}`,children:r?e.jsxs(e.Fragment,{children:[e.jsx(I,{className:"w-3.5 h-3.5 fill-current animate-pulse"})," Running…"]}):e.jsxs(e.Fragment,{children:[e.jsx(D,{className:"w-3.5 h-3.5 fill-current"})," Run Script"]})})]})]}),e.jsxs("div",{className:"flex flex-1 overflow-hidden",children:[e.jsxs("div",{className:"w-52 flex-shrink-0 border-r border-white/8 flex flex-col overflow-y-auto",children:[e.jsxs("div",{className:"p-3 border-b border-white/8",children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"Language"}),e.jsx("div",{className:"space-y-1",children:z.map(t=>e.jsxs("button",{onClick:()=>d(t.id),className:`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${j===t.id?"bg-cyan-500/15 border border-cyan-500/25 text-cyan-300":"text-gray-400 hover:bg-white/5 hover:text-gray-200"}`,children:[e.jsx("span",{children:t.icon}),e.jsxs("div",{className:"text-left",children:[e.jsx("p",{className:"font-medium leading-none",children:t.label}),e.jsx("p",{className:"text-[9px] text-gray-600 mt-0.5 leading-tight",children:t.desc})]})]},t.id))})]}),e.jsxs("div",{className:"p-3 border-b border-white/8",children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"Snippets"}),e.jsx("div",{className:"space-y-1",children:c.map(t=>e.jsxs("button",{onClick:()=>P(t),className:`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${p.id===t.id?"bg-white/10 border border-white/15 text-white":"text-gray-400 hover:bg-white/5 hover:text-gray-200"}`,children:[e.jsx("p",{className:"font-medium truncate",children:t.label}),e.jsx("p",{className:"text-[9px] text-gray-600 mt-0.5",children:t.lang})]},t.id))})]}),e.jsxs("div",{className:"p-3",children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"API Reference"}),e.jsx("div",{className:"space-y-2",children:v.slice(0,3).map(t=>e.jsxs("div",{className:"px-2 py-1.5 bg-white/3 border border-white/6 rounded-lg",children:[e.jsx("p",{className:"text-[10px] font-mono text-cyan-400 mb-1",children:t.module}),t.methods.slice(0,2).map(s=>e.jsxs("p",{className:"text-[9px] text-gray-600 font-mono truncate",children:[".",s]},s))]},t.module))})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col overflow-hidden",children:[e.jsxs("div",{className:"flex items-center border-b border-white/8 bg-[#0A0A16] px-4",children:[["editor","docs"].map(t=>e.jsx("button",{onClick:()=>w(t),className:`px-4 py-2.5 text-xs font-medium border-b-2 capitalize transition-all ${g===t?"border-cyan-500 text-cyan-400":"border-transparent text-gray-500 hover:text-gray-300"}`,children:t==="editor"?e.jsxs(e.Fragment,{children:[e.jsx(T,{className:"w-3 h-3 inline mr-1"}),"Editor"]}):e.jsxs(e.Fragment,{children:[e.jsx(L,{className:"w-3 h-3 inline mr-1"}),"API Docs"]})},t)),e.jsxs("div",{className:"ml-auto flex items-center gap-2 py-1.5",children:[e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",children:e.jsx(E,{className:"w-3.5 h-3.5"})}),e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",children:e.jsx(B,{className:"w-3.5 h-3.5"})}),e.jsx("button",{className:"p-1.5 text-gray-500 hover:text-gray-300 transition-colors",children:e.jsx(G,{className:"w-3.5 h-3.5"})})]})]}),g==="editor"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex-1 overflow-hidden relative flex",children:[e.jsx("div",{className:"w-10 bg-[#060610] border-r border-white/5 pt-4 flex-shrink-0 overflow-hidden",children:m.split(`
`).map((t,s)=>e.jsx("div",{className:"text-[9px] text-gray-700 font-mono text-right pr-2 leading-relaxed",children:s+1},s))}),e.jsx("textarea",{value:m,onChange:t=>x(t.target.value),className:"flex-1 bg-[#060610] text-cyan-200 font-mono text-xs p-4 resize-none outline-none border-0 leading-relaxed",spellCheck:!1})]}),e.jsxs("div",{className:"border-t border-white/8 bg-[#060610]",style:{height:"200px"},children:[e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 border-b border-white/5",children:[e.jsx(f,{className:"w-3 h-3 text-cyan-400"}),e.jsx("span",{className:"text-[10px] text-gray-600 uppercase tracking-wider",children:"Console"}),e.jsx("button",{onClick:()=>i(b),className:"ml-auto text-[10px] text-gray-600 hover:text-gray-400",children:"Clear"})]}),e.jsxs("div",{ref:o,className:"overflow-y-auto px-4 py-2 font-mono text-[10px]",style:{height:"130px"},children:[h.map((t,s)=>e.jsx("div",{className:`leading-relaxed ${t.type==="success"?"text-cyan-400":t.type==="output"?"text-gray-300":t.type==="error"?"text-red-400":"text-gray-500"}`,children:t.text},s)),r&&e.jsx("div",{className:"text-cyan-400 animate-pulse",children:"▌"})]}),e.jsxs("div",{className:"flex items-center gap-2 px-4 py-1.5 border-t border-white/5",children:[e.jsx("span",{className:"text-cyan-400 font-mono text-[10px]",children:">>>"}),e.jsx("input",{value:l,onChange:t=>y(t.target.value),onKeyDown:S,placeholder:"Enter Python expression…",className:"flex-1 bg-transparent text-[10px] font-mono text-gray-300 outline-none placeholder-gray-700"})]})]})]}):e.jsxs("div",{className:"flex-1 overflow-y-auto p-6",children:[e.jsx("h2",{className:"text-sm font-semibold text-white mb-4",children:"spatial_sdk API Reference"}),e.jsx("div",{className:"space-y-4",children:v.map(t=>e.jsxs("div",{className:"bg-white/3 border border-white/8 rounded-xl p-4",children:[e.jsx("p",{className:"text-sm font-mono text-cyan-400 mb-3",children:t.module}),e.jsx("div",{className:"space-y-1.5",children:t.methods.map(s=>e.jsxs("div",{className:"flex items-center gap-2 px-2 py-1 rounded bg-white/3",children:[e.jsx(A,{className:"w-3 h-3 text-gray-600"}),e.jsx("span",{className:"text-xs font-mono text-gray-300",children:s})]},s))})]},t.module))})]})]}),e.jsxs("div",{className:"w-56 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto",children:[e.jsx("div",{className:"px-4 py-3 border-b border-white/8",children:e.jsx("p",{className:"text-xs text-gray-500 uppercase tracking-wider",children:"Runtime"})}),e.jsxs("div",{className:"p-4 space-y-4",children:[e.jsx("div",{className:"space-y-2",children:[{label:"Kernel",value:"Python 3.11",status:"running",color:"text-green-400"},{label:"SDK",value:"spatial 3.0.1",status:"ready",color:"text-cyan-400"},{label:"GPU",value:"Apple M3 Ultra",status:"idle",color:"text-blue-400"},{label:"Memory",value:"2.4 / 8.0 GB",status:"ok",color:"text-purple-400"}].map(({label:t,value:s,status:n,color:C})=>e.jsxs("div",{className:"flex items-center justify-between py-1.5 border-b border-white/5",children:[e.jsx("span",{className:"text-[10px] text-gray-500",children:t}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:`text-[10px] font-mono ${C}`,children:s}),e.jsx("p",{className:"text-[9px] text-gray-600",children:n})]})]},t))}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] text-gray-600 uppercase tracking-wider mb-2",children:"Scene Variables"}),e.jsx("div",{className:"space-y-1",children:[{name:"scene",type:"Scene",val:"'Z-Pinch Plasma'"},{name:"devices",type:"list",val:"[3 items]"},{name:"domain",type:"Domain",val:"plasma_column"},{name:"ai",type:"AIService",val:"ready"}].map(({name:t,type:s,val:n})=>e.jsxs("div",{className:"px-2 py-1.5 bg-white/3 border border-white/6 rounded-lg",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-[10px] font-mono text-cyan-400",children:t}),e.jsx("span",{className:"text-[9px] text-gray-600",children:s})]}),e.jsx("p",{className:"text-[9px] text-gray-500 mt-0.5 font-mono",children:n})]},t))})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("button",{className:"w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/15 transition-all",children:[e.jsx(M,{className:"w-3.5 h-3.5"}),"Run in Blender"]}),e.jsxs("button",{className:"w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/8 transition-all",children:[e.jsx(R,{className:"w-3.5 h-3.5 text-blue-400"}),"Run on Vision Pro"]})]})]})]})]})]})}export{Y as default};
