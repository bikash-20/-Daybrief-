import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeApplier } from "@/components/ThemeApplier";
import { DEFAULT_THEME } from "@/lib/themes";

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

// Inline FOUC-prevention: applies the stored theme attribute to <html> before
// any React or stylesheet activity, so users never see a flash of the wrong
// theme on cold load.
const themeInitScript = `
(function(){try{
  var k='daybrief:theme';
  var d=document.documentElement;
  var v=localStorage.getItem(k);
  d.setAttribute('data-theme', v && /^(mauve|sunset|ocean|midnight|chocolate-rose|pink-rose)$/.test(v) ? v : '${DEFAULT_THEME}');
}catch(e){}})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Tile color kept generic cream — the live theme-color is set per-page
            by the client ThemeApplier so newly-installed PWAs will pick up the
            user's chosen theme via the manifest read on next install. */}
        <meta name="msapplication-TileColor" content="#ECE9E3" />
      </head>
      <body className="antialiased">
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
