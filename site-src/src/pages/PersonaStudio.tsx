import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Sliders, Eye, Download, Upload, RefreshCw, Lock, Zap, ChevronRight, Check } from "lucide-react";

const PERSONA_PRESETS = [
  { id: "realistic", label: "Realistic",   desc: "High-fidelity photorealistic render" },
  { id: "stylized",  label: "Stylized",    desc: "Artistic interpretation of your face" },
  { id: "minimal",   label: "Minimal",     desc: "Clean, simplified representation" },
  { id: "spatial",   label: "Spatial",     desc: "Optimized for spatial computing" },
];

const PLATFORMS = [
  { id: "visionos", label: "Apple Vision Pro", icon: "👓", supported: true,  note: "Persona + EyeSight" },
  { id: "facetime", label: "FaceTime",          icon: "📹", supported: true,  note: "SharePlay avatar" },
  { id: "quest",    label: "Meta Quest",        icon: "🥽", supported: true,  note: "Meta avatar bridge" },
  { id: "horizon",  label: "Horizon Worlds",    icon: "🌐", supported: true,  note: "Horizon avatar" },
  { id: "ipad",     label: "iPadOS",            icon: "📱", supported: true,  note: "Memoji fallback" },
  { id: "blender",  label: "Blender",           icon: "🔷", supported: true,  note: "GLTF/USDZ export" },
];

const FEATURE_GROUPS = [
  {
    label: "Face",
    features: [
      { name: "Skin Tone",      type: "color",  value: "#C8956C" },
      { name: "Face Shape",     type: "slider", value: 50 },
      { name: "Jaw Width",      type: "slider", value: 45 },
      { name: "Cheek Volume",   type: "slider", value: 55 },
    ],
  },
  {
    label: "Eyes",
    features: [
      { name: "Eye Color",      type: "color",  value: "#4A7FA5" },
      { name: "Eye Size",       type: "slider", value: 60 },
      { name: "Eye Spacing",    type: "slider", value: 50 },
      { name: "Brow Thickness", type: "slider", value: 40 },
    ],
  },
  {
    label: "Hair",
    features: [
      { name: "Hair Color",     type: "color",  value: "#2C1810" },
      { name: "Hair Length",    type: "slider", value: 65 },
      { name: "Hair Density",   type: "slider", value: 75 },
      { name: "Curl Amount",    type: "slider", value: 30 },
    ],
  },
  {
    label: "Expression",
    features: [
      { name: "Smile Intensity",type: "slider", value: 70 },
      { name: "Blink Speed",    type: "slider", value: 50 },
      { name: "Expressiveness", type: "slider", value: 80 },
      { name: "Micro Gestures", type: "toggle", value: true },
    ],
  },
];

const PRIVACY_SETTINGS = [
  { label: "Show exact eye position",  enabled: false, risk: "high" },
  { label: "Share face geometry data", enabled: false, risk: "high" },
  { label: "Sync expressions live",    enabled: true,  risk: "medium" },
  { label: "Allow Persona capture",    enabled: true,  risk: "low" },
  { label: "Cross-platform avatar",    enabled: true,  risk: "low" },
  { label: "Store in iCloud Keychain", enabled: true,  risk: "low" },
];

