import type { NewsItem, NewsResponse } from "@/app/api/news/route";

export type CalEvent = { title: string; start: string; end: string };
export type CalSnapshot = {
  source: "user" | "default" | "none";
  events: CalEvent[];
};
export type WeatherSnapshot = {
  tempNow: number;
  high: number;
  low: number;
  condition: string;
  updatedAt: string;
};
export type Alarm = {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
};
export type LocationSnapshot = { label: string };

export type DaybriefContext = {
  generatedAt: string;
  userName: string;
  location: LocationSnapshot | null;
  weather: WeatherSnapshot | null;
  calendar: CalSnapshot | null;
  alarms: Alarm[];
  news: NewsItem[];
};

export type ChatContextPayload =
  | { kind: "weather"; data: WeatherSnapshot | null; error?: string }
  | { kind: "calendar"; data: CalSnapshot | null; error?: string }
  | { kind: "alarms"; data: Alarm[] }
  | { kind: "news"; data: NewsItem[]; error?: string }
  | { kind: "user"; data: { name: string; location: LocationSnapshot | null } }
  | { kind: "generatedAt"; data: string };

export const ALARMS_STORAGE_KEY = "daybrief:alarms";
export const NAME_STORAGE_KEY = "daybrief:name";
export const MANUAL_LOCATION_KEY = "daybrief:manual-location";

/**
 * Read the raw pieces the assistant needs directly from localStorage.
 * Browser-only. Caller must guard with `typeof window !== "undefined"`.
 */
export function readClientSnapshot(): {
  userName: string;
  location: LocationSnapshot | null;
  alarms: Alarm[];
} {
  const name = localStorage.getItem(NAME_STORAGE_KEY)?.trim();
  const userName = name && name.length > 0 ? name : "friend";
  let location: LocationSnapshot | null = null;
  try {
    const raw = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { label?: string };
      if (typeof parsed.label === "string") location = { label: parsed.label };
    }
  } catch {
    /* ignore */
  }
  let alarms: Alarm[] = [];
  try {
    const raw = localStorage.getItem(ALARMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        alarms = parsed.filter(
          (a): a is Alarm =>
            a &&
            typeof a.id === "string" &&
            typeof a.time === "string" &&
            typeof a.label === "string" &&
            typeof a.enabled === "boolean",
        );
      }
    }
  } catch {
    /* ignore */
  }
  return { userName, location, alarms };
}

async function fetchWeather(): Promise<WeatherSnapshot | null> {
  try {
    const manual = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (!manual) return null;
    const parsed = JSON.parse(manual) as { lat?: number; lon?: number };
    if (typeof parsed.lat !== "number" || typeof parsed.lon !== "number") return null;
    const res = await fetch(
      `/api/weather?lat=${parsed.lat}&lon=${parsed.lon}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as WeatherSnapshot | { error: string };
    if ("error" in data) return null;
    return data;
  } catch {
    return null;
  }
}

async function fetchCalendar(): Promise<CalSnapshot | null> {
  try {
    const userUrl = localStorage.getItem("daybrief:calendar-url");
    const endpoint = userUrl
      ? `/api/calendar?url=${encodeURIComponent(userUrl)}`
      : "/api/calendar";
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as
      | { configured: boolean; source: CalSnapshot["source"]; events: CalEvent[] }
      | { configured: boolean };
    if (!data.configured) return null;
    return {
      source: "source" in data ? data.source : "none",
      events: "events" in data ? data.events : [],
    };
  } catch {
    return null;
  }
}

async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch("/api/news", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as NewsResponse;
    if (!data.ok) return [];
    return data.items;
  } catch {
    return [];
  }
}

/**
 * Build a full Daybrief context by hitting the existing data APIs in parallel.
 * Browser-only. Returns a serializable, JSON-safe object ready to ship to /api/chat.
 */
export async function loadAssistantContext(): Promise<DaybriefContext> {
  const local = readClientSnapshot();
  const [weather, calendar, news] = await Promise.all([
    fetchWeather(),
    fetchCalendar(),
    fetchNews(),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    userName: local.userName,
    location: local.location,
    weather,
    calendar,
    alarms: local.alarms,
    news,
  };
}
