"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { THEMES, type ThemeId } from "@/lib/themes";

type Props = {
  applied: ThemeId;
  onApply: (next: ThemeId) => void;
};

export function ThemePicker({ applied, onApply }: Props) {
  const [focusId, setFocusId] = useState<ThemeId>(applied);
  const focused = THEMES.find((t) => t.id === focusId) ?? THEMES[0];
  const dirty = focusId !== applied;

  function commit() {
    onApply(focusId);
  }

  function reset() {
    setFocusId(applied);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[12px] font-semibold text-ink">Theme</div>
        <div className="text-[11px] text-ink-soft">Changes the entire app instantly.</div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {THEMES.map((t) => {
          const isActive = t.id === applied;
          const isFocused = t.id === focusId;
          return (
            <motion.button
              key={t.id}
              onClick={() => setFocusId(t.id)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              aria-pressed={isFocused}
              aria-label={`Preview ${t.label}`}
              className="relative h-16 rounded-2xl text-left p-2 overflow-hidden"
              style={{
                background: t.swatch.bg,
                boxShadow: isFocused
                  ? `0 0 0 2px ${t.swatch.accent}, -4px -4px 10px rgba(0,0,0,0.18), 5px 5px 12px rgba(0,0,0,0.22)`
                  : "0 2px 6px rgba(0,0,0,0.18)",
              }}
            >
              <span
                className="absolute top-1 right-1 inline-block w-2 h-2 rounded-full"
                style={{ background: t.swatch.accent }}
                aria-hidden
              />
              <span
                className="absolute bottom-1 left-2 text-[10px] font-bold tracking-wide truncate"
                style={{ color: t.swatch.text }}
              >
                {t.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-1 left-1 text-[8px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full"
                  style={{ background: t.swatch.accent, color: t.swatch.bg }}
                >
                  Active
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Live preview — re-cascades tokens via [data-theme] on a sub-tree. */}
      <div
        data-theme={focused.id}
        className="rounded-2xl p-4"
        style={{
          background: `radial-gradient(700px 300px at 0% 0%, ${focused.swatch.accent}33, transparent 70%), var(--bg)`,
          border: "1px solid var(--divider)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--text-faint)" }}>
            Preview · {focused.label}
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {focused.blurb}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="h-[80px] w-[80px] rounded-full grid place-items-center text-[11px] font-bold"
            style={{
              background: "var(--sunken)",
              color: "var(--text-soft)",
              boxShadow: "inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)",
            }}
          >
            Clock
          </div>
          <div
            className="flex-1 rounded-card p-3"
            style={{
              background: "var(--card)",
              color: "var(--text)",
              boxShadow: "-6px -6px 14px var(--shadow-light), 7px 7px 16px var(--shadow-dark)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: "var(--text-faint)" }}>
              Today
            </div>
            <div className="text-[24px] font-bold leading-tight mt-0.5">31°C</div>
            <div className="text-[11px] mt-1" style={{ color: "var(--text-soft)" }}>
              Mostly clear · H 33° · L 26°
            </div>
            <div
              className="mt-3 inline-block px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: "linear-gradient(135deg, var(--accent-1), var(--accent-3))",
                color: "var(--bg)",
              }}
            >
              Accent gradient
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          onClick={commit}
          disabled={!dirty}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="neu-pill px-4 py-2 text-[12px] font-semibold text-ink disabled:opacity-40"
        >
          Apply theme
        </motion.button>
        <motion.button
          onClick={reset}
          disabled={!dirty}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="neu-pill px-4 py-2 text-[12px] font-semibold text-ink-soft disabled:opacity-40"
        >
          Reset
        </motion.button>
      </div>

      <p className="text-[10px] text-ink-faint">
        The page background, all surfaces, and the browser address bar color update instantly.
        The OS-level PWA title bar is set when you install the app and won&apos;t change
        between installs — reinstall once after picking your theme to lock in the right color.
      </p>
    </div>
  );
}
