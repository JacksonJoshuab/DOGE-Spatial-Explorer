/**
 * DOGE-LANDSCAPER — Chip's Push Notifications Hook
 * Uses browser Notifications API to send hourly corn-belt quips during active missions
 * Requests permission once, then fires on an hourly interval while mission is active
 */

import { useState, useEffect, useCallback, useRef } from "react";

const CHIP_QUIPS = [
  { title: "🌽 Chip McHaymaker", body: "It's hotter than a tractor seat in July out here! Spray window still open though — we're good to go!" },
  { title: "🚜 Chip's Field Report", body: "By golly, them dandelions don't stand a chance! Zone A is looking cleaner than a freshly waxed combine." },
  { title: "🌱 Chip's Lawn Wisdom", body: "Neighbor Earl says his lawn looks better than mine. Challenge accepted, Earl. Challenge. Accepted." },
  { title: "☀️ Chip's Weather Check", body: "Wind's cooperating like a good Iowa neighbor today. Scotts Weed & Feed going down smooth — no overspray incidents!" },
  { title: "🌾 Chip's Corn Belt Update", body: "Scilla bulbs by the oak tree are looking real pretty. Avoided the root zone like a pro — that tree's been here since Eisenhower!" },
  { title: "🤖 Chip's AI Insight", body: "Jetson Orin just flagged 47 dandelions in Zone B. That's 47 too many. Initiating precision elimination protocol!" },
  { title: "💧 Chip's Spray Report", body: "Humidity at 68% — perfect for weed & feed absorption. Chip don't spray in the rain and he don't spray in the wind. Safety first!" },
  { title: "🏡 Chip's Yard Update", body: "Swing set area is clear — child-safe buffer maintained. Chip McHaymaker takes his safety protocols seriously, folks!" },
  { title: "🌻 Chip's Garden Note", body: "Them scilla bulbs are putting on quite a show this spring! Selective spray mode engaged — we protect the pretty ones." },
  { title: "⚡ Chip's Energy Report", body: "Battery at 77% — enough juice to finish Zone C and start on the fence line. Efficiency is Chip's middle name. Well, actually it's Dale." },
  { title: "🌤️ Chip's Morning Briefing", body: "Dew burned off at 9:15 AM — right on schedule. Spray window is OPEN. Chip McHaymaker is ON THE CLOCK!" },
  { title: "🎯 Chip's Precision Report", body: "LiDAR scan shows 12,847 square feet of lawn. Scotts bag covers 12,000. Chip's gonna need to make some choices about Zone D." },
  { title: "🦅 Chip's Patriotic Moment", body: "Beautiful day in West Liberty, Iowa! Stars and stripes flying, lawn getting treated, Jetson Orin humming along. This is the American dream, folks." },
  { title: "🌧️ Chip's Weather Advisory", body: "Checking tomorrow's forecast — 30% chance of rain. That means today's application needs to set for 24 hours. Chip's got the timing dialed in!" },
  { title: "🏆 Chip's Achievement Unlocked", body: "Zone A treatment complete! Coverage: 94%. That's what we call a professional-grade application. Earl across the street is watching. He knows." },
];

export type NotificationPermission = "default" | "granted" | "denied";

export interface ChipNotificationState {
  permission: NotificationPermission;
  isScheduled: boolean;
  lastQuipIndex: number;
  notificationsSent: number;
}

export function useChipNotifications(isMissionActive: boolean) {
  const [state, setState] = useState<ChipNotificationState>({
    permission: typeof Notification !== "undefined" ? Notification.permission as NotificationPermission : "default",
    isScheduled: false,
    lastQuipIndex: -1,
    notificationsSent: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quipIndexRef = useRef(0);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      console.warn("Notifications API not supported");
      return false;
    }
    const result = await Notification.requestPermission();
    setState(s => ({ ...s, permission: result as NotificationPermission }));
    return result === "granted";
  }, []);

  const sendQuip = useCallback((quipIndex?: number) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const idx = quipIndex !== undefined ? quipIndex : quipIndexRef.current % CHIP_QUIPS.length;
    const quip = CHIP_QUIPS[idx];
    quipIndexRef.current = (idx + 1) % CHIP_QUIPS.length;

    try {
      const notification = new Notification(quip.title, {
        body: quip.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "chip-quip",
        requireInteraction: false,
        silent: false,
      });

      // Auto-close after 8 seconds
      setTimeout(() => notification.close(), 8000);

      setState(s => ({
        ...s,
        lastQuipIndex: idx,
        notificationsSent: s.notificationsSent + 1,
      }));
    } catch (err) {
      console.warn("Failed to send notification:", err);
    }
  }, []);

  const startSchedule = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Send one immediately, then every hour
    sendQuip();
    intervalRef.current = setInterval(() => {
      sendQuip();
    }, 60 * 60 * 1000); // 1 hour
    setState(s => ({ ...s, isScheduled: true }));
  }, [sendQuip]);

  const stopSchedule = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(s => ({ ...s, isScheduled: false }));
  }, []);

  const sendTestQuip = useCallback(() => {
    sendQuip();
  }, [sendQuip]);

  // Auto-start/stop schedule based on mission active state
  useEffect(() => {
    if (isMissionActive && state.permission === "granted" && !state.isScheduled) {
      startSchedule();
    } else if (!isMissionActive && state.isScheduled) {
      stopSchedule();
    }
  }, [isMissionActive, state.permission, state.isScheduled, startSchedule, stopSchedule]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    state,
    requestPermission,
    sendTestQuip,
    startSchedule,
    stopSchedule,
    quips: CHIP_QUIPS,
  };
}
