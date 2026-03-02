/**
 * MsGraphExplorer — Microsoft 365 integration hub
 * Mounted at /ms-graph
 *
 * Features:
 *  - Connect / disconnect Microsoft account (PKCE OAuth2)
 *  - Send Outlook email alerts
 *  - Post Teams channel messages
 *  - Create Calendar events
 *  - View upcoming calendar events
 *  - Wire critical IoT audit events to Teams/Outlook
 */
import DashboardLayout from "@/components/DashboardLayout";
import {
  Mail, MessageSquare, Calendar, Plug, LogOut, Send,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw, Plus,
  ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getStoredToken, clearToken, startMsLogin,
  getMe, sendOutlookAlert, postTeamsMessage,
  createCalendarEvent, listTeams, listChannels, listCalendarEvents,
  type MsGraphToken,
} from "@/lib/msGraph";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TeamInfo { id: string; displayName: string }
interface ChannelInfo { id: string; displayName: string }
interface CalEvent { id: string; subject: string; start: { dateTime: string }; end: { dateTime: string }; webLink: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDt(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────
function OutlookPanel() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("[West Liberty IoT] Critical Alert");
  const [body, setBody] = useState("<b>Alert:</b> A critical IoT sensor event was detected on the West Liberty municipal network. Please review the Audit Studio for details.");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!to.trim()) { toast.error("Recipient email is required"); return; }
    setSending(true);
    try {
      await sendOutlookAlert({ to, subject, body });
      toast.success("Email sent via Outlook");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4" style={{ color: "oklch(0.40 0.18 240)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.40 0.18 240)" }}>Send Outlook Email</span>
      </div>
      {[
        { label: "To", value: to, setter: setTo, placeholder: "director@cityofwestlibertyia.org" },
        { label: "Subject", value: subject, setter: setSubject, placeholder: "Email subject" },
      ].map(({ label, value, setter, placeholder }) => (
        <div key={label}>
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>{label}</label>
          <input
            value={value}
            onChange={e => setter(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg text-xs"
            style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.018 250)" }}
          />
        </div>
      ))}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Body (HTML)</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-xs resize-none"
          style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.018 250)" }}
        />
      </div>
      <button
        onClick={send}
        disabled={sending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
        style={{ background: "oklch(0.40 0.18 240)", color: "oklch(1 0 0)" }}
      >
        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {sending ? "Sending…" : "Send Email"}
      </button>
    </div>
  );
}

