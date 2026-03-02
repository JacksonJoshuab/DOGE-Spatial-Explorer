/**
 * SecureAuthGate — Civic Intelligence Light
 * Authentication gate for secure module pages (Evidence Room, SCIF, Detention Center).
 * Simulates passkey / SSO authentication with Apple, Microsoft, Google, and badge-number fallback.
 * In production this would integrate with Manus OAuth or Azure Entra ID.
 */
import { useState, useEffect } from "react";
import {
  Shield, Fingerprint, Lock, Eye, EyeOff, AlertTriangle,
  CheckCircle2, Chrome, Apple, Monitor, Key
} from "lucide-react";

type AuthMethod = "passkey" | "sso-apple" | "sso-microsoft" | "sso-google" | "badge";

interface SecureAuthGateProps {
  moduleName: string;
  classificationLevel: "RESTRICTED" | "CONFIDENTIAL" | "SECRET" | "TS/SCI";
  requiredRole: string;
  children: React.ReactNode;
}

// Simulated valid credentials for demo
const VALID_CREDENTIALS = [
  { badge: "WL-001", pin: "1234", name: "Chief David Hernandez", role: "Police Chief",      clearance: "SECRET" },
  { badge: "WL-002", pin: "5678", name: "Matt Muckler",          role: "City Administrator",clearance: "TS/SCI" },
  { badge: "WL-003", pin: "9012", name: "Sarah Hernandez",       role: "Finance Director",  clearance: "CONFIDENTIAL" },
  { badge: "WL-004", pin: "3456", name: "Patricia Ochoa",        role: "Community Dev Dir", clearance: "RESTRICTED" },
  { badge: "WL-005", pin: "7890", name: "James Rawson",          role: "Public Works Dir",  clearance: "CONFIDENTIAL" },
];

const CLASSIFICATION_COLORS = {
  "RESTRICTED":  { bg: "oklch(0.65 0.20 55 / 10%)",  border: "oklch(0.65 0.20 55 / 35%)",  text: "oklch(0.52 0.20 55)",  badge: "oklch(0.65 0.20 55)" },
  "CONFIDENTIAL":{ bg: "oklch(0.45 0.20 240 / 10%)", border: "oklch(0.45 0.20 240 / 35%)", text: "oklch(0.38 0.18 240)", badge: "oklch(0.45 0.20 240)" },
  "SECRET":      { bg: "oklch(0.55 0.22 25 / 10%)",  border: "oklch(0.55 0.22 25 / 35%)",  text: "oklch(0.48 0.22 25)",  badge: "oklch(0.55 0.22 25)" },
  "TS/SCI":      { bg: "oklch(0.50 0.22 0 / 10%)",   border: "oklch(0.50 0.22 0 / 35%)",   text: "oklch(0.42 0.22 0)",   badge: "oklch(0.50 0.22 0)" },
};

const SESSION_KEY = (module: string) => `secure_auth_${module.replace(/\s+/g, "_").toLowerCase()}`;

