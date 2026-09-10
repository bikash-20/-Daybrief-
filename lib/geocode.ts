/**
 * Open-Meteo geocoding client. Returns the top match for a city name, or
 * null if the lookup failed or returned no results.
 *
 * Used by SettingsPanel when the user saves a manual city. Kept tiny and
 * dependency-free so it can be unit-tested without spinning up a network.
 */
export type GeocodeResult = {
  lat: number;
  lon: number;
  label: string;
};

export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return null;
    return {
      lat: first.latitude,
      lon: first.longitude,
      label: `${first.name}, ${first.admin1 ?? first.country}`,
    };
  } catch {
    return null;
  }
}
