import { NextRequest, NextResponse } from "next/server";

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Light Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Rain Showers",
  95: "Thunderstorm",
};

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=auto`;

  const upstream = await fetch(url, {
    next: { revalidate: 600 },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "weather upstream failed" }, { status: 502 });
  }

  const data = await upstream.json();

  return NextResponse.json({
    tempNow: Math.round(data.current.temperature_2m),
    high: Math.round(data.daily.temperature_2m_max[0]),
    low: Math.round(data.daily.temperature_2m_min[0]),
    condition: WMO_LABELS[data.current.weather_code] ?? "Unknown",
    updatedAt: new Date().toISOString(),
  });
}
