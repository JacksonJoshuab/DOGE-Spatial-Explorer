/**
 * RouteGuard — enforces role-based access control AND MFA on protected routes.
 *
 * Two layers of protection:
 *   1. RBAC check — redirects to /access-denied if the role lacks the required module.
 *   2. MFA gate  — for high-security routes (/secure, /le-hub, /admin/roles), shows a
 *      TOTP modal.  The 6-digit code is validated server-side via trpc.mfa.verifyCode,
 *      which checks against the otplib TOTP secret stored in Postgres.
 *      Demo staff without a DB record fall back to accepting any valid 6-digit code.
 */
import { ReactNode, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth, ROUTE_MODULE_MAP } from "@/contexts/AuthContext";
import { Shield, Lock, KeyRound, AlertTriangle, CheckCircle2, X, Loader2, QrCode } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Routes that require MFA verification on every visit
const MFA_REQUIRED_ROUTES = new Set(["/secure", "/le-hub", "/admin/roles"]);

// Staff accounts that have MFA disabled (mirrors AdminRoles.tsx INITIAL_STAFF)
const MFA_DISABLED_STAFF = new Set([
  "Marcus Webb",
  "Tom Harrington",
  "Council Member Rivera",
  "Officer K. Thompson",
]);

// Map demo staff names to stable openId tokens for DB lookup
const STAFF_OPEN_ID_MAP: Record<string, string> = {
  "Mayor Sarah Chen": "demo-mayor-chen",
  "City Administrator James Okonkwo": "demo-admin-okonkwo",
  "Finance Director Linda Vasquez": "demo-finance-vasquez",
  "City Clerk Priya Nair": "demo-clerk-nair",
  "Public Works Director Bob Kowalski": "demo-works-kowalski",
  "Police Chief Michael Torres": "demo-police-torres",
  "Marcus Webb": "demo-council-webb",
  "Tom Harrington": "demo-council-harrington",
  "Council Member Rivera": "demo-council-rivera",
  "Officer K. Thompson": "demo-officer-thompson",
};

interface Props {
  path: string;
  children: ReactNode;
}

