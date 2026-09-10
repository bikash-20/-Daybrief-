"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes";
import { STORAGE_KEYS } from "./storageKeys";

export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;
export const THEME_CHANGE_EVENT = "daybrief:theme-change";

function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);
}

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Read/write the active theme id. Synchronizes <html data-theme="..."> on mount
 * and on every change, and persists to localStorage. Other components can
 * listen on `daybrief:theme-change` if they need to re-render reactive content.
 */
export function useTheme(): {
  theme: ThemeId;
  setTheme: (next: ThemeId) => void;
  hydrated: boolean;
} {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const next = readStoredTheme();
    setThemeState(next);
    applyTheme(next);
    setHydrated(true);
    function onSync() {
      const v = readStoredTheme();
      setThemeState(v);
      applyTheme(v);
    }
    window.addEventListener(THEME_CHANGE_EVENT, onSync);
    window.addEventListener("storage", onSync);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onSync);
      window.removeEventListener("storage", onSync);
    };
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    if (!isThemeId(next)) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* quota — ignore, apply still works for the session */
    }
    applyTheme(next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: next } }));
  }, []);

  return { theme, setTheme, hydrated };
}
