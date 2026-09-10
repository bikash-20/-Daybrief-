"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDate, greeting } from "@/lib/format";
import { SettingsPanel } from "./SettingsPanel";

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
    <header className="px-6 pt-8 pb-3 flex items-start justify-between gap-3">
      <div>
        <div className="text-[12px] tracking-[0.22em] text-ink-faint font-semibold uppercase">
          {day}
        </div>
        <h1 className="mt-1 text-[28px] font-bold leading-tight text-ink">
          {now ? greeting(name, now.getHours()) : "Daybrief"}
        </h1>
        <div className="mt-0.5 text-[14px] text-ink-soft font-medium">{full}</div>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh brief"
          whileTap={{ scale: 0.92 }}
          className="neu-pill h-11 w-11 grid place-items-center text-ink-soft disabled:opacity-50"
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
        </motion.button>
        <SettingsPanel />
      </div>
    </header>
  );
}
