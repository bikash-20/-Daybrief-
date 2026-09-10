"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal pull-to-refresh. Only activates on touch devices at scrollTop=0,
 * fires onRefresh() once the user pulls past THRESHOLD and releases.
 * Avoids fighting native overscroll on iOS by keeping the gesture subtle.
 *
 * Scoped to a target element (defaults to <main>) so scrolling inside
 * nested scroll regions (settings sheet, assistant chat) doesn't trigger
 * a page refresh.
 *
 * Debounced: a second pull can't fire while a refresh is in flight.
 */
export function usePullToRefresh(
  onRefresh: () => void,
  target?: HTMLElement | null,
) {
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);
  const inFlight = useRef(false);
  const pulledPx = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el: HTMLElement | Window =
      target ?? document.querySelector("main") ?? window;

    const getScrollTop = (): number => {
      if (el === window) return window.scrollY;
      return (el as HTMLElement).scrollTop;
    };

    function onTouchStart(e: Event) {
      const te = e as TouchEvent;
      if (getScrollTop() > 0 || inFlight.current) {
        startY.current = null;
        return;
      }
      startY.current = te.touches[0]?.clientY ?? null;
      triggered.current = false;
      pulledPx.current = 0;
    }

    function onTouchMove(e: Event) {
      const te = e as TouchEvent;
      if (startY.current == null || triggered.current || inFlight.current) return;
      const y = te.touches[0]?.clientY ?? 0;
      const dy = y - startY.current;
      pulledPx.current = Math.max(0, dy);
      if (getScrollTop() === 0 && dy > 90) {
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
      pulledPx.current = 0;
    }

    el.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    el.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    el.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart as EventListener);
      el.removeEventListener("touchmove", onTouchMove as EventListener);
      el.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, [onRefresh, target]);

  /** Live pull distance in px for a visual indicator (0 when not pulling). */
  return { getPulledPx: () => pulledPx.current };
}
