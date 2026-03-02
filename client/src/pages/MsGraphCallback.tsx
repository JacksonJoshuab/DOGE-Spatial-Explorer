/**
 * MsGraphCallback — handles the OAuth2 PKCE redirect from Microsoft
 * Mounted at /ms-graph/callback
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { handleMsCallback } from "@/lib/msGraph";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function MsGraphCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errParam = params.get("error");
    const errDesc = params.get("error_description");

    if (errParam) {
      setError(errDesc ?? errParam);
      setStatus("error");
      return;
    }

    if (!code || !state) {
      setError("Missing authorization code or state parameter.");
      setStatus("error");
      return;
    }

    handleMsCallback(code, state)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/ms-graph"), 1500);
      })
      .catch((err: Error) => {
        setError(err.message);
        setStatus("error");
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.003 240)" }}>
      <div className="p-8 rounded-2xl text-center space-y-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)", maxWidth: 400 }}>
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: "oklch(0.40 0.18 240)" }} />
            <p className="text-sm font-medium" style={{ color: "oklch(0.30 0.012 250)" }}>Completing Microsoft sign-in…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: "oklch(0.45 0.18 145)" }} />
            <p className="text-sm font-semibold" style={{ color: "oklch(0.30 0.012 250)" }}>Microsoft account connected!</p>
            <p className="text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>Redirecting to Graph Explorer…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 mx-auto" style={{ color: "oklch(0.50 0.22 25)" }} />
            <p className="text-sm font-semibold" style={{ color: "oklch(0.30 0.012 250)" }}>Authentication failed</p>
            <p className="text-xs px-2" style={{ color: "oklch(0.52 0.010 250)" }}>{error}</p>
            <button
              onClick={() => navigate("/ms-graph")}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "oklch(0.45 0.20 240)", color: "oklch(1 0 0)" }}
            >
              Back to Graph Explorer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
