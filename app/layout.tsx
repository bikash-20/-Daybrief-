import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeApplier } from "@/components/ThemeApplier";
import { DEFAULT_THEME, THEMES, getThemeBg } from "@/lib/themes";
import { themeBootstrapScript } from "@/components/theme-init";

const SITE_URL = process.env.SITE_URL || "https://daybrief.app";

export const metadata: Metadata = {
  title: "Daybrief",
  description: "Your morning dashboard — weather, calendar, and headlines in one tap.",
  applicationName: "Daybrief",
  keywords: ["dashboard", "weather", "calendar", "news", "morning brief", "pwa"],
  appleWebApp: {
    capable: true,
    title: "Daybrief",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/favicon-32.png", sizes: "32x32" }],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icons/apple-touch-icon-ipad.png", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-ipad-pro.png", sizes: "152x152" },
    ],
    other: [
      { rel: "apple-touch-icon-precomposed", url: "/icons/apple-touch-icon.png", sizes: "180x180" },
      { rel: "msapplication-TileImage", url: "/icons/icon-256.png" },
    ],
  },
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Build the theme payload ONCE at module load. JSON.stringify handles every
// edge case (Unicode, quotes, `</script>`) so we never have to template-interpolate
// the user-controlled values into raw script.
const themePayload = {
  storageKey: "daybrief:theme",
  defaultId: DEFAULT_THEME,
  themes: THEMES.map((t) => ({
    id: t.id,
    bgHex: t.bgHex,
    isDark: t.colorScheme === "dark",
  })),
};

// Per-theme theme-color meta tags. Chromium 121+ uses these to drive the OS
// chrome color (PWA title bar, address bar, splash) live, even after install.
// Each has `media="(prefers-color-scheme: dark|light)"` so the right one
// activates per OS theme; within each scheme the JS ThemeApplier keeps the
// content attribute in sync with the user's selected theme.
const DARK_THEMES = ["mauve", "sunset", "ocean", "midnight", "chocolate-rose"] as const;
const LIGHT_THEMES = ["pink-rose"] as const;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The dark-theme fallback is the deepest of the dark themes (midnight);
  // the light fallback is pink-rose. Live JS overrides on hydration.
  const darkFallback = getThemeBg("midnight");
  const lightFallback = getThemeBg("pink-rose");
  const bootstrap = themeBootstrapScript({
    storageKey: "daybrief:theme",
    defaultId: DEFAULT_THEME,
    themes: THEMES.map((t) => ({
      id: t.id,
      bgHex: t.bgHex,
      isDark: t.colorScheme === "dark",
    })),
  });

  return (
    <html lang="en">
      <head>
        {/* Payload is JSON — safely serializable, no escape risk. */}
        <script
          id="__daybrief_theme_payload__"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(themePayload) }}
        />
        {/* Bootstrap reads the payload above and applies data-theme +
            theme-color to the matching meta tags before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
        {/* Per-theme theme-color meta tags — Chromium 121+ uses media queries
            to pick the right one for the current OS scheme, and the live
            JS updater mutates the matching tag when the user picks a theme. */}
        {DARK_THEMES.map((id) => (
          <meta
            key={`tc-d-${id}`}
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content={darkFallback}
            data-theme-id={id}
          />
        ))}
        {LIGHT_THEMES.map((id) => (
          <meta
            key={`tc-l-${id}`}
            name="theme-color"
            media="(prefers-color-scheme: light)"
            content={lightFallback}
            data-theme-id={id}
          />
        ))}
        {/* No-media fallback used by older Safari + Windows tile. */}
        <meta name="theme-color" content={getThemeBg(DEFAULT_THEME)} />
        <meta name="msapplication-TileColor" content={getThemeBg(DEFAULT_THEME)} />
      </head>
      <body className="antialiased">
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
