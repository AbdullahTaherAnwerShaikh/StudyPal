export const THEME_PRESETS = [
  { key: "indigo", label: "Indigo", accent: "#6c63ff" },
  { key: "sky", label: "Sky", accent: "#0ea5e9" },
  { key: "emerald", label: "Emerald", accent: "#059669" },
  { key: "amber", label: "Amber", accent: "#d97706" },
  { key: "rose", label: "Rose", accent: "#e11d48" },
] as const;

export type ThemeKey = (typeof THEME_PRESETS)[number]["key"];

export const THEME_KEYS = THEME_PRESETS.map((preset) => preset.key);

export const THEME_MODES = ["light", "dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_COOKIE = "theme";
export const THEME_MODE_COOKIE = "theme_mode";

export function sanitizeTheme(value: unknown): ThemeKey {
  return typeof value === "string" &&
    (THEME_KEYS as readonly string[]).includes(value)
    ? (value as ThemeKey)
    : "indigo";
}

export function sanitizeThemeMode(value: unknown): ThemeMode {
  return value === "dark" ? "dark" : "light";
}