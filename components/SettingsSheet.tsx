"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, type Settings, loadSettings, saveSettings } from "@/lib/settings";

type Props = {
  open: boolean;
  onClose: () => void;
  onUseGeolocation: () => Promise<{ lat: number; lon: number } | null>;
  onChange: (s: Settings) => void;
};

export function SettingsSheet({ open, onClose, onUseGeolocation, onChange }: Props) {
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [geoBusy, setGeoBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(loadSettings());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function save(next: Settings) {
    setDraft(next);
    saveSettings(next);
    onChange(next);
  }

  async function requestGeo() {
    setGeoBusy(true);
    try {
      await onUseGeolocation();
    } finally {
      setGeoBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-md sm:rounded-card rounded-t-card bg-[#10172A] border border-white/10 p-5 animate-fade-up"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="h-8 w-8 grid place-items-center rounded-full bg-white/8 hover:bg-white/14"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Your name" hint="Used in the greeting.">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => save({ ...draft, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-white/30"
              placeholder="friend"
            />
          </Field>

          <Field
            label="Location"
            hint="City used for weather when geolocation is unavailable."
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.city ?? ""}
                onChange={(e) => save({ ...draft, city: e.target.value.trim() || null })}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-white/30"
                placeholder="City name"
              />
              <button
                onClick={requestGeo}
                disabled={geoBusy}
                className="shrink-0 rounded-xl bg-white/10 hover:bg-white/16 px-3 text-[12px] font-medium disabled:opacity-50"
              >
                {geoBusy ? "…" : "Use device"}
              </button>
            </div>
          </Field>

          <Field
            label="Calendar (ICS URL)"
            hint="Paste a public ICS / webcal feed. Google Calendar → Settings → Integrate calendar → Secret address in iCal format."
          >
            <input
              type="url"
              value={draft.calendarUrl ?? ""}
              onChange={(e) => save({ ...draft, calendarUrl: e.target.value.trim() || null })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-white/30"
              placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              inputMode="url"
            />
          </Field>
        </div>

        <div className="mt-5 text-[11px] text-white/45">
          Everything is stored locally in your browser. No accounts, no tracking.
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-white/85">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-white/50 mb-1.5">{hint}</div>}
      {children}
    </label>
  );
}
