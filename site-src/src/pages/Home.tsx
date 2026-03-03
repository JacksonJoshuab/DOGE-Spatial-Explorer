import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layers, Video, Monitor, Brain, Package, ShieldCheck,
  ArrowRight, Zap, Globe, Lock, Cpu, Eye, Wifi,
  ChevronRight, Star, Check, Sparkles, Atom
} from "lucide-react";

const FEATURES = [
  {
    href: "/studio",
    icon: Layers,
    color: "from-blue-500 to-cyan-500",
    glow: "rgba(74,144,217,0.3)",
    title: "Spatial Studio",
    desc: "Full 3D viewport with React Three Fiber, scene graph editor, and real-time collaboration overlays. Supports USDZ, GLB, FBX.",
    tags: ["RealityKit", "Three.js", "CRDT"],
  },
  {
    href: "/collaboration",
    icon: Video,
    color: "from-purple-500 to-pink-500",
    glow: "rgba(139,92,246,0.3)",
    title: "Live Collaboration",
    desc: "FaceTime-style live editing studio with SharePlay, spatial audio, participant cursors, and E2E encrypted sessions.",
    tags: ["SharePlay", "FaceTime", "E2EE"],
  },
  {
    href: "/devices",
    icon: Monitor,
    color: "from-green-500 to-emerald-500",
    glow: "rgba(16,185,129,0.3)",
    title: "Device Manager",
    desc: "Manage Apple Vision Pro, Meta Quest, iPadOS, tvOS, and Blender workstations from one unified dashboard.",
    tags: ["visionOS", "Meta Quest", "iPadOS"],
  },
  {
    href: "/ai",
    icon: Brain,
    color: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
    title: "AI Generation",
    desc: "Text-to-3D, Text-to-Texture, Image-to-3D, Audio-to-Scene, and RF-to-Spatial generation with live job queue.",
    tags: ["Text→3D", "Image→3D", "Audio→Scene"],
  },
  {
    href: "/assets",
    icon: Package,
    color: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.3)",
    title: "Asset Library",
    desc: "USDZ, GLB, FBX, textures, materials, scenes, and audio. Upload, organize, and push to any connected device.",
    tags: ["USDZ", "GLB", "PBR Textures"],
  },
  {
    href: "/privacy",
    icon: ShieldCheck,
    color: "from-teal-500 to-cyan-500",
    glow: "rgba(20,184,166,0.3)",
    title: "Privacy & Security",
    desc: "Full OSI stack visualization, Secure Enclave integration, privacy zones, E2E encryption audit log, and key management.",
    tags: ["Secure Enclave", "OSI L1-L7", "CRDT"],
  },
];

const PLATFORMS = [
  { name: "Apple Vision Pro", icon: "👓", desc: "visionOS 3 + RealityKit + SharePlay", color: "text-blue-400" },
  { name: "Meta Quest 3", icon: "🥽", desc: "Meta Spatial SDK + OpenXR + Horizon", color: "text-purple-400" },
  { name: "iPadOS", icon: "📱", desc: "Remote control + session management", color: "text-green-400" },
  { name: "Apple TV", icon: "📺", desc: "Large-screen presentation mode", color: "text-amber-400" },
  { name: "Blender", icon: "🔷", desc: "PC/mobile/cloud plugin + CRDT sync", color: "text-pink-400" },
  { name: "Web Browser", icon: "🌐", desc: "Full studio in any modern browser", color: "text-cyan-400" },
];

const STATS = [
  { value: "62", unit: "fps", label: "Render Rate" },
  { value: "< 50", unit: "ms", label: "Sync Latency" },
  { value: "256", unit: "bit", label: "Encryption" },
  { value: "6", unit: "OSI", label: "Security Layers" },
];

export default function Home() {
  return (
    <div className="min-h-full bg-[#08080F] text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300 mb-6"
          >
            <Sparkles className="w-3 h-3" />
            visionOS 3 · RealityKit · Meta Spatial SDK · SharePlay
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-4 leading-tight"
          >
            <span className="text-white">Spatial Editing</span>
            <br />
            <span className="text-gradient-spatial">Reimagined</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            A FaceTime live editing studio for Apple Vision Pro, Meta Quest, iPadOS, and Blender.
            Privacy-first, AI-powered, cross-platform 3D collaboration with end-to-end encryption.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/studio"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Layers className="w-4 h-4" />
              Open Spatial Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/collaboration"
              className="flex items-center gap-2 px-6 py-3 bg-white/8 hover:bg-white/12 border border-white/12 rounded-xl text-sm font-medium transition-all"
            >
              <Video className="w-4 h-4 text-purple-400" />
              Live Collaboration
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative max-w-2xl mx-auto mt-12 grid grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8"
        >
          {STATS.map((s, i) => (
            <div key={i} className="bg-[#0F0F1E] px-4 py-4 text-center">
              <div className="text-2xl font-bold font-mono text-gradient-blue">{s.value}<span className="text-sm text-gray-500 ml-0.5">{s.unit}</span></div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Full Studio Suite</h2>
          <p className="text-sm text-gray-500">Six integrated tools for end-to-end spatial editing</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.href}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            >
              <Link
                to={f.href}
                className="group block p-5 bg-[#0F0F1E] border border-white/8 rounded-2xl hover:border-white/16 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: `0 0 0 0 ${f.glow}` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{f.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/8 rounded-full text-[9px] text-gray-400">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-600 group-hover:text-blue-400 transition-colors">
                  Open <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform support */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="bg-[#0F0F1E] border border-white/8 rounded-2xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Cross-Platform Native</h2>
            <p className="text-xs text-gray-500">One scene, every device, real-time sync</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PLATFORMS.map(p => (
              <div key={p.name} className="text-center p-3 bg-white/3 border border-white/8 rounded-xl hover:bg-white/6 transition-colors">
                <div className="text-2xl mb-2">{p.icon}</div>
                <p className={`text-xs font-semibold ${p.color} mb-0.5`}>{p.name}</p>
                <p className="text-[9px] text-gray-600 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture callout */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Privacy-First Architecture</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              End-to-end encryption via Apple Secure Enclave and Android Keystore. Granular privacy zones, CRDT conflict resolution, and full OSI stack security monitoring from L1 Physical to L7 Application.
            </p>
            <div className="space-y-1.5">
              {["AES-256-GCM encryption", "ECDH P-256 key exchange", "Secure Enclave key storage", "CRDT integrity verification"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                  <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Atom className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">AI-Powered Generation</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Six AI generation modes powered by cloud GPU clusters. Generate 3D models, PBR textures, full scenes, and spatial audio environments from text, images, audio, or RF data.
            </p>
            <div className="space-y-1.5">
              {["Text → 3D Model (USDZ/GLB)", "Text → PBR Texture (4K)", "Image → 3D Reconstruction", "Audio → Spatial Scene", "RF → Spatial Geometry"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                  <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6 text-center">
        <p className="text-xs text-gray-600">
          DOGE Spatial Studio — Built with visionOS 3, RealityKit, Meta Spatial SDK, React Three Fiber, and SharePlay
        </p>
        <p className="text-[10px] text-gray-700 mt-1">
          Open source · <a href="https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
