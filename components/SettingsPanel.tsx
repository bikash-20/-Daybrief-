"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CALENDAR_URL_KEY } from "./CalendarCard.shared";
import { NAME_STORAGE_KEY } from "@/lib/useName";
import { useTheme } from "@/lib/useTheme";
import { ThemePicker } from "./ThemePicker";

const CITY_KEY = "daybrief:manual-location";

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cityStatus, setCityStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [urlStatus, setUrlStatus] = useState<"idle" | "saved">("idle");
  const [nameStatus, setNameStatus] = useState<"idle" | "saved">("idle");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    setUrlInput(localStorage.getItem(CALENDAR_URL_KEY) ?? "");
    setNameInput(localStorage.getItem(NAME_STORAGE_KEY) ?? "");
    try {
      const stored = localStorage.getItem(CITY_KEY);
      if (stored) setCityInput(JSON.parse(stored).label ?? "");
    } catch {
      /* ignore */
    }
  }, [open]);

  function saveName() {
    const v = nameInput.trim();
    if (v) {
      localStorage.setItem(NAME_STORAGE_KEY, v);
    } else {
      localStorage.removeItem(NAME_STORAGE_KEY);
    }
    window.dispatchEvent(new Event("daybrief:name-change"));
    setNameStatus("saved");
    window.setTimeout(() => setNameStatus("idle"), 1200);
  }

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
      <motion.button
        aria-label="Settings"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.92, rotate: 30 }}
        whileHover={{ rotate: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="neu-pill h-11 w-11 grid place-items-center text-ink-soft"
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              key="settings-modal"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full sm:max-w-md sm:rounded-card-lg rounded-t-card-lg bg-bg p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-ink">Settings</h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close settings"
                  className="neu-pill h-9 w-9 grid place-items-center text-ink-soft"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <section className="space-y-2">
                <div className="text-[12px] font-semibold text-ink">Your name</div>
                <div className="text-[11px] text-ink-soft">
                  Used in the greeting. Leave blank to fall back to &ldquo;friend&rdquo;.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your first name"
                    maxLength={32}
                    className="flex-1 neu-sunken px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                  <button
                    onClick={saveName}
                    className="shrink-0 neu-pill px-4 py-2.5 text-[12px] font-semibold text-ink"
                  >
                    {nameStatus === "saved" ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </section>

              <section className="mt-6">
                <ThemePicker applied={theme} onApply={setTheme} />
              </section>

              <section className="mt-6 space-y-2">
                <div className="text-[12px] font-semibold text-ink">Your calendar</div>
                <div className="text-[11px] text-ink-soft">
                  Paste an ICS / webcal URL. Leave blank to use the app&rsquo;s default calendar.
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/…"
                    className="flex-1 neu-sunken px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                  <button
                    onClick={saveUrl}
                    className="shrink-0 neu-pill px-4 py-2.5 text-[12px] font-semibold text-ink"
                  >
                    {urlStatus === "saved" ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </section>

              <section className="mt-6 space-y-2">
                <div className="text-[12px] font-semibold text-ink">Your city</div>
                <div className="text-[11px] text-ink-soft">
                  Used for weather when location permission is denied.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="City name"
                    className="flex-1 neu-sunken px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                  <button
                    onClick={saveCity}
                    disabled={cityStatus === "saving"}
                    className="shrink-0 neu-pill px-4 py-2.5 text-[12px] font-semibold text-ink disabled:opacity-50"
                  >
                    {cityStatus === "saving" ? "…" : cityStatus === "ok" ? "Saved ✓" : cityStatus === "err" ? "Not found" : "Save"}
                  </button>
                </div>
              </section>

              <p className="mt-6 text-[11px] text-ink-faint">
                Everything is stored locally in your browser. No accounts, no tracking.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
