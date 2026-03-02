/**
 * AccessDenied — shown when a user's role lacks permission for a route.
 * Design: Civic Intelligence Light
 */
import { useLocation } from "wouter";
import { ShieldOff, ArrowLeft, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";

export default function AccessDenied() {
  const [, navigate] = useLocation();
  const { roleName, roleIcon, actorName } = useAuth();

  return (
    <DashboardLayout title="Access Denied">
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "oklch(0.55 0.22 25 / 10%)", border: "2px solid oklch(0.55 0.22 25 / 25%)" }}
        >
          <ShieldOff className="w-10 h-10" style={{ color: "oklch(0.55 0.22 25)" }} />
        </div>

        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}
        >
          Access Denied
        </h1>

        <p className="text-sm mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>
          Your current role does not have permission to view this module.
        </p>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold my-4"
          style={{ background: "oklch(0.55 0.22 25 / 8%)", border: "1px solid oklch(0.55 0.22 25 / 20%)", color: "oklch(0.45 0.22 25)" }}
        >
          <span className="text-base">{roleIcon}</span>
          {actorName} — {roleName}
        </div>

        <p className="text-xs mb-8 max-w-sm" style={{ color: "oklch(0.60 0.010 250)" }}>
          This access attempt has been logged to the Audit Studio. Contact the City Administrator
          to request elevated permissions for your role.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "oklch(0.45 0.20 240)", color: "#fff" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/roles")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "oklch(0.965 0.005 240)", color: "oklch(0.45 0.010 250)", border: "1px solid oklch(0 0 0 / 10%)" }}
          >
            <UserCog className="w-4 h-4" />
            RBAC Panel
          </button>
        </div>

        <p className="text-[10px] mt-8 font-mono" style={{ color: "oklch(0.65 0.010 250)" }}>
          Iowa Code Ch. 22 · Unauthorized access attempts are subject to civil and criminal penalties.
        </p>
      </div>
    </DashboardLayout>
  );
}
