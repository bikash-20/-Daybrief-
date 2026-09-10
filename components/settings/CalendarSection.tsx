"use client";

import { useSettingsField } from "@/lib/useSettingsField";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { SettingsSection, FieldRow } from "./SettingsSection";

/**
 * Settings row for the user's ICS / webcal URL. Saves to localStorage and
 * broadcasts `daybrief:calendar-refresh` so CalendarCard re-fetches.
 */
export function CalendarSection() {
  const { value, setValue, save, status } = useSettingsField({
    storageKey: STORAGE_KEYS.calendarUrl,
    changeEvent: "daybrief:calendar-refresh",
  });

  return (
    <SettingsSection
      title="Your calendar"
      description={
        <>
          Paste an ICS / webcal URL. Leave blank to use the app&rsquo;s default calendar.
        </>
      }
    >
      <FieldRow
        input={
          <input
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/…"
            className="flex-1 neu-sunken px-4 py-2.5 text-[16px] sm:text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        }
        button={
          <button
            onClick={save}
            className="shrink-0 neu-pill px-4 py-2.5 text-[14px] font-semibold text-ink"
          >
            {status === "saved" ? "Saved ✓" : "Save"}
          </button>
        }
      />
    </SettingsSection>
  );
}
