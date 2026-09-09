"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/Header";
import { WeatherCard } from "@/components/WeatherCard";
import { CalendarCard } from "@/components/CalendarCard";
import { NewsCarousel } from "@/components/NewsCarousel";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { usePullToRefresh } from "@/lib/usePullToRefresh";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const install = useInstallPrompt();

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setRefreshing(false), 600);
  }, []);

  usePullToRefresh(refresh);

  return (
    <main className="mx-auto w-full max-w-md px-0 pb-24 pt-2">
      <Header name="friend" onRefresh={refresh} loading={refreshing} />

      <div className="px-5 space-y-4">
        <WeatherCard />
        <CalendarCard refreshKey={refreshKey} />
        <NewsCarousel refreshKey={refreshKey} />
      </div>

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
      <button
        onClick={() => void onInstall()}
        className="rounded-full bg-white text-[#0F172A] text-[13px] font-medium px-4 py-2 shadow-lg hover:bg-white/90"
      >
        Install Daybrief
      </button>
    </div>
  );
}
