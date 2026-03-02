/**
 * SecureAuthGate — Civic Intelligence Platform
 * Biometric passkey authentication gate for secure module pages.
 * Supports Apple (Touch ID / Face ID), Google (Passkey), and Microsoft (Windows Hello).
 * Simulates WebAuthn/FIDO2 passkey flow — in production, wire to real WebAuthn API.
 */
import { useState, useEffect } from "react";
import { ReactNode } from "react";
import { Shield, Lock, Fingerprint, CheckCircle2, AlertTriangle, Eye, EyeOff, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  moduleName: string;
  classificationLevel?: string;
  requiredRole?: string;
}

type AuthStep = "select" | "authenticating" | "mfa" | "granted" | "denied";
type Provider = "apple" | "google" | "microsoft" | "pin";

interface ProviderConfig {
  id: Provider;
  name: string;
  method: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  description: string;
}

// SVG icons for the three platform providers
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M13 1h10v10H13z" />
      <path fill="#7FBA00" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "apple",
    name: "Apple",
    method: "Touch ID / Face ID",
    icon: AppleIcon,
    color: "oklch(0.25 0.010 250)",
    bg: "oklch(0.25 0.010 250 / 6%)",
    border: "oklch(0.25 0.010 250 / 20%)",
    description: "Sign in with your Apple ID using Face ID or Touch ID via iCloud Keychain",
  },
  {
    id: "google",
    name: "Google",
    method: "Google Passkey",
    icon: GoogleIcon,
    color: "oklch(0.50 0.18 240)",
    bg: "oklch(0.50 0.18 240 / 6%)",
    border: "oklch(0.50 0.18 240 / 20%)",
    description: "Sign in with your Google account using a passkey stored on your device",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    method: "Windows Hello",
    icon: MicrosoftIcon,
    color: "oklch(0.45 0.18 240)",
    bg: "oklch(0.45 0.18 240 / 6%)",
    border: "oklch(0.45 0.18 240 / 20%)",
    description: "Sign in with your Microsoft account using Windows Hello biometrics",
  },
];

// Simulated authorized users for demo
const AUTHORIZED_USERS: Record<Provider, { name: string; role: string; clearance: string }> = {
  apple: { name: "Chief R. Davis", role: "Police Chief", clearance: "SECRET/SCI" },
  google: { name: "City Admin M. Muckler", role: "City Administrator", clearance: "SECRET" },
  microsoft: { name: "Det. M. Chen", role: "Detective", clearance: "SECRET" },
  pin: { name: "Officer", role: "Law Enforcement", clearance: "CONFIDENTIAL" },
};

