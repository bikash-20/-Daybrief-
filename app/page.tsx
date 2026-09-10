"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { WeatherCard } from "@/components/WeatherCard";
import { CalendarCard } from "@/components/CalendarCard";
import { NewsCarousel } from "@/components/NewsCarousel";
import { AlarmCard } from "@/components/AlarmCard";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useName } from "@/lib/useName";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const install = useInstallPrompt();
  const name = useName();

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event("daybrief:calendar-refresh"));
    window.setTimeout(() => setRefreshing(false), 600);
  }, []);

  usePullToRefresh(refresh);

  return (
    <>
        <main className="mx-auto min-w-0 w-full max-w-screen-sm overflow-x-hidden px-4 pb-32 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-6 lg:max-w-2xl lg:px-8 xl:max-w-3xl">
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
      className="fixed right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6"
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
          className="neu-pill max-w-full px-4 py-2.5 text-center text-[14px] font-semibold text-ink"
        >
          Install Daybrief
        </motion.button>
      )}
    </div>
  );
}
