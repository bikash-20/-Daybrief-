/**
 * Single source of truth for localStorage keys.
 *
 * Importing from here (instead of duplicating the string in multiple
 * components) prevents the classic "renamed in one place, missed in three
 * others" bug. Adding a new key: append, then update any place that
 * previously had its own copy.
 */
export const STORAGE_KEYS = {
  name: "daybrief:name",
  calendarUrl: "daybrief:calendar-url",
  manualLocation: "daybrief:manual-location",
  theme: "daybrief:theme",
  alarms: "daybrief:alarms",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
