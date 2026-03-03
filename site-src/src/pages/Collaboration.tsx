import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, PhoneCall, PhoneOff,
  Users, Shield, Lock, Wifi, Activity, Share2, Copy,
  MessageSquare, Send, Eye, Sparkles, Volume2, VolumeX,
  Monitor, Smartphone, Headphones, Globe, Zap, Check,
  Plus, X, ChevronRight, Clock, Star, Settings,
  Hand, Pointer, Edit3, Layers, Camera, Radio
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  platform: "visionOS" | "metaQuest" | "iPadOS" | "tvOS" | "blender" | "web";
  status: "active" | "idle" | "away";
  isMuted: boolean;
  isVideoOff: boolean;
  isHost: boolean;
  color: string;
  action?: string;
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  time: string;
  type: "text" | "action" | "system";
}

const PLATFORM_ICONS: Record<string, string> = {
  visionOS: "👓", metaQuest: "🥽", iPadOS: "📱", tvOS: "📺", blender: "🔷", web: "🌐"
};
const PLATFORM_COLORS: Record<string, string> = {
  visionOS: "#4A90D9", metaQuest: "#8B5CF6", iPadOS: "#10B981", tvOS: "#F59E0B", blender: "#EC4899", web: "#06B6D4"
};

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "You", platform: "web", status: "active", isMuted: false, isVideoOff: false, isHost: true, color: "#4A90D9", action: "Editing Z-Pinch Column" },
  { id: "p2", name: "Alex Chen", platform: "visionOS", status: "active", isMuted: false, isVideoOff: false, isHost: false, color: "#8B5CF6", action: "Viewing plasma rings" },
  { id: "p3", name: "Sam Rivera", platform: "metaQuest", status: "active", isMuted: true, isVideoOff: false, isHost: false, color: "#EC4899", action: "Moving sensor array" },
  { id: "p4", name: "Taylor Kim", platform: "iPadOS", status: "idle", isMuted: false, isVideoOff: true, isHost: false, color: "#10B981", action: "Reviewing scene" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "m1", from: "System", text: "Secure session started · AES-256-GCM · 4 participants", time: "10:15 AM", type: "system" },
  { id: "m2", from: "Alex Chen", text: "The plasma column looks great in Vision Pro passthrough!", time: "10:16 AM", type: "text" },
  { id: "m3", from: "Sam Rivera", text: "Moving the sensor array to the right side", time: "10:17 AM", type: "action" },
  { id: "m4", from: "Taylor Kim", text: "Can we increase the ring density?", time: "10:18 AM", type: "text" },
  { id: "m5", from: "You", text: "On it — adjusting compression rings now", time: "10:19 AM", type: "text" },
];

function ParticipantTile({ participant }: { participant: Participant }) {
  const platformColor = PLATFORM_COLORS[participant.platform];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative aspect-video bg-[#0F0F1E] border border-white/10 rounded-2xl overflow-hidden group"
      style={{ boxShadow: participant.status === "active" ? `0 0 0 1px ${platformColor}30` : "none" }}
    >
      {/* Video placeholder */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 50% 60%, ${platformColor}15 0%, transparent 70%)` }}>
        {participant.isVideoOff ? (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: `${platformColor}20`, border: `2px solid ${platformColor}40` }}>
            {participant.name[0]}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl">{PLATFORM_ICONS[participant.platform]}</div>
          </div>
        )}
      </div>

      {/* Platform badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
        style={{ backgroundColor: `${platformColor}20`, border: `1px solid ${platformColor}30`, color: platformColor }}>
        <span>{PLATFORM_ICONS[participant.platform]}</span>
        <span>{participant.platform}</span>
      </div>

      {/* Host badge */}
      {participant.isHost && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[9px] text-amber-400">HOST</div>
      )}

      {/* Status indicator */}
      <div className={`absolute top-2 ${participant.isHost ? "right-12" : "right-2"} w-2 h-2 rounded-full ${
        participant.status === "active" ? "bg-green-400 animate-pulse" :
        participant.status === "idle" ? "bg-amber-400" : "bg-gray-600"
      }`} />

      {/* Name + action bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white">{participant.name}</p>
            {participant.action && <p className="text-[9px] text-gray-400 truncate">{participant.action}</p>}
          </div>
          <div className="flex items-center gap-1">
            {participant.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
            {participant.isVideoOff && <VideoOff className="w-3 h-3 text-red-400" />}
          </div>
        </div>
      </div>

      {/* Active editing glow */}
      {participant.status === "active" && !participant.isHost && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 1.5px ${platformColor}50` }} />
      )}
    </motion.div>
  );
}

