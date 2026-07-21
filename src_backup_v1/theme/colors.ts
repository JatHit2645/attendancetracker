/**
 * Attendance Tracker — Color System
 * 
 * Inspired by Linear's dark obsidian palette, Apple Fitness ring vibrancy,
 * and Arc Browser's frosted glass layering.
 * 
 * Every color is intentionally curated — no generic blues or grays.
 */

// ─── Canvas & Surface Layers ───────────────────────────────────────
// Deep obsidian base with progressively lighter glass layers
export const canvas = {
  /** Deepest background — the app's canvas */
  base: '#0B0F19',
  /** Slightly elevated surface (cards, sheets) */
  elevated: '#111827',
  /** Second elevation (modals, floating panels) */
  overlay: '#1A2236',
  /** Third elevation (popovers, tooltips) */
  popover: '#222D45',
} as const;

// ─── Glass & Frosted Surfaces ──────────────────────────────────────
// For glassmorphic card backgrounds (used with expo-blur)
export const glass = {
  /** Subtle frosted card — barely visible */
  subtle: 'rgba(255, 255, 255, 0.03)',
  /** Light frosted card */
  light: 'rgba(255, 255, 255, 0.06)',
  /** Medium frosted card — default for most cards */
  medium: 'rgba(255, 255, 255, 0.08)',
  /** Strong frosted card — active/focused states */
  strong: 'rgba(255, 255, 255, 0.12)',
} as const;

// ─── Borders ───────────────────────────────────────────────────────
// Subtle 1px borders inspired by Linear's crisp edges
export const border = {
  /** Default subtle border */
  default: 'rgba(255, 255, 255, 0.06)',
  /** Slightly more visible border (hover, focus) */
  muted: 'rgba(255, 255, 255, 0.10)',
  /** Strong border for active/selected states */
  strong: 'rgba(255, 255, 255, 0.16)',
} as const;

// ─── Text Hierarchy ────────────────────────────────────────────────
export const text = {
  /** Primary text — high contrast white */
  primary: '#F1F5F9',
  /** Secondary text — muted, for descriptions & metadata */
  secondary: '#94A3B8',
  /** Tertiary text — very muted, for timestamps & hints */
  tertiary: '#64748B',
  /** Disabled text */
  disabled: '#475569',
  /** Inverse text — dark text on light backgrounds */
  inverse: '#0B0F19',
} as const;

// ─── Attendance Status Colors ──────────────────────────────────────
// Core to the product — each status has a distinct, vibrant identity
export const attendance = {
  present: {
    /** Vibrant emerald green — safe, present */
    base: '#10B981',
    /** Lighter for glows and backgrounds */
    light: 'rgba(16, 185, 129, 0.15)',
    /** Subtle background tint */
    surface: 'rgba(16, 185, 129, 0.08)',
  },
  absent: {
    /** Deep rose crimson — absent, warning */
    base: '#F43F5E',
    /** Lighter for glows and backgrounds */
    light: 'rgba(244, 63, 94, 0.15)',
    /** Subtle background tint */
    surface: 'rgba(244, 63, 94, 0.08)',
  },
  cancelled: {
    /** Warm amber — cancelled, not your fault */
    base: '#F59E0B',
    /** Lighter for glows and backgrounds */
    light: 'rgba(245, 158, 11, 0.15)',
    /** Subtle background tint */
    surface: 'rgba(245, 158, 11, 0.08)',
  },
  missed: {
    /** Muted slate violet — missed, informational */
    base: '#8B5CF6',
    /** Lighter for glows and backgrounds */
    light: 'rgba(139, 92, 246, 0.15)',
    /** Subtle background tint */
    surface: 'rgba(139, 92, 246, 0.08)',
  },
} as const;

// ─── Attendance Gauge Ring Colors ──────────────────────────────────
// Apple Fitness-inspired dynamic ring colors based on percentage
export const gauge = {
  /** Above threshold — healthy, vibrant green */
  safe: '#10B981',
  /** Slightly below threshold — caution amber */
  warning: '#F59E0B',
  /** Significantly below threshold — danger crimson */
  danger: '#F43F5E',
  /** Critical — deep red, almost emergency */
  critical: '#DC2626',
  /** Ring track (unfilled portion) */
  track: 'rgba(255, 255, 255, 0.06)',
} as const;

// ─── Accent & Brand ────────────────────────────────────────────────
export const accent = {
  /** Primary brand accent — electric indigo-blue */
  primary: '#6366F1',
  /** Primary hover/pressed state */
  primaryHover: '#818CF8',
  /** Primary subtle background */
  primarySurface: 'rgba(99, 102, 241, 0.12)',
  /** Secondary accent — cyan for links, active tabs */
  secondary: '#22D3EE',
  /** Secondary subtle background */
  secondarySurface: 'rgba(34, 211, 238, 0.12)',
} as const;

// ─── Semantic Feedback Colors ──────────────────────────────────────
export const feedback = {
  success: '#10B981',
  error: '#F43F5E',
  warning: '#F59E0B',
  info: '#6366F1',
} as const;

// ─── Shadows (for native elevation) ───────────────────────────────
export const shadow = {
  color: '#000000',
  /** Subtle card shadow */
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  /** Medium shadow for floating elements */
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  /** Strong shadow for modals, popovers */
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  /** Glowing accent shadow (for buttons, active rings) */
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;
