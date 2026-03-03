/**
 * SpatialCollaboration — /spatial-collab
 * FaceTime-style live collaboration dashboard for spatial editing sessions.
 * Shows active sessions, participant video feeds, shared spatial canvas,
 * and real-time editing operations across all connected platforms.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Monitor,
  Share2, MessageSquare, Hand, Shield, Lock, Unlock, Eye, EyeOff,
  Maximize2, Minimize2, Grid3X3, Layers, Activity, Wifi,
  Camera, Headphones, Smartphone, Box, Globe, Cloud,
  ChevronRight, Plus, Settings, Sparkles, Zap, Radio,
  Check, X, AlertTriangle, Send, Volume2, VolumeX
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Participant {
  id: string;
  name: string;
  platform: "visionOS" | "metaQuest" | "blender" | "web" | "iPadOS" | "tvOS";
  role: "host" | "editor" | "viewer";
  isMuted: boolean;
  isVideoOn: boolean;
  isSpatialAudioOn: boolean;
  isHandRaised: boolean;
  color: string;
  editingNode?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  type: "text" | "system" | "spatial-pin";
}

interface Session {
  id: string;
  name: string;
  host: string;
  participants: number;
  maxParticipants: number;
  privacy: "private" | "team" | "org";
  status: "live" | "paused" | "ended";
  createdAt: string;
  encryption: "E2EE" | "TLS";
}

/* ─── Demo Data ────────────────────────────────────────────────────────────── */

const PARTICIPANTS: Participant[] = [
  { id: "p1", name: "You (Web)", platform: "web", role: "host", isMuted: false, isVideoOn: true, isSpatialAudioOn: true, isHandRaised: false, color: "#4A90D9" },
  { id: "p2", name: "Alex (Vision Pro)", platform: "visionOS", role: "editor", isMuted: false, isVideoOn: true, isSpatialAudioOn: true, isHandRaised: false, color: "#E74C3C", editingNode: "Plasma Column" },
  { id: "p3", name: "Jordan (Quest 3)", platform: "metaQuest", role: "editor", isMuted: true, isVideoOn: false, isSpatialAudioOn: true, isHandRaised: false, color: "#2ECC71", editingNode: "Sensor Array" },
  { id: "p4", name: "Sam (Blender)", platform: "blender", role: "editor", isMuted: false, isVideoOn: true, isSpatialAudioOn: false, isHandRaised: true, color: "#F39C12" },
  { id: "p5", name: "Taylor (iPad)", platform: "iPadOS", role: "viewer", isMuted: true, isVideoOn: false, isSpatialAudioOn: false, isHandRaised: false, color: "#9B59B6" },
];

const CHAT_MESSAGES: ChatMessage[] = [
  { id: "m1", sender: "System", text: "Session started — E2E encryption active", timestamp: "10:00 AM", type: "system" },
  { id: "m2", sender: "Alex", text: "I've adjusted the plasma column instabilities — check the pinch nodes", timestamp: "10:02 AM", type: "text" },
  { id: "m3", sender: "Jordan", text: "Sensor array B is showing drift. Recalibrating in spatial view.", timestamp: "10:04 AM", type: "text" },
  { id: "m4", sender: "Sam", text: "📌 Pinned spatial note at [0, 2.5, 0] — \"Review toroidal geometry\"", timestamp: "10:05 AM", type: "spatial-pin" },
  { id: "m5", sender: "System", text: "Taylor (iPad) joined as viewer", timestamp: "10:06 AM", type: "system" },
  { id: "m6", sender: "Alex", text: "Can everyone see the volumetric update? Rendering at 60fps on Vision Pro", timestamp: "10:08 AM", type: "text" },
];

const ACTIVE_SESSIONS: Session[] = [
  { id: "s1", name: "Z-Pinch Plasma Simulation", host: "You", participants: 5, maxParticipants: 12, privacy: "team", status: "live", createdAt: "10:00 AM", encryption: "E2EE" },
  { id: "s2", name: "City Hall 3D Scan Review", host: "Morgan", participants: 3, maxParticipants: 8, privacy: "org", status: "live", createdAt: "9:30 AM", encryption: "E2EE" },
  { id: "s3", name: "IoT Sensor Placement", host: "Casey", participants: 2, maxParticipants: 6, privacy: "private", status: "paused", createdAt: "Yesterday", encryption: "TLS" },
];

