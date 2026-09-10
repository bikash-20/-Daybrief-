"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Alarm = {
  id: string;
  time: string; // "HH:mm", 24h
  label: string;
  enabled: boolean;
  lastFiredDate?: string; // "YYYY-MM-DD", prevents re-firing within the same day
};

const STORAGE_KEY = "daybrief:alarms";

/**
 * IMPORTANT LIMITATION: this fires alarms only while the app/tab is open —
 * browsers (especially iOS Safari PWAs) do not allow true background wake-up
 * alarms without a native app or a scheduled push notification from a server.
 * Treat this as an "in-app alarm while Daybrief is open," not a phone alarm
 * replacement. Flag this clearly in the UI copy.
 */
export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const alarmsRef = useRef<Alarm[]>([]);
  alarmsRef.current = alarms;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAlarms(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    } catch {
      /* ignore quota */
    }
  }, [alarms, hydrated]);

  const addAlarm = useCallback((time: string, label: string) => {
    const alarm: Alarm = {
      id: crypto.randomUUID(),
      time,
      label: label.trim(),
      enabled: true,
    };
    setAlarms((prev) => [...prev, alarm]);
  }, []);

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }, []);

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Poll every 15s for matching, not-yet-fired-today alarms.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = now.toISOString().slice(0, 10);
      let changed = false;
      const next = alarmsRef.current.map((a) => {
        if (a.enabled && a.time === hhmm && a.lastFiredDate !== today) {
          fireAlarm(a);
          changed = true;
          return { ...a, lastFiredDate: today };
        }
        return a;
      });
      if (changed) setAlarms(next);
    };
    const interval = window.setInterval(tick, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  return { alarms, addAlarm, toggleAlarm, removeAlarm, hydrated };
}

function fireAlarm(alarm: Alarm) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(alarm.label || "Alarm", {
        body: alarm.time,
        tag: alarm.id,
        silent: false,
      });
    } catch {
      /* iOS Safari can throw on Notification in some states */
    }
  }
  // AudioContext requires user gesture on first use in some browsers;
  // a failed beep silently falls back to the notification above.
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    window.setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 600);
  } catch {
    /* ignore */
  }
}

export async function requestAlarmPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}
