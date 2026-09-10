"use client";

import { useEffect, useState } from "react";
import { requestAlarmPermission, useAlarms } from "@/lib/useAlarms";

export function AlarmCard() {
  const { alarms, addAlarm, toggleAlarm, removeAlarm, hydrated } = useAlarms();
  const [time, setTime] = useState("07:00");
  const [label, setLabel] = useState("");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  async function enableNotifications() {
    const next = await requestAlarmPermission();
    setPermission(next);
  }

  if (!hydrated) {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 p-5 h-[180px] animate-pulse" />
    );
  }

  return (
    <section className="rounded-card bg-white/5 border border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Alarms</h2>
        <button
          onClick={enableNotifications}
          disabled={permission === "unsupported" || permission === "denied"}
          className="text-[11px] text-white/55 hover:text-white/80 underline disabled:no-underline disabled:opacity-50"
        >
          {permission === "granted"
            ? "Notifications on"
            : permission === "denied"
              ? "Notifications blocked"
              : permission === "unsupported"
                ? "Notifications unsupported"
                : "Enable notifications"}
        </button>
      </div>

      <p className="text-[11px] text-white/55 mb-3">
        Alarms only ring while this app is open in a tab — not a background phone alarm.
      </p>

      {alarms.length === 0 && (
        <p className="text-sm text-white/60 mb-3">No alarms set.</p>
      )}

      <ul className="space-y-1">
        {alarms.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between py-2 border-t border-white/10 first:border-t-0"
          >
            <div className="min-w-0">
              <p className="font-medium">{a.time}</p>
              {a.label && <p className="text-xs text-white/60 truncate">{a.label}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => toggleAlarm(a.id)}
                aria-pressed={a.enabled}
                aria-label={a.enabled ? "Disable alarm" : "Enable alarm"}
                className={`relative h-6 w-10 rounded-full transition ${
                  a.enabled ? "bg-white/80" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    a.enabled ? "left-[18px]" : "left-0.5"
                  } ${a.enabled ? "bg-blue-500" : "bg-white/70"}`}
                />
              </button>
              <button
                onClick={() => removeAlarm(a.id)}
                aria-label="Delete alarm"
                className="text-white/50 hover:text-white/85 text-sm"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addAlarm(time, label);
          setLabel("");
        }}
        className="flex gap-2 mt-4"
      >
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg bg-white/10 px-2 py-1 text-sm outline-none"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-sm outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-sm font-medium"
        >
          Add
        </button>
      </form>
    </section>
  );
}
