import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Pin, MapPin, Mic, MicOff, Video, VideoOff, Lock, Plus, Smile, Paperclip } from "lucide-react";

const PARTICIPANTS = [
  { id: "1", name: "Vision Pro",  avatar: "👓", color: "#4A90D9", platform: "visionOS", online: true },
  { id: "2", name: "Quest 3",     avatar: "🥽", color: "#00B4D8", platform: "Meta",     online: true },
  { id: "3", name: "Blender",     avatar: "🔷", color: "#E87D0D", platform: "Desktop",  online: true },
  { id: "4", name: "iPad Pro",    avatar: "📱", color: "#4CAF50", platform: "iPadOS",   online: true },
  { id: "5", name: "Apple TV",    avatar: "📺", color: "#888",    platform: "tvOS",     online: false },
];

const CHANNELS = [
  { id: "general",    label: "# general",           unread: 0 },
  { id: "scene",      label: "# scene-edits",       unread: 3 },
  { id: "render",     label: "# render-queue",      unread: 1 },
  { id: "physics",    label: "# physics-sim",       unread: 0 },
  { id: "ai",         label: "# ai-generation",     unread: 2 },
  { id: "private",    label: "🔒 secure-channel",   unread: 0 },
];

interface Message {
  id: string;
  author: string;
  avatar: string;
  color: string;
  text: string;
  time: string;
  pinned?: boolean;
  spatialPin?: { x: number; y: number; z: number };
  type: "text" | "system" | "spatial";
  reactions?: { emoji: string; count: number }[];
}

const INITIAL_MESSAGES: Message[] = [
  { id: "1", author: "System",     avatar: "⚙️", color: "#888",    text: "Session started — Z-Pinch Plasma Collaboration v3", time: "10:00", type: "system" },
  { id: "2", author: "Vision Pro", avatar: "👓", color: "#4A90D9", text: "I can see the plasma column clearly in immersive mode. The Z-Pinch effect looks great!", time: "10:02", type: "text", reactions: [{ emoji: "👍", count: 2 }] },
  { id: "3", author: "Blender",    avatar: "🔷", color: "#E87D0D", text: "Adjusting the magnetic field strength to 2.5T. Syncing now...", time: "10:03", type: "text" },
  { id: "4", author: "Quest 3",    avatar: "🥽", color: "#00B4D8", text: "Spatial pin placed at the emission point", time: "10:04", type: "spatial", spatialPin: { x: 0.0, y: 0.5, z: 0.0 } },
  { id: "5", author: "iPad Pro",   avatar: "📱", color: "#4CAF50", text: "Render farm job submitted — ETA 4 minutes for 250 frames", time: "10:05", type: "text", reactions: [{ emoji: "🚀", count: 1 }] },
  { id: "6", author: "Blender",    avatar: "🔷", color: "#E87D0D", text: "Sim speed is 947 Mvox/s — looking good. VRAM at 5.9/9.8 GB", time: "10:06", type: "text" },
  { id: "7", author: "Vision Pro", avatar: "👓", color: "#4A90D9", text: "The volumetric glow needs more intensity around the pinch points. Can you boost emission?", time: "10:07", type: "text", pinned: true },
  { id: "8", author: "System",     avatar: "⚙️", color: "#888",    text: "Scene synced to all 4 devices — CRDT merge complete", time: "10:08", type: "system" },
];

export default function SpatialChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("scene");
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      author: "You",
      avatar: "👤",
      color: "#A78BFA",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };
    setMessages(m => [...m, newMsg]);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="h-full flex bg-[#08080F] text-white overflow-hidden">
      {/* Left — Channels */}
      <div className="w-52 flex-shrink-0 border-r border-white/8 flex flex-col">
        <div className="px-4 py-4 border-b border-white/8">
          <h1 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            Spatial Chat
          </h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Persistent spatial annotations</p>
        </div>

        {/* Channels */}
        <div className="p-3 border-b border-white/8">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Channels</p>
          <div className="space-y-0.5">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  selectedChannel === ch.id ? "bg-violet-500/15 border border-violet-500/25 text-violet-300" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <span>{ch.label}</span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center">{ch.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Participants</p>
          <div className="space-y-1">
            {PARTICIPANTS.map(p => (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="relative">
                  <span className="text-base">{p.avatar}</span>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#08080F] ${p.online ? "bg-green-400" : "bg-gray-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-200 truncate">{p.name}</p>
                  <p className="text-[9px] text-gray-600">{p.platform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center — Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Channel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0A0A14]">
          <div>
            <p className="text-sm font-medium text-white">{CHANNELS.find(c => c.id === selectedChannel)?.label}</p>
            <p className="text-[10px] text-gray-500">{messages.length} messages · E2E encrypted</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/8 border border-green-500/15 rounded-full">
              <Lock className="w-2.5 h-2.5 text-green-400" />
              <span className="text-[9px] text-green-400">E2EE</span>
            </div>
            <button onClick={() => setMicOn(m => !m)} className={`p-1.5 rounded-lg border transition-all ${micOn ? "bg-red-500/15 border-red-500/25 text-red-400" : "bg-white/5 border-white/10 text-gray-400"}`}>
              {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setVideoOn(v => !v)} className={`p-1.5 rounded-lg border transition-all ${videoOn ? "bg-blue-500/15 border-blue-500/25 text-blue-400" : "bg-white/5 border-white/10 text-gray-400"}`}>
              {videoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${msg.type === "system" ? "flex justify-center" : "flex items-start gap-3"}`}
              >
                {msg.type === "system" ? (
                  <span className="text-[10px] text-gray-600 bg-white/3 px-3 py-1 rounded-full border border-white/6">{msg.text}</span>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: `${msg.color}20`, border: `1px solid ${msg.color}40` }}>
                      {msg.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: msg.color }}>{msg.author}</span>
                        <span className="text-[10px] text-gray-600">{msg.time}</span>
                        {msg.pinned && <Pin className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className={`text-xs text-gray-300 leading-relaxed ${msg.type === "spatial" ? "flex items-center gap-2" : ""}`}>
                        {msg.type === "spatial" && <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                        {msg.text}
                        {msg.spatialPin && (
                          <span className="ml-2 text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                            ({msg.spatialPin.x}, {msg.spatialPin.y}, {msg.spatialPin.z})
                          </span>
                        )}
                      </div>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {msg.reactions.map(r => (
                            <button key={r.emoji} className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/8 transition-colors">
                              <span>{r.emoji}</span>
                              <span className="text-gray-400">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/8 bg-[#0A0A14]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <button className="text-gray-500 hover:text-gray-300 transition-colors"><Plus className="w-4 h-4" /></button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${selectedChannel}…`}
              className="flex-1 bg-transparent text-xs text-gray-200 outline-none placeholder-gray-600"
            />
            <button className="text-gray-500 hover:text-gray-300 transition-colors"><MapPin className="w-4 h-4" /></button>
            <button className="text-gray-500 hover:text-gray-300 transition-colors"><Paperclip className="w-4 h-4" /></button>
            <button className="text-gray-500 hover:text-gray-300 transition-colors"><Smile className="w-4 h-4" /></button>
            <button onClick={sendMessage} className="p-1.5 bg-violet-500 rounded-lg text-white hover:bg-violet-600 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
