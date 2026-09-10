"use client";

import { useEffect } from "react";

/**
 * When `locked`, prevents the body from scrolling behind a modal. Saves the
 * previous overflow + padding-right (compensating for any disappearing
 * scrollbar) so the page doesn't shift when the lock releases.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;
    const body = document.body;
    const html = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - html.clientWidth;
    body.style.overflow = "hidden";
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [locked]);
}
