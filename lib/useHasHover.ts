"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the primary input supports hover (i.e. a fine pointer
 * such as a mouse). On coarse-pointer devices — touch phones and tablets —
 * we suppress `whileHover` transforms and rotations in framer-motion, because
 * the hover state is either meaningless (touch) or sticky (some Android
 * Chrome builds), causing layout drift.
 *
 * Implementation note: `(any-hover: none)` matches touch devices; `(any-pointer: coarse)`
 * matches finger input. We treat both as "no hover" so a hybrid device
 * (e.g. a Surface with a pen) is treated as a touch device until a mouse
 * is plugged in.
 */
export function useHasHover(): boolean {
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(any-hover: none), (any-pointer: coarse)");
    const update = () => setHasHover(!mq.matches);
    update();
    // Safari < 14 only supports addListener / removeListener.
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  return hasHover;
}