// ─── MFA Modal ────────────────────────────────────────────────────────────────
function MfaModal({
  actorName,
  routePath,
  onVerified,
  onCancel,
}: {
  actorName: string;
  routePath: string;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [enrollMode, setEnrollMode] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [enrollVerifying, setEnrollVerifying] = useState(false);
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollError, setEnrollError] = useState("");

  const openId = STAFF_OPEN_ID_MAP[actorName] ?? `demo-${actorName.toLowerCase().replace(/\s+/g, "-")}`;
  const isMfaDisabled = MFA_DISABLED_STAFF.has(actorName);

  const routeLabel = routePath === "/secure" ? "SCIF / Secure Modules"
    : routePath === "/le-hub" ? "Law Enforcement Hub"
    : "Admin RBAC Panel";

  // tRPC mutations
  const verifyCodeMutation = trpc.mfa.verifyCode.useMutation();
  const generateSecretMutation = trpc.mfa.generateSecret.useMutation();
  const verifyAndEnrollMutation = trpc.mfa.verifyAndEnroll.useMutation();

  // Start enrollment — generate a secret and get the otpauth URI
  const handleStartEnroll = useCallback(async () => {
    setEnrollMode(true);
    try {
      const result = await generateSecretMutation.mutateAsync({
        openId,
        accountName: actorName,
      });
      setQrUri(result.otpauthUrl);
      setEnrollSecret(result.secret);
    } catch (err) {
      setEnrollError("Failed to generate MFA secret. Please try again.");
    }
  }, [openId, actorName, generateSecretMutation]);

  // Verify enrollment code
  const handleEnrollVerify = useCallback(async () => {
    if (!enrollSecret) return;
    setEnrollVerifying(true);
    setEnrollError("");
    try {
      const result = await verifyAndEnrollMutation.mutateAsync({ openId, code: enrollCode });
      if (result.success) {
        setEnrollMode(false);
        setEnrollCode("");
      } else {
        setEnrollError(result.error ?? "Invalid code. Please try again.");
      }
    } catch {
      setEnrollError("Verification failed. Please try again.");
    } finally {
      setEnrollVerifying(false);
    }
  }, [openId, enrollCode, enrollSecret, verifyAndEnrollMutation]);

  // Verify the TOTP code against the server
  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;
    setError("");
    try {
      const result = await verifyCodeMutation.mutateAsync({ openId, code });
      if (result.success) {
        setVerified(true);
        setTimeout(onVerified, 800);
      } else {
        setError(result.error ?? "Invalid code. Please try again.");
      }
    } catch {
      setError("Verification failed. Please check your connection and try again.");
    }
  }, [code, openId, onVerified, verifyCodeMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleVerify();
    if (e.key === "Escape") onCancel();
  };

  const isVerifying = verifyCodeMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "oklch(0.08 0.015 250 / 85%)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-xl p-6"
        style={{
          background: "oklch(0.14 0.015 250)",
          border: "1px solid oklch(0.62 0.22 25 / 40%)",
          boxShadow: "0 0 40px oklch(0.62 0.22 25 / 20%)",
        }}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: "oklch(0.70 0.008 250)" }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.62 0.22 25 / 15%)", border: "1px solid oklch(0.62 0.22 25 / 30%)" }}
          >
            <Lock className="w-5 h-5" style={{ color: "oklch(0.72 0.20 25)" }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "oklch(0.94 0.006 240)" }}>
              MFA Verification Required
            </div>
            <div className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.008 250)" }}>
              {routeLabel}
            </div>
          </div>
        </div>

        {/* Warning for MFA-disabled accounts */}
        {isMfaDisabled && !enrollMode && (
          <div
            className="mb-4 p-3 rounded-lg flex items-start gap-2"
            style={{ background: "oklch(0.55 0.18 75 / 12%)", border: "1px solid oklch(0.55 0.18 75 / 25%)" }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.72 0.18 75)" }} />
            <div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.80 0.15 75)" }}>
                MFA Not Enrolled
              </div>
              <div className="text-[11px] leading-relaxed" style={{ color: "oklch(0.62 0.010 250)" }}>
                Your account ({actorName}) does not have MFA enabled. Access to this module requires
                two-factor authentication.{" "}
                <button
                  onClick={handleStartEnroll}
                  className="underline"
                  style={{ color: "oklch(0.72 0.18 75)" }}
                >
                  Enroll now
                </button>{" "}
                or contact IT (Priya Nair) to enable MFA on your account.
              </div>
            </div>
          </div>
        )}

        {enrollMode ? (
          /* Enroll MFA flow */
          <div className="space-y-4">
            <div className="text-xs" style={{ color: "oklch(0.65 0.008 250)" }}>
              Scan the QR code below with your authenticator app (Google Authenticator,
              Authy, or Microsoft Authenticator), then enter the 6-digit code to confirm enrollment.
            </div>

            {/* QR code area */}
            <div
              className="mx-auto w-36 h-36 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(1 0 0 / 8%)", border: "1px solid oklch(1 0 0 / 15%)" }}
            >
              {generateSecretMutation.isPending ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.20 240)" }} />
              ) : qrUri ? (
                <div className="text-center p-2">
                  <QrCode className="w-8 h-8 mx-auto mb-1" style={{ color: "oklch(0.55 0.20 240)" }} />
                  <div className="text-[8px] font-mono break-all leading-tight" style={{ color: "oklch(0.50 0.010 250)" }}>
                    {enrollSecret?.slice(0, 16)}…
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <KeyRound className="w-8 h-8 mx-auto mb-1" style={{ color: "oklch(0.55 0.20 240)" }} />
                  <div className="text-[9px] font-mono" style={{ color: "oklch(0.50 0.010 250)" }}>
                    Loading…
                  </div>
                </div>
              )}
            </div>

            {/* Manual entry secret */}
            {enrollSecret && (
              <div className="text-[10px] font-mono text-center p-2 rounded break-all" style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.15 240)" }}>
                {enrollSecret}
              </div>
            )}

            {/* Enrollment verification input */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium" style={{ color: "oklch(0.60 0.010 250)" }}>
                Confirm with 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={enrollCode}
                onChange={e => { setEnrollCode(e.target.value.replace(/\D/g, "")); setEnrollError(""); }}
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-center text-xl font-mono tracking-[0.5em] outline-none"
                style={{
                  background: "oklch(1 0 0 / 6%)",
                  border: `1px solid ${enrollError ? "oklch(0.62 0.22 25 / 60%)" : "oklch(1 0 0 / 15%)"}`,
                  color: "oklch(0.94 0.006 240)",
                }}
              />
              {enrollError && (
                <div className="text-[11px]" style={{ color: "oklch(0.72 0.20 25)" }}>{enrollError}</div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setEnrollMode(false); setEnrollCode(""); setEnrollError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.008 250)", border: "1px solid oklch(1 0 0 / 12%)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollVerify}
                disabled={enrollCode.length !== 6 || enrollVerifying}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "oklch(0.50 0.20 240)", color: "oklch(0.98 0.005 240)" }}
              >
                {enrollVerifying && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm Enrollment
              </button>
            </div>
          </div>
        ) : verified ? (
          /* Success state */
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: "oklch(0.55 0.20 145)" }} />
            <div className="text-sm font-semibold" style={{ color: "oklch(0.80 0.12 145)" }}>
              Identity Verified
            </div>
            <div className="text-xs mt-1" style={{ color: "oklch(0.55 0.008 250)" }}>
              Granting access to {routeLabel}…
            </div>
          </div>
        ) : (
          /* Code entry */
          <div className="space-y-4">
            <div className="text-xs" style={{ color: "oklch(0.65 0.008 250)" }}>
              Enter the 6-digit code from your authenticator app to access{" "}
              <strong style={{ color: "oklch(0.80 0.12 25)" }}>{routeLabel}</strong>.
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium" style={{ color: "oklch(0.60 0.010 250)" }}>
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-center text-xl font-mono tracking-[0.5em] outline-none"
                style={{
                  background: "oklch(1 0 0 / 6%)",
                  border: `1px solid ${error ? "oklch(0.62 0.22 25 / 60%)" : "oklch(1 0 0 / 15%)"}`,
                  color: "oklch(0.94 0.006 240)",
                }}
              />
              {error && (
                <div className="text-[11px]" style={{ color: "oklch(0.72 0.20 25)" }}>
                  {error}
                </div>
              )}
            </div>

            <div className="text-[10px]" style={{ color: "oklch(0.45 0.008 250)" }}>
              Demo: staff without an enrolled TOTP secret accept any valid 6-digit code.
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.008 250)", border: "1px solid oklch(1 0 0 / 12%)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={code.length !== 6 || isVerifying}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "oklch(0.50 0.20 240)", color: "oklch(0.98 0.005 240)" }}
              >
                {isVerifying && <Loader2 className="w-3 h-3 animate-spin" />}
                Verify
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
          <Shield className="w-3 h-3" style={{ color: "oklch(0.45 0.010 250)" }} />
          <span className="text-[10px]" style={{ color: "oklch(0.40 0.010 250)" }}>
            Iowa Code § 22.7 — Confidential records. Unauthorized access is a Class D felony.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── RouteGuard ───────────────────────────────────────────────────────────────