export default function Collaboration() {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInCall, setIsInCall] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: `m${Date.now()}`, from: "You", text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), type: "text"
    }]);
    setNewMessage("");
  };

  return (
    <div className="flex h-full bg-[#08080F] text-white overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Session header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">Live Editing Session</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] text-green-400 font-mono">
            {formatTime(sessionTime)}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400">
            <Lock className="w-2.5 h-2.5" /> E2EE · AES-256-GCM
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors">
              <Copy className="w-3 h-3" /> Copy Link
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors">
              <Share2 className="w-3 h-3" /> Invite
            </button>
          </div>
        </div>

        {/* Participant grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className={`grid gap-3 h-full ${
            participants.length <= 2 ? "grid-cols-2" :
            participants.length <= 4 ? "grid-cols-2" :
            "grid-cols-3"
          }`}>
            {participants.map(p => <ParticipantTile key={p.id} participant={p} />)}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-white/8 bg-[#0A0A16] flex-shrink-0">
          <button onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-2xl transition-colors ${isMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/8 text-gray-300 hover:bg-white/15 border border-white/10"}`}>
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-3 rounded-2xl transition-colors ${isVideoOff ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/8 text-gray-300 hover:bg-white/15 border border-white/10"}`}>
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
          <button className="p-3 rounded-2xl bg-white/8 hover:bg-white/15 text-gray-300 border border-white/10 transition-colors">
            <Volume2 className="w-4 h-4" />
          </button>
          <button className="p-3 rounded-2xl bg-white/8 hover:bg-white/15 text-gray-300 border border-white/10 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="w-px h-8 bg-white/10" />
          <button onClick={() => setIsInCall(!isInCall)}
            className={`px-5 py-3 rounded-2xl font-medium text-sm transition-colors ${isInCall ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
            {isInCall ? <><PhoneOff className="w-4 h-4 inline mr-2" />End Session</> : <><PhoneCall className="w-4 h-4 inline mr-2" />Join Session</>}
          </button>
          <div className="w-px h-8 bg-white/10" />
          <button onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-2xl transition-colors ${showChat ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/8 text-gray-300 hover:bg-white/15 border border-white/10"}`}>
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-l border-white/8 flex flex-col bg-[#0A0A16] overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8">
              <span className="text-xs font-semibold text-gray-300">Session Chat</span>
              <button onClick={() => setShowChat(false)} className="p-1 text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.type === "system" ? (
                    <div className="text-center py-1">
                      <span className="text-[9px] text-gray-600 bg-white/3 px-2 py-0.5 rounded-full">{msg.text}</span>
                    </div>
                  ) : (
                    <div className={`${msg.from === "You" ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                        {msg.from !== "You" && <span className="font-medium text-gray-400">{msg.from}</span>}
                        <span>{msg.time}</span>
                      </div>
                      <div className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-xs ${
                        msg.from === "You"
                          ? "bg-blue-600/40 text-blue-100 border border-blue-500/20"
                          : msg.type === "action"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 italic"
                          : "bg-white/8 text-gray-300 border border-white/8"
                      }`}>
                        {msg.type === "action" && <Edit3 className="w-2.5 h-2.5 inline mr-1" />}
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Message input */}
            <div className="p-3 border-t border-white/8">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Message…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <button onClick={sendMessage} className="p-1.5 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-white transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Security footer */}
            <div className="px-3 pb-3">
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-green-500/5 border border-green-500/15 rounded-lg">
                <Lock className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                <p className="text-[8px] text-green-400/70">Messages are end-to-end encrypted</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
