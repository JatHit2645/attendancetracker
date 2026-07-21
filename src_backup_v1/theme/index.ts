/**
 * Attendance Tracker — Unified Theme
 * 
 * Single import point for the entire design system.
 * Usage: import { theme } from '@/theme';
 */

export * from './colors';
export * from './typography';
export * from './spacing';

// Re-export everything under a single `theme` namespace
import * as colors from './colors';
import { fontFamily, fontSize, lineHeight, letterSpacing, textStyle } from './typography';
import { spacing, radius, layout, animation } from './spacing';

export const theme = {
  colors: {
    canvas: colors.canvas,
    glass: colors.glass,
    border: colors.border,
    text: colors.text,
    attendance: colors.attendance,
    gauge: colors.gauge,
    accent: colors.accent,
    feedback: colors.feedback,
    shadow: colors.shadow,
  },
  typography: {
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    textStyle,
  },
  spacing,
  radius,
  layout,
  animation,
} as const;

export type Theme = typeof theme;
export default theme;
