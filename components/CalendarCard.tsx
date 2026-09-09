"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
  title: string;
  start: string;
  end: string;
};

type CalendarResponse =
  | { configured: false; events: [] }
  | { configured: true; events: CalendarEvent[]; error?: string };

type Props = { refreshKey: number };

export function CalendarCard({ refreshKey }: Props) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "missing" }
    | { status: "empty" }
    | { status: "ready"; events: CalendarEvent[] }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetch("/api/calendar")
      .then((r) => r.json() as Promise<CalendarResponse>)
      .then((data) => {
        if (cancelled) return;
        if (!data.configured) {
          setState({ status: "missing" });
        } else if ("error" in data) {
          setState({ status: "error", message: data.error ?? "Calendar error" });
        } else if (data.events.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "ready", events: data.events });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Network error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (state.status === "missing") {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5 text-sm text-white/70">
        No calendar configured.
      </section>
    );
  }

  if (state.status === "loading") {
    return <div className="rounded-card bg-white/5 border border-white/10 h-[150px] animate-pulse" />;
  }

  if (state.status === "empty") {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5">
        <div className="text-[15px] font-semibold">Next 48 hours</div>
        <div className="text-[12px] text-white/60 mt-1">No events scheduled.</div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5 text-sm text-white/70">
        Calendar unavailable. {state.message}
      </section>
    );
  }

  const first = state.events[0];
  const rest = state.events.slice(1);
  return (
    <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold">Next 48 hours</div>
          <div className="text-[12px] text-white/60">
            {state.events.length} event{state.events.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {first && (
        <div className="mt-4">
          <div className="text-[14px] font-medium">{first.title}</div>
          <div className="text-[12px] text-white/60 mt-0.5">
            {formatTimeRange(first.start, first.end)}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {rest.map((ev, i) => (
            <li key={`${ev.start}-${i}`} className="flex items-center justify-between text-[13px]">
              <span className="truncate pr-3">{ev.title}</span>
              <span className="shrink-0 text-white/55 text-[12px]">
                {formatTimeRange(ev.start, ev.end)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (x: Date) =>
    x.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}
