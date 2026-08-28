/**
 * Attendance Tracker — Schedule Item Card
 * 
 * Individual lecture slot in today's schedule.
 * Features:
 * - Time column with start/end times
 * - Subject name and short code
 * - Status indicator (Upcoming / Ongoing pulse / Completed / Cancelled)
 * - Attendance status for completed lectures
 * - Color-coded left accent matching subject
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  glass,
  border,
  text as textColors,
  attendance as attendanceColors,
  accent,
  shadow,
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { TodayScheduleItem } from '../data/mockData';

interface ScheduleItemProps {
  item: TodayScheduleItem;
  isLast?: boolean;
  onMarkAttendance?: (scheduleId: string, status: string) => void;
}

function getScheduleStatusConfig(status: TodayScheduleItem['status'], attendanceStatus?: string) {
  switch (status) {
    case 'completed':
      if (attendanceStatus === 'present') {
        return {
          label: 'Present',
          color: attendanceColors.present.base,
          bgColor: attendanceColors.present.surface,
          dotStyle: 'solid' as const,
        };
      }
      if (attendanceStatus === 'absent') {
        return {
          label: 'Absent',
          color: attendanceColors.absent.base,
          bgColor: attendanceColors.absent.surface,
          dotStyle: 'solid' as const,
        };
      }
      return {
        label: 'Done',
        color: textColors.tertiary,
        bgColor: glass.light,
        dotStyle: 'solid' as const,
      };
    case 'ongoing':
      return {
        label: 'In Progress',
        color: accent.secondary,
        bgColor: accent.secondarySurface,
        dotStyle: 'pulse' as const,
      };
    case 'upcoming':
      return {
        label: 'Upcoming',
        color: textColors.secondary,
        bgColor: glass.subtle,
        dotStyle: 'outline' as const,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: attendanceColors.cancelled.base,
        bgColor: attendanceColors.cancelled.surface,
        dotStyle: 'solid' as const,
      };
    default:
      return {
        label: '',
        color: textColors.tertiary,
        bgColor: glass.subtle,
        dotStyle: 'outline' as const,
      };
  }
}

export default function ScheduleItem({ item, isLast, onMarkAttendance }: ScheduleItemProps) {
  const [expanded, setExpanded] = useState(item.status === 'ongoing');

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleMark = (status: string) => {
    if (onMarkAttendance) {
      onMarkAttendance(item.id, status);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
  };

  const config = getScheduleStatusConfig(item.status, item.attendanceStatus);
  const isOngoing = item.status === 'ongoing';
  const isCompleted = item.status === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.timelineColumn}>
        <View
          style={[
            styles.timelineDot,
            config.dotStyle === 'solid' && { backgroundColor: config.color, ...shadow.glow(config.color) },
            config.dotStyle === 'outline' && {
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: config.color,
            },
            config.dotStyle === 'pulse' && {
              backgroundColor: config.color,
              ...shadow.glow(config.color),
            },
          ]}
        />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      <Pressable
        onPress={toggleExpand}
        accessible={true}
        accessibilityState={{ expanded }}
        accessibilityLabel={`${item.subjectName}, from ${item.startTime} to ${item.endTime}. Status: ${config.label}. Double tap to ${expanded ? 'collapse' : 'expand'} options.`}
        style={[
          styles.cardWrapper,
          isOngoing ? shadow.glow(item.color) : null
        ]}
      >
        <View
          style={[
            styles.card,
            isOngoing && styles.cardOngoing,
            { borderLeftColor: item.color },
          ]}
        >
          <View style={styles.timeRow}>
            <Text style={[styles.time, isOngoing && styles.timeOngoing]}>
              {item.startTime}
            </Text>
            <Text style={styles.timeSeparator}>—</Text>
            <Text style={[styles.time, isOngoing && styles.timeOngoing]}>
              {item.endTime}
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={textColors.tertiary} 
            />
          </View>

          <View style={styles.subjectRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
              <Text
                style={[
                  styles.subjectName,
                  isCompleted && !item.attendanceStatus && styles.subjectNameFaded,
                  { flex: 1, marginRight: 8 }
                ]}
                numberOfLines={1}
              >
                {item.subjectName}
              </Text>
              {item.teacher ? (
                <View style={{ backgroundColor: item.color + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: item.color, fontSize: 10, fontFamily: fontFamily.bold }}>
                    {item.classType === 'lab' ? '🧪 ' : item.classType === 'tutorial' ? '📚 ' : ''}{item.teacher}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.statusLabel, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          {expanded && (
            <View style={styles.actionBar}>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
                style={[styles.actionBtn, { backgroundColor: attendanceColors.present.surface }]} 
                onPress={() => handleMark('present')}
                accessibilityRole="button"
                accessibilityLabel="Mark as present"
              >
                <Ionicons name="checkmark-circle" size={16} color={attendanceColors.present.base} />
                <Text style={[styles.actionBtnText, { color: attendanceColors.present.base }]}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
                style={[styles.actionBtn, { backgroundColor: attendanceColors.absent.surface }]} 
                onPress={() => handleMark('absent')}
                accessibilityRole="button"
                accessibilityLabel="Mark as absent"
              >
                <Ionicons name="close-circle" size={16} color={attendanceColors.absent.base} />
                <Text style={[styles.actionBtnText, { color: attendanceColors.absent.base }]}>Absent</Text>
              </TouchableOpacity>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
                style={[styles.actionBtn, { backgroundColor: attendanceColors.cancelled.surface }]} 
                onPress={() => handleMark('cancelled')}
                accessibilityRole="button"
                accessibilityLabel="Mark as cancelled"
              >
                <Ionicons name="ban" size={16} color={attendanceColors.cancelled.base} />
                <Text style={[styles.actionBtnText, { color: attendanceColors.cancelled.base }]}>Cancelled</Text>
              </TouchableOpacity>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
                style={[styles.actionBtn, { backgroundColor: glass.medium }]} 
                onPress={() => handleMark('holiday')}
                accessibilityRole="button"
                accessibilityLabel="Mark as holiday"
              >
                <Ionicons name="calendar-clear" size={16} color={textColors.secondary} />
                <Text style={[styles.actionBtnText, { color: textColors.secondary }]}>Holiday</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 20,
    paddingTop: spacing.lg,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: border.subtle,
    marginTop: spacing.sm,
  },
  cardWrapper: {
    flex: 1,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
  },
  card: {
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderLeftWidth: 4,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardOngoing: {
    backgroundColor: glass.medium,
    borderColor: border.subtle,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
    letterSpacing: 0.5,
  },
  timeOngoing: {
    color: accent.primary,
  },
  timeSeparator: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.disabled,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    flex: 1,
    letterSpacing: -0.3,
  },
  subjectNameFaded: {
    color: textColors.secondary,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: border.subtle,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  actionBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
  },
});