function PersonaPreview({ style }: { style: string }) {
  const colors: Record<string, { face: string; glow: string }> = {
    realistic: { face: "#C8956C", glow: "rgba(200,149,108,0.3)" },
    stylized:  { face: "#A0C4FF", glow: "rgba(160,196,255,0.3)" },
    minimal:   { face: "#E0E0E0", glow: "rgba(224,224,224,0.2)" },
    spatial:   { face: "#7B9FE0", glow: "rgba(123,159,224,0.3)" },
  };
  const c = colors[style] || colors.realistic;

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#05050A] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: c.glow }} />
      </div>
      {/* Persona face SVG */}
      <svg viewBox="0 0 200 240" className="w-40 h-48 relative z-10">
        {/* Head */}
        <ellipse cx="100" cy="110" rx="65" ry="80" fill={c.face} opacity="0.9" />
        {/* Hair */}
        <ellipse cx="100" cy="50" rx="68" ry="40" fill="#2C1810" opacity="0.85" />
        <rect x="32" y="50" width="15" height="60" rx="7" fill="#2C1810" opacity="0.85" />
        <rect x="153" y="50" width="15" height="60" rx="7" fill="#2C1810" opacity="0.85" />
        {/* Eyes */}
        <ellipse cx="75" cy="105" rx="12" ry="9" fill="white" />
        <ellipse cx="125" cy="105" rx="12" ry="9" fill="white" />
        <ellipse cx="75" cy="105" rx="7" ry="7" fill="#4A7FA5" />
        <ellipse cx="125" cy="105" rx="7" ry="7" fill="#4A7FA5" />
        <ellipse cx="75" cy="105" rx="4" ry="4" fill="#111" />
        <ellipse cx="125" cy="105" rx="4" ry="4" fill="#111" />
        {/* Eyebrows */}
        <path d="M 60 92 Q 75 87 90 92" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 110 92 Q 125 87 140 92" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Nose */}
        <path d="M 100 115 L 90 135 Q 100 140 110 135 Z" fill={c.face} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        {/* Mouth */}
        <path d="M 80 155 Q 100 168 120 155" stroke="#8B4A4A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Ears */}
        <ellipse cx="35" cy="115" rx="10" ry="14" fill={c.face} />
        <ellipse cx="165" cy="115" rx="10" ry="14" fill={c.face} />
        {/* Neck */}
        <rect x="82" y="185" width="36" height="30" rx="8" fill={c.face} opacity="0.8" />
        {/* EyeSight glow (visionOS) */}
        {style === "spatial" && (
          <>
            <ellipse cx="75" cy="105" rx="16" ry="12" fill="none" stroke="rgba(100,200,255,0.5)" strokeWidth="1.5" />
            <ellipse cx="125" cy="105" rx="16" ry="12" fill="none" stroke="rgba(100,200,255,0.5)" strokeWidth="1.5" />
          </>
        )}
      </svg>
      {/* Platform badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[10px] text-gray-300">Persona Active</span>
      </div>
    </div>
  );
}

export default function PersonaStudio() {
  const [selectedPreset, setSelectedPreset] = useState("realistic");
  const [activeGroup, setActiveGroup] = useState("Face");
  const [featureValues, setFeatureValues] = useState<Record<string, number | string | boolean>>({
    "Skin Tone": "#C8956C", "Face Shape": 50, "Jaw Width": 45, "Cheek Volume": 55,
    "Eye Color": "#4A7FA5", "Eye Size": 60, "Eye Spacing": 50, "Brow Thickness": 40,
    "Hair Color": "#2C1810", "Hair Length": 65, "Hair Density": 75, "Curl Amount": 30,
    "Smile Intensity": 70, "Blink Speed": 50, "Expressiveness": 80, "Micro Gestures": true,
  });
  const [privacySettings, setPrivacySettings] = useState(PRIVACY_SETTINGS);
  const [activeTab, setActiveTab] = useState<"customize" | "platforms" | "privacy">("customize");

  const togglePrivacy = (i: number) => {
    setPrivacySettings(s => s.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p));
  };

  const currentGroup = FEATURE_GROUPS.find(g => g.label === activeGroup);

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Persona Studio
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Apple Vision Pro Persona customization and cross-platform avatar editor</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            Recapture
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 rounded-lg text-xs text-white font-medium hover:bg-blue-600 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export Persona
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Preview */}
        <div className="w-64 flex-shrink-0 border-r border-white/8 flex flex-col">
          {/* Persona preview */}
          <div className="flex-1 relative">
            <PersonaPreview style={selectedPreset} />
          </div>

          {/* Style presets */}
          <div className="border-t border-white/8 p-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Render Style</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PERSONA_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedPreset === p.id ? "border-blue-500/40 bg-blue-500/10" : "border-white/8 bg-white/3 hover:bg-white/6"
                  }`}
                >
                  <p className="text-[10px] font-medium text-gray-200">{p.label}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center — Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/8 bg-[#0A0A16] px-4">
            {(["customize", "platforms", "privacy"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 capitalize transition-all ${
                  activeTab === tab ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "customize" && (
              <div className="space-y-6">
                {/* Group selector */}
                <div className="flex gap-2">
                  {FEATURE_GROUPS.map(g => (
                    <button
                      key={g.label}
                      onClick={() => setActiveGroup(g.label)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeGroup === g.label ? "bg-blue-500/20 border border-blue-500/30 text-blue-300" : "bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Feature sliders */}
                {currentGroup && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentGroup.features.map(f => (
                      <div key={f.name} className="bg-white/3 border border-white/8 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-300">{f.name}</span>
                          {f.type === "toggle" ? (
                            <button
                              onClick={() => setFeatureValues(v => ({ ...v, [f.name]: !v[f.name] }))}
                              className={`w-8 h-4 rounded-full transition-colors ${featureValues[f.name] ? "bg-blue-500" : "bg-gray-700"}`}
                            >
                              <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${featureValues[f.name] ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                          ) : f.type === "color" ? (
                            <div className="w-6 h-6 rounded-full border border-white/20" style={{ background: featureValues[f.name] as string }} />
                          ) : (
                            <span className="text-xs font-mono text-blue-400">{featureValues[f.name] as number}%</span>
                          )}
                        </div>
                        {f.type === "slider" && (
                          <input
                            type="range" min={0} max={100} value={featureValues[f.name] as number}
                            onChange={e => setFeatureValues(v => ({ ...v, [f.name]: parseInt(e.target.value) }))}
                            className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
                          />
                        )}
                        {f.type === "color" && (
                          <div className="flex gap-1.5 mt-1">
                            {["#C8956C","#F5CBA7","#8D5524","#4A7FA5","#6B4226","#E8D5B7"].map(c => (
                              <button
                                key={c}
                                onClick={() => setFeatureValues(v => ({ ...v, [f.name]: c }))}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${featureValues[f.name] === c ? "border-white scale-110" : "border-transparent"}`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "platforms" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-4">Your Persona is synchronized across all connected platforms. Configure how it appears on each device.</p>
                {PLATFORMS.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 bg-white/3 border border-white/8 rounded-xl">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{p.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.note}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.supported ? "bg-green-400" : "bg-gray-600"}`} />
                      <span className={`text-xs ${p.supported ? "text-green-400" : "text-gray-600"}`}>{p.supported ? "Active" : "Unavailable"}</span>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
                      <Upload className="w-3 h-3" />
                      Sync
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl mb-2">
                  <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">Persona Privacy</p>
                    <p className="text-xs text-gray-500 mt-0.5">Your face geometry is processed entirely on-device using the Secure Enclave. It is never uploaded to any server.</p>
                  </div>
                </div>
                {privacySettings.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-4 p-3.5 bg-white/3 border border-white/8 rounded-xl">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-300">{s.label}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.risk === "high" ? "bg-red-400" : s.risk === "medium" ? "bg-amber-400" : "bg-green-400"}`} />
                        <span className={`text-[10px] ${s.risk === "high" ? "text-red-400" : s.risk === "medium" ? "text-amber-400" : "text-green-400"}`}>
                          {s.risk} privacy impact
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePrivacy(i)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${s.enabled ? "bg-blue-500" : "bg-gray-700"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Export */}
        <div className="w-56 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Export Options</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Formats</p>
              <div className="space-y-1.5">
                {[
                  { fmt: "USDZ",  desc: "visionOS / iOS",   icon: "🍎" },
                  { fmt: "GLTF",  desc: "Web / Meta",       icon: "🌐" },
                  { fmt: "FBX",   desc: "Blender / DCC",    icon: "🔷" },
                  { fmt: "OBJ",   desc: "Universal",        icon: "📦" },
                  { fmt: "PNG",   desc: "2D Snapshot",      icon: "🖼" },
                ].map(({ fmt, desc, icon }) => (
                  <button key={fmt} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/3 border border-white/8 hover:bg-white/6 transition-all">
                    <span className="text-base">{icon}</span>
                    <div className="text-left">
                      <p className="text-[10px] font-medium text-gray-200">{fmt}</p>
                      <p className="text-[9px] text-gray-600">{desc}</p>
                    </div>
                    <Download className="w-3 h-3 text-gray-500 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="space-y-1.5">
                <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/15 transition-all">
                  <Zap className="w-3.5 h-3.5" />
                  Apply to FaceTime
                </button>
                <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/15 transition-all">
                  <User className="w-3.5 h-3.5" />
                  Sync to Meta
                </button>
                <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/15 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  Push to Blender
                </button>
              </div>
            </div>

            <div className="p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">On-Device Processing</span>
              </div>
              <p className="text-[9px] text-gray-500">Face geometry never leaves your device. Secure Enclave protected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
