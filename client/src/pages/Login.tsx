// DOGE Spatial Explorer — Login Page
// Uses Manus OAuth for authentication

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) navigate("/app");
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.08 0.025 255)" }}>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "oklch(0.08 0.025 255)" }}
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url(https://d2xsxph8kpxj0f.cloudfront.net/116029439/69mnn7kDrambwunF6LqmC3/hero-login-bg-ViXMPsJa9bkiBj9vYaauTv.webp)",
        }}
        aria-hidden="true"
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, oklch(0.20 0.08 258 / 30%) 0%, oklch(0.08 0.025 255 / 80%) 70%)",
        }}
        aria-hidden="true"
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div
          className="rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{
            background: "oklch(0.12 0.028 255 / 85%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">DOGE Spatial Explorer</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Intelligence Command Center</p>
          </div>

          <div className="mb-6 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-xs text-primary font-mono">
              Secure authentication via Manus OAuth
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            <LogIn className="w-4 h-4" />
            Sign In with Manus
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
          Secure access · WCAG 2.2 compliant
        </p>
      </div>
    </div>
  );
}