function TeamsPanel() {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [message, setMessage] = useState("<b>🚨 West Liberty IoT Alert:</b> A critical sensor event has been detected. Please check the Audit Studio immediately.");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const t = await listTeams();
      setTeams(t);
      if (t.length > 0) setSelectedTeam(t[0].id);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  useEffect(() => {
    if (!selectedTeam) return;
    listChannels(selectedTeam).then(ch => {
      setChannels(ch);
      if (ch.length > 0) setSelectedChannel(ch[0].id);
    });
  }, [selectedTeam]);

  const send = async () => {
    if (!selectedTeam || !selectedChannel) { toast.error("Select a team and channel"); return; }
    setSending(true);
    try {
      await postTeamsMessage({ teamId: selectedTeam, channelId: selectedChannel, message });
      toast.success("Message posted to Teams");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-4 h-4" style={{ color: "oklch(0.45 0.20 270)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.45 0.20 270)" }}>Post to Teams Channel</span>
        <button onClick={loadTeams} disabled={loading} className="ml-auto">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} style={{ color: "oklch(0.52 0.010 250)" }} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Team</label>
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs"
            style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.018 250)" }}
          >
            {teams.length === 0 && <option value="">No teams found</option>}
            {teams.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Channel</label>
          <select
            value={selectedChannel}
            onChange={e => setSelectedChannel(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs"
            style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.018 250)" }}
          >
            {channels.length === 0 && <option value="">No channels</option>}
            {channels.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Message (HTML)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-xs resize-none"
          style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.018 250)" }}
        />
      </div>
      <button
        onClick={send}
        disabled={sending || teams.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
        style={{ background: "oklch(0.45 0.20 270)", color: "oklch(1 0 0)" }}
      >
        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {sending ? "Posting…" : "Post to Teams"}
      </button>
    </div>
  );
}

function CalendarPanel() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject: "West Liberty Infrastructure Review",
    body: "Scheduled review of IoT sensor alerts and work order status.",
    start: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    end: new Date(Date.now() + 90000000).toISOString().slice(0, 16),
    attendees: "",
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const ev = await listCalendarEvents(10);
      setEvents(ev);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const create = async () => {
    setCreating(true);
    try {
      const attendees = form.attendees.split(",").map(s => s.trim()).filter(Boolean);
      const ev = await createCalendarEvent({
        subject: form.subject,
        body: form.body,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        attendees,
      });
      toast.success("Calendar event created");
      setShowCreate(false);
      loadEvents();
      window.open(ev.webLink, "_blank");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4" style={{ color: "oklch(0.45 0.18 145)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.45 0.18 145)" }}>Outlook Calendar</span>
        <button onClick={loadEvents} disabled={loading} className="ml-auto">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} style={{ color: "oklch(0.52 0.010 250)" }} />
        </button>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
          style={{ background: "oklch(0.45 0.18 145 / 12%)", color: "oklch(0.38 0.18 145)", border: "1px solid oklch(0.45 0.18 145 / 25%)" }}
        >
          <Plus className="w-3 h-3" /> New Event
          {showCreate ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showCreate && (
        <div className="p-3 rounded-lg space-y-2" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
          {[
            { key: "subject", label: "Subject", type: "text" },
            { key: "start", label: "Start", type: "datetime-local" },
            { key: "end", label: "End", type: "datetime-local" },
            { key: "attendees", label: "Attendees (comma-separated emails)", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-widest block mb-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-2 py-1.5 rounded text-xs"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.018 250)" }}
              />
            </div>
          ))}
          <button
            onClick={create}
            disabled={creating}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
            style={{ background: "oklch(0.45 0.18 145)", color: "oklch(1 0 0)" }}
          >
            {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {creating ? "Creating…" : "Create Event"}
          </button>
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {loading && <div className="text-xs text-center py-4" style={{ color: "oklch(0.52 0.010 250)" }}>Loading events…</div>}
        {!loading && events.length === 0 && (
          <div className="text-xs text-center py-4" style={{ color: "oklch(0.52 0.010 250)" }}>No upcoming events</div>
        )}
        {events.map(ev => (
          <div key={ev.id} className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg"
            style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 6%)" }}>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "oklch(0.22 0.018 250)" }}>{ev.subject}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                {formatDt(ev.start.dateTime)} → {formatDt(ev.end.dateTime)}
              </div>
            </div>
            <a href={ev.webLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "oklch(0.40 0.18 240)" }} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MsGraphExplorer() {
  const [token, setToken] = useState<MsGraphToken | null>(null);
  const [me, setMe] = useState<{ displayName: string; mail: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"outlook" | "teams" | "calendar">("outlook");
  const clientId = import.meta.env.VITE_MS_CLIENT_ID;

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      setToken(stored);
      getMe().then(setMe).catch(() => setMe(null));
    }
  }, []);

  const connect = async () => {
    if (!clientId) {
      toast.error("VITE_MS_CLIENT_ID is not configured. Add it in Settings → Secrets.");
      return;
    }
    setConnecting(true);
    try {
      await startMsLogin();
    } catch (e: unknown) {
      toast.error((e as Error).message);
      setConnecting(false);
    }
  };

  const disconnect = () => {
    clearToken();
    setToken(null);
    setMe(null);
    toast.info("Microsoft account disconnected");
  };

  const TABS = [
    { id: "outlook" as const, label: "Outlook Email", icon: Mail, color: "oklch(0.40 0.18 240)" },
    { id: "teams" as const, label: "Teams", icon: MessageSquare, color: "oklch(0.45 0.20 270)" },
    { id: "calendar" as const, label: "Calendar", icon: Calendar, color: "oklch(0.45 0.18 145)" },
  ];

  return (
    <DashboardLayout title="Microsoft Graph">
      <div className="p-6 space-y-5 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.22 0.018 250)" }}>
              Microsoft 365 Integration
            </h1>
            <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.010 250)" }}>
              Connect your Microsoft account to route critical IoT alerts to Outlook, Teams, and Calendar.
            </p>
          </div>
          {token ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "oklch(0.50 0.22 25 / 10%)", color: "oklch(0.45 0.22 25)", border: "1px solid oklch(0.50 0.22 25 / 25%)" }}
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "oklch(0.40 0.18 240)", color: "oklch(1 0 0)" }}
            >
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
              {connecting ? "Redirecting…" : "Connect Microsoft Account"}
            </button>
          )}
        </div>

        {/* Connection status */}
        <div className="p-4 rounded-xl flex items-center gap-3"
          style={{ background: token ? "oklch(0.42 0.18 145 / 8%)" : "oklch(0.97 0.003 240)", border: `1px solid ${token ? "oklch(0.42 0.18 145 / 25%)" : "oklch(0 0 0 / 8%)"}` }}>
          {token ? (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "oklch(0.42 0.18 145)" }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: "oklch(0.30 0.012 250)" }}>
                  Connected as {me?.displayName ?? token.account?.name ?? "Microsoft User"}
                </div>
                <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                  {me?.mail ?? token.account?.email ?? ""} · Token expires {new Date(token.expiresAt).toLocaleTimeString()}
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "oklch(0.55 0.18 75)" }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: "oklch(0.30 0.012 250)" }}>
                  Not connected
                </div>
                <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                  {clientId
                    ? "Click 'Connect Microsoft Account' to sign in with your Microsoft 365 credentials."
                    : "Add VITE_MS_CLIENT_ID and VITE_MS_TENANT_ID in Settings → Secrets to enable this integration."}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Setup instructions when not configured */}
        {!clientId && (
          <div className="p-4 rounded-xl space-y-2" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.40 0.18 240)" }}>Setup Instructions</div>
            <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: "oklch(0.40 0.012 250)" }}>
              <li>Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "oklch(0.40 0.18 240)" }}>Azure Portal → App Registrations</a> and create a new registration.</li>
              <li>Set the redirect URI to: <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: "oklch(0.93 0.005 240)", color: "oklch(0.30 0.012 250)" }}>{window.location.origin}/ms-graph/callback</code></li>
              <li>Under "API Permissions", add: User.Read, Mail.Send, Calendars.ReadWrite, ChannelMessage.Send, Team.ReadBasic.All</li>
              <li>Copy the Application (client) ID and Directory (tenant) ID.</li>
              <li>Add them as <strong>VITE_MS_CLIENT_ID</strong> and <strong>VITE_MS_TENANT_ID</strong> in Settings → Secrets.</li>
            </ol>
          </div>
        )}

        {/* Feature tabs (only when connected) */}
        {token && (
          <div className="space-y-4">
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: activeTab === tab.id ? `${tab.color.replace(")", " / 12%)")}` : "oklch(0.97 0.003 240)",
                    color: activeTab === tab.id ? tab.color : "oklch(0.45 0.012 250)",
                    border: `1px solid ${activeTab === tab.id ? tab.color.replace(")", " / 30%)") : "oklch(0 0 0 / 8%)"}`,
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              {activeTab === "outlook" && <OutlookPanel />}
              {activeTab === "teams" && <TeamsPanel />}
              {activeTab === "calendar" && <CalendarPanel />}
            </div>
          </div>
        )}

        {/* Alert routing info card */}
        <div className="p-4 rounded-xl" style={{ background: "oklch(0.40 0.18 240 / 6%)", border: "1px solid oklch(0.40 0.18 240 / 20%)" }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "oklch(0.40 0.18 240)" }}>Automatic Alert Routing</div>
          <p className="text-xs leading-relaxed" style={{ color: "oklch(0.40 0.012 250)" }}>
            When a <strong>critical</strong> audit event is appended (IoT sensor alert, SCIF access denial, etc.), the platform's
            alert dispatcher automatically calls <strong>Manus push notifications</strong> (always active) plus
            <strong> SendGrid email</strong> and <strong>Twilio SMS</strong> if those secrets are configured.
            Use the panels above to manually route additional alerts to your Microsoft 365 Teams channel or Outlook inbox.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