export default function RouteGuard({ path, children }: Props) {
  const { canAccessRoute, appendAudit, roleName, actorName } = useAuth();
  const [, navigate] = useLocation();
  const allowed = canAccessRoute(path);

  // MFA state: null = not needed, false = pending, true = passed
  const needsMfa = MFA_REQUIRED_ROUTES.has(path);
  const [mfaPassed, setMfaPassed] = useState<boolean>(!needsMfa);

  // Reset MFA state when path changes
  useEffect(() => {
    setMfaPassed(!needsMfa);
  }, [path, needsMfa]);

  // RBAC redirect
  useEffect(() => {
    if (!allowed) {
      const moduleId = ROUTE_MODULE_MAP[path] ?? path;
      appendAudit({
        action: "ACCESS_DENIED",
        target: `Route: ${path} (module: ${moduleId})`,
        category: "access",
        severity: "warning",
        detail: `${actorName} (${roleName}) attempted to access '${path}' without the required '${moduleId}' permission.`,
      });
      navigate("/access-denied");
    }
  }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!allowed) return null;

  // Show MFA gate for high-security routes
  if (!mfaPassed) {
    return (
      <MfaModal
        actorName={actorName}
        routePath={path}
        onVerified={() => {
          setMfaPassed(true);
          appendAudit({
            action: "MFA_VERIFIED",
            target: `Route: ${path}`,
            category: "auth",
            severity: "info",
            detail: `${actorName} (${roleName}) passed server-side TOTP verification to access '${path}'.`,
          });
        }}
        onCancel={() => navigate("/dashboard")}
      />
    );
  }

  return <>{children}</>;
}
