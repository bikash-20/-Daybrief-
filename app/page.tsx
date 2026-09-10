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
    <main className="mx-auto w-full max-w-md px-0 pb-24 pt-2">
      <Header name={name} onRefresh={refresh} loading={refreshing} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="px-5 space-y-4"
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

      <Footer canInstall={install.canInstall} onInstall={install.promptInstall} />
    </main>
  );
}

function Footer({
  canInstall,
  onInstall,
}: {
  canInstall: boolean;
  onInstall: () => Promise<boolean>;
}) {
  if (!canInstall) return null;
  return (
    <div className="fixed bottom-4 inset-x-0 mx-auto w-fit max-w-[90%] z-40">
      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        onClick={() => void onInstall()}
        className="neu-pill px-5 py-2.5 text-[13px] font-semibold text-ink"
      >
        Install Daybrief
      </motion.button>
    </div>
  );
}
