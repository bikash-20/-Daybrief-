# Daybrief

A zero-cost, installable PWA morning dashboard: greeting, weather, calendar, and a quick news scroll. No accounts, no keys, no backend database.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- `@ducanh2912/next-pwa` (service worker, manifest, offline shell)
- Open-Meteo (weather + geocoding) — no API key
- `rss-parser` over public RSS feeds — no API key
- `ical.js` for ICS calendar feeds — no API key

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build + service worker
npm start            # serve production build
```

PWA service worker is generated only on `build` / `start`, not in dev (matches next-pwa defaults).

## Deploy

Push to a git remote and import on Vercel — no env vars required. Optionally set `NEWS_FEEDS` to a JSON array `[{name,url}]` to override defaults.

## Setup

Open the app, tap the header (or the install banner if shown), and fill in:

- **Name** — used in the greeting.
- **City** — fallback for weather when geolocation is denied. Or hit "Use device" to grant precise location.
- **Calendar ICS URL** — Google Calendar → Settings → *Integrate calendar* → *Secret address in iCal format*. iCloud and any other public ICS feed works too.

Everything is stored in `localStorage` only.

## API routes

| Route | Source | Caching |
|---|---|---|
| `GET /api/weather?city=…` or `?lat=…&lon=…` | Open-Meteo + reverse geocoding | 15 min |
| `GET /api/calendar?url=…` | Any http(s) ICS feed | 15 min |
| `GET /api/news` | BBC, NPR, Reuters, The Verge RSS | 15 min |

Each route returns `200 { ok: false, error }` instead of throwing, so a feed failure never blanks the screen — the cached last-good response stays visible offline.
