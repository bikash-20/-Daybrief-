"use client";

import { useEffect, useRef } from "react";

/**
 * Mobile-friendly "back" affordance. When `active` is true, pushes a sentinel
 * `history` entry so the browser's back button (desktop, mobile Safari,
 * Android hardware back) pops our handler instead of leaving the page.
 *
 * Returns nothing; the caller closes the modal inside `onBack`.
 *
 * Pattern: when the modal opens, we pushState a no-op entry. When the user
 * hits back, the browser fires `popstate`, we run `onBack`, and we replace
 * the sentinel with the real page so the next back actually navigates.
 *
 * Race-safety: an instanceId is generated per activation. popstate events
 * that don't match the active instance are ignored. This prevents a rapid
 * active→inactive→active cycle from leaving the wrong sentinel on the stack
 * or closing the wrong modal.
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const instanceRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const SENTINEL = "__daybrief_back_sentinel__";
    const myInstance = ++instanceRef.current;
    window.history.pushState({ [SENTINEL]: true, i: myInstance }, "");

    function onPop(e: PopStateEvent) {
      // The sentinel always pops first; the second pop is what triggers onBack.
      // We just need to make sure we only run onBack once for our instance.
      if (e.state && typeof e.state === "object" && SENTINEL in e.state) return;
      if (instanceRef.current !== myInstance) return;
      onBack();
    }

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      // Only clear the sentinel if we're still the active instance.
      // If a new mount has already taken over (rapid reopen), don't undo it.
      if (instanceRef.current !== myInstance) return;
      instanceRef.current = 0;
      const state = window.history.state as Record<string, unknown> | null;
      if (state && typeof state === "object" && SENTINEL in state) {
        window.history.back();
      }
    };
  }, [active, onBack]);
}
