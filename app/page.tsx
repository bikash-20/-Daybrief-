"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { WeatherCard } from "@/components/WeatherCard";
import { CalendarCard } from "@/components/CalendarCard";
import { NewsCarousel } from "@/components/NewsCarousel";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "@/lib/settings";

type Geo = { lat: number; lon: number } | null;

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [geo, setGeo] = useState<Geo>(null);
  const install = useInstallPrompt();

  useEffect(() => {
    setHydrated(true);
    setSettings(loadSettings());
    if (localStorage.getItem("daybrief.geo.v1")) {
      try {
        setGeo(JSON.parse(localStorage.getItem("daybrief.geo.v1")!));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const requestGeolocation = useCallback(async (): Promise<{ lat: number; lon: number } | null> => {
    if (!("geolocation" in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setGeo(next);
          try {
            localStorage.setItem("daybrief.geo.v1", JSON.stringify(next));
          } catch {
            /* ignore */
          }
          resolve(next);
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 * 30 },
      );
    });
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setRefreshing(false), 600);
  }, []);

  usePullToRefresh(refresh);

  const weatherQuery = useMemo(() => {
    if (geo) return `lat=${geo.lat}&lon=${geo.lon}`;
    if (settings.city) return `city=${encodeURIComponent(settings.city)}`;
    return null;
  }, [geo, settings.city]);

  // Persist settings changes from the sheet.
  function handleSettingsChange(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  return (
    <main className="mx-auto w-full max-w-md px-0 pb-24 pt-2">
      <Header
        name={settings.name}
        onOpenSettings={() => setSettingsOpen(true)}
        onRefresh={refresh}
        loading={refreshing}
      />

      <div className="px-5 space-y-4">
        <WeatherCard query={weatherQuery} refreshKey={refreshKey} />
        <CalendarCard icsUrl={settings.calendarUrl} refreshKey={refreshKey} />
        <NewsCarousel refreshKey={refreshKey} />
      </div>

      <Footer hydrated={hydrated} canInstall={install.canInstall} onInstall={install.promptInstall} />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUseGeolocation={requestGeolocation}
        onChange={handleSettingsChange}
      />
    </main>
  );
}

function Footer({
  hydrated,
  canInstall,
  onInstall,
}: {
  hydrated: boolean;
  canInstall: boolean;
  onInstall: () => Promise<boolean>;
}) {
  if (!hydrated) return null;
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
