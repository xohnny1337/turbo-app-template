import { colors, type ThemeMode } from "./colors";

/**
 * Web helpers — resolve theme colors for CSS variables.
 */
export function getWebColors(mode: ThemeMode) {
  return mode === "dark"
    ? {
        background: colors.backgroundDark,
        surface: colors.surfaceDark,
        text: colors.textDark,
        textMuted: colors.textMutedDark,
        border: colors.borderDark,
        primary: colors.primary,
      }
    : {
        background: colors.background,
        surface: colors.surface,
        text: colors.text,
        textMuted: colors.textMuted,
        border: colors.border,
        primary: colors.primary,
      };
}
