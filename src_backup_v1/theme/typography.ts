/**
 * Attendance Tracker — Typography System
 * 
 * Uses Plus Jakarta Sans — a modern geometric sans-serif with
 * excellent readability on mobile screens and a premium, distinctive feel.
 * 
 * Fallback chain ensures graceful degradation across platforms.
 */

// ─── Font Family ───────────────────────────────────────────────────
export const fontFamily = {
  /** Regular weight — body text, descriptions */
  regular: 'PlusJakartaSans-Regular',
  /** Medium weight — labels, secondary headings */
  medium: 'PlusJakartaSans-Medium',
  /** Semi-bold — subheadings, emphasis */
  semiBold: 'PlusJakartaSans-SemiBold',
  /** Bold — primary headings, key numbers */
  bold: 'PlusJakartaSans-Bold',
  /** Extra-bold — hero numbers (attendance percentages) */
  extraBold: 'PlusJakartaSans-ExtraBold',
  /** System fallback (used before custom fonts load) */
  system: 'System',
} as const;

// ─── Font Sizes (scaled for mobile readability) ────────────────────
export const fontSize = {
  /** Tiny — timestamps, metadata badges */
  xs: 11,
  /** Small — captions, helper text */
  sm: 13,
  /** Base — body text, descriptions */
  base: 15,
  /** Medium — labels, list items */
  md: 17,
  /** Large — section headers, card titles */
  lg: 20,
  /** Extra large — page titles */
  xl: 24,
  /** 2XL — screen hero titles */
  '2xl': 30,
  /** 3XL — hero numbers (attendance percentage display) */
  '3xl': 40,
  /** Display — massive emphasis (dashboard gauge center number) */
  display: 56,
} as const;

// ─── Line Heights ──────────────────────────────────────────────────
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

// ─── Letter Spacing ────────────────────────────────────────────────
export const letterSpacing = {
  /** Tighter — for large display numbers */
  tight: -0.5,
  /** Normal — body text */
  normal: 0,
  /** Slightly wider — all-caps labels, badges */
  wide: 0.5,
  /** Widest — tiny uppercase meta labels */
  wider: 1.2,
} as const;

// ─── Pre-composed Text Styles ──────────────────────────────────────
// Ready-to-use text style objects for consistency across screens
import { text as textColors } from './colors';

export const textStyle = {
  /** Hero attendance percentage number */
  displayNumber: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.display,
    letterSpacing: letterSpacing.tight,
    color: textColors.primary,
    lineHeight: fontSize.display * lineHeight.tight,
  },
  /** Page title (e.g., "Dashboard", "Subjects") */
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    letterSpacing: letterSpacing.tight,
    color: textColors.primary,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  /** Section heading inside a page */
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
  /** Card title / list item title */
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: textColors.primary,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  /** Body text */
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
    lineHeight: fontSize.base * lineHeight.relaxed,
  },
  /** Caption / helper text */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: textColors.tertiary,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  /** Tiny label (timestamps, badges) */
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
    color: textColors.tertiary,
    textTransform: 'uppercase' as const,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  /** Button text */
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    letterSpacing: letterSpacing.wide,
    color: textColors.primary,
    lineHeight: fontSize.base * lineHeight.normal,
  },
} as const;
