/**
 * Six curated themes for Daybrief. Each maps directly to a `[data-theme="..."]`
 * block in `app/globals.css` that overrides the 12 design tokens.
 *
 * Adding a theme: append to THEMES, add a matching `[data-theme="id"] { ... }`
 * block in globals.css. Keep the token list in sync.
 */

export type ThemeId =
  | "mauve"
  | "sunset"
  | "ocean"
  | "midnight"
  | "chocolate-rose"
  | "pink-rose";

export const DEFAULT_THEME: ThemeId = "mauve";

export type ThemeDef = {
  id: ThemeId;
  label: string;
  blurb: string;
  swatch: { bg: string; accent: string; text: string };
  /** Native color-scheme hint — dark themes don't need scrollbar overrides. */
  colorScheme: "dark" | "light";
};

export const THEMES: ReadonlyArray<ThemeDef> = [
  {
    id: "mauve",
    label: "Deep Mauve",
    blurb: "Warm mauve dust, the Daybrief default.",
    swatch: { bg: "#674D66", accent: "#E89B85", text: "#EBD6DC" },
    colorScheme: "dark",
  },
  {
    id: "sunset",
    label: "Sunset",
    blurb: "Burnt amber and coral.",
    swatch: { bg: "#5A2E2A", accent: "#F4896C", text: "#FFD8B5" },
    colorScheme: "dark",
  },
  {
    id: "ocean",
    label: "Ocean",
    blurb: "Deep sea blue with cool highlights.",
    swatch: { bg: "#1F2D3D", accent: "#7BC4D4", text: "#DCE7F0" },
    colorScheme: "dark",
  },
  {
    id: "midnight",
    label: "Midnight",
    blurb: "Indigo night, electric purple.",
    swatch: { bg: "#0F1226", accent: "#8E84E6", text: "#D9DAF0" },
    colorScheme: "dark",
  },
  {
    id: "chocolate-rose",
    label: "Chocolate Rose",
    blurb: "Cocoa with a dusty rose.",
    swatch: { bg: "#3E2A22", accent: "#E29C8D", text: "#F5D6CC" },
    colorScheme: "dark",
  },
  {
    id: "pink-rose",
    label: "Pink Rose",
    blurb: "Pastel light — bright by day.",
    swatch: { bg: "#F5E1E0", accent: "#C77F8B", text: "#3A2A2F" },
    colorScheme: "light",
  },
];

export const THEME_IDS = new Set<ThemeId>(THEMES.map((t) => t.id));

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && THEME_IDS.has(v as ThemeId);
}

export function getTheme(id: ThemeId): ThemeDef {
  const t = THEMES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown theme: ${id}`);
  return t;
}
