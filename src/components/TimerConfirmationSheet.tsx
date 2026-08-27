import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  ScrollView,
  Animated,
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
import { TimerState } from '../services/TimerService';

interface TimerConfirmationSheetProps {
  visible: boolean;
  timer: TimerState | null;
  records: any[];
  subject?: any; // Add subject prop to fetch default teachers
  onConfirm: (start: Date, end: Date, classType: string, teacherName: string, rating: number | null) => Promise<void> | void;
  onDiscard: () => void;
  onCancel: () => void;
}

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
  subject,
  onConfirm,
  onDiscard,
  onCancel,
}: TimerConfirmationSheetProps) {
  const [startTimeText, setStartTimeText] = useState('');
  const [endTimeText, setEndTimeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classType, setClassType] = useState<'theory' | 'lab' | 'tutorial'>('theory');
  const [teacherName, setTeacherName] = useState<string>('');
  const [rating, setRating] = useState<string>('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleRatingChange = (text: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();

    const cleaned = text.replace(/[^0-9.]/g, '');
    if ((cleaned.match(/\./g) || []).length > 1) return;

    if (cleaned === '') {
      setRating('');
      return;
    }

    if (cleaned.endsWith('.')) {
      setRating(cleaned);
      return;
    }

    let parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      if (parsed > 10) {
        setRating('10');
      } else {
        setRating(cleaned);
      }
    } else {
      setRating('');
    }
  };

  // Determine rating color
  let ratingColor: string = border.default;
  let ratingBg: string = glass.medium;
  if (rating !== '') {
    const num = parseFloat(rating);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(10, num));
      let r, g, b;
      if (clamped <= 5) {
        // Red (#EF4444) to Yellow (#F59E0B)
        const t = clamped / 5;
        r = Math.round(239 + t * (245 - 239));
        g = Math.round(68 + t * (158 - 68));
        b = Math.round(68 + t * (11 - 68));
      } else {
        // Yellow (#F59E0B) to Green (#10B981)
        const t = (clamped - 5) / 5;
        r = Math.round(245 + t * (16 - 245));
        g = Math.round(158 + t * (185 - 158));
        b = Math.round(11 + t * (129 - 11));
      }
      ratingColor = `rgb(${r}, ${g}, ${b})`;
      ratingBg = `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
  }

  useEffect(() => {
    if (visible && timer) {
      setStartTimeText(formatISTTime(new Date(timer.startTimeIso)));
      setEndTimeText(formatISTTime(new Date()));
      setIsSubmitting(false);

      if (subject && subject.teachers && subject.teachers.length > 0) {
        setTeacherName(subject.teachers[0]);
      }
    }
  }, [visible, timer, subject]);

  if (!timer) return null;

  const baseDate = new Date(timer.startTimeIso);
  const parsedStart = parseTimeText(startTimeText, baseDate);
  const parsedEnd = parseTimeText(endTimeText, new Date());

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

  const handleConfirm = async () => {
    if (isSubmitting || currentError || !parsedStart || !parsedEnd) return;
    setIsSubmitting(true);
    try {
      await onConfirm(parsedStart, parsedEnd, classType, teacherName, rating ? parseFloat(rating) : null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={() => !isSubmitting && onDiscard()}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => !isSubmitting && onDiscard()}>
          <View style={styles.backdrop}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          </View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardContainer}
        >
          <View style={[styles.sheetContainer, { maxHeight: '85%' }]}>
            {Platform.OS !== 'web' && (
              <View style={styles.handleContainer}>
                <View style={styles.handleIndicator} />
              </View>
            )}

            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Lecture Finished</Text>
                    <Text style={styles.subtitle}>Confirm details to save attendance</Text>
                  </View>
                </View>

                <View style={[styles.summaryCard, shadow.glow(timer.color)]}>
                  <View style={styles.subjectRow}>
                    <View style={[styles.colorDot, { backgroundColor: timer.color, ...shadow.glow(timer.color) }]} />
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
                    
                    <View style={styles.timeDivider}>
                      <Ionicons name="arrow-forward" size={16} color={textColors.tertiary} />
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

                  <View style={styles.durationBadge}>
                    <Ionicons name="time" size={16} color={textColors.secondary} />
                    <View>
                      <Text style={styles.durationLabel}>Duration</Text>
                      <Text style={styles.durationValue}>{durationStr}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.form}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>CLASS TYPE</Text>
                    <View style={styles.segmentedControl}>
                      {(['theory', 'lab', 'tutorial'] as const).map(type => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.segmentBtn, classType === type && styles.segmentBtnActive]}
                          onPress={() => setClassType(type)}
                        >
                          <Text style={[styles.segmentText, classType === type && styles.segmentTextActive]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {subject && subject.teachers && subject.teachers.length > 0 && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>TEACHER</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                        {subject.teachers.map((t: string) => {
                          let display = t;
                          try {
                            if (t.startsWith('{')) {
                              const obj = JSON.parse(t);
                              display = `${obj.n} (${obj.s})`;
                            }
                          } catch(e) {}
                          return (
                            <TouchableOpacity
                              key={t}
                              style={[
                                { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: border.default },
                                teacherName === t && { backgroundColor: accent.primary, borderColor: accent.primary }
                              ]}
                              onPress={() => setTeacherName(teacherName === t ? '' : t)}
                            >
                              <Text style={[{ fontSize: 12, color: textColors.secondary }, teacherName === t && { color: '#fff' }]}>{display}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>RATING / 10 (OPTIONAL)</Text>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <TextInput
                        style={[
                          styles.ratingInput,
                          {
                            borderColor: ratingColor,
                            backgroundColor: ratingBg,
                            color: ratingColor === border.default ? textColors.primary : ratingColor,
                          }
                        ]}
                        value={rating}
                        onChangeText={handleRatingChange}
                        placeholder="10"
                        keyboardType="decimal-pad"
                        maxLength={4}
                        placeholderTextColor={textColors.tertiary}
                      />
                    </Animated.View>
                  </View>

                  <Text style={styles.helperText}>
                    Adjust the times directly in the fields above if needed.
                    We'll validate that the format is correct and slots do not overlap.
                  </Text>
                </View>

              </ScrollView>

              <View style={[styles.actionRow, { padding: spacing.md, borderTopWidth: 1, borderTopColor: border.subtle, backgroundColor: canvas.elevated }]}>
                <TouchableOpacity style={[styles.cancelBtn, isSubmitting && { opacity: 0.5 }]} activeOpacity={0.7} onPress={() => !isSubmitting && onCancel()}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.discardBtn, isSubmitting && { opacity: 0.5 }]} activeOpacity={0.7} onPress={() => !isSubmitting && onDiscard()}>
                  <Text style={styles.discardText}>Discard</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, isSubmitting && { opacity: 0.5 }, currentError ? { opacity: 0.5, backgroundColor: glass.medium } : {}]} 
                  activeOpacity={0.7} 
                  onPress={handleConfirm}
                  disabled={isSubmitting || !!currentError}
                >
                  <Text style={[styles.saveText, currentError ? { color: textColors.tertiary } : {}]}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Text>
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
    ...StyleSheet.absoluteFill,
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
    backgroundColor: border.default,
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
  ratingInput: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    backgroundColor: glass.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: border.default,
    textAlign: 'center',
    width: 80,
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
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: border.subtle,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: border.subtle,
  },
  durationLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    textTransform: 'uppercase',
  },
  durationValue: {
    fontSize: fontSize.md,
    color: textColors.primary,
    fontFamily: fontFamily.bold,
  },
  form: {
    paddingHorizontal: spacing.md,
  },
  formGroup: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: textColors.tertiary,
    marginBottom: spacing.xl,
    lineHeight: 18,
  },

  segmentedControl: {
    flexDirection: "row",
    backgroundColor: glass.medium,
    borderRadius: radius.md,
    padding: 4,
    marginTop: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: glass.light,
  },
  segmentText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
  },
  segmentTextActive: {
    color: textColors.primary,
    fontFamily: fontFamily.bold,
  },

  label: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 1.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: border.subtle,
    backgroundColor: canvas.elevated,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Purple background
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  discardBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
  },
  cancelText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: '#8B5CF6',
  },
  discardText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: '#EF4444',
  },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: '#000000',
  },
});
