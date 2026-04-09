/* 
 * DOGE-LANDSCAPER App.tsx
 * Design: Spatial Glass Command Deck — dark theme, Iowa Gold + Prairie Green accents
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// ── Hard-refresh notice ───────────────────────────────────────────────────────
// Shows once per session when the app is running as a PWA (standalone mode) or
// when the service worker has a waiting update. Helps iOS Safari users who see
// stale content from the PWA cache.
function HardRefreshNotice() {
  useEffect(() => {
    // Only show if we haven't shown this session
    const SESSION_KEY = "doge-refresh-notice-shown";
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    // Check if running as installed PWA (standalone / fullscreen)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    // Listen for SW update available
    const handleSWUpdate = () => {
      toast.info("🔄 Update available", {
        description: "Hold-reload (iOS) or Ctrl+Shift+R to get the latest version.",
        duration: 8000,
        action: {
          label: "Reload",
          onClick: () => window.location.reload(),
        },
      });
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg.waiting) {
          handleSWUpdate();
          return;
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleSWUpdate();
            }
          });
        });
      }).catch(() => {/* SW not available — ignore */});
    }

    // On first PWA launch, show a brief "offline-ready" confirmation
    if (isStandalone) {
      setTimeout(() => {
        toast.success("📡 Offline ready", {
          description: "DOGE-Landscaper is cached for field use without cell coverage.",
          duration: 5000,
        });
      }, 2000);
    }
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'oklch(0.12 0.015 260 / 0.92)',
                backdropFilter: 'blur(24px)',
                border: '1px solid oklch(1 0 0 / 0.15)',
                color: 'oklch(0.96 0.005 260)',
              }
            }}
          />
          <HardRefreshNotice />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
