"use client";

import { useTheme } from "@/lib/useTheme";

/**
 * Mounted at the root layout. The inline script in <head> already applies the
 * theme pre-paint to avoid FOUC; this client component mirrors any later
 * changes (cross-tab, settings save) onto the <html data-theme="..."> attr.
 *
 * Renders nothing visible.
 */
export function ThemeApplier() {
  useTheme();
  return null;
}
