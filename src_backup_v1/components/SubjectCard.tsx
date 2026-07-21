/**
 * Attendance Tracker — Subject Card
 * 
 * Individual subject attendance card for the dashboard.
 * Features:
 * - Mini circular gauge ring
 * - Subject name with short code
 * - Attended/Conducted counts
 * - Status badge (Safe / Warning / Danger / Critical)
 * - Subtle glassmorphic card with colored left accent border
 * - Lectures needed / can skip indicator
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AttendanceGauge from './AttendanceGauge';
import {
  canvas,
  glass,
  border,
  text as textColors,
  attendance as attendanceColors,
  gauge as gaugeColors,
} from '../theme/colors';
import { fontFamily, fontSize, textStyle } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import {
  Subject,
  calculatePercentage,
  getAttendanceStatus,
  lecturesNeededForTarget,
  lecturesCanMiss,
} from '../data/mockData';

interface SubjectCardProps {
  subject: Subject;
  onPress?: () => void;
  onStartTimer?: (subject: Subject) => void;
}

/** Get human-readable status label */
function getStatusLabel(status: 'safe' | 'warning' | 'danger' | 'critical'): string {
  switch (status) {
    case 'safe':
      return 'On Track';
    case 'warning':
      return 'Borderline';
    case 'danger':
      return 'At Risk';
    case 'critical':
      return 'Critical';
  }
}

/** Get badge color for status */
function getStatusColor(status: 'safe' | 'warning' | 'danger' | 'critical'): string {
  switch (status) {
    case 'safe':
      return gaugeColors.safe;
    case 'warning':
      return gaugeColors.warning;
    case 'danger':
      return gaugeColors.danger;
    case 'critical':
      return gaugeColors.critical;
  }
}

export default function SubjectCard({ subject, onPress, onStartTimer }: SubjectCardProps) {
  const percentage = calculatePercentage(subject.totalAttended, subject.totalConducted);
  const status = getAttendanceStatus(percentage, subject.threshold);
  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);

  const needed = lecturesNeededForTarget(
    subject.totalAttended,
    subject.totalConducted,
    subject.threshold
  );
  const canMiss = lecturesCanMiss(
    subject.totalAttended,
    subject.totalConducted,
    subject.threshold
  );

  // Determine helper text
  let helperText = '';
  if (status === 'safe' || status === 'warning') {
    if (canMiss > 0) {
      helperText = `Can miss ${canMiss} more`;
    } else {
      helperText = 'Cannot miss any';
    }
  } else {
    if (needed > 0) {
      helperText = `Need ${needed} more to reach ${subject.threshold}%`;
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { borderLeftColor: subject.color }]}
    >
      {/* Left side: Info */}
      <View style={styles.infoSection}>
        {/* Top row: Subject name + badge */}
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.subjectName} numberOfLines={1}>
              {subject.name}
            </Text>
            <Text style={[styles.shortName, { color: subject.color }]}>
              {subject.shortName}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            <Text style={styles.statsHighlight}>{subject.totalAttended}</Text>
            <Text style={styles.statsSeparator}> / </Text>
            <Text style={styles.statsSecondary}>{subject.totalConducted}</Text>
            <Text style={styles.statsLabel}> lectures</Text>
          </Text>
        </View>

        {/* Bottom row: Status badge + helper */}
        <View style={styles.bottomRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          {helperText ? (
            <Text style={styles.helperText} numberOfLines={1}>
              {helperText}
            </Text>
          ) : null}
        </View>

        {/* Start Timer Action */}
        {onStartTimer && (
          <TouchableOpacity
            style={[styles.timerButton, { backgroundColor: subject.color + '15' }]}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onStartTimer(subject);
            }}
          >
            <Ionicons name="stopwatch-outline" size={16} color={subject.color} />
            <Text style={[styles.timerButtonText, { color: subject.color }]}>Start Timer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Right side: Mini gauge */}
      <View style={styles.gaugeSection}>
        <AttendanceGauge
          percentage={percentage}
          threshold={subject.threshold}
          size={56}
          strokeWidth={5}
          animated={true}
          animationDuration={1000}
        >
          <Text style={styles.gaugePercentage}>{percentage}%</Text>
        </AttendanceGauge>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderLeftWidth: 3,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // ── Info Section (left)
  infoSection: {
    flex: 1,
    gap: spacing.xs + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: textColors.primary,
  },
  shortName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },

  // ── Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statsText: {
    fontSize: fontSize.sm,
  },
  statsHighlight: {
    fontFamily: fontFamily.bold,
    color: textColors.primary,
    fontSize: fontSize.base,
  },
  statsSeparator: {
    fontFamily: fontFamily.regular,
    color: textColors.tertiary,
  },
  statsSecondary: {
    fontFamily: fontFamily.medium,
    color: textColors.secondary,
    fontSize: fontSize.base,
  },
  statsLabel: {
    fontFamily: fontFamily.regular,
    color: textColors.tertiary,
    fontSize: fontSize.sm,
  },

  // ── Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
    flex: 1,
  },

  // ── Gauge Section (right)
  gaugeSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentage: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: textColors.primary,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  timerButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
});
