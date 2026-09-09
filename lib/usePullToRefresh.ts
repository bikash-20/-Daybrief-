"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal pull-to-refresh. Only activates on touch devices at scrollTop=0,
 * fires onRefresh() once the user pulls past THRESHOLD and releases.
 * Avoids fighting native overscroll on iOS by keeping the gesture subtle.
 */
export function usePullToRefresh(onRefresh: () => void) {
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    let detached = false;
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0]?.clientY ?? null;
      triggered.current = false;
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || triggered.current) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - startY.current;
      if (window.scrollY === 0 && dy > 90) {
        triggered.current = true;
        onRefresh();
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
