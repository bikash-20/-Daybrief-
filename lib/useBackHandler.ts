"use client";

import { useEffect } from "react";

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
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  useEffect(() => {
    if (!active) return;
    const SENTINEL = "__daybrief_back_sentinel__";
    window.history.pushState({ [SENTINEL]: true }, "");

    function onPop(e: PopStateEvent) {
      // If the popped state isn't ours, the user is leaving the page — let it.
      if (e.state && typeof e.state === "object" && SENTINEL in e.state) return;
      onBack();
    }
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // When closing via UI (X button, etc.), the sentinel is still on the
      // stack. Replace it with `null` so the real previous entry is restored
      // — otherwise the next back press would do nothing useful.
      if (window.history.state && SENTINEL in (window.history.state as object)) {
        window.history.back();
      }
    };
  }, [active, onBack]);
}
