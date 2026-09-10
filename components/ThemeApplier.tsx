"use client";

import { useEffect } from "react";
import { useTheme } from "@/lib/useTheme";
import { getThemeBg } from "@/lib/themes";

/**
 * Mounted at the root layout. The inline script in <head> already applies the
 * theme pre-paint to avoid FOUC; this client component mirrors any later
 * changes (cross-tab, settings save) onto:
 *   - <html data-theme="...">     — drives all CSS variables
 *   - <meta name="theme-color">   — drives PWA title bar / address bar color
 *   - <meta name="msapplication-TileColor"> — Windows pinned tile
 *
 * Renders nothing visible.
 */
export function ThemeApplier() {
  const { theme } = useTheme();

  useEffect(() => {
    const hex = getThemeBg(theme);

    // 1. Bare (no-media) theme-color — used by Safari + Windows tile + fallback.
    setMeta("theme-color", hex);
    setMeta("msapplication-TileColor", hex);

    // 2. Per-theme-color meta tags with media queries. Chromium 121+ uses
    // these to recolor the OS chrome based on the user's selected theme,
    // even on already-installed PWAs. We mutate the data-theme-id="<id>"
    // tag whose id matches the current theme.
    const tagged = document.querySelectorAll(
      `meta[name="theme-color"][data-theme-id="${theme}"]`,
    );
    tagged.forEach((m) => m.setAttribute("content", hex));

    // 3. Make sure the OTHER theme-color tags aren't stale — set them to
    // their own theme's bg so the next swap is instant. (Cheap; only 6.)
    const all = document.querySelectorAll('meta[name="theme-color"][data-theme-id]');
    all.forEach((m) => {
      const id = m.getAttribute("data-theme-id");
      if (id && id !== theme) {
        m.setAttribute("content", getThemeBg(id as typeof theme));
      }
    });
  }, [theme]);

  return null;
}

function setMeta(name: string, content: string) {
  const el = document.querySelector(`meta[name="${name}"]:not([media])`);
  if (el) el.setAttribute("content", content);
}
