"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
    return <div className="neu-card-soft h-[180px] animate-pulse" />;
  }

  return (
    <motion.section
      whileTap={{ scale: 0.99 }}
      className="neu-card-soft p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-ink">Alarms</h2>
        <button
          onClick={enableNotifications}
          disabled={permission === "unsupported" || permission === "denied"}
          className="text-[12px] text-ink-soft hover:text-ink underline disabled:no-underline disabled:opacity-50 font-semibold"
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

      <p className="text-[12px] text-ink-faint mb-3">
        Alarms only ring while this app is open in a tab — not a background phone alarm.
      </p>

      {alarms.length === 0 && (
        <p className="text-[14px] text-ink-soft mb-3">No alarms set.</p>
      )}

      <ul className="space-y-1">
        {alarms.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between py-2.5 border-t border-ink/[0.06] first:border-t-0"
          >
            <div className="min-w-0">
              <p className="font-bold text-ink text-[15px] tabular-nums">{a.time}</p>
              {a.label && <p className="text-[12px] text-ink-soft truncate">{a.label}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <motion.button
                onClick={() => toggleAlarm(a.id)}
                aria-pressed={a.enabled}
                aria-label={a.enabled ? "Disable alarm" : "Enable alarm"}
                className="relative h-6 w-11 rounded-full neu-pill-sunken"
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  className={`absolute top-0.5 h-5 w-5 rounded-full shadow ${
                    a.enabled ? "left-[22px]" : "left-0.5"
                  }`}
                  style={{
                    background: a.enabled
                      ? "linear-gradient(135deg, var(--accent-1) 0%, var(--accent-3) 100%)"
                      : "var(--card)",
                  }}
                />
              </motion.button>
              <button
                onClick={() => removeAlarm(a.id)}
                aria-label="Delete alarm"
                className="text-ink-faint hover:text-ink text-sm"
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
          className="neu-sunken px-3 py-2 text-[16px] sm:text-[14px] text-ink focus:outline-none tabular-nums"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="flex-1 neu-sunken px-3 py-2 text-[16px] sm:text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          className="neu-pill px-4 py-2 text-[14px] font-semibold text-ink"
        >
          Add
        </button>
      </form>
    </motion.section>
  );
}
