import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface AddClassSheetProps {
  visible: boolean;
  subjects: any[];
  onClose: () => void;
  onSave: (data: { subjectId: string; dayOfWeek: string; startTime: string; endTime: string }) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddClassSheet({ visible, subjects, onClose, onSave }: AddClassSheetProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (visible && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [visible, subjects]);

  const handleSave = () => {
    if (!selectedSubjectId || !selectedDay || !startTime || !endTime) return;
    onSave({
      subjectId: selectedSubjectId,
      dayOfWeek: selectedDay,
      startTime,
      endTime
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
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
                <Text style={styles.title}>Add Class</Text>
                <Text style={styles.subtitle}>Schedule a lecture in your timetable</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={textColors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {/* Subject Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>SELECT SUBJECT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {subjects.map(sub => (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.chip, selectedSubjectId === sub.id && { borderColor: sub.color, backgroundColor: sub.color + '20' }]}
                      onPress={() => setSelectedSubjectId(sub.id)}
                    >
                      <Text style={[styles.chipText, selectedSubjectId === sub.id && { color: sub.color, fontFamily: fontFamily.bold }]}>
                        {sub.short_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>DAY OF WEEK</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {DAYS.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.chip, selectedDay === day && styles.chipActive]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.chipText, selectedDay === day && styles.chipTextActive]}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Time Selection */}
              <View style={styles.timeRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>START TIME (HH:MM)</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="e.g. 09:00"
                    placeholderTextColor={textColors.tertiary}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>END TIME (HH:MM)</Text>
                  <TextInput
                    style={[styles.timeInput, { textAlign: 'right' }]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="e.g. 10:00"
                    placeholderTextColor={textColors.tertiary}
                  />
                </View>
              </View>
              <Text style={styles.helperText}>
                Enter times in 24-hour format (HH:MM).
              </Text>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                <LinearGradient colors={[accent.primary, accent.primaryHover]} style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>Add to Timetable</Text>
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
    borderTopLeftRadius: Platform.OS === 'web' ? radius['2xl'] : radius['3xl'],
    borderTopRightRadius: Platform.OS === 'web' ? radius['2xl'] : radius['3xl'],
    borderBottomLeftRadius: Platform.OS === 'web' ? radius['2xl'] : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? radius['2xl'] : 0,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
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
  closeButton: {
    backgroundColor: glass.light,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border.default,
  },
  form: {
    gap: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  formGroup: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: glass.subtle,
    borderWidth: 1,
    borderColor: border.default,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: accent.primary + '20',
    borderColor: accent.primary,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    color: textColors.secondary,
  },
  chipTextActive: {
    color: accent.primary,
    fontFamily: fontFamily.bold,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  timeInput: {
    fontFamily: fontFamily.medium,
    color: textColors.primary,
    fontSize: fontSize.base,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
    paddingVertical: 6,
  },
  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.md,
  },
  saveButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#fff',
  },
});
