"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the browser's visual viewport — the part of the layout viewport
 * not covered by the on-screen keyboard. Returns the keyboard height in
 * CSS pixels (0 when closed) plus the visual viewport height.
 *
 * Use `keyboardHeight` to translate fixed bottom elements above the
 * keyboard. Use `visualHeight` when you want to size a layout to what the
 * user can actually see (instead of the inflated layout viewport).
 *
 * Safe on SSR (returns zeros), safe when the API is missing (returns
 * zeros), and safe inside Android Chrome's predictive-keyboard state
 * transitions (debounces via the visualViewport `resize` event).
 */
export function useVisualViewport(): {
  keyboardHeight: number;
  visualHeight: number;
} {
  const [state, setState] = useState<{ keyboardHeight: number; visualHeight: number }>({
    keyboardHeight: 0,
    visualHeight: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // On mobile, when the keyboard opens, layout viewport height stays
      // the same but visual viewport shrinks. The delta vs. the inner
      // window height is the keyboard height.
      const layoutH = window.innerHeight;
      const visualH = vv.height;
      // Some Android keyboards (e.g. Chrome predictive) keep the visual
      // viewport roughly the same height but shift it up; use the *offset*
      // from the top as well to compute a more accurate keyboard height.
      const offsetTop = vv.offsetTop;
      const keyboardHeight = Math.max(0, layoutH - visualH - offsetTop);
      setState({ keyboardHeight, visualHeight: visualH });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
