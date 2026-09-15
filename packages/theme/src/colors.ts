/**
 * Core color tokens shared by mobile (twrnc) and web (Tailwind/CSS vars).
 * Swap these for your brand palette.
 */

export const colors = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  background: "#ffffff",
  backgroundDark: "#09090b",
  surface: "#f4f4f5",
  surfaceDark: "#18181b",
  text: "#18181b",
  textDark: "#fafafa",
  textMuted: "#71717a",
  textMutedDark: "#a1a1aa",
  border: "#e4e4e7",
  borderDark: "#27272a",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export type ColorToken = keyof typeof colors;
export type ThemeMode = "light" | "dark";
