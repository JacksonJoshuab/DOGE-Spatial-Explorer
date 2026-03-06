import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Upload, Download, Lock, RefreshCw, HardDrive, Zap, Folder, File, Trash2, Share2, Eye } from "lucide-react";

const STORAGE_PROVIDERS = [
  { id: "icloud",  label: "iCloud Secure Enclave", icon: "☁️", used: 12.4, total: 50, color: "#4A90D9", secure: true },
  { id: "s3",      label: "AWS S3 (Encrypted)",    icon: "🟡", used: 34.7, total: 100, color: "#FF9900", secure: true },
  { id: "local",   label: "Local NVMe Cache",       icon: "💾", used: 8.2,  total: 16,  color: "#4CAF50", secure: true },
];

const FILES = [
  { id: "1", name: "zpinch_plasma_v3.usdz",    type: "USDZ",  size: "234 MB", modified: "2m ago",   synced: true,  encrypted: true,  platform: "visionOS" },
  { id: "2", name: "plasma_column.blend",       type: "BLEND", size: "156 MB", modified: "5m ago",   synced: true,  encrypted: true,  platform: "Blender" },
  { id: "3", name: "electromagnetic_field.glb", type: "GLB",   size: "89 MB",  modified: "12m ago",  synced: true,  encrypted: true,  platform: "Meta" },
  { id: "4", name: "session_recording_001.mp4", type: "MP4",   size: "1.2 GB", modified: "1h ago",   synced: false, encrypted: true,  platform: "All" },
  { id: "5", name: "plasma_texture_4k.exr",     type: "EXR",   size: "67 MB",  modified: "2h ago",   synced: true,  encrypted: true,  platform: "Blender" },
  { id: "6", name: "scene_v12_backup.usdz",     type: "USDZ",  size: "198 MB", modified: "3h ago",   synced: true,  encrypted: true,  platform: "visionOS" },
  { id: "7", name: "physics_sim_cache.vdb",     type: "VDB",   size: "445 MB", modified: "1d ago",   synced: true,  encrypted: false, platform: "Blender" },
  { id: "8", name: "collaboration_log.json",    type: "JSON",  size: "2.1 MB", modified: "1d ago",   synced: true,  encrypted: true,  platform: "All" },
];

const TYPE_COLORS: Record<string, string> = {
  USDZ: "#4A90D9", BLEND: "#E87D0D", GLB: "#00B4D8",
  MP4: "#E91E63", EXR: "#9C27B0", VDB: "#4CAF50",
  JSON: "#FFC107", default: "#888",
};

export default function CloudStorage() {
  const [selectedProvider, setSelectedProvider] = useState(STORAGE_PROVIDERS[0]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const toggleFile = (id: string) => {
    setSelectedFiles(s => s.includes(id) ? s.filter(f => f !== id) : [...s, id]);
  };

  const triggerSync = () => {
    setSyncing(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(interval); setSyncing(false); return 100; }
        return p + 5;
      });
    }, 100);
  };

  const totalUsed = STORAGE_PROVIDERS.reduce((a, p) => a + p.used, 0);
  const totalCapacity = STORAGE_PROVIDERS.reduce((a, p) => a + p.total, 0);

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            Cloud Storage
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Secure spatial asset storage with iCloud Secure Enclave and E2E encryption</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={triggerSync} disabled={syncing} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all border ${
            syncing ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-sky-500/10 border-sky-500/20 text-sky-300 hover:bg-sky-500/15"
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? `Syncing ${uploadProgress}%` : "Sync All"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Storage providers */}
        <div className="w-56 flex-shrink-0 border-r border-white/8 overflow-y-auto">
          <div className="p-4 space-y-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Storage Providers</p>
            {STORAGE_PROVIDERS.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(p)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedProvider.id === p.id ? "border-sky-500/30 bg-sky-500/8" : "border-white/8 bg-white/3 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-200 truncate">{p.label}</p>
                    {p.secure && <div className="flex items-center gap-1 mt-0.5"><Lock className="w-2.5 h-2.5 text-green-400" /><span className="text-[9px] text-green-400">E2E Encrypted</span></div>}
                  </div>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(p.used/p.total)*100}%`, background: p.color }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-gray-600">{p.used} GB used</span>
                  <span className="text-[9px] text-gray-600">{p.total} GB</span>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Total Storage</span>
              </div>
              <p className="text-lg font-bold text-white">{totalUsed.toFixed(1)} <span className="text-xs text-gray-500">/ {totalCapacity} GB</span></p>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600" style={{ width: `${(totalUsed/totalCapacity)*100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center — File browser */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-[#0A0A14]">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Folder className="w-3.5 h-3.5" />
              <span>Z-Pinch Plasma Session</span>
              <span>/</span>
              <span className="text-gray-300">Assets</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {selectedFiles.length > 0 && (
                <>
                  <span className="text-[10px] text-gray-400">{selectedFiles.length} selected</span>
                  <button className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 hover:bg-red-500/15 transition-all">
                    <Trash2 className="w-3 h-3" />Delete
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 hover:bg-white/8 transition-all">
                    <Download className="w-3 h-3" />Download
                  </button>
                </>
              )}
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0A0A14] border-b border-white/8">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium w-8"></th>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Name</th>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Size</th>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Modified</th>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Platform</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {FILES.map((file, i) => (
                  <motion.tr
                    key={file.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleFile(file.id)}
                    className={`border-b border-white/4 cursor-pointer transition-colors ${
                      selectedFiles.includes(file.id) ? "bg-sky-500/8" : "hover:bg-white/3"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedFiles.includes(file.id) ? "bg-sky-500 border-sky-500" : "border-white/20"
                      }`}>
                        {selectedFiles.includes(file.id) && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <File className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs text-gray-200 font-mono">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium" style={{ background: `${TYPE_COLORS[file.type] || TYPE_COLORS.default}20`, color: TYPE_COLORS[file.type] || TYPE_COLORS.default }}>
                        {file.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{file.size}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{file.modified}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${file.synced ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
                        <span className={`text-[10px] ${file.synced ? "text-green-400" : "text-amber-400"}`}>{file.synced ? "Synced" : "Pending"}</span>
                        {file.encrypted && <Lock className="w-2.5 h-2.5 text-blue-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-gray-500">{file.platform}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button className="p-1 text-gray-600 hover:text-gray-300 transition-colors"><Eye className="w-3 h-3" /></button>
                        <button className="p-1 text-gray-600 hover:text-gray-300 transition-colors"><Share2 className="w-3 h-3" /></button>
                        <button className="p-1 text-gray-600 hover:text-gray-300 transition-colors"><Download className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
