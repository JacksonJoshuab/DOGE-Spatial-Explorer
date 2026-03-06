import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Users, Clock, Star, Archive, Zap, Lock, Globe, ChevronRight, MoreHorizontal, GitBranch, Cpu } from "lucide-react";

const PROJECTS = [
  {
    id: "1",
    name: "Z-Pinch Plasma Column",
    description: "Electromagnetic plasma simulation with Squatter Man aurora visualization",
    status: "active",
    starred: true,
    privacy: "private",
    team: ["👓","🥽","🔷","📱"],
    lastModified: "2 min ago",
    branch: "main",
    commits: 47,
    assets: 23,
    renderJobs: 3,
    progress: 72,
    tags: ["Physics","Plasma","visionOS","Blender"],
    color: "#7C3AED",
  },
  {
    id: "2",
    name: "Aurora Borealis Spatial",
    description: "Real-time aurora simulation using particle systems and volumetric rendering",
    status: "active",
    starred: true,
    privacy: "team",
    team: ["👓","🔷"],
    lastModified: "1h ago",
    branch: "feature/particles",
    commits: 31,
    assets: 18,
    renderJobs: 1,
    progress: 45,
    tags: ["Particles","Atmosphere","Meta"],
    color: "#0EA5E9",
  },
  {
    id: "3",
    name: "Electromagnetic Field Viz",
    description: "3D visualization of electromagnetic field lines and force vectors",
    status: "paused",
    starred: false,
    privacy: "private",
    team: ["🔷","📱"],
    lastModified: "2d ago",
    branch: "dev",
    commits: 19,
    assets: 11,
    renderJobs: 0,
    progress: 28,
    tags: ["EM Fields","Physics","iPad"],
    color: "#10B981",
  },
  {
    id: "4",
    name: "Spatial Architecture Tour",
    description: "Interactive architectural walkthrough for Apple Vision Pro with LiDAR scanning",
    status: "review",
    starred: false,
    privacy: "public",
    team: ["👓","📱","📺"],
    lastModified: "3d ago",
    branch: "release/v1",
    commits: 88,
    assets: 67,
    renderJobs: 0,
    progress: 94,
    tags: ["Architecture","LiDAR","visionOS","tvOS"],
    color: "#F59E0B",
  },
  {
    id: "5",
    name: "Quantum Particle System",
    description: "Quantum mechanics visualization with probabilistic particle wave functions",
    status: "archived",
    starred: false,
    privacy: "private",
    team: ["🔷"],
    lastModified: "2w ago",
    branch: "main",
    commits: 124,
    assets: 34,
    renderJobs: 0,
    progress: 100,
    tags: ["Quantum","Physics","Blender"],
    color: "#EC4899",
  },
];

const TEAM_MEMBERS = [
  { name: "Alex Chen",     role: "Lead Artist",       avatar: "👓", platform: "Vision Pro", online: true },
  { name: "Jordan Smith",  role: "3D Modeler",         avatar: "🔷", platform: "Blender",    online: true },
  { name: "Sam Rivera",    role: "XR Developer",       avatar: "🥽", platform: "Quest 3",    online: true },
  { name: "Taylor Kim",    role: "Compositor",         avatar: "📱", platform: "iPad Pro",   online: false },
  { name: "Morgan Lee",    role: "Technical Director", avatar: "📺", platform: "Apple TV",   online: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",    color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  paused:   { label: "Paused",    color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  review:   { label: "Review",    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  archived: { label: "Archived",  color: "text-gray-500",   bg: "bg-gray-500/10 border-gray-500/20" },
};

const PRIVACY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  private: { icon: <Lock className="w-3 h-3" />, label: "Private" },
  team:    { icon: <Users className="w-3 h-3" />, label: "Team" },
  public:  { icon: <Globe className="w-3 h-3" />, label: "Public" },
};

export default function ProjectManager() {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);
  const [filter, setFilter] = useState("all");

  const filtered = PROJECTS.filter(p => {
    if (filter === "starred") return p.starred;
    if (filter === "active") return p.status === "active";
    if (filter === "archived") return p.status === "archived";
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            Project Manager
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Multi-project workspace with team management and version control</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 transition-all">
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Project list */}
        <div className="w-72 flex-shrink-0 border-r border-white/8 flex flex-col overflow-hidden">
          {/* Filter tabs */}
          <div className="flex gap-1 p-3 border-b border-white/8">
            {[
              { id: "all",      label: "All" },
              { id: "starred",  label: "Starred" },
              { id: "active",   label: "Active" },
              { id: "archived", label: "Archived" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] transition-all ${
                  filter === f.id ? "bg-amber-500/15 border border-amber-500/25 text-amber-300" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filtered.map(project => (
              <motion.div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedProject.id === project.id
                    ? "border-amber-500/30 bg-amber-500/8"
                    : "border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />
                    <p className="text-xs font-medium text-gray-200 truncate">{project.name}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {project.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border ${STATUS_CONFIG[project.status].bg} ${STATUS_CONFIG[project.status].color}`}>
                      {STATUS_CONFIG[project.status].label}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">{project.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {project.team.map((a, i) => (
                      <span key={i} className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px]">{a}</span>
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-600">{project.lastModified}</span>
                </div>
                <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, background: project.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — Project detail */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Project header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: selectedProject.color }} />
                  <h2 className="text-xl font-bold text-white">{selectedProject.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border ${STATUS_CONFIG[selectedProject.status].bg} ${STATUS_CONFIG[selectedProject.status].color}`}>
                    {STATUS_CONFIG[selectedProject.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{selectedProject.description}</p>
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {selectedProject.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400">{tag}</span>
              ))}
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-500 flex items-center gap-1">
                {PRIVACY_CONFIG[selectedProject.privacy].icon}
                {PRIVACY_CONFIG[selectedProject.privacy].label}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Progress",    value: `${selectedProject.progress}%`,   icon: <Zap className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
                { label: "Commits",     value: selectedProject.commits,           icon: <GitBranch className="w-4 h-4 text-blue-400" />, color: "text-blue-400" },
                { label: "Assets",      value: selectedProject.assets,            icon: <FolderOpen className="w-4 h-4 text-green-400" />, color: "text-green-400" },
                { label: "Render Jobs", value: selectedProject.renderJobs,        icon: <Cpu className="w-4 h-4 text-purple-400" />, color: "text-purple-400" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="p-4 bg-white/3 border border-white/8 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[10px] text-gray-500">{label}</span></div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400">Overall Progress</span>
                <span className="text-xs font-mono" style={{ color: selectedProject.color }}>{selectedProject.progress}%</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: selectedProject.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedProject.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Branch info */}
            <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-300">Version Control</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs font-mono text-gray-300">{selectedProject.branch}</span>
                </div>
                <span className="text-xs text-gray-500">{selectedProject.commits} commits</span>
                <span className="text-xs text-gray-500">Last: {selectedProject.lastModified}</span>
              </div>
            </div>

            {/* Team */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Team Members
                </h3>
                <button className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Invite
                </button>
              </div>
              <div className="space-y-2">
                {TEAM_MEMBERS.filter(m => selectedProject.team.includes(m.avatar)).map(member => (
                  <div key={member.name} className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
                    <div className="relative">
                      <span className="text-xl">{member.avatar}</span>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#08080F] ${member.online ? "bg-green-400" : "bg-gray-600"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-200">{member.name}</p>
                      <p className="text-[10px] text-gray-500">{member.role} · {member.platform}</p>
                    </div>
                    <span className={`text-[10px] ${member.online ? "text-green-400" : "text-gray-600"}`}>{member.online ? "Online" : "Offline"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
