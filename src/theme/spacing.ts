/**
 * Attendance Tracker — Spacing, Layout & Animation
 */

export const spacing = {
  'none': 0,
  'px': 1,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32, // Fix: Added missing token
  full: 9999,
} as const;

export const layout = {
  screenPaddingH: 20,
  maxContentWidth: 480,
  bottomNavHeight: 72,
  headerHeight: 56,
  cardMinHeight: 64,
  touchTarget: 44,
} as const;

export const zIndex = {
  base: 0,
  elevated: 10,
  overlay: 20,
  modal: 30,
  popover: 40,
  toast: 50,
} as const;

export const animation = {
  instant: 100,
  fast: 200,
  normal: 300,
  smooth: 400,
  slow: 600,
} as const;
