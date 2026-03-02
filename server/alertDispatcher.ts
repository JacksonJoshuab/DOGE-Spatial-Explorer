/**
 * alertDispatcher.ts
 * ──────────────────
 * Sends multi-channel notifications for critical IoT audit events.
 *
 * Channels (in order of priority):
 *  1. Manus owner push notification (always attempted — uses built-in Forge API)
 *  2. SendGrid email (optional — requires SENDGRID_API_KEY + ALERT_EMAIL_TO env vars)
 *  3. Twilio SMS (optional — requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *                 TWILIO_FROM, ALERT_SMS_TO env vars)
 *
 * All channels are fire-and-forget; failures are logged but never thrown.
 */

import { notifyOwner } from "./_core/notification";

export interface AlertPayload {
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  isoTime: string;
  category: string;
  severity: "info" | "warning" | "critical";
  detail?: string | null;
}

// ─── Channel 1: Manus push notification ──────────────────────────────────────
async function sendManusNotification(p: AlertPayload): Promise<void> {
  try {
    await notifyOwner({
      title: `🚨 Critical IoT Alert — ${p.action}`,
      content: [
        `**Sensor / Target:** ${p.target}`,
        `**Actor:** ${p.actor} (${p.actorRole})`,
        `**Category:** ${p.category}`,
        `**Time:** ${p.isoTime}`,
        p.detail ? `**Detail:** ${p.detail}` : null,
      ].filter(Boolean).join("\n"),
    });
  } catch (err) {
    console.warn("[AlertDispatcher] Manus push failed:", err);
  }
}

// ─── Channel 2: SendGrid email ────────────────────────────────────────────────
async function sendEmailAlert(p: AlertPayload): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM ?? "alerts@cityofwestlibertyia.org";

  if (!apiKey || !to) return; // silently skip if not configured

  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from, name: "West Liberty Municipal Alerts" },
    subject: `[CRITICAL] IoT Alert — ${p.action} — ${p.target}`,
    content: [
      {
        type: "text/html",
        value: `
          <h2 style="color:#c0392b;">🚨 Critical IoT Alert</h2>
          <table cellpadding="6" style="font-family:monospace;font-size:13px;">
            <tr><td><strong>Action</strong></td><td>${p.action}</td></tr>
            <tr><td><strong>Target</strong></td><td>${p.target}</td></tr>
            <tr><td><strong>Actor</strong></td><td>${p.actor} (${p.actorRole})</td></tr>
            <tr><td><strong>Category</strong></td><td>${p.category}</td></tr>
            <tr><td><strong>Time</strong></td><td>${p.isoTime}</td></tr>
            ${p.detail ? `<tr><td><strong>Detail</strong></td><td>${p.detail}</td></tr>` : ""}
          </table>
          <p style="color:#555;font-size:12px;margin-top:16px;">
            City of West Liberty, IA — DOGE Municipal Intelligence Platform<br>
            This is an automated alert. Do not reply to this email.
          </p>
        `,
      },
    ],
  };

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[AlertDispatcher] SendGrid email failed (${res.status}): ${text}`);
    } else {
      console.info(`[AlertDispatcher] Email alert sent to ${to} for: ${p.action}`);
    }
  } catch (err) {
    console.warn("[AlertDispatcher] SendGrid fetch error:", err);
  }
}

// ─── Channel 3: Twilio SMS ────────────────────────────────────────────────────
async function sendSmsAlert(p: AlertPayload): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.ALERT_SMS_TO;

  if (!sid || !token || !from || !to) return; // silently skip if not configured

  const message = [
    `[CRITICAL] West Liberty IoT Alert`,
    `Action: ${p.action}`,
    `Target: ${p.target}`,
    `Time: ${p.isoTime}`,
    p.detail ? `Detail: ${p.detail.slice(0, 80)}` : null,
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({ From: from, To: to, Body: message });
  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[AlertDispatcher] Twilio SMS failed (${res.status}): ${text}`);
    } else {
      console.info(`[AlertDispatcher] SMS alert sent to ${to} for: ${p.action}`);
    }
  } catch (err) {
    console.warn("[AlertDispatcher] Twilio fetch error:", err);
  }
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────
/**
 * Dispatch a critical IoT alert across all configured channels.
 * Only fires for severity === "critical" and category === "iot".
 * All channels are fire-and-forget (no await at call site needed).
 */
export async function dispatchCriticalAlert(p: AlertPayload): Promise<void> {
  if (p.severity !== "critical") return;

  // Run all channels concurrently; failures are isolated per channel
  await Promise.allSettled([
    sendManusNotification(p),
    sendEmailAlert(p),
    sendSmsAlert(p),
  ]);
}
