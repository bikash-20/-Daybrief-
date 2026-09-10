"use client";

import { useEffect, useState } from "react";

type CalEvent = { title: string; start: string; end: string };
type CalResponse = {
  configured: boolean;
  source: "user" | "default" | "none";
  events: CalEvent[];
  error?: string;
};

export const CALENDAR_URL_KEY = "daybrief:calendar-url";

export function CalendarCard() {
  const [data, setData] = useState<CalResponse | null>(null);
  const [refreshing, setRefreshing] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const userUrl =
      typeof window !== "undefined" ? localStorage.getItem(CALENDAR_URL_KEY) : null;
    const endpoint = userUrl
      ? `/api/calendar?url=${encodeURIComponent(userUrl)}`
      : "/api/calendar";
    fetch(endpoint)
      .then((r) => r.json() as Promise<CalResponse>)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ configured: false, source: "none", events: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshing]);

  // Subscribe to a custom event so SettingsPanel can trigger a refetch without reload.
  useEffect(() => {
    function onRefresh() {
      setRefreshing((n) => n + 1);
    }
    window.addEventListener("daybrief:calendar-refresh", onRefresh);
    return () => window.removeEventListener("daybrief:calendar-refresh", onRefresh);
  }, []);

  if (!data) return <Card>Loading calendar…</Card>;

  if (!data.configured) {
    return (
      <Card>
        <p className="text-sm opacity-70">
          No calendar configured. Add your calendar link from the settings (gear icon).
        </p>
      </Card>
    );
  }

  if (data.events.length === 0) {
    return (
      <Card>
        <div className="flex items-baseline justify-between mb-1">
          <p className="font-semibold">Calendar</p>
          <p className="text-[10px] uppercase tracking-wider opacity-50">
            {data.source === "user" ? "Your calendar" : "Default"}
          </p>
        </div>
        <p className="text-sm opacity-70">Nothing in the next 48 hours.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-semibold">Calendar</p>
        <p className="text-[10px] uppercase tracking-wider opacity-50">
          Next 48h · {data.source === "user" ? "Your calendar" : "Default"}
        </p>
      </div>
      {data.events.map((e, i) => (
        <div
          key={`${e.start}-${i}`}
          className="text-sm py-2 border-t border-white/10 first:border-t-0 first:pt-0"
        >
          <p className="font-medium truncate">{e.title}</p>
          <p className="opacity-60 text-xs">
            {new Date(e.start).toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      ))}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-white/5 border border-white/10 p-5">
      {children}
    </section>
  );
}
