import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daybrief",
  description: "Your morning dashboard — weather, calendar, and headlines in one tap.",
  applicationName: "Daybrief",
  keywords: ["dashboard", "weather", "calendar", "news", "morning brief", "pwa"],
  appleWebApp: {
    capable: true,
    title: "Daybrief",
    statusBarStyle: "black-translucent",
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
      // Windows pinned tile
      { rel: "msapplication-TileImage", url: "/icons/icon-256.png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#274FC2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Windows pinned-tile background color */}
        <meta name="msapplication-TileColor" content="#274FC2" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
