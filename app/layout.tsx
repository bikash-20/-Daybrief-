import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeApplier } from "@/components/ThemeApplier";
import { DEFAULT_THEME, THEMES, getThemeBg } from "@/lib/themes";

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

// Per-theme theme-color meta tags. Chromium 121+ uses these to drive the OS
// chrome color (PWA title bar, address bar, splash) live, even after install.
// Each has `media="(prefers-color-scheme: dark|light)"` so the right one
// activates per OS theme; within each scheme the JS ThemeApplier keeps the
// content attribute in sync with the user's selected theme.
const THEME_HEXES = THEMES.map((t) => t.bgHex).join("|");
const THEME_IDS_RE = THEMES.map((t) => t.id).join("|");

// Inline FOUC-prevention: applies the stored theme to <html> AND syncs the
// theme-color / msapplication-TileColor meta tags to the matching bg hex —
// so the OS chrome color matches the app on cold load with no flash.
const themeInitScript = `
(function(){
  try {
    var k = 'daybrief:theme';
    var ids = '${THEME_IDS_RE}'.split('|');
    var hexes = '${THEME_HEXES}'.split('|');
    var def = '${DEFAULT_THEME}';
    var v = localStorage.getItem(k);
    var i = ids.indexOf(v);
    var id = i >= 0 ? v : def;
    var hex = i >= 0 ? hexes[i] : hexes[ids.indexOf(def)];

    document.documentElement.setAttribute('data-theme', id);

    var setMeta = function(name, content) {
      var el = document.querySelector('meta[name="' + name + '"]');
      if (el) el.setAttribute('content', content);
    };
    var darkSchemes = ['mauve','sunset','ocean','midnight','chocolate-rose'];
    var schemes = document.querySelectorAll('meta[name="theme-color"][media]');
    schemes.forEach(function(m){
      var isDark = m.getAttribute('media').indexOf('dark') >= 0;
      m.setAttribute('content', darkSchemes.indexOf(id) >= 0 ? hex : (isDark ? hexes[hexes.length-1] : hex));
    });
    setMeta('theme-color', hex);
    setMeta('msapplication-TileColor', hex);
  } catch (e) {}
})();
`.trim();

// Build the six per-theme theme-color meta tags (3 dark + 1 light Pink Rose).
// Pink Rose ships under the light media query; the dark themes all share the
// dark scheme, so we pick the most contrasting one per media query as the
// static fallback. The live ThemeApplier updates these at runtime.
const darkThemeIds = ["mauve", "sunset", "ocean", "midnight", "chocolate-rose"] as const;
const lightThemeIds = ["pink-rose"] as const;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The dark-theme fallback is the deepest of the dark themes (midnight);
  // the light fallback is pink-rose. Live JS overrides on hydration.
  const darkFallback = getThemeBg("midnight");
  const lightFallback = getThemeBg("pink-rose");

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Per-theme theme-color meta tags — Chromium 121+ uses media queries
            to pick the right one for the current OS scheme, and the live
            JS updater mutates the matching tag when the user picks a theme. */}
        {darkThemeIds.map((id) => (
          <meta
            key={`tc-d-${id}`}
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content={darkFallback}
            data-theme-id={id}
          />
        ))}
        {lightThemeIds.map((id) => (
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
