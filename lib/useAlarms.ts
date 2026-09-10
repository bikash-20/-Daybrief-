"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "./storageKeys";

export type Alarm = {
  id: string;
  time: string; // "HH:mm", 24h
  label: string;
  enabled: boolean;
  lastFiredDate?: string; // "YYYY-MM-DD", prevents re-firing within the same day
};

const STORAGE_KEY = STORAGE_KEYS.alarms;
const TICK_MS = 60_000; // one minute granularity; alarms are hh:mm only

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
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
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

  // Poll every minute. Skips work entirely when no alarms are enabled,
  // and only updates state when an alarm actually fires (preserves React
  // memoization, reduces mobile GC pressure).
  useEffect(() => {
    const hasEnabled = () => alarmsRef.current.some((a) => a.enabled);

    const tick = () => {
      if (!hasEnabled()) return; // nothing to do
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

    // First tick is offset to the next minute boundary to keep the hh:mm
    // comparison honest (a 0s tick would fire too early).
    const offset = 60_000 - (Date.now() % 60_000);
    const initial = window.setTimeout(() => {
      tick();
      const interval = window.setInterval(tick, TICK_MS);
      // Stash the interval id on the timeout so the cleanup function can
      // clear both. (Closures over the same id make this safe.)
      cleanupRef.current = () => {
        window.clearInterval(interval);
      };
    }, offset);

    const cleanupRef = { current: () => window.clearTimeout(initial) };

    return () => {
      cleanupRef.current();
    };
  }, []);

  return { alarms, addAlarm, toggleAlarm, removeAlarm, hydrated };
}

// Reused across the page so we don't spin up an AudioContext per alarm tick.
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_audioCtx) return _audioCtx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    _audioCtx = new Ctor();
  } catch {
    _audioCtx = null;
  }
  return _audioCtx;
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
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    window.setTimeout(() => {
      osc.stop();
      // Don't close the context — it's reused. Just disconnect.
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
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
