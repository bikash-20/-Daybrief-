"use client";

import { useCallback, useEffect, useState } from "react";

export type SaveState = "idle" | "saving" | "ok" | "saved" | "err";

/**
 * Settings form pattern: a local string state, write to localStorage on
 * save, broadcast a `daybrief:<key>-change` window event so other
 * components can react. Returns `{ value, setValue, save, status }`.
 *
 * Used by SettingsPanel for Name, Calendar URL, and City.
 */
export function useSettingsField({
  storageKey,
  changeEvent,
  parseStored,
  beforeSave,
  validator,
}: {
  storageKey: string;
  /** Window event name to broadcast after a successful save. */
  changeEvent: string;
  /**
   * Read the stored value as a string suitable for an <input>.
   * Default returns the raw localStorage string (or empty).
   */
  parseStored?: () => string;
  /**
   * Optional hook to run before writing — e.g. to validate or transform.
   * Return a non-empty string to write, an empty string to remove the key,
   * or null to abort the save (status flips to "err").
   */
  beforeSave?: (current: string) => string | null | Promise<string | null>;
  /** Optional sync validator; returns null if ok, an error key if not. */
  validator?: (value: string) => string | null;
}): {
  value: string;
  setValue: (v: string) => void;
  save: () => void | Promise<void>;
  status: SaveState;
} {
  const [value, setValue] = useState<string>("");
  const [status, setStatus] = useState<SaveState>("idle");

  // Hydrate from storage on mount only — keeps SSR/CSR markup aligned.
  useEffect(() => {
    if (parseStored) {
      setValue(parseStored());
      return;
    }
    try {
      setValue(localStorage.getItem(storageKey) ?? "");
    } catch {
      setValue("");
    }
  }, [storageKey, parseStored]);

  const broadcast = useCallback(() => {
    window.dispatchEvent(new Event(changeEvent));
  }, [changeEvent]);

  const save = useCallback(async () => {
    if (validator) {
      const err = validator(value);
      if (err) {
        setStatus("err");
        return;
      }
    }
    let toWrite = value;
    if (beforeSave) {
      setStatus("saving");
      const result = await beforeSave(value);
      if (result === null) {
        setStatus("err");
        return;
      }
      toWrite = result;
    }
    try {
      if (toWrite.trim()) {
        localStorage.setItem(storageKey, toWrite);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      setStatus("err");
      return;
    }
    broadcast();
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 1200);
  }, [value, validator, beforeSave, storageKey, broadcast]);

  return { value, setValue, save, status };
}
