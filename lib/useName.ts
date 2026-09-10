"use client";

import { useEffect, useState } from "react";

const NAME_KEY = "daybrief:name";

export const NAME_STORAGE_KEY = NAME_KEY;

/**
 * Read the user-set display name from localStorage.
 *
 * Listens for a `daybrief:name-change` window event so consumers
 * (e.g. Header) re-render immediately after the SettingsPanel saves.
 * Returns `null` while reading on the client; pass a `fallback` for
 * the pre-hydration / unset case.
 */
export function useName(fallback = "friend"): string {
  const [name, setName] = useState<string>(fallback);

  useEffect(() => {
    function sync() {
      try {
        const v = localStorage.getItem(NAME_KEY)?.trim();
        setName(v && v.length > 0 ? v : fallback);
      } catch {
        setName(fallback);
      }
    }
    sync();
    window.addEventListener("daybrief:name-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("daybrief:name-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [fallback]);

  return name;
}
