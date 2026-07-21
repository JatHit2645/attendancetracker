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
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  canvas,
  glass,
  border,
  text as textColors,
  attendance as attendanceColors,
  accent,
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { TodayScheduleItem } from '../data/mockData';

interface ScheduleItemProps {
  item: TodayScheduleItem;
  isLast?: boolean;
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

export default function ScheduleItem({ item, isLast }: ScheduleItemProps) {
  const [expanded, setExpanded] = useState(item.status === 'ongoing');

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleMark = (status: string) => {
    console.log(`Marked ${item.subjectShortName} as ${status}`);
    // In a real app, update state/mockData here
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
  };

  const config = getScheduleStatusConfig(item.status, item.attendanceStatus);
  const isOngoing = item.status === 'ongoing';
  const isCompleted = item.status === 'completed';
  const isUpcoming = item.status === 'upcoming';

  return (
    <View style={styles.container}>
      {/* Timeline connector */}
      <View style={styles.timelineColumn}>
        {/* Dot */}
        <View
          style={[
            styles.timelineDot,
            config.dotStyle === 'solid' && { backgroundColor: config.color },
            config.dotStyle === 'outline' && {
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: config.color,
            },
            config.dotStyle === 'pulse' && {
              backgroundColor: config.color,
            },
          ]}
        />
        {/* Vertical line */}
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Content */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleExpand}
        style={[
          styles.card,
          isOngoing && styles.cardOngoing,
          { borderLeftColor: item.color },
        ]}
      >
        {/* Time */}
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
            size={14} 
            color={textColors.tertiary} 
          />
        </View>

        {/* Subject info */}
        <View style={styles.subjectRow}>
          <Text
            style={[
              styles.subjectName,
              isCompleted && !item.attendanceStatus && styles.subjectNameFaded,
            ]}
            numberOfLines={1}
          >
            {item.subjectName}
          </Text>
        </View>

        {/* Status badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.statusLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Action Bar (Expandable) */}
        {expanded && (
          <View style={styles.actionBar}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: attendanceColors.present.surface }]} onPress={() => handleMark('present')}>
              <Text style={[styles.actionBtnText, { color: attendanceColors.present.base }]}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: attendanceColors.absent.surface }]} onPress={() => handleMark('absent')}>
              <Text style={[styles.actionBtnText, { color: attendanceColors.absent.base }]}>Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: attendanceColors.cancelled.surface }]} onPress={() => handleMark('cancelled')}>
              <Text style={[styles.actionBtnText, { color: attendanceColors.cancelled.base }]}>Cancelled</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: glass.medium }]} onPress={() => handleMark('holiday')}>
              <Text style={[styles.actionBtnText, { color: textColors.secondary }]}>Holiday</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // ── Timeline
  timelineColumn: {
    alignItems: 'center',
    width: 20,
    paddingTop: spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: border.default,
    marginTop: spacing.xs,
  },

  // ── Card
  card: {
    flex: 1,
    backgroundColor: glass.subtle,
    borderWidth: 1,
    borderColor: border.default,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  cardOngoing: {
    backgroundColor: glass.medium,
    borderColor: border.muted,
  },

  // ── Time
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
  },
  timeOngoing: {
    color: textColors.secondary,
  },
  timeSeparator: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.disabled,
  },

  // ── Subject
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: textColors.primary,
    flex: 1,
  },
  subjectNameFaded: {
    color: textColors.secondary,
  },

  // ── Badge
  badgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },

  // ── Action Bar
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: border.default,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
});
