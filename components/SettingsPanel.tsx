"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useTheme } from "@/lib/useTheme";
import { useBackHandler } from "@/lib/useBackHandler";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { ThemePicker } from "./ThemePicker";
import { NameSection } from "./settings/NameSection";
import { CalendarSection } from "./settings/CalendarSection";
import { CitySection } from "./settings/CitySection";

const SWIPE_DISMISS_PX = 120;
const SWIPE_DISMISS_VELOCITY = 500;

/**
 * Modal shell for the Settings sheet. Holds only modal state + a11y plumbing;
 * each row lives in its own component under `./settings/*`.
 */
export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const close = () => setOpen(false);
  useBackHandler(open, close);
  useBodyScrollLock(open);

  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus management — on open, jump to the close button; on close, return
  // focus to the gear icon so keyboard users land somewhere sensible.
  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>("[data-settings-close]")?.focus();
    });
  }, [open]);

  // Esc closes — desktop keyboard accessibility.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > SWIPE_DISMISS_PX || info.velocity.y > SWIPE_DISMISS_VELOCITY) {
      close();
    }
  }

  return (
    <>
      <motion.button
        ref={triggerRef}
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.92, rotate: 30 }}
        whileHover={{ rotate: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="neu-pill h-11 w-11 grid place-items-center text-ink-soft"
      >
        <GearIcon />
      </motion.button>

      {/*
        We split the modal into two pieces: backdrop and sheet. Backdrop is
        a sibling of the sheet in the DOM tree so the click-outside handler
        can stay trivially correct. The sheet is the only thing that
        responds to swipe-to-dismiss.
      */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <motion.div
              key="settings-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={onDragEnd}
              className="
                relative w-full sm:max-w-md
                bg-bg shadow-xl
                flex flex-col
                h-[92dvh] sm:h-auto sm:max-h-[90dvh]
                rounded-t-card-lg sm:rounded-card-lg
                overflow-hidden
                pb-[env(safe-area-inset-bottom)]
              "
            >
              <div
                aria-hidden
                className="sm:hidden pt-2 pb-1 grid place-items-center cursor-grab active:cursor-grabbing"
              >
                <span className="block w-10 h-1 rounded-full bg-ink-faint/40" />
              </div>

              <div className="flex items-center justify-between px-6 pt-3 sm:pt-6 pb-3 shrink-0">
                <h2 className="text-[18px] font-bold text-ink">Settings</h2>
                <button
                  onClick={close}
                  data-settings-close
                  aria-label="Close settings"
                  className="neu-pill h-9 w-9 grid place-items-center text-ink-soft"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 -webkit-overflow-scrolling-touch space-y-6">
                <NameSection />
                <ThemePicker applied={theme} onApply={setTheme} />
                <CalendarSection />
                <CitySection />

                <p className="text-[12px] text-ink-faint">
                  Everything is stored locally in your browser. No accounts, no tracking.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function GearIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
