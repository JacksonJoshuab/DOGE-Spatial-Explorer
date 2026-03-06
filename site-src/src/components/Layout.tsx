import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Layers, Video, Monitor, Brain, Package, ShieldCheck,
  Menu, X, Wifi, Lock, Activity, ChevronRight, Home,
  Cpu, Globe, Headphones, Zap, ArrowLeftRight, GitBranch,
  Server, Palette, GitCommit, BarChart3, Store, Film,
  Settings as SettingsIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/",             label: "Home",              icon: Home },
  { href: "/studio",       label: "Spatial Studio",    icon: Layers },
  { href: "/collaboration",label: "Live Collaboration", icon: Video },
  { href: "/devices",      label: "Device Manager",    icon: Monitor },
  { href: "/ai",           label: "AI Generation",     icon: Brain },
  { href: "/assets",       label: "Asset Library",     icon: Package },
  { href: "/privacy",      label: "Privacy & Security",icon: ShieldCheck },
];

const BLENDER_NAV_ITEMS = [
  { href: "/blender-bridge",  label: "Blender Bridge",   icon: ArrowLeftRight },
  { href: "/node-graph",      label: "Node Graph",       icon: GitBranch },
  { href: "/render-farm",     label: "Render Farm",      icon: Server },
  { href: "/materials",       label: "Material Sync",    icon: Palette },
  { href: "/version-control", label: "Version Control",  icon: GitCommit },
];

const ADVANCED_NAV_ITEMS = [
  { href: "/analytics",   label: "Analytics",        icon: BarChart3 },
  { href: "/marketplace", label: "Marketplace",      icon: Store },
  { href: "/audio",       label: "Audio Studio",     icon: Headphones },
  { href: "/timeline",    label: "Timeline",         icon: Film },
  { href: "/settings",    label: "Settings",         icon: SettingsIcon },
];

const PLATFORM_STATUS = [
  { label: "visionOS",  color: "bg-blue-400",   active: true },
  { label: "Meta Quest",color: "bg-purple-400", active: true },
  { label: "iPadOS",    color: "bg-green-400",  active: true },
  { label: "Blender",   color: "bg-amber-400",  active: true },
];

const ALL_NAV = [...NAV_ITEMS, ...BLENDER_NAV_ITEMS, ...ADVANCED_NAV_ITEMS];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blenderExpanded, setBlenderExpanded] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(true);
  const location = useLocation();

  const currentLabel =
    ALL_NAV.find(n => n.href === location.pathname)?.label ?? "DOGE Spatial Studio";

  const NavSection = ({ items, onClose }: { items: typeof NAV_ITEMS; onClose?: () => void }) => (
    <>
      {items.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          end={href === "/"}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-400" : ""}`} />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-400/50" />}
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  const CollapsibleSection = ({
    title, items, dotColor, activeColor, expanded, onToggle, onClose
  }: {
    title: string; items: typeof NAV_ITEMS; dotColor: string; activeColor: string;
    expanded: boolean; onToggle: () => void; onClose?: () => void;
  }) => (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[9px] text-gray-600 uppercase tracking-wider hover:text-gray-400 transition-colors"
      >
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
        {title}
        <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pl-1">
              {items.map(({ href, label, icon: Icon }) => (
                <NavLink
                  key={href}
                  to={href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? `${activeColor} border`
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0`} />
                      {label}
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <NavSection items={NAV_ITEMS} onClose={onClose} />
      <div className="pt-2">
        <CollapsibleSection
          title="Blender Integration"
          items={BLENDER_NAV_ITEMS}
          dotColor="bg-amber-400"
          activeColor="bg-amber-500/15 text-amber-300 border-amber-500/20"
          expanded={blenderExpanded}
          onToggle={() => setBlenderExpanded(p => !p)}
          onClose={onClose}
        />
      </div>
      <div className="pt-2">
        <CollapsibleSection
          title="Advanced Tools"
          items={ADVANCED_NAV_ITEMS}
          dotColor="bg-green-400"
          activeColor="bg-green-500/15 text-green-300 border-green-500/20"
          expanded={advancedExpanded}
          onToggle={() => setAdvancedExpanded(p => !p)}
          onClose={onClose}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#08080F] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-white/8 bg-[#0A0A16]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/8">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">DOGE Spatial</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Studio v3.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <SidebarContent />
        </nav>

        {/* Platform status */}
        <div className="px-3 py-3 border-t border-white/8">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2 px-1">Connected Platforms</p>
          <div className="space-y-1.5">
            {PLATFORM_STATUS.map(p => (
              <div key={p.label} className="flex items-center gap-2 px-1">
                <div className={`w-1.5 h-1.5 rounded-full ${p.active ? p.color : "bg-gray-700"} ${p.active ? "animate-pulse" : ""}`} />
                <span className={`text-[10px] ${p.active ? "text-gray-300" : "text-gray-600"}`}>{p.label}</span>
                <span className={`ml-auto text-[9px] ${p.active ? "text-green-400" : "text-gray-600"}`}>{p.active ? "live" : "off"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security indicator */}
        <div className="px-3 py-2.5 border-t border-white/8">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/8 border border-green-500/15 rounded-lg">
            <Lock className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-green-400 font-medium">E2EE Active</p>
              <p className="text-[8px] text-gray-600">AES-256-GCM · TLS 1.3</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-56 z-50 lg:hidden flex flex-col bg-[#0A0A16] border-r border-white/8 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-white">DOGE Spatial</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 px-2 py-3 space-y-0.5">
                <SidebarContent onClose={() => setSidebarOpen(false)} />
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="text-gray-300 font-medium">{currentLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Live metrics */}
            <div className="hidden md:flex items-center gap-3 text-[10px] text-gray-500 font-mono">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-400" /> 62 fps</span>
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-blue-400" /> 34%</span>
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-purple-400" /> 3 live</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium">LIVE</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
