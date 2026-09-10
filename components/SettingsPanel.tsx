"use client";

import { useEffect, useState } from "react";
import { CALENDAR_URL_KEY } from "./CalendarCard";

/**
 * Gear-icon settings trigger + modal. Lets each visitor:
 *   - paste their own calendar ICS/webcal URL
 *   - set a manual city (used by useLocation when geolocation is denied)
 *   - clear either to fall back to defaults / re-prompt geolocation
 *
 * Writes are persisted to localStorage; CalendarCard listens for a
 * 'daybrief:calendar-refresh' window event so it refetches without a reload.
 */

const CITY_KEY = "daybrief:manual-location";

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cityStatus, setCityStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [urlStatus, setUrlStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    if (!open) return;
    setUrlInput(localStorage.getItem(CALENDAR_URL_KEY) ?? "");
    try {
      const stored = localStorage.getItem(CITY_KEY);
      if (stored) setCityInput(JSON.parse(stored).label ?? "");
    } catch {
      /* ignore */
    }
  }, [open]);

  function saveUrl() {
    if (urlInput.trim()) {
      localStorage.setItem(CALENDAR_URL_KEY, urlInput.trim());
    } else {
      localStorage.removeItem(CALENDAR_URL_KEY);
    }
    setUrlStatus("saved");
    window.dispatchEvent(new Event("daybrief:calendar-refresh"));
    window.setTimeout(() => setUrlStatus("idle"), 1200);
  }

  async function saveCity() {
    setCityStatus("saving");
    const q = cityInput.trim();
    if (!q) {
      localStorage.removeItem(CITY_KEY);
      setCityStatus("ok");
      window.setTimeout(() => setCityStatus("idle"), 1200);
      return;
    }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`,
      );
      const data = await res.json();
      const first = data?.results?.[0];
      if (!first) {
        setCityStatus("err");
        return;
      }
      localStorage.setItem(
        CITY_KEY,
        JSON.stringify({
          lat: first.latitude,
          lon: first.longitude,
          label: `${first.name}, ${first.admin1 ?? first.country}`,
        }),
      );
      setCityStatus("ok");
      window.setTimeout(() => setCityStatus("idle"), 1200);
    } catch {
      setCityStatus("err");
    }
  }

  return (
    <>
      <button
        aria-label="Settings"
        onClick={() => setOpen(true)}
        className="h-10 w-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full sm:max-w-md sm:rounded-card rounded-t-card bg-[#10172A] border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold">Settings</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close settings"
                className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <section className="space-y-2">
              <label className="block">
                <div className="text-[12px] font-medium text-white/85">Your calendar</div>
                <div className="text-[11px] text-white/50 mb-1.5">
                  Paste an ICS / webcal URL. Leave blank to use the app&rsquo;s default calendar.
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={saveUrl}
                    className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 px-3 text-[12px] font-medium"
                  >
                    {urlStatus === "saved" ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </label>
            </section>

            <section className="mt-5 space-y-2">
              <label className="block">
                <div className="text-[12px] font-medium text-white/85">Your city</div>
                <div className="text-[11px] text-white/50 mb-1.5">
                  Used for weather when location permission is denied.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="City name"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={saveCity}
                    disabled={cityStatus === "saving"}
                    className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 px-3 text-[12px] font-medium disabled:opacity-50"
                  >
                    {cityStatus === "saving" ? "…" : cityStatus === "ok" ? "Saved ✓" : cityStatus === "err" ? "Not found" : "Save"}
                  </button>
                </div>
              </label>
            </section>

            <p className="mt-5 text-[11px] text-white/45">
              Everything is stored locally in your browser. No accounts, no tracking.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
