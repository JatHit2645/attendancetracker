/**
 * Attendance Tracker — Timer Confirmation Sheet (Phase 4)
 * 
 * Pops up when the user stops the lecture timer.
 * Displays IST times, duration, and allows minor adjustments (inflation fix)
 * before confirming and automatically marking as Present.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  shadow,
  attendance,
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { TimerState } from '../../services/TimerService';

interface TimerConfirmationSheetProps {
  visible: boolean;
  timer: TimerState | null;
  records: any[];
  onConfirm: (start: Date, end: Date) => void;
  onDiscard: () => void;
}

/** Formats a Date to IST string like "10:15 AM" */
const formatISTTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const parseTimeText = (text: string, baseDate: Date): Date | null => {
  if (!text) return null;
  const cleaned = text.trim();
  
  // Try 12-hour format with AM/PM: "h:mm:ss am" or "h:mm am"
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const seconds = match12[3] ? parseInt(match12[3], 10) : 0;
    const ampm = match12[4].toUpperCase();

    if (hours < 1 || hours > 12) return null;
    if (minutes < 0 || minutes > 59) return null;
    if (seconds < 0 || seconds > 59) return null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, seconds, 0);
    return newDate;
  }

  // Try 24-hour format: "HH:mm:ss" or "HH:mm"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    const seconds = match24[3] ? parseInt(match24[3], 10) : 0;

    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;
    if (seconds < 0 || seconds > 59) return null;

    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, seconds, 0);
    return newDate;
  }

  return null;
};

export default function TimerConfirmationSheet({
  visible,
  timer,
  records,
  onConfirm,
  onDiscard,
}: TimerConfirmationSheetProps) {
  const [startTimeText, setStartTimeText] = useState('');
  const [endTimeText, setEndTimeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (visible && timer) {
      setStartTimeText(formatISTTime(new Date(timer.startTimeIso)));
      setEndTimeText(formatISTTime(new Date()));
      setIsSubmitting(false);
      setValidationError(null);
    }
  }, [visible, timer]);

  if (!timer) return null;

  const baseDate = new Date(timer.startTimeIso);
  const parsedStart = parseTimeText(startTimeText, baseDate);
  const parsedEnd = parseTimeText(endTimeText, new Date());

  // Real-time validation rules
  let currentError: string | null = null;
  if (!parsedStart) {
    currentError = 'Invalid Start Time (use "10:15:30 AM" or "14:30")';
  } else if (!parsedEnd) {
    currentError = 'Invalid End Time (use "11:15:30 AM" or "15:30")';
  } else if (parsedEnd.getTime() <= parsedStart.getTime()) {
    currentError = 'End Time must be after Start Time';
  } else if (parsedEnd.getTime() > new Date().getTime()) {
    currentError = 'End Time cannot be in the future';
  } else {
    // Check overlaps with today's logged records
    const todayStr = new Date().toLocaleDateString('en-CA');
    const hasOverlap = records.some(r => {
      if (r.date !== todayStr) return false;
      if (!r.ist_start_time || !r.ist_end_time) return false;
      
      const extStart = parseTimeText(r.ist_start_time, new Date());
      const extEnd = parseTimeText(r.ist_end_time, new Date());
      if (!extStart || !extEnd) return false;
      
      return parsedStart.getTime() < extEnd.getTime() && parsedEnd.getTime() > extStart.getTime();
    });
    if (hasOverlap) {
      currentError = 'This slot overlaps with another class today';
    }
  }

  // Calculate duration string dynamically from parsed dates
  let durationStr = '0 min';
  if (parsedStart && parsedEnd && parsedEnd > parsedStart) {
    const diffMs = parsedEnd.getTime() - parsedStart.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    durationStr = '';
    if (hrs > 0) durationStr += `${hrs} hr `;
    if (mins > 0) durationStr += `${mins} min `;
    durationStr += `${diffSecs} sec`;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={() => !isSubmitting && onDiscard()}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => !isSubmitting && onDiscard()}>
          {Platform.OS !== 'web' ? (
            <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          )}
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheetContainer}>
            {Platform.OS !== 'web' && (
              <View style={styles.handleContainer}>
                <View style={styles.handleIndicator} />
              </View>
            )}

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Lecture Finished</Text>
                <Text style={styles.subtitle}>Confirm details to save attendance</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.subjectRow}>
                <View style={[styles.colorDot, { backgroundColor: timer.color }]} />
                <Text style={styles.subjectName}>{timer.subjectName}</Text>
              </View>

              <View style={styles.timeGrid}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>STARTED (IST)</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={startTimeText}
                    onChangeText={setStartTimeText}
                    placeholder="e.g. 10:15:00 AM"
                    placeholderTextColor={textColors.tertiary}
                  />
                </View>
                
                <View style={[styles.timeCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.timeLabel}>ENDED (IST)</Text>
                  <TextInput
                    style={[styles.timeInput, { textAlign: 'right' }]}
                    value={endTimeText}
                    onChangeText={setEndTimeText}
                    placeholder="e.g. 11:15:00 AM"
                    placeholderTextColor={textColors.tertiary}
                  />
                </View>
              </View>

              {currentError && (
                <View style={styles.errorRow}>
                  <Ionicons name="warning-outline" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{currentError}</Text>
                </View>
              )}

              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Total Duration:</Text>
                <Text style={styles.durationValue}>{durationStr}</Text>
              </View>
            </View>

            <Text style={styles.helperText}>
              Adjust the times directly in the fields above if needed.
              We'll validate that the format is correct and slots do not overlap.
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.discardButton, isSubmitting && { opacity: 0.5 }]} activeOpacity={0.7} onPress={() => !isSubmitting && onDiscard()}>
                <Text style={styles.discardText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmButton, (isSubmitting || !!currentError) && { opacity: 0.4 }]} 
                activeOpacity={0.8} 
                disabled={isSubmitting || !!currentError}
                onPress={async () => {
                  if (isSubmitting || currentError || !parsedStart || !parsedEnd) return;
                  setIsSubmitting(true);
                  await onConfirm(parsedStart, parsedEnd);
                }}
              >
                <LinearGradient
                  colors={[attendance.present.base, '#059669']} // Green gradient
                  style={styles.confirmGradient}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.confirmText}>{isSubmitting ? 'Saving...' : 'Confirm & Mark Present'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    padding: Platform.OS === 'web' ? spacing.lg : 0,
    zIndex: 10,
  },
  sheetContainer: {
    backgroundColor: canvas.elevated,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    borderBottomLeftRadius: Platform.OS === 'web' ? radius['3xl'] : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? radius['3xl'] : 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing['2xl'],
    paddingTop: Platform.OS === 'web' ? spacing['2xl'] : 0,
    paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing['2xl'],
    ...shadow.high,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handleIndicator: {
    backgroundColor: border.muted,
    width: 36,
    height: 4,
    borderRadius: radius.full,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: textColors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },
  summaryCard: {
    backgroundColor: glass.subtle,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: border.default,
    marginBottom: spacing.lg,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  subjectName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: textColors.primary,
  },
  timeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  timeInput: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.primary,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
    paddingVertical: 4,
    minWidth: 120,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: '#EF4444',
  },
  timeDivider: {
    paddingHorizontal: spacing.md,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: glass.medium,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  durationLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
  },
  durationValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: textColors.primary,
  },
  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: textColors.tertiary,
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  discardButton: {
    flex: 1,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.default,
    backgroundColor: glass.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },
  confirmButton: {
    flex: 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 4,
    gap: spacing.sm,
  },
  confirmText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#fff',
  },
});
