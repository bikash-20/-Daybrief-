"use client";

import { useEffect, useState } from "react";
import { formatDate, greeting } from "@/lib/format";

type Props = {
  name: string;
  onRefresh: () => void;
  loading: boolean;
};

export function Header({ name, onRefresh, loading }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const date = now ?? new Date(0);
  const { day, full } = formatDate(date);

  return (
    <header className="px-5 pt-6 pb-4 flex items-start justify-between">
      <div>
        <div className="text-[11px] tracking-[0.18em] text-white/55">
          {day}
        </div>
        <h1 className="mt-1 text-[22px] font-semibold leading-tight">
          {now ? greeting(name, now.getHours()) : "Daybrief"}
        </h1>
        <div className="mt-0.5 text-[13px] text-white/60">{full}</div>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh brief"
        className="mt-1 h-10 w-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
      >
        <svg
          className={loading ? "animate-spin" : ""}
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12a9 9 0 1 1-3.5-7.1" />
          <path d="M21 4v6h-6" />
        </svg>
      </button>
    </header>
  );
}
