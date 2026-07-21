/**
 * Attendance Tracker — Quick Stats Bar
 * 
 * Horizontal row of key metric tiles displayed below the main gauge.
 * Shows: Attended, Conducted, Missed, Cancelled
 * Each stat has an icon indicator, value, and label.
 */

import { View, Text, StyleSheet } from 'react-native';
import {
  glass,
  border,
  text as textColors,
  attendance as attendanceColors,
  accent,
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { DashboardStats } from '../data/mockData';

interface QuickStatsBarProps {
  stats: DashboardStats;
}

interface StatTileProps {
  value: number;
  label: string;
  color: string;
}

function StatTile({ value, label, color }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIndicator, { backgroundColor: color + '20' }]}>
        <View style={[styles.tileDot, { backgroundColor: color }]} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default function QuickStatsBar({ stats }: QuickStatsBarProps) {
  return (
    <View style={styles.container}>
      <StatTile
        value={stats.totalAttended}
        label="Attended"
        color={attendanceColors.present.base}
      />
      <View style={styles.separator} />
      <StatTile
        value={stats.totalConducted}
        label="Conducted"
        color={accent.primary}
      />
      <View style={styles.separator} />
      <StatTile
        value={stats.totalMissed}
        label="Missed"
        color={attendanceColors.absent.base}
      />
      <View style={styles.separator} />
      <StatTile
        value={stats.totalCancelled}
        label="Cancelled"
        color={attendanceColors.cancelled.base}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tileIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: textColors.primary,
  },
  tileLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  separator: {
    width: 1,
    height: 36,
    backgroundColor: border.default,
  },
});
