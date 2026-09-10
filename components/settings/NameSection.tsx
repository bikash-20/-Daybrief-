"use client";

import { useSettingsField } from "@/lib/useSettingsField";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { SettingsSection, FieldRow } from "./SettingsSection";

/**
 * Settings row for the user's display name. Saves to localStorage and
 * broadcasts `daybrief:name-change` so the Header re-renders immediately.
 */
export function NameSection() {
  const { value, setValue, save, status } = useSettingsField({
    storageKey: STORAGE_KEYS.name,
    changeEvent: "daybrief:name-change",
  });

  return (
    <SettingsSection
      title="Your name"
      description={
        <>
          Used in the greeting. Leave blank to fall back to &ldquo;friend&rdquo;.
        </>
      }
    >
      <FieldRow
        input={
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your first name"
            maxLength={32}
            className="flex-1 neu-sunken px-4 py-2.5 text-[16px] sm:text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        }
        button={
          <button
            onClick={save}
            className="shrink-0 neu-pill px-4 py-2.5 text-[12px] font-semibold text-ink"
          >
            {status === "saved" ? "Saved ✓" : "Save"}
          </button>
        }
      />
    </SettingsSection>
  );
}
