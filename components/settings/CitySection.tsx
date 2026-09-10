"use client";

import { useSettingsField } from "@/lib/useSettingsField";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { geocodeCity } from "@/lib/geocode";
import { SettingsSection, FieldRow } from "./SettingsSection";

/**
 * Settings row for the user's manual city. Saves a {lat, lon, label}
 * object (JSON) to localStorage and broadcasts a generic refresh event.
 */
export function CitySection() {
  const { value, setValue, save, status } = useSettingsField({
    storageKey: STORAGE_KEYS.manualLocation,
    // Reuse the calendar-refresh event so WeatherCard re-fetches too.
    changeEvent: "daybrief:calendar-refresh",
    parseStored: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.manualLocation);
        if (!raw) return "";
        const parsed = JSON.parse(raw);
        return typeof parsed?.label === "string" ? parsed.label : "";
      } catch {
        return "";
      }
    },
    beforeSave: async (current) => {
      const q = current.trim();
      if (!q) return ""; // empty = remove override
      const found = await geocodeCity(q);
      if (!found) return null; // signal error
      return JSON.stringify({ lat: found.lat, lon: found.lon, label: found.label });
    },
  });

  return (
    <SettingsSection
      title="Your city"
      description={<>Used for weather when location permission is denied.</>}
    >
      <FieldRow
        input={
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="City name"
            className="flex-1 neu-sunken px-4 py-2.5 text-[16px] sm:text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        }
        button={
          <button
            onClick={save}
            disabled={status === "saving"}
            className="shrink-0 neu-pill px-4 py-2.5 text-[13px] font-semibold text-ink disabled:opacity-50"
          >
            {status === "saving"
              ? "…"
              : status === "saved"
                ? "Saved ✓"
                : status === "err"
                  ? "Not found"
                  : "Save"}
          </button>
        }
      />
    </SettingsSection>
  );
}
