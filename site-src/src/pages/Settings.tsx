import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon, Key, Globe, Shield, Palette, Bell,
  Monitor, Cpu, Cloud, GitBranch, Headphones, Eye, EyeOff,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Plus, Trash2,
  ChevronRight, Lock, Unlock, Download, Upload, RotateCcw
} from "lucide-react";

const SECTIONS = [
  { id: "general",    label: "General",       icon: SettingsIcon },
  { id: "appearance", label: "Appearance",    icon: Palette },
  { id: "platforms",  label: "Platforms",     icon: Monitor },
  { id: "api",        label: "API Keys",      icon: Key },
  { id: "privacy",    label: "Privacy",       icon: Shield },
  { id: "blender",    label: "Blender",       icon: GitBranch },
  { id: "cloud",      label: "Cloud",         icon: Cloud },
  { id: "audio",      label: "Audio",         icon: Headphones },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const PLATFORM_CONNECTIONS = [
  { id: "visionpro",  name: "Apple Vision Pro",  icon: "👓", status: "connected",    version: "visionOS 3.0 beta", device: "Vision Pro (256GB)", color: "#60a5fa" },
  { id: "quest3",     name: "Meta Quest 3",       icon: "🥽", status: "connected",    version: "Meta Spatial SDK 71", device: "Quest 3 (512GB)", color: "#a78bfa" },
  { id: "ipad",       name: "iPad Pro",           icon: "📱", status: "connected",    version: "iPadOS 18.3", device: "iPad Pro M4 13\"", color: "#34d399" },
  { id: "appletv",    name: "Apple TV",           icon: "📺", status: "connected",    version: "tvOS 18.3", device: "Apple TV 4K (3rd gen)", color: "#f59e0b" },
  { id: "blender",    name: "Blender Workstation",icon: "🔷", status: "connected",    version: "Blender 4.3.2", device: "macOS 15.3 / M4 Max", color: "#f87171" },
  { id: "cloud",      name: "Cloud Render Node",  icon: "☁️", status: "idle",         version: "Node v22.13", device: "AWS us-east-1 / g5.4xl", color: "#ec4899" },
  { id: "hololens",   name: "HoloLens 2",         icon: "🔬", status: "disconnected", version: "—", device: "Not paired", color: "#6b7280" },
];

const API_KEYS = [
  { id: "openai",   name: "OpenAI",          key: "sk-proj-••••••••••••••••••••••••••••••••••••••••••••••••••", scope: "Text→3D, Texture Gen", status: "active" },
  { id: "stability",name: "Stability AI",    key: "sk-••••••••••••••••••••••••••••••••••••••••••••••••••••••••", scope: "Image→3D, Upscaling", status: "active" },
  { id: "meshy",    name: "Meshy.ai",        key: "msy_••••••••••••••••••••••••••••••••••••••••••••••••••••••", scope: "3D Generation", status: "active" },
  { id: "aws",      name: "AWS S3",          key: "AKIA••••••••••••••••", scope: "Asset Storage", status: "active" },
  { id: "anthropic",name: "Anthropic Claude",key: "sk-ant-••••••••••••••••••••••••••••••••••••••••••••••••••••", scope: "RAG Assistant", status: "active" },
  { id: "mapbox",   name: "Mapbox",          key: "pk.eyJ1••••••••••••••••••••••••••••••••••••••••••••••••••••", scope: "Geospatial Data", status: "inactive" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    connected:    { color: "text-green-400 bg-green-500/10 border-green-500/20",    icon: <CheckCircle className="w-3 h-3" />, label: "Connected" },
    idle:         { color: "text-amber-400 bg-amber-500/10 border-amber-500/20",    icon: <AlertTriangle className="w-3 h-3" />, label: "Idle" },
    disconnected: { color: "text-gray-500 bg-white/5 border-white/10",              icon: <XCircle className="w-3 h-3" />, label: "Disconnected" },
    active:       { color: "text-green-400 bg-green-500/10 border-green-500/20",    icon: <CheckCircle className="w-3 h-3" />, label: "Active" },
    inactive:     { color: "text-gray-500 bg-white/5 border-white/10",              icon: <XCircle className="w-3 h-3" />, label: "Inactive" },
  };
  const s = map[status] || map.disconnected;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${s.color}`}>
      {s.icon} {s.label}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-blue-500" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function Settings() {
  const [section, setSection] = useState("general");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState({
    theme: "dark",
    accentColor: "blue",
    reducedMotion: false,
    highContrast: false,
    autoSync: true,
    syncInterval: 500,
    crdt: true,
    e2ee: true,
    privacyZones: true,
    auditLog: true,
    blenderHost: "localhost",
    blenderPort: "9001",
    blenderAutoConnect: true,
    cloudProvider: "aws",
    cloudRegion: "us-east-1",
    cloudAutoUpload: true,
    spatialAudio: true,
    hrtf: true,
    ambisonicsOrder: 3,
    notifyCollaboration: true,
    notifyRender: true,
    notifySync: false,
    notifyUpdates: true,
  });

  const set = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));

  const renderSection = () => {
    switch (section) {
      case "general": return (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">General Settings</h2>
          {[
            { key: "autoSync",    label: "Auto-sync on change",   desc: "Automatically sync scene changes to all connected devices" },
            { key: "crdt",        label: "CRDT conflict resolution", desc: "Use Conflict-free Replicated Data Types for merge conflicts" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl">
              <div>
                <p className="text-sm text-gray-200">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
              <Toggle value={(settings as any)[s.key]} onChange={v => set(s.key, v)} />
            </div>
          ))}
          <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-sm text-gray-200 mb-1">Sync Interval</p>
            <p className="text-xs text-gray-500 mb-3">How often to push scene changes (ms)</p>
            <div className="flex items-center gap-3">
              <input type="range" min="100" max="2000" step="100" value={settings.syncInterval}
                onChange={e => set("syncInterval", parseInt(e.target.value))}
                className="flex-1 accent-blue-400" />
              <span className="text-sm font-mono text-gray-300 w-16">{settings.syncInterval}ms</span>
            </div>
          </div>
        </div>
      );

      case "appearance": return (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Appearance</h2>
          <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-sm text-gray-200 mb-3">Theme</p>
            <div className="flex gap-2">
              {["dark", "darker", "midnight"].map(t => (
                <button key={t} onClick={() => set("theme", t)}
                  className={`flex-1 py-2 rounded-lg text-xs capitalize transition-colors ${settings.theme === t ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-400 border border-white/8"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-sm text-gray-200 mb-3">Accent Color</p>
            <div className="flex gap-2">
              {[
                { name: "blue",   color: "#60a5fa" },
                { name: "purple", color: "#a78bfa" },
                { name: "green",  color: "#34d399" },
                { name: "amber",  color: "#f59e0b" },
                { name: "pink",   color: "#ec4899" },
              ].map(c => (
                <button key={c.name} onClick={() => set("accentColor", c.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${settings.accentColor === c.name ? "scale-125 border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c.color }} />
              ))}
            </div>
          </div>
          {[
            { key: "reducedMotion", label: "Reduce Motion",    desc: "Minimize animations for accessibility" },
            { key: "highContrast",  label: "High Contrast",    desc: "Increase contrast for better readability" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl">
              <div>
                <p className="text-sm text-gray-200">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
              <Toggle value={(settings as any)[s.key]} onChange={v => set(s.key, v)} />
            </div>
          ))}
        </div>
      );

      case "platforms": return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Platform Connections</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Device
            </button>
          </div>
          {PLATFORM_CONNECTIONS.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: p.color + "20", border: `1px solid ${p.color}30` }}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{p.name}</p>
                <p className="text-xs text-gray-500">{p.device}</p>
                <p className="text-[10px] text-gray-600 font-mono">{p.version}</p>
              </div>
              <StatusBadge status={p.status} />
              <button className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      );

      case "api": return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">API Keys</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Key
            </button>
          </div>
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            API keys are stored encrypted in the Secure Enclave and never transmitted in plaintext.
          </div>
          {API_KEYS.map(k => (
            <div key={k.id} className="p-3 bg-white/3 border border-white/8 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">{k.name}</p>
                  <p className="text-xs text-gray-500">{k.scope}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={k.status} />
                  <button onClick={() => setShowKeys(s => ({ ...s, [k.id]: !s[k.id] }))}
                    className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                    {showKeys[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs text-gray-500 bg-black/30 rounded-lg px-3 py-2 break-all">
                {showKeys[k.id] ? k.key.replace(/•/g, "x") : k.key}
              </div>
            </div>
          ))}
        </div>
      );

      case "blender": return (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Blender Integration</h2>
          <div className="p-3 bg-white/3 border border-white/8 rounded-xl space-y-3">
            <p className="text-sm text-gray-200">WebSocket Connection</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Host</p>
                <input value={settings.blenderHost} onChange={e => set("blenderHost", e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500/40 font-mono" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Port</p>
                <input value={settings.blenderPort} onChange={e => set("blenderPort", e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500/40 font-mono" />
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs hover:bg-amber-500/30 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Test Connection
            </button>
          </div>
          {[
            { key: "blenderAutoConnect", label: "Auto-connect on startup", desc: "Automatically connect to Blender when the app starts" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl">
              <div>
                <p className="text-sm text-gray-200">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
              <Toggle value={(settings as any)[s.key]} onChange={v => set(s.key, v)} />
            </div>
          ))}
          <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-sm text-gray-200 mb-1">Addon Installation</p>
            <p className="text-xs text-gray-500 mb-3">Install the DOGE Spatial Bridge addon in Blender</p>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download Addon (.zip)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs hover:bg-white/10 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Install via Blender
              </button>
            </div>
          </div>
        </div>
      );

      case "privacy": return (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Privacy & Security</h2>
          {[
            { key: "e2ee",         label: "End-to-End Encryption",  desc: "Encrypt all collaboration data with Secure Enclave keys" },
            { key: "privacyZones", label: "Privacy Zones",          desc: "Enable spatial privacy zones in the 3D editor" },
            { key: "auditLog",     label: "Audit Logging",          desc: "Log all data access and modifications for compliance" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl">
              <div>
                <p className="text-sm text-gray-200">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
              <Toggle value={(settings as any)[s.key]} onChange={v => set(s.key, v)} />
            </div>
          ))}
          <div className="p-3 bg-white/3 border border-white/8 rounded-xl space-y-2">
            <p className="text-sm text-gray-200">Secure Enclave Key</p>
            <p className="text-xs text-gray-500">Rotates automatically every 30 days</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs text-gray-500 bg-black/30 rounded-lg px-3 py-2">
                SE:2026-03-05:••••••••••••••••••••••••••••••••
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Rotate
              </button>
            </div>
          </div>
        </div>
      );

      case "notifications": return (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Notifications</h2>
          {[
            { key: "notifyCollaboration", label: "Collaboration Events",  desc: "Participant joins, leaves, or requests access" },
            { key: "notifyRender",        label: "Render Completions",    desc: "Cloud render job finished or failed" },
            { key: "notifySync",          label: "Sync Events",           desc: "Scene sync conflicts or connection drops" },
            { key: "notifyUpdates",       label: "Plugin Updates",        desc: "New versions available in the marketplace" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl">
              <div>
                <p className="text-sm text-gray-200">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
              <Toggle value={(settings as any)[s.key]} onChange={v => set(s.key, v)} />
            </div>
          ))}
        </div>
      );

      default: return (
        <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
          Select a section from the left
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#08080F] text-white p-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-gray-400" /> Settings & Preferences
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Configure platforms, API keys, privacy, and Blender integration</p>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left ${
                  section === s.id ? "bg-white/8 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/3"
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {s.label}
                {section === s.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
          <div className="pt-3 border-t border-white/8 space-y-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/3 transition-colors">
              <Download className="w-4 h-4" /> Export Config
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/3 transition-colors">
              <Upload className="w-4 h-4" /> Import Config
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset All
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-5">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