export default function SecureAuthGate({ children, moduleName, classificationLevel = "SECRET", requiredRole = "Law Enforcement" }: Props) {
  const [step, setStep] = useState<AuthStep>("select");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessionUser, setSessionUser] = useState<typeof AUTHORIZED_USERS[Provider] | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // Session countdown
  useEffect(() => {
    if (step !== "granted") return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStep("select");
          setSelectedProvider(null);
          setSessionUser(null);
          toast.warning("Secure session expired — re-authentication required");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setStep("authenticating");
    setProgress(0);

    // Simulate biometric authentication progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 8;
      setProgress(Math.min(p, 95));
      if (p >= 95) {
        clearInterval(interval);
        // Simulate MFA step after biometric
        setTimeout(() => {
          setProgress(100);
          setStep("mfa");
        }, 400);
      }
    }, 120);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept any 6-digit code for demo
    if (mfaCode.length === 6 && /^\d+$/.test(mfaCode)) {
      const user = AUTHORIZED_USERS[selectedProvider!];
      setSessionUser(user);
      const expiry = Date.now() + 30 * 60 * 1000; // 30 min
      setSessionExpiry(expiry);
      setCountdown(30 * 60);
      setStep("granted");
      toast.success(`Access granted — ${user.name} · ${user.clearance}`);
    } else {
      setStep("denied");
      setTimeout(() => {
        setStep("select");
        setSelectedProvider(null);
        setMfaCode("");
      }, 2500);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (step === "granted" && sessionUser) {
    return (
      <div>
        {/* Session banner */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[11px]"
          style={{ background: "oklch(0.42 0.18 145 / 10%)", borderBottom: "1px solid oklch(0.42 0.18 145 / 20%)" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.42 0.18 145)" }} />
            <span style={{ color: "oklch(0.30 0.014 250)" }}>
              Authenticated: <strong>{sessionUser.name}</strong> · {sessionUser.role} · Clearance: <strong>{sessionUser.clearance}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" style={{ color: "oklch(0.55 0.010 250)" }}>
              <Clock className="w-3 h-3" />
              <span className="font-mono">{formatCountdown(countdown)}</span>
            </div>
            <button
              onClick={() => { setStep("select"); setSelectedProvider(null); setSessionUser(null); }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold"
              style={{ background: "oklch(0.58 0.22 25 / 12%)", color: "oklch(0.50 0.22 25)", border: "1px solid oklch(0.58 0.22 25 / 25%)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "oklch(0.975 0.004 240)" }}>
      <div className="w-full max-w-md">
        {/* Classification banner */}
        <div
          className="text-center py-2 mb-6 rounded-lg text-[11px] font-bold tracking-widest uppercase"
          style={{
            background: classificationLevel === "SECRET" ? "oklch(0.58 0.22 25 / 12%)" : "oklch(0.55 0.18 75 / 12%)",
            color: classificationLevel === "SECRET" ? "oklch(0.50 0.22 25)" : "oklch(0.50 0.18 75)",
            border: `1px solid ${classificationLevel === "SECRET" ? "oklch(0.58 0.22 25 / 25%)" : "oklch(0.55 0.18 75 / 25%)"}`,
          }}
        >
          ⚠ {classificationLevel} — Authorized Personnel Only ⚠
        </div>

        {/* Auth card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", boxShadow: "0 20px 60px oklch(0 0 0 / 8%)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center" style={{ borderBottom: "1px solid oklch(0 0 0 / 6%)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "oklch(0.45 0.20 240 / 10%)", border: "1px solid oklch(0.45 0.20 240 / 20%)" }}>
              {step === "authenticating" ? (
                <Fingerprint className="w-7 h-7 animate-pulse" style={{ color: "oklch(0.40 0.18 240)" }} />
              ) : step === "denied" ? (
                <AlertTriangle className="w-7 h-7" style={{ color: "oklch(0.58 0.22 25)" }} />
              ) : (
                <Lock className="w-7 h-7" style={{ color: "oklch(0.40 0.18 240)" }} />
              )}
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              {step === "denied" ? "Access Denied" : "Secure Authentication Required"}
            </h2>
            <p className="text-[12px]" style={{ color: "oklch(0.55 0.010 250)" }}>
              {moduleName}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Shield className="w-3 h-3" style={{ color: "oklch(0.45 0.20 240)" }} />
              <span className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>
                Required: {requiredRole}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Step: Select provider */}
            {step === "select" && (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-4 text-center" style={{ color: "oklch(0.55 0.010 250)" }}>
                  Choose your authentication method
                </div>
                {PROVIDERS.map(provider => {
                  const Icon = provider.icon;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider.id)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left group"
                      style={{
                        background: provider.bg,
                        border: `1px solid ${provider.border}`,
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: "oklch(0.22 0.014 250)" }}>
                          {provider.name} — {provider.method}
                        </div>
                        <div className="text-[10px] truncate" style={{ color: "oklch(0.58 0.010 250)" }}>
                          {provider.description}
                        </div>
                      </div>
                      <Fingerprint className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: provider.color }} />
                    </button>
                  );
                })}

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: "oklch(0 0 0 / 8%)" }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-[10px] bg-white" style={{ color: "oklch(0.65 0.010 250)" }}>or use backup PIN</span>
                  </div>
                </div>

                <button
                  onClick={() => handleProviderSelect("pin")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                  style={{
                    background: "oklch(0.975 0.004 240)",
                    border: "1px solid oklch(0 0 0 / 10%)",
                    color: "oklch(0.45 0.012 250)",
                  }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Use Backup PIN
                </button>
              </div>
            )}

            {/* Step: Authenticating */}
            {step === "authenticating" && selectedProvider && (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "oklch(0.45 0.20 240 / 8%)" }}>
                  {(() => {
                    const p = PROVIDERS.find(p => p.id === selectedProvider);
                    if (!p) return null;
                    const Icon = p.icon;
                    return <Icon className="w-8 h-8" />;
                  })()}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "oklch(0.22 0.014 250)" }}>
                    {selectedProvider === "apple" ? "Touch the sensor or look at your device" :
                     selectedProvider === "google" ? "Confirm your passkey on your device" :
                     selectedProvider === "microsoft" ? "Complete Windows Hello verification" :
                     "Verifying PIN..."}
                  </div>
                  <div className="text-[11px]" style={{ color: "oklch(0.58 0.010 250)" }}>
                    {selectedProvider === "apple" ? "Face ID / Touch ID · iCloud Keychain" :
                     selectedProvider === "google" ? "FIDO2 Passkey · Google Password Manager" :
                     selectedProvider === "microsoft" ? "Windows Hello · Microsoft Authenticator" :
                     "Backup authentication"}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0 0 0 / 8%)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${progress}%`, background: "oklch(0.45 0.20 240)" }}
                    />
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: "oklch(0.60 0.010 250)" }}>
                    Authenticating... {Math.round(progress)}%
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                  {["WebAuthn FIDO2", "End-to-End Encrypted", "Zero-Knowledge Proof"].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded" style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Step: MFA */}
            {step === "mfa" && (
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="text-sm font-semibold" style={{ color: "oklch(0.22 0.014 250)" }}>Two-Factor Verification</div>
                  <div className="text-[11px]" style={{ color: "oklch(0.58 0.010 250)" }}>
                    Enter the 6-digit code from your authenticator app
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showMfa ? "text" : "password"}
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl text-center text-xl font-mono tracking-[0.4em] outline-none"
                    style={{
                      background: "oklch(0.975 0.004 240)",
                      border: "1px solid oklch(0 0 0 / 12%)",
                      color: "oklch(0.22 0.014 250)",
                    }}
                    autoFocus
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMfa(!showMfa)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "oklch(0.60 0.010 250)" }}
                  >
                    {showMfa ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-center" style={{ color: "oklch(0.60 0.010 250)" }}>
                  Demo: enter any 6 digits (e.g. 123456)
                </div>
                <button
                  type="submit"
                  disabled={mfaCode.length !== 6}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                  style={{ background: "oklch(0.45 0.20 240)", color: "white" }}
                >
                  Verify & Access Secure Module
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("select"); setSelectedProvider(null); setMfaCode(""); }}
                  className="w-full py-2 text-[12px]"
                  style={{ color: "oklch(0.55 0.010 250)" }}
                >
                  ← Back to provider selection
                </button>
              </form>
            )}

            {/* Step: Denied */}
            {step === "denied" && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "oklch(0.58 0.22 25 / 12%)" }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: "oklch(0.58 0.22 25)" }} />
                </div>
                <div className="text-sm font-semibold" style={{ color: "oklch(0.50 0.22 25)" }}>Authentication Failed</div>
                <div className="text-[11px]" style={{ color: "oklch(0.58 0.010 250)" }}>
                  Invalid credentials. This attempt has been logged. Returning to login...
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 text-center" style={{ borderTop: "1px solid oklch(0 0 0 / 6%)", background: "oklch(0.975 0.004 240)" }}>
            <div className="flex items-center justify-center gap-3 text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
              <span>🔒 FIPS 140-3 Level 2</span>
              <span>·</span>
              <span>CJIS Compliant</span>
              <span>·</span>
              <span>ISO 27001:2022</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
          City of West Liberty, IA · DOGE Municipal Platform · All access attempts are logged
        </div>
      </div>
    </div>
  );
}
