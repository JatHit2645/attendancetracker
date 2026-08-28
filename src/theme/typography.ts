/**
 * Attendance Tracker — Typography System
 */

export const fontFamily = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
  system: 'System',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  display: 56,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const letterSpacing = {
  tightest: -1.0,
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1.2,
} as const;

import { text as textColors } from './colors';

// Text styles now include color to fix Auth screen invisible text
export const textStyle = {
  displayNumber: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.display,
    letterSpacing: letterSpacing.tightest,
    lineHeight: fontSize.display * lineHeight.tight,
    color: textColors.primary,
  },
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    color: textColors.primary,
  },
  heroSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize.md * lineHeight.relaxed,
    color: textColors.primary,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize.lg * lineHeight.tight,
    color: textColors.primary,
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize.md * lineHeight.normal,
    color: textColors.primary,
  },
  statNumber: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize.xl * lineHeight.tight,
    color: textColors.primary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.md * lineHeight.relaxed,
    color: textColors.primary,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: textColors.primary,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
    lineHeight: fontSize.xs * lineHeight.normal,
    color: textColors.primary,
  },
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.wide,
    lineHeight: fontSize.md * lineHeight.normal,
    color: textColors.primary,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.2,
    lineHeight: 12,
    color: textColors.primary,
  },
} as const;
