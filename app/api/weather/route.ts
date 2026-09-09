import { NextRequest, NextResponse } from "next/server";

export const revalidate = 900; // 15 min

type Current = {
  temperature: number;
  apparent: number;
  weatherCode: number;
  high: number;
  low: number;
  isDay: boolean;
};
type Geo = { name: string; admin1?: string; country?: string; timezone: string };

const WMO: Record<number, { label: string; icon: string; gradient: [string, string, string] }> = {
  0: { label: "Clear", icon: "☀️", gradient: ["#5BA8FF", "#3B7BE0", "#1F4FB8"] },
  1: { label: "Mostly clear", icon: "🌤️", gradient: ["#5BA8FF", "#3B7BE0", "#1F4FB8"] },
  2: { label: "Partly cloudy", icon: "⛅", gradient: ["#7BB6F0", "#5489C9", "#2E5BAA"] },
  3: { label: "Overcast", icon: "☁️", gradient: ["#8C97AD", "#5F6A82", "#3A4259"] },
  45: { label: "Fog", icon: "🌫️", gradient: ["#9DA8B8", "#6B7588", "#414A5E"] },
  48: { label: "Rime fog", icon: "🌫️", gradient: ["#9DA8B8", "#6B7588", "#414A5E"] },
  51: { label: "Light drizzle", icon: "🌦️", gradient: ["#6C8FC2", "#4F6E9C", "#314D77"] },
  53: { label: "Drizzle", icon: "🌦️", gradient: ["#6C8FC2", "#4F6E9C", "#314D77"] },
  55: { label: "Heavy drizzle", icon: "🌧️", gradient: ["#6C8FC2", "#4F6E9C", "#314D77"] },
  61: { label: "Light rain", icon: "🌧️", gradient: ["#5C7FB6", "#3F5F92", "#28426E"] },
  63: { label: "Rain", icon: "🌧️", gradient: ["#5C7FB6", "#3F5F92", "#28426E"] },
  65: { label: "Heavy rain", icon: "🌧️", gradient: ["#4E6F9F", "#324F7A", "#1E3357"] },
  71: { label: "Light snow", icon: "🌨️", gradient: ["#A8C2DD", "#7B97B5", "#566E89"] },
  73: { label: "Snow", icon: "❄️", gradient: ["#A8C2DD", "#7B97B5", "#566E89"] },
  75: { label: "Heavy snow", icon: "❄️", gradient: ["#A8C2DD", "#7B97B5", "#566E89"] },
  80: { label: "Showers", icon: "🌦️", gradient: ["#5C7FB6", "#3F5F92", "#28426E"] },
  81: { label: "Heavy showers", icon: "🌧️", gradient: ["#4E6F9F", "#324F7A", "#1E3357"] },
  82: { label: "Violent showers", icon: "⛈️", gradient: ["#3F567F", "#27395A", "#15213A"] },
  95: { label: "Thunderstorm", icon: "⛈️", gradient: ["#3F567F", "#27395A", "#15213A"] },
  96: { label: "Thunder + hail", icon: "⛈️", gradient: ["#3F567F", "#27395A", "#15213A"] },
  99: { label: "Thunder + heavy hail", icon: "⛈️", gradient: ["#3F567F", "#27395A", "#15213A"] },
};

const fallback = { label: "Unknown", icon: "🌡️", gradient: ["#5BA8FF", "#3B7BE0", "#1F4FB8"] } as const;

export type WeatherResponse = {
  ok: true;
  location: Geo;
  current: Current;
  label: string;
  icon: string;
  gradient: [string, string, string];
  updatedAt: number;
} | {
  ok: false;
  error: string;
};

async function reverseGeocode(lat: number, lon: number): Promise<Geo> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const r = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!r.ok) throw new Error(`geocoding ${r.status}`);
  const data = (await r.json()) as { results?: Array<{ name: string; admin1?: string; country?: string; timezone?: string }> };
  const first = data.results?.[0];
  if (!first) throw new Error("no geocoding result");
  return {
    name: first.name,
    admin1: first.admin1,
    country: first.country,
    timezone: first.timezone ?? "UTC",
  };
}

async function geocodeName(name: string): Promise<{ lat: number; lon: number } & Geo> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const r = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!r.ok) throw new Error(`geocoding ${r.status}`);
  const data = (await r.json()) as { results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string; timezone?: string }> };
  const first = data.results?.[0];
  if (!first) throw new Error("city not found");
  return {
    lat: first.latitude,
    lon: first.longitude,
    name: first.name,
    admin1: first.admin1,
    country: first.country,
    timezone: first.timezone ?? "UTC",
  };
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  const city = req.nextUrl.searchParams.get("city");

  try {
    let coords: { lat: number; lon: number };
    let location: Geo;

    if (lat && lon) {
      coords = { lat: Number(lat), lon: Number(lon) };
      location = await reverseGeocode(coords.lat, coords.lon);
    } else if (city) {
      const g = await geocodeName(city);
      coords = { lat: g.lat, lon: g.lon };
      location = { name: g.name, admin1: g.admin1, country: g.country, timezone: g.timezone };
    } else {
      return NextResponse.json<WeatherResponse>(
        { ok: false, error: "Provide lat+lon or city." },
        { status: 400 },
      );
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(coords.lat));
    url.searchParams.set("longitude", String(coords.lon));
    url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,is_day");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
    url.searchParams.set("timezone", location.timezone || "auto");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("temperature_unit", "celsius");

    const r = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!r.ok) throw new Error(`forecast ${r.status}`);
    const data = (await r.json()) as {
      current: { temperature_2m: number; apparent_temperature: number; weather_code: number; is_day: number };
      daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
    };

    const code = data.current.weather_code;
    const meta = WMO[code] ?? fallback;
    // Soften the gradient at night.
    const gradient: [string, string, string] =
      data.current.is_day === 0
        ? ["#243559", "#172245", "#0A0F25"]
        : meta.gradient;

    const body: WeatherResponse = {
      ok: true,
      location,
      current: {
        temperature: Math.round(data.current.temperature_2m),
        apparent: Math.round(data.current.apparent_temperature),
        weatherCode: code,
        high: Math.round(data.daily.temperature_2m_max[0]),
        low: Math.round(data.daily.temperature_2m_min[0]),
        isDay: data.current.is_day === 1,
      },
      label: meta.label,
      icon: meta.icon,
      gradient,
      updatedAt: Date.now(),
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=900" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "weather fetch failed";
    return NextResponse.json<WeatherResponse>({ ok: false, error: message }, { status: 200 });
  }
}
