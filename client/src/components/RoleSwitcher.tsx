/**
 * RoleSwitcher — demo persona switcher shown in the sidebar footer.
 * In production this would be replaced by the city's SSO login button.
 * Lets the City Administrator (or demo reviewer) switch between the 8 roles
 * to verify that route guards and module permissions work correctly.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/pages/AdminRoles";

export default function RoleSwitcher() {
  const { roleId, roleName, roleIcon, actorName, switchRole } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
        style={{
          background: "oklch(1 0 0 / 5%)",
          border: "1px solid oklch(1 0 0 / 12%)",
        }}
      >
        <span className="text-base flex-shrink-0">{roleIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold truncate" style={{ color: "oklch(0.92 0.005 250)" }}>
            {actorName}
          </div>
          <div className="text-[9px] font-mono truncate" style={{ color: "oklch(0.55 0.010 250)" }}>
            {roleName}
          </div>
        </div>
        {open
          ? <ChevronUp className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.55 0.010 250)" }} />
          : <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.55 0.010 250)" }} />
        }
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden z-50"
          style={{ background: "oklch(0.14 0.015 250)", border: "1px solid oklch(1 0 0 / 12%)", boxShadow: "0 -4px 20px oklch(0 0 0 / 30%)" }}
        >
          <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
            <UserCog className="w-3 h-3" style={{ color: "oklch(0.45 0.20 240)" }} />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "oklch(0.45 0.20 240)" }}>
              Demo Persona
            </span>
          </div>
          {ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => { switchRole(r.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all"
              style={{
                background: r.id === roleId ? "oklch(0.45 0.20 240 / 15%)" : "transparent",
                borderLeft: r.id === roleId ? `2px solid ${r.color}` : "2px solid transparent",
              }}
            >
              <span className="text-sm">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold" style={{ color: r.id === roleId ? "oklch(0.92 0.005 250)" : "oklch(0.72 0.008 250)" }}>
                  {r.name}
                </div>
              </div>
              {r.id === roleId && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
