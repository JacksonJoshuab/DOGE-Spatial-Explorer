/**
 * OSIStackPanel — Civic Intelligence Platform
 * Live OSI/ISO 7-layer communication security status panel
 * with Faraday cage integrity, EM shielding, and encryption readouts.
 * Designed for SCIF and secure facility monitoring.
 */
import { useState, useEffect } from "react";
import { Shield, Wifi, Radio, Lock, Server, Network, Globe, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

interface LayerStatus {
  layer: number;
  name: string;
  protocol: string;
  status: "secure" | "warning" | "alert" | "offline";
  latency?: number;
  detail: string;
  encryption?: string;
  lastChecked: string;
}

const INITIAL_LAYERS: LayerStatus[] = [
  {
    layer: 1,
    name: "Physical",
    protocol: "Fiber / Shielded Cat6A",
    status: "secure",
    detail: "Faraday cage integrity 99.8% — EM shielding nominal",
    lastChecked: "2s ago",
  },
  {
    layer: 2,
    name: "Data Link",
    protocol: "IEEE 802.1AE (MACsec)",
    status: "secure",
    detail: "MACsec GCM-AES-256 active on all switch ports",
    encryption: "GCM-AES-256",
    lastChecked: "2s ago",
  },
  {
    layer: 3,
    name: "Network",
    protocol: "IPsec / IPv4",
    status: "secure",
    detail: "IPsec tunnel active — ESP mode, AES-256-GCM",
    encryption: "AES-256-GCM",
    latency: 0.4,
    lastChecked: "2s ago",
  },
  {
    layer: 4,
    name: "Transport",
    protocol: "TLS 1.3 / DTLS 1.3",
    status: "secure",
    detail: "TLS 1.3 with X25519 key exchange — 0-RTT disabled",
    encryption: "ChaCha20-Poly1305",
    latency: 1.2,
    lastChecked: "2s ago",
  },
  {
    layer: 5,
    name: "Session",
    protocol: "SAML 2.0 / OAuth 2.1",
    status: "warning",
    detail: "Session token expiry in 14 min — re-auth recommended",
    lastChecked: "4s ago",
  },
  {
    layer: 6,
    name: "Presentation",
    protocol: "ASN.1 / X.509 / PKCS",
    status: "secure",
    detail: "Certificate chain valid — ECDSA P-384, expires 2026-08-15",
    encryption: "ECDSA P-384",
    lastChecked: "2s ago",
  },
  {
    layer: 7,
    name: "Application",
    protocol: "HTTPS / HSTS / CSP",
    status: "secure",
    detail: "HSTS enforced, CSP strict-dynamic, SRI checksums verified",
    lastChecked: "2s ago",
  },
];

const FARADAY_SENSORS = [
  { zone: "Evidence Room A", shielding: 98.2, status: "secure" as const, freq: "10 kHz–18 GHz" },
  { zone: "SCIF Zone Alpha", shielding: 99.7, status: "secure" as const, freq: "10 kHz–40 GHz" },
  { zone: "SCIF Zone Bravo", shielding: 97.1, status: "warning" as const, freq: "10 kHz–40 GHz" },
  { zone: "Detention Control", shielding: 95.4, status: "secure" as const, freq: "10 kHz–6 GHz" },
];

const STATUS_CONFIG = {
  secure: { color: "oklch(0.42 0.18 145)", bg: "oklch(0.42 0.18 145 / 12%)", border: "oklch(0.42 0.18 145 / 30%)", label: "SECURE" },
  warning: { color: "oklch(0.72 0.20 85)", bg: "oklch(0.72 0.20 85 / 12%)", border: "oklch(0.72 0.20 85 / 30%)", label: "WARNING" },
  alert: { color: "oklch(0.58 0.22 25)", bg: "oklch(0.58 0.22 25 / 12%)", border: "oklch(0.58 0.22 25 / 30%)", label: "ALERT" },
  offline: { color: "oklch(0.55 0.010 250)", bg: "oklch(0.55 0.010 250 / 12%)", border: "oklch(0.55 0.010 250 / 30%)", label: "OFFLINE" },
};

const LAYER_ICONS = [Radio, Network, Globe, Lock, Activity, Shield, Globe];

function StatusDot({ status }: { status: LayerStatus["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default function OSIStackPanel() {
  const [layers, setLayers] = useState<LayerStatus[]>(INITIAL_LAYERS);
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [faradayPulse, setFaradayPulse] = useState(false);

  // Simulate live updates every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setFaradayPulse(true);
      setTimeout(() => setFaradayPulse(false), 600);

      setLayers(prev => prev.map(layer => {
        // Randomly vary latency for network/transport layers
        if (layer.layer === 3 || layer.layer === 4) {
          const base = layer.layer === 3 ? 0.4 : 1.2;
          return { ...layer, latency: +(base + (Math.random() * 0.6 - 0.3)).toFixed(1), lastChecked: "just now" };
        }
        // Occasionally flip session layer between warning and secure
        if (layer.layer === 5) {
          const r = Math.random();
          return {
            ...layer,
            status: r > 0.7 ? "warning" : "secure",
            detail: r > 0.7
              ? "Session token expiry in 14 min — re-auth recommended"
              : "Session active — SAML assertion valid",
            lastChecked: "just now",
          };
        }
        return { ...layer, lastChecked: "just now" };
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const secureCount = layers.filter(l => l.status === "secure").length;
  const warningCount = layers.filter(l => l.status === "warning").length;
  const alertCount = layers.filter(l => l.status === "alert").length;

  const overallStatus = alertCount > 0 ? "alert" : warningCount > 0 ? "warning" : "secure";
  const overallCfg = STATUS_CONFIG[overallStatus];

  return (
    <div className="space-y-4">
      {/* Overall status bar */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: overallCfg.bg, border: `1px solid ${overallCfg.border}` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: overallCfg.color + "22" }}>
            <Shield className="w-5 h-5" style={{ color: overallCfg.color }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              OSI/ISO Communication Security Stack
            </div>
            <div className="text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>
              {secureCount}/7 layers secure · Last scan: {tick > 0 ? "just now" : "2s ago"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <StatusDot status={overallStatus} />
          <div className="text-[10px] mt-1" style={{ color: "oklch(0.55 0.010 250)" }}>
            {warningCount > 0 ? `${warningCount} warning` : "All systems nominal"}
          </div>
        </div>
      </div>

      {/* Layer stack */}
      <div className="space-y-1.5">
        {[...layers].reverse().map((layer) => {
          const Icon = LAYER_ICONS[layer.layer - 1];
          const cfg = STATUS_CONFIG[layer.status];
          const isExpanded = expanded === layer.layer;

          return (
            <div key={layer.layer}>
              <button
                onClick={() => setExpanded(isExpanded ? null : layer.layer)}
                className="w-full rounded-lg px-3 py-2.5 flex items-center gap-3 transition-all text-left"
                style={{
                  background: isExpanded ? cfg.bg : "oklch(0.975 0.004 240)",
                  border: `1px solid ${isExpanded ? cfg.border : "oklch(0 0 0 / 8%)"}`,
                }}
              >
                {/* Layer number badge */}
                <div
                  className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                >
                  L{layer.layer}
                </div>

                {/* Icon */}
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />

                {/* Name + protocol */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: "oklch(0.22 0.014 250)" }}>
                      {layer.name}
                    </span>
                    <span className="text-[10px] truncate" style={{ color: "oklch(0.55 0.010 250)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {layer.protocol}
                    </span>
                  </div>
                </div>

                {/* Latency */}
                {layer.latency !== undefined && (
                  <span className="text-[10px] font-mono hidden sm:block" style={{ color: "oklch(0.55 0.010 250)" }}>
                    {layer.latency}ms
                  </span>
                )}

                {/* Status badge */}
                <StatusDot status={layer.status} />
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div
                  className="mx-1 rounded-b-lg px-4 py-3 space-y-2"
                  style={{ background: cfg.bg, borderLeft: `1px solid ${cfg.border}`, borderRight: `1px solid ${cfg.border}`, borderBottom: `1px solid ${cfg.border}` }}
                >
                  <div className="text-[12px]" style={{ color: "oklch(0.35 0.014 250)" }}>{layer.detail}</div>
                  <div className="flex flex-wrap gap-3">
                    {layer.encryption && (
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3" style={{ color: cfg.color }} />
                        <span className="text-[10px] font-mono" style={{ color: "oklch(0.45 0.010 250)" }}>{layer.encryption}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" style={{ color: "oklch(0.55 0.010 250)" }} />
                      <span className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>Checked: {layer.lastChecked}</span>
                    </div>
                    {layer.latency !== undefined && (
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" style={{ color: "oklch(0.55 0.010 250)" }} />
                        <span className="text-[10px] font-mono" style={{ color: "oklch(0.55 0.010 250)" }}>{layer.latency}ms RTT</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Faraday cage integrity panel */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 10%)" }}>
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: "oklch(0.18 0.018 250)" }}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
            <span className="text-[12px] font-semibold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Faraday Cage / EM Shielding
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${faradayPulse ? "animate-ping" : ""}`}
              style={{ background: "oklch(0.42 0.18 145)" }}
            />
            <span className="text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>LIVE MONITOR</span>
          </div>
        </div>
        <div className="divide-y" style={{ background: "oklch(0.12 0.018 250)", borderColor: "oklch(1 0 0 / 8%)" }}>
          {FARADAY_SENSORS.map(sensor => {
            const pct = sensor.shielding;
            const barColor = pct >= 98 ? "oklch(0.42 0.18 145)" : pct >= 95 ? "oklch(0.72 0.20 85)" : "oklch(0.58 0.22 25)";
            const statusIcon = pct >= 95 ? CheckCircle2 : AlertTriangle;
            const StatusIcon = statusIcon;
            return (
              <div key={sensor.zone} className="px-4 py-2.5 flex items-center gap-3">
                <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: barColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white">{sensor.zone}</span>
                    <span className="text-[10px] font-mono" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "oklch(1 0 0 / 10%)" }}>
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.50 0.010 250)" }}>
                    Freq range: {sensor.freq}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ISO 27001 compliance badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "ISO 27001:2022", status: "Certified" },
          { label: "NIST SP 800-53", status: "Compliant" },
          { label: "CJIS Security Policy", status: "Active" },
          { label: "FIPS 140-3", status: "Level 2" },
        ].map(badge => (
          <div
            key={badge.label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "oklch(0.42 0.18 145 / 10%)", border: "1px solid oklch(0.42 0.18 145 / 25%)" }}
          >
            <CheckCircle2 className="w-3 h-3" style={{ color: "oklch(0.42 0.18 145)" }} />
            <span className="text-[10px] font-semibold" style={{ color: "oklch(0.35 0.014 250)" }}>{badge.label}</span>
            <span className="text-[9px] px-1 rounded" style={{ background: "oklch(0.42 0.18 145)", color: "white" }}>{badge.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