/* ─── Helper Components ────────────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; bg: string }> = {
    visionOS: { icon: <Eye size={10} />, label: "Vision Pro", bg: "rgba(74,144,217,0.15)" },
    metaQuest: { icon: <Headphones size={10} />, label: "Quest 3", bg: "rgba(0,188,212,0.15)" },
    blender: { icon: <Box size={10} />, label: "Blender", bg: "rgba(243,156,18,0.15)" },
    web: { icon: <Globe size={10} />, label: "Web", bg: "rgba(107,114,128,0.15)" },
    iPadOS: { icon: <Smartphone size={10} />, label: "iPad", bg: "rgba(155,89,182,0.15)" },
    tvOS: { icon: <Monitor size={10} />, label: "Apple TV", bg: "rgba(99,102,241,0.15)" },
  };
  const c = config[platform] || config.web;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 10, background: c.bg, fontSize: 9, fontWeight: 600 }}>
      {c.icon} {c.label}
    </span>
  );
}

function VideoTile({ participant, isLarge = false }: { participant: Participant; isLarge?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = isLarge ? 640 : 240;
    canvas.height = isLarge ? 360 : 135;

    // Simulated video feed with noise pattern
    const draw = () => {
      if (!participant.isVideoOn) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = participant.color;
        ctx.font = `bold ${isLarge ? 48 : 24}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(participant.name.charAt(0), canvas.width / 2, canvas.height / 2);
        return;
      }

      // Animated gradient simulating video
      const t = Date.now() / 3000;
      const grad = ctx.createLinearGradient(
        canvas.width / 2 + Math.sin(t) * 100, 0,
        canvas.width / 2 + Math.cos(t) * 100, canvas.height
      );
      grad.addColorStop(0, participant.color + "40");
      grad.addColorStop(0.5, "#1a1a2e");
      grad.addColorStop(1, participant.color + "20");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle noise
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imgData.data.length; i += 16) {
        const noise = (Math.random() - 0.5) * 10;
        imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
        imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
        imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // Avatar overlay
      ctx.fillStyle = participant.color;
      ctx.font = `bold ${isLarge ? 36 : 18}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.3;
      ctx.fillText(participant.name.charAt(0), canvas.width / 2, canvas.height / 2);
      ctx.globalAlpha = 1;
    };

    draw();
    const iv = setInterval(draw, 200);
    return () => clearInterval(iv);
  }, [participant, isLarge]);

  return (
    <div style={{
      position: "relative", borderRadius: 8, overflow: "hidden",
      border: participant.editingNode ? `2px solid ${participant.color}` : "2px solid rgba(255,255,255,0.05)",
      background: "#1a1a2e",
    }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Name overlay */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", flex: 1 }}>{participant.name}</span>
        {participant.isMuted && <MicOff size={12} color="#ef4444" />}
        {participant.isHandRaised && <Hand size={12} color="#f59e0b" />}
      </div>

      {/* Platform badge */}
      <div style={{ position: "absolute", top: 4, left: 4 }}>
        <PlatformBadge platform={participant.platform} />
      </div>

      {/* Editing indicator */}
      {participant.editingNode && (
        <div style={{
          position: "absolute", top: 4, right: 4, padding: "2px 6px",
          borderRadius: 4, background: participant.color + "CC", fontSize: 9, fontWeight: 600, color: "#fff",
        }}>
          Editing: {participant.editingNode}
        </div>
      )}

      {/* Role badge */}
      <div style={{
        position: "absolute", bottom: 4, right: 4, padding: "1px 5px",
        borderRadius: 3, background: "rgba(0,0,0,0.5)", fontSize: 8, fontWeight: 700,
        color: participant.role === "host" ? "#f59e0b" : participant.role === "editor" ? "#22c55e" : "#94a3b8",
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>
        {participant.role}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function SpatialCollaboration() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [activeSession, setActiveSession] = useState<string>("s1");
  const [viewMode, setViewMode] = useState<"grid" | "speaker" | "spatial">("grid");

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: "You",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  return (
    <DashboardLayout title="Spatial Collaboration">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>

        {/* ── Top Bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "8px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.02)",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Z-Pinch Plasma Simulation</span>
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", fontFamily: "monospace" }}>LIVE</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            {/* View mode toggle */}
            {(["grid", "speaker", "spatial"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)",
                background: viewMode === mode ? "rgba(74,144,217,0.15)" : "transparent",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                color: viewMode === mode ? "#4A90D9" : "rgba(0,0,0,0.5)",
                textTransform: "capitalize",
              }}>
                {mode}
              </button>
            ))}

            <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.1)", margin: "0 4px" }} />

            {/* Security badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: "rgba(34,197,94,0.1)", color: "#16a34a",
              border: "1px solid rgba(34,197,94,0.2)",
            }}>
              <Lock size={12} /> E2EE Active
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: "rgba(74,144,217,0.1)", color: "#4A90D9",
            }}>
              <Users size={12} /> {PARTICIPANTS.length} / 12
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Session List (left sidebar) */}
          <div style={{
            width: 220, borderRight: "1px solid rgba(0,0,0,0.1)", overflow: "auto",
            background: "rgba(0,0,0,0.02)", flexShrink: 0, padding: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(0,0,0,0.3)", padding: "4px 8px" }}>
              Active Sessions
            </div>
            {ACTIVE_SESSIONS.map(session => (
              <div key={session.id} onClick={() => setActiveSession(session.id)} style={{
                padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer",
                background: activeSession === session.id ? "rgba(74,144,217,0.08)" : "transparent",
                border: activeSession === session.id ? "1px solid rgba(74,144,217,0.15)" : "1px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: session.status === "live" ? "#22c55e" : session.status === "paused" ? "#f59e0b" : "#6b7280",
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 10, color: "rgba(0,0,0,0.4)" }}>
                  <span><Users size={10} /> {session.participants}/{session.maxParticipants}</span>
                  <span><Lock size={10} /> {session.encryption}</span>
                </div>
              </div>
            ))}

            <button style={{
              width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed rgba(0,0,0,0.15)",
              background: "transparent", fontSize: 12, cursor: "pointer", marginTop: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "rgba(0,0,0,0.4)",
            }}>
              <Plus size={14} /> New Session
            </button>

            {/* Participants */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(0,0,0,0.3)", padding: "4px 8px" }}>
                Participants
              </div>
              {PARTICIPANTS.map(p => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: p.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>{p.name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  </div>
                  {p.isMuted && <MicOff size={10} color="#ef4444" />}
                  {p.isHandRaised && <Hand size={10} color="#f59e0b" />}
                </div>
              ))}
            </div>
          </div>

          {/* Video Grid */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#111827" }}>
            <div style={{
              flex: 1, padding: 8, display: "grid",
              gridTemplateColumns: viewMode === "speaker" ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 8, overflow: "auto",
            }}>
              {PARTICIPANTS.map((p, i) => (
                <VideoTile key={p.id} participant={p} isLarge={viewMode === "speaker" && i === 0} />
              ))}
            </div>

            {/* Call Controls */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 16px", background: "rgba(0,0,0,0.3)",
            }}>
              <button onClick={() => setIsMuted(!isMuted)} style={{
                width: 40, height: 40, borderRadius: "50%", border: "none",
                background: isMuted ? "#ef4444" : "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={() => setIsVideoOn(!isVideoOn)} style={{
                width: 40, height: 40, borderRadius: "50%", border: "none",
                background: !isVideoOn ? "#ef4444" : "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
              <button onClick={() => setIsScreenSharing(!isScreenSharing)} style={{
                width: 40, height: 40, borderRadius: "50%", border: "none",
                background: isScreenSharing ? "#4A90D9" : "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Monitor size={18} />
              </button>
              <button style={{
                width: 40, height: 40, borderRadius: "50%", border: "none",
                background: "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Volume2 size={18} />
              </button>
              <button onClick={() => setShowChat(!showChat)} style={{
                width: 40, height: 40, borderRadius: "50%", border: "none",
                background: showChat ? "#4A90D9" : "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageSquare size={18} />
              </button>
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)", margin: "0 8px" }} />
              <button onClick={() => toast.error("Session ended")} style={{
                width: 48, height: 40, borderRadius: 20, border: "none",
                background: "#ef4444", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PhoneOff size={18} />
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div style={{
              width: 280, borderLeft: "1px solid rgba(0,0,0,0.1)", display: "flex",
              flexDirection: "column", background: "rgba(0,0,0,0.02)", flexShrink: 0,
            }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.1)", fontSize: 13, fontWeight: 700 }}>
                Chat
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ marginBottom: 8 }}>
                    {msg.type === "system" ? (
                      <div style={{
                        fontSize: 10, color: "rgba(0,0,0,0.4)", textAlign: "center",
                        padding: "4px 8px", background: "rgba(0,0,0,0.03)", borderRadius: 4,
                      }}>
                        {msg.text}
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{msg.sender}</span>
                          <span style={{ fontSize: 9, color: "rgba(0,0,0,0.3)" }}>{msg.timestamp}</span>
                        </div>
                        <div style={{
                          fontSize: 12, marginTop: 2, padding: "4px 8px", borderRadius: 6,
                          background: msg.type === "spatial-pin" ? "rgba(243,156,18,0.1)" : "rgba(0,0,0,0.03)",
                          border: msg.type === "spatial-pin" ? "1px solid rgba(243,156,18,0.2)" : "none",
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: 8, borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", gap: 4 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: "6px 10px", borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.15)", fontSize: 12,
                  }}
                />
                <button onClick={handleSendMessage} style={{
                  padding: "6px 10px", borderRadius: 6, border: "none",
                  background: "#4A90D9", color: "#fff", cursor: "pointer",
                }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </DashboardLayout>
  );
}
