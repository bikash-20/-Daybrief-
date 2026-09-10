"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal pull-to-refresh. Only activates on touch devices at scrollTop=0,
 * fires onRefresh() once the user pulls past THRESHOLD and releases.
 * Avoids fighting native overscroll on iOS by keeping the gesture subtle.
 *
 * Debounced: a second pull can't fire while a refresh is in flight.
 */
export function usePullToRefresh(onRefresh: () => void) {
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);
  const inFlight = useRef(false);

  useEffect(() => {
    let detached = false;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0 || inFlight.current) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0]?.clientY ?? null;
      triggered.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || triggered.current || inFlight.current) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - startY.current;
      if (window.scrollY === 0 && dy > 90) {
        triggered.current = true;
        inFlight.current = true;
        onRefresh();
        // Release the in-flight guard a beat later than the refresh animation,
        // so a fast re-pull can't trigger a second refresh while the page
        // is still settling.
        window.setTimeout(() => {
          inFlight.current = false;
        }, 1200);
      }
    }

    function onTouchEnd() {
      startY.current = null;
    }

    if (!detached) {
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
    }

    return () => {
      detached = true;
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh]);
}
