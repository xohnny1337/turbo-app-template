import { colors } from "./colors";

/**
 * Flat color map for twrnc (mobile).
 * Usage in tailwind.config.js: colors: mobileColors
 * Then: tw`bg-primary text-content`
 */
export const mobileColors = {
  primary: colors.primary,
  "primary-dark": colors.primaryDark,
  background: colors.background,
  "background-dark": colors.backgroundDark,
  surface: colors.surface,
  "surface-dark": colors.surfaceDark,
  content: colors.text,
  "content-dark": colors.textDark,
  muted: colors.textMuted,
  "muted-dark": colors.textMutedDark,
  line: colors.border,
  "line-dark": colors.borderDark,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
} as const;
