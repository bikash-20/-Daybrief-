export type Settings = {
  name: string;
  city: string | null; // fallback when geolocation denied
  calendarUrl: string | null;
  feeds: string | null; // optional: serialized JSON of feed list (client-side cache only)
};

const KEY = "daybrief.settings.v1";

export const DEFAULT_SETTINGS: Settings = {
  name: "friend",
  city: null,
  calendarUrl: null,
  feeds: null,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode — ignore */
  }
}
