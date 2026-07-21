/**
 * Attendance Tracker — Spacing & Layout System
 * 
 * Consistent spacing scale based on a 4px grid.
 * Every margin, padding, gap, and radius uses these tokens.
 */

// ─── Spacing Scale (4px base grid) ─────────────────────────────────
export const spacing = {
  /** 2px — hairline gaps */
  '2xs': 2,
  /** 4px — tight internal padding */
  xs: 4,
  /** 8px — compact spacing */
  sm: 8,
  /** 12px — default inner padding */
  md: 12,
  /** 16px — standard content gap */
  lg: 16,
  /** 20px — section spacing */
  xl: 20,
  /** 24px — generous spacing */
  '2xl': 24,
  /** 32px — major section gaps */
  '3xl': 32,
  /** 40px — page-level vertical rhythm */
  '4xl': 40,
  /** 48px — large breathing room */
  '5xl': 48,
  /** 64px — hero section spacing */
  '6xl': 64,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────
export const radius = {
  /** 4px — subtle rounding (inputs, small badges) */
  xs: 4,
  /** 8px — light rounding (buttons, small cards) */
  sm: 8,
  /** 12px — medium rounding (standard cards) */
  md: 12,
  /** 16px — generous rounding (larger cards, sheets) */
  lg: 16,
  /** 20px — prominent rounding (floating panels) */
  xl: 20,
  /** 24px — very rounded (pill buttons, search bars) */
  '2xl': 24,
  /** Full circle (avatars, status dots) */
  full: 9999,
} as const;

// ─── Layout Constants ──────────────────────────────────────────────
export const layout = {
  /** Horizontal page padding */
  screenPaddingH: spacing.xl,
  /** Maximum content width (for web/tablet) */
  maxContentWidth: 480,
  /** Bottom nav bar height */
  bottomNavHeight: 72,
  /** Header height */
  headerHeight: 56,
  /** Card minimum height for touch targets */
  cardMinHeight: 64,
  /** Touch target minimum (accessibility) */
  touchTarget: 44,
} as const;

// ─── Animation Timing ──────────────────────────────────────────────
export const animation = {
  /** Ultra-fast micro-interaction (scale on press) */
  instant: 100,
  /** Fast transition (color change, opacity) */
  fast: 200,
  /** Standard transition (card expand, slide) */
  normal: 300,
  /** Smooth transition (page transitions, modals) */
  smooth: 400,
  /** Slow entrance (staggered list items) */
  slow: 600,
} as const;