export default function SecureAuthGate({ moduleName, classificationLevel, requiredRole, children }: SecureAuthGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [badge, setBadge] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState<typeof VALID_CREDENTIALS[0] | null>(null);
  const [auditLog, setAuditLog] = useState<{ time: string; action: string; user: string }[]>([]);

  const colors = CLASSIFICATION_COLORS[classificationLevel];

  // Check session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY(moduleName));
    if (stored) {
      const parsed = JSON.parse(stored);
      setAuthenticated(true);
      setAuthUser(parsed);
    }
  }, [moduleName]);

  const addAuditEntry = (action: string, user: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setAuditLog(prev => [{ time, action, user }, ...prev.slice(0, 4)]);
  };

  const handlePasskeyAuth = async () => {
    setLoading(true);
    setError("");
    // Simulate passkey biometric prompt delay
    await new Promise(r => setTimeout(r, 1800));
    const user = VALID_CREDENTIALS[1]; // Matt Muckler for demo
    sessionStorage.setItem(SESSION_KEY(moduleName), JSON.stringify(user));
    setAuthUser(user);
    setAuthenticated(true);
    addAuditEntry(`Passkey authentication successful`, user.name);
    setLoading(false);
  };

  const handleSSOAuth = async (provider: string) => {
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 1500));
    const user = VALID_CREDENTIALS[1];
    sessionStorage.setItem(SESSION_KEY(moduleName), JSON.stringify(user));
    setAuthUser(user);
    setAuthenticated(true);
    addAuditEntry(`SSO authentication via ${provider}`, user.name);
    setLoading(false);
  };

  const handleBadgeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 800));
    const user = VALID_CREDENTIALS.find(u => u.badge === badge.toUpperCase() && u.pin === pin);
    if (user) {
      sessionStorage.setItem(SESSION_KEY(moduleName), JSON.stringify(user));
      setAuthUser(user);
      setAuthenticated(true);
      addAuditEntry(`Badge authentication successful`, user.name);
    } else {
      setError("Invalid badge number or PIN. Access denied.");
      addAuditEntry(`Failed authentication attempt`, `Badge: ${badge || "unknown"}`);
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(SESSION_KEY(moduleName));
    setAuthenticated(false);
    setAuthUser(null);
    setMethod(null);
    setBadge("");
    setPin("");
  };

  if (authenticated && authUser) {
    return (
      <div>
        {/* Secure session banner */}
        <div className="flex items-center justify-between px-4 py-2 text-[11px]" style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color: colors.text }} />
            <span style={{ color: colors.text }}>
              <strong>{classificationLevel}</strong> — Authenticated as {authUser.name} ({authUser.role})
            </span>
          </div>
          <button onClick={handleSignOut} className="text-[11px] underline" style={{ color: colors.text }}>Sign Out</button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "oklch(0.975 0.004 240)" }}>
      <div className="w-full max-w-md">
        {/* Classification banner */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            <Shield className="w-3.5 h-3.5" />
            {classificationLevel}
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: colors.bg, border: `2px solid ${colors.border}` }}>
            <Lock className="w-7 h-7" style={{ color: colors.text }} />
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
            {moduleName}
          </h1>
          <p className="text-[12px]" style={{ color: "oklch(0.55 0.010 250)" }}>
            Access restricted to authorized personnel — {requiredRole}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "oklch(0.60 0.010 250)" }}>
            City of West Liberty, IA · DOGE Municipal Platform
          </p>
        </div>

        <div className="rounded-2xl border overflow-hidden shadow-lg" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 10%)" }}>
          {/* Method selector */}
          {!method && (
            <div className="p-6 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-center mb-4" style={{ color: "oklch(0.55 0.010 250)" }}>
                Select Authentication Method
              </div>

              {/* Passkey */}
              <button
                onClick={handlePasskeyAuth}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:scale-[1.01]"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.badge }}>
                  <Fingerprint className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Passkey / Biometric</div>
                  <div className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>Touch ID, Face ID, or Windows Hello</div>
                </div>
                {loading && <div className="ml-auto w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: colors.badge }} />}
              </button>

              {/* SSO options */}
              {[
                { id: "sso-apple" as AuthMethod,     label: "Sign in with Apple",     sub: "Apple ID + iCloud Keychain",  icon: Apple,   bg: "oklch(0.12 0 0)" },
                { id: "sso-microsoft" as AuthMethod, label: "Sign in with Microsoft", sub: "Azure Entra ID / M365",       icon: Monitor, bg: "oklch(0.38 0.18 240)" },
                { id: "sso-google" as AuthMethod,    label: "Sign in with Google",    sub: "Google Workspace / Gmail",    icon: Chrome,  bg: "oklch(0.55 0.22 25)" },
              ].map(sso => {
                const SSOIcon = sso.icon;
                return (
                  <button
                    key={sso.id}
                    onClick={() => handleSSOAuth(sso.label)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:scale-[1.01]"
                    style={{ borderColor: "oklch(0 0 0 / 10%)", background: "oklch(1 0 0)" }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: sso.bg }}>
                      <SSOIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{sso.label}</div>
                      <div className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>{sso.sub}</div>
                    </div>
                  </button>
                );
              })}

              {/* Badge + PIN fallback */}
              <button
                onClick={() => setMethod("badge")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:scale-[1.01]"
                style={{ borderColor: "oklch(0 0 0 / 10%)", background: "oklch(1 0 0)" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.50 0.010 250)" }}>
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Badge Number + PIN</div>
                  <div className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>City employee badge fallback</div>
                </div>
              </button>
            </div>
          )}

          {/* Badge + PIN form */}
          {method === "badge" && (
            <form onSubmit={handleBadgeAuth} className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => { setMethod(null); setError(""); }} className="text-[12px]" style={{ color: "oklch(0.45 0.20 240)" }}>← Back</button>
                <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Badge + PIN Authentication</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "oklch(0.55 0.22 25 / 10%)", border: "1px solid oklch(0.55 0.22 25 / 30%)" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.55 0.22 25)" }} />
                  <span className="text-[12px]" style={{ color: "oklch(0.48 0.22 25)" }}>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Badge Number</label>
                <input
                  required value={badge} onChange={e => setBadge(e.target.value)}
                  placeholder="e.g. WL-001"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
                  style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>PIN</label>
                <div className="relative">
                  <input
                    required type={showPin ? "text" : "password"} value={pin} onChange={e => setPin(e.target.value)}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono pr-10"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
                  />
                  <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPin ? <EyeOff className="w-4 h-4" style={{ color: "oklch(0.60 0.010 250)" }} /> : <Eye className="w-4 h-4" style={{ color: "oklch(0.60 0.010 250)" }} />}
                  </button>
                </div>
                <div className="text-[10px] mt-1" style={{ color: "oklch(0.65 0.010 250)" }}>Demo: Badge WL-001, PIN 1234</div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: colors.badge, color: "white", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <><Lock className="w-4 h-4" /> Authenticate</>
                )}
              </button>
            </form>
          )}

          {/* Audit log */}
          {auditLog.length > 0 && (
            <div className="border-t px-4 py-3" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.975 0.004 240)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.60 0.010 250)" }}>Access Audit Log</div>
              {auditLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] mb-1">
                  <span className="font-mono" style={{ color: "oklch(0.65 0.010 250)" }}>{entry.time}</span>
                  <span style={{ color: "oklch(0.45 0.010 250)" }}>{entry.action}</span>
                  <span className="font-medium" style={{ color: "oklch(0.35 0.014 250)" }}>— {entry.user}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
          All access attempts are logged and audited · Iowa Code Ch. 22 · CJIS Security Policy
        </div>
      </div>
    </div>
  );
}
