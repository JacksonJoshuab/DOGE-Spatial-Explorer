/**
 * Microsoft Graph Integration — PKCE OAuth2 + REST helpers
 * Handles token acquisition, refresh, and Graph API calls for
 * Teams notifications, Outlook email, and Calendar events.
 *
 * Required env vars (set via webdev_request_secrets):
 *   VITE_MS_CLIENT_ID   — Azure AD app registration client ID
 *   VITE_MS_TENANT_ID   — Azure AD tenant ID (or "common" for multi-tenant)
 *
 * No client secret is needed — PKCE flow is used for the SPA.
 */

const CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID ?? "";
const TENANT_ID = import.meta.env.VITE_MS_TENANT_ID ?? "common";
const REDIRECT_URI = `${window.location.origin}/ms-graph/callback`;
const SCOPES = [
  "User.Read",
  "Mail.Send",
  "Calendars.ReadWrite",
  "ChannelMessage.Send",
  "Team.ReadBasic.All",
].join(" ");

const STORAGE_KEY = "ms_graph_token";

export interface MsGraphToken {
  accessToken: string;
  expiresAt: number; // Unix ms
  idToken?: string;
  account?: { name: string; email: string };
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(array.buffer);
  const hashed = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
}

// ─── Token storage ────────────────────────────────────────────────────────────

export function getStoredToken(): MsGraphToken | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const token: MsGraphToken = JSON.parse(raw);
    if (Date.now() >= token.expiresAt - 60_000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function storeToken(token: MsGraphToken): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(token));
}

export function clearToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem("ms_pkce_verifier");
  sessionStorage.removeItem("ms_pkce_state");
}

// ─── Auth flow ────────────────────────────────────────────────────────────────

export async function startMsLogin(): Promise<void> {
  if (!CLIENT_ID) throw new Error("VITE_MS_CLIENT_ID is not configured");
  const { verifier, challenge } = await generatePKCE();
  const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer);
  sessionStorage.setItem("ms_pkce_verifier", verifier);
  sessionStorage.setItem("ms_pkce_state", state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    response_mode: "query",
  });

  window.location.href = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

export async function handleMsCallback(code: string, returnedState: string): Promise<MsGraphToken> {
  const storedState = sessionStorage.getItem("ms_pkce_state");
  const verifier = sessionStorage.getItem("ms_pkce_verifier");
  if (!storedState || storedState !== returnedState) throw new Error("OAuth state mismatch");
  if (!verifier) throw new Error("PKCE verifier missing");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
    scope: SCOPES,
  });

  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description ?? "Token exchange failed");
  }
  const data = await res.json();
  const token: MsGraphToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    idToken: data.id_token,
  };

  // Decode display name from id_token
  if (data.id_token) {
    try {
      const payload = JSON.parse(atob(data.id_token.split(".")[1]));
      token.account = { name: payload.name ?? "", email: payload.preferred_username ?? "" };
    } catch { /* ignore */ }
  }

  storeToken(token);
  sessionStorage.removeItem("ms_pkce_verifier");
  sessionStorage.removeItem("ms_pkce_state");
  return token;
}

// ─── Graph API helpers ────────────────────────────────────────────────────────

async function graphFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated with Microsoft");
  return fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

export async function getMe(): Promise<{ displayName: string; mail: string; id: string }> {
  const res = await graphFetch("/me");
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function sendOutlookAlert(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const payload = {
    message: {
      subject: params.subject,
      body: { contentType: "HTML", content: params.body },
      toRecipients: [{ emailAddress: { address: params.to } }],
    },
    saveToSentItems: true,
  };
  const res = await graphFetch("/me/sendMail", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to send email");
  }
}

export async function postTeamsMessage(params: {
  teamId: string;
  channelId: string;
  message: string;
}): Promise<void> {
  const payload = {
    body: { contentType: "html", content: params.message },
  };
  const res = await graphFetch(`/teams/${params.teamId}/channels/${params.channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to post Teams message");
  }
}

export async function createCalendarEvent(params: {
  subject: string;
  body: string;
  start: string; // ISO 8601
  end: string;
  attendees?: string[];
}): Promise<{ id: string; webLink: string }> {
  const payload = {
    subject: params.subject,
    body: { contentType: "HTML", content: params.body },
    start: { dateTime: params.start, timeZone: "America/Chicago" },
    end: { dateTime: params.end, timeZone: "America/Chicago" },
    attendees: (params.attendees ?? []).map(email => ({
      emailAddress: { address: email },
      type: "required",
    })),
  };
  const res = await graphFetch("/me/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create calendar event");
  }
  return res.json();
}

export async function listTeams(): Promise<Array<{ id: string; displayName: string }>> {
  const res = await graphFetch("/me/joinedTeams");
  if (!res.ok) return [];
  const data = await res.json();
  return data.value ?? [];
}

export async function listChannels(teamId: string): Promise<Array<{ id: string; displayName: string }>> {
  const res = await graphFetch(`/teams/${teamId}/channels`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.value ?? [];
}

export async function listCalendarEvents(top = 10): Promise<Array<{
  id: string; subject: string; start: { dateTime: string }; end: { dateTime: string }; webLink: string;
}>> {
  const res = await graphFetch(`/me/events?$top=${top}&$orderby=start/dateTime`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.value ?? [];
}
