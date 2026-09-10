"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CALENDAR_URL_KEY } from "./CalendarCard.shared";
import { useHasHover } from "@/lib/useHasHover";

type CalEvent = { title: string; start: string; end: string };
type CalResponse = {
  configured: boolean;
  source: "user" | "default" | "none";
  events: CalEvent[];
  error?: string;
};

export function CalendarCard() {
  const [data, setData] = useState<CalResponse | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [now] = useState(() => new Date());
  const hasHover = useHasHover();

  // AbortController for the in-flight fetch; rapid refreshes cancel stale ones.
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    ctrlRef.current?.abort();
    ctrlRef.current = ctrl;

    const userUrl =
      typeof window !== "undefined" ? localStorage.getItem(CALENDAR_URL_KEY) : null;
    const endpoint = userUrl
      ? `/api/calendar?url=${encodeURIComponent(userUrl)}`
      : "/api/calendar";

    fetch(endpoint, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json() as Promise<CalResponse>)
      .then((d) => {
        if (!ctrl.signal.aborted) setData(d);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        // Network failure: keep whatever we previously had rather than nuking
        // the user's calendar on a flaky connection.
        if (!data) {
          setData({ configured: false, source: "none", events: [] });
        }
        // Surface the error for debugging — silent in prod.
        if (err instanceof Error) console.warn("[CalendarCard] fetch failed:", err.message);
      });

    return () => ctrl.abort();
    // We deliberately exclude `data` from deps: refetch on tick, then write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  useEffect(() => {
    function onRefresh() {
      setRefreshTick((n) => n + 1);
    }
    window.addEventListener("daybrief:calendar-refresh", onRefresh);
    return () => window.removeEventListener("daybrief:calendar-refresh", onRefresh);
  }, []);

  if (!data) {
    return (
      <div className="neu-card-soft h-[260px] grid place-items-center text-ink-faint text-[14px]" role="status" aria-live="polite">
        Loading calendar…
      </div>
    );
  }

  if (!data.configured) {
    return (
      <motion.section whileTap={{ scale: 0.99 }} className="neu-card-soft card-pressable p-5">
        <p className="text-[15px] text-ink mb-1">No calendar configured.</p>
        <p className="text-[14px] text-ink-soft">
          Add your calendar link from <span className="font-semibold text-ink">Settings</span> (gear icon).
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      whileTap={{ scale: 0.99 }}
      whileHover={hasHover ? { y: -1 } : undefined}
      className="neu-card-soft card-pressable p-5"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-bold text-ink">
          {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <span className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">
          {data.source === "user" ? "Your calendar" : "Default"}
        </span>
      </div>

      <MonthGrid today={now} />

      <div className="mt-5">
        <div className="text-[12px] uppercase tracking-[0.18em] text-ink-faint font-semibold mb-2">
          Next 48 hours
        </div>
        {data.events.length === 0 ? (
          <p className="text-[15px] text-ink-soft">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {data.events.slice(0, 3).map((e, i) => (
              <li
                key={`${e.start}-${i}`}
                className="flex items-center justify-between gap-3 text-[15px]"
              >
                <span className="truncate text-ink font-medium">{e.title}</span>
                <span className="shrink-0 text-ink-soft text-[14px] tabular-nums">
                  {new Date(e.start).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  );
}

function MonthGrid({ today }: { today: Date }) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-[13px] text-ink-faint text-center mb-2 font-semibold">
        {weekdays.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c.day === null) return <div key={i} />;
          const isToday = c.day === todayDate;
          return (
            <div
              key={i}
              className={`aspect-square grid place-items-center text-[15px] rounded-full font-semibold ${
                isToday
                  ? "text-white"
                  : "text-ink"
              }`}
              style={
                isToday
                  ? {
                      background: "linear-gradient(135deg, var(--accent-1) 0%, var(--accent-3) 100%)",
                      boxShadow: "0 6px 16px var(--accent-shadow)",
                    }
                  : undefined
              }
            >
              {c.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
