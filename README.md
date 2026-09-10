# Daybrief


Daybrief is a personal morning dashboard that brings the day's essentials into one fast, installable PWA: greeting, local weather, calendar events, alarms, headlines, and an AI assistant. live link: https://daybrief-git-main-bikash-20s-projects.vercel.app/
<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/6fc0fca7-7d08-4294-b496-c4751cd94949" />
<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/6eb58f0d-5b8b-4552-85da-adbf0fc8f002" />
<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/d6407fa7-5c47-4654-aadb-bb65de410bce" />




It is designed for mobile first use, works without an account, and stores user preferences in the browser. There is no application database.

## Features

### Morning dashboard

- Personalized greeting using the saved display name.
- Current date and an animated analog clock.
- Current temperature, condition, daily high, and daily low.
- Automatic device geolocation with a manual city fallback.
- Calendar month view with today highlighted.
- Upcoming calendar events for the next 48 hours.
- Top stories from multiple RSS feeds with source, summary, relative time, and external article links.
- Pull-to-refresh for weather, calendar, and news data.
- Graceful loading, empty, offline, and upstream-error states.

### Calendar

- Accepts any public HTTP(S) ICS feed, including Google Calendar secret iCal URLs and iCloud calendars.
- Supports a deployment-level fallback calendar through `ICS_FEED_URL`.
- User calendar URLs stay in the browser and are sent only when loading that user's calendar.
- Displays up to five events from the next 48 hours and shows the first three in the dashboard.

### Alarms

- Add alarms with a time and optional label.
- Enable or disable individual alarms.
- Delete alarms.
- Optional browser notifications and an in-app audio tone.
- Alarm data persists locally.

Alarms fire only while the Daybrief tab or installed PWA is open. Browser and iOS restrictions prevent this feature from acting as a guaranteed background phone alarm.

### AI assistant

- Ask questions about the current weather, calendar, alarms, headlines, and saved location.
- Also supports general questions when Daybrief context is unavailable.
- Starter prompts for common morning workflows.
- Markdown, code, links, lists, and math rendering in assistant replies.
- Conversation history persists for the current browser session, up to 30 messages.
- Uses an OpenRouter model cascade with live free-model discovery, preferred-model support, and fallback safety tiers.
- Shows the model and cascade tier used for each response.

The assistant is optional. Configure `OPENROUTER_API_KEY` on the server to enable it.

### Personalization and mobile UX

- Six themes: Deep Mauve, Sunset, Ocean, Midnight, Chocolate Rose, and Pink Rose.
- Theme selection updates the browser and installed-PWA chrome color.
- Install prompt support for browsers that expose `beforeinstallprompt`.
- Standalone portrait PWA manifest with icons and a Refresh brief shortcut.
- Service-worker caching for the application shell, API responses, and images.
- Responsive layouts for narrow phones through large desktop screens.
- Safe-area support for iPhone notches and home indicators.
- Touch targets sized for mobile use, with keyboard-aware assistant input positioning.
- Settings sheet with mobile swipe-to-dismiss, desktop Escape support, and focus restoration.

## Stack

- Next.js 14 App Router
- React 18 and TypeScript
- Tailwind CSS
- Framer Motion
- `@ducanh2912/next-pwa`
- Open-Meteo for weather and geocoding
- `rss-parser` for RSS feeds
- `node-ical` for ICS calendars
- OpenRouter for the optional AI assistant
- `react-markdown`, GitHub Flavored Markdown, KaTeX, and syntax highlighting

## Requirements

- Node.js 18.17 or newer
- npm

## Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run lint      # ESLint
npm run build     # production build and service worker generation
npm start         # serve the production build
```

The PWA service worker is disabled during development and generated during a production build.

## Configuration

Create `.env.local` when you need server-side configuration:

```bash
# Optional: enables the AI assistant
OPENROUTER_API_KEY=your-server-side-key

# Optional: put a preferred OpenRouter model at the front of the fallback list
OPENROUTER_PREFERRED_MODEL=provider/model:free

# Optional: default public calendar for the deployment
ICS_FEED_URL=https://example.com/calendar.ics

# Optional: JSON array replacing the default news feeds
NEWS_FEEDS='[{"name":"Example News","url":"https://example.com/rss.xml"}]'

# Optional: used for metadata and OpenRouter request attribution
SITE_URL=https://example.com
```

Never expose `OPENROUTER_API_KEY` in client-side code or commit `.env.local`.

## First-time setup

1. Open Settings from the gear button.
2. Set a display name for the greeting.
3. Set a city or allow device location access for weather.
4. Add a public calendar ICS URL if calendar events are needed.
5. Choose a theme.
6. Add alarms and grant notification permission if desired.
7. Install Daybrief from the browser install prompt when available.

All settings, alarms, selected themes, and user calendar/location data are stored locally in browser storage. Assistant history uses session storage and is limited to the current browser session.

## API routes

| Route | Purpose | Cache behavior |
|---|---|---|
| `GET /api/weather?lat=...&lon=...` | Current weather and today's high/low from Open-Meteo | Upstream revalidation for 10 minutes |
| `GET /api/calendar?url=...` | Parse a user-supplied ICS feed; `webcal://` is normalized to HTTPS | Route revalidation for 10 minutes |
| `GET /api/news` | Fetch, deduplicate, sort, and limit RSS headlines | Route/cache headers for 15 minutes |
| `POST /api/chat` | Generate an assistant reply through OpenRouter | No-store response |

The weather card obtains coordinates through the browser location flow and the settings city geocoder. Calendar and news failures return usable empty/error states instead of blanking the dashboard. Previously successful news data is retained in local storage for offline display.

## Deploy

The app can be deployed to Vercel or another Node-compatible host:

1. Push the repository to a Git remote.
2. Import the repository into the hosting provider.
3. Add the optional environment variables in the provider dashboard.
4. Build with `npm run build` and serve with `npm start` when a custom server is required.

No database or migration step is required.
