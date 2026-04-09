import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ── Service Worker: offline GLB caching ──────────────────────────────────────
// Registers sw.js which caches the 23MB LiDAR scan after first load.
// On subsequent visits (including offline field use) the scan loads instantly.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered, scope:", reg.scope);
        // Listen for updates — new SW available after a deploy
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available — tell the SW to skip waiting
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch((err) => {
        // SW registration failed — app still works, just no offline cache
        console.warn("[SW] Registration failed:", err);
      });
  });
}
