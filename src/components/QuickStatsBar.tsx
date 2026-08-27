import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  glass,
  border,
  text as textColors,
  attendance as attendanceColors,
  accent,
} from '../theme/colors';
import { fontFamily, fontSize, textStyle } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { DashboardStats } from '../data/mockData';

interface QuickStatsBarProps {
  stats: DashboardStats;
}

interface StatTileProps {
  value: number;
  label: string;
  color: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

function StatTile({ value, label, color, iconName }: StatTileProps) {
  return (
    <View 
      style={styles.tile}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}`}
    >
      <View style={styles.tileHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={iconName} size={16} color={color} />
        </View>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

export default function QuickStatsBar({ stats }: QuickStatsBarProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile
          value={stats.totalAttended}
          label="Attended"
          color={attendanceColors.present.base}
          iconName="checkmark-circle-outline"
        />
        <StatTile
          value={stats.totalConducted}
          label="Conducted"
          color={accent.primary}
          iconName="calendar-outline"
        />
      </View>
      <View style={styles.row}>
        <StatTile
          value={stats.totalMissed}
          label="Missed"
          color={attendanceColors.missed.base}
          iconName="alert-circle-outline"
        />
        <StatTile
          value={stats.totalCancelled}
          label="Cancelled"
          color={attendanceColors.cancelled.base}
          iconName="close-circle-outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['2xl'],
    color: textColors.primary,
    letterSpacing: -0.5,
  },
  tileLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: textColors.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
