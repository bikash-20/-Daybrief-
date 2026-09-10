"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { WeatherCard } from "@/components/WeatherCard";
import { CalendarCard } from "@/components/CalendarCard";
import { NewsCarousel } from "@/components/NewsCarousel";
import { AlarmCard } from "@/components/AlarmCard";
import { AssistantFab } from "@/components/AssistantFab";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useName } from "@/lib/useName";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0); // 0..1 for hint
  const install = useInstallPrompt();
  const name = useName();

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event("daybrief:calendar-refresh"));
    window.setTimeout(() => setRefreshing(false), 600);
  }, []);

  // Pull-to-refresh scoped to the main element; expose pull distance for
  // a small visual hint so the gesture isn't invisible.
  const ptr = usePullToRefresh(refresh);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = Math.min(1, ptr.getPulledPx() / 120);
      setPullProgress((prev) => (Math.abs(prev - next) > 0.01 ? next : prev));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ptr]);

  useEffect(() => {
    if (!refreshing) setPullProgress(0);
  }, [refreshing]);

  return (
    <>
      {/* Pull-to-refresh visual hint. Sits absolutely at the top of the
          main element so it scrolls with content and never overlaps the
          install/assistant FABs at the bottom. */}
      <PullHint progress={pullProgress} refreshing={refreshing} />

      <main className="mx-auto w-full max-w-screen-sm lg:max-w-2xl xl:max-w-3xl px-4 sm:px-6 lg:px-8 pb-32 pt-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Header name={name} onRefresh={refresh} loading={refreshing} />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={staggerItem}>
            <WeatherCard />
          </motion.div>
          <motion.div variants={staggerItem}>
            <CalendarCard />
          </motion.div>
          <motion.div variants={staggerItem}>
            <AlarmCard />
          </motion.div>
          <motion.div variants={staggerItem}>
            <NewsCarousel refreshKey={refreshKey} />
          </motion.div>
        </motion.div>
      </main>

      <BottomActions canInstall={install.canInstall} onInstall={install.promptInstall} />
    </>
  );
}

function BottomActions({
  canInstall,
  onInstall,
}: {
  canInstall: boolean;
  onInstall: () => Promise<boolean>;
}) {
  return (
    <div
      className="fixed right-4 z-40 flex flex-col items-end gap-3 sm:right-6"
      style={{
        // bottom = 16px (1rem) on small phones, 24px (1.5rem) on larger
        // screens, plus the home-indicator safe-area inset.
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
      }}
    >
      {canInstall && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={() => void onInstall()}
          className="neu-pill px-4 py-2.5 text-[14px] font-semibold text-ink whitespace-nowrap"
        >
          Install Daybrief
        </motion.button>
      )}
      <AssistantFab />
    </div>
  );
}

function PullHint({ progress, refreshing }: { progress: number; refreshing: boolean }) {
  const visible = progress > 0.05 || refreshing;
  const rotation = refreshing ? 360 : progress * 280;
  return (
    <div
      aria-hidden
      className="fixed top-0 inset-x-0 z-30 grid place-items-center pointer-events-none transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0, paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}
    >
      <div
        className="neu-pill h-9 w-9 grid place-items-center text-ink-soft"
        style={{ transform: `scale(${0.7 + progress * 0.3})`, transition: "transform 80ms linear" }}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: `rotate(${rotation}deg)`, transition: refreshing ? "transform 0.6s linear" : undefined }}
        >
          <path d="M21 12a9 9 0 1 1-3.5-7.1" />
          <path d="M21 4v6h-6" />
        </svg>
      </div>
    </div>
  );
}
