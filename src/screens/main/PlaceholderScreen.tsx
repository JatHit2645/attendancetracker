/**
 * Placeholder screen for tabs that will be built in future phases.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { canvas, text as textColors, accent, glass, border } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface PlaceholderScreenProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  phase: string;
}

export default function PlaceholderScreen({
  title,
  icon,
  description,
  phase,
}: PlaceholderScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={48} color={accent.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseText}>{phase}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    maxWidth: 300,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: accent.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
    textAlign: 'center',
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.6,
  },
  phaseBadge: {
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  phaseText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: textColors.tertiary,
    letterSpacing: 0.5,
  },
});
