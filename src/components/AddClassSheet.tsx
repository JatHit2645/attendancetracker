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
  TouchableWithoutFeedback,
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
  semesters?: any[];
  initialSemesterId?: string;
  initialData?: {
    id: string;
    semesterId?: string;
    subjectId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
    class_type?: string;
    default_teacher?: string;
    date?: string;
  } | null;
  onClose: () => void;
  onSave: (data: {
    semesterId?: string;
    subjectId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomNumber?: string;
    class_type?: string;
    default_teacher?: string;
    date?: string;
  }) => void;
  onDelete?: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddClassSheet({ visible, subjects, semesters, initialSemesterId, initialData, onClose, onSave, onDelete }: AddClassSheetProps) {
  const [selectedSemesterId, setSelectedSemesterId] = useState(initialSemesterId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [roomNumber, setRoomNumber] = useState('');
  
  const [dateText, setDateText] = useState('');
  const [classType, setClassType] = useState<'theory' | 'lab' | 'tutorial'>('theory');
  const [defaultTeacher, setDefaultTeacher] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setSelectedSubjectId(initialData.subjectId);
        setSelectedDay(initialData.dayOfWeek);
        setStartTime(initialData.startTime);
        setEndTime(initialData.endTime);
        setRoomNumber(initialData.roomNumber === 'TBA' ? '' : initialData.roomNumber);
      } else if (subjects.length > 0) {
        setSelectedSubjectId(subjects[0].id);
        setSelectedDay('Monday');
        setStartTime('09:00');
        setEndTime('10:00');
        setRoomNumber('');
      }
    }
  }, [visible, subjects, initialData]);

  const formatTimeInput = (text: string, prevText: string) => {
    if (text.length < prevText.length) return text;
    const cleaned = text.replace(/\D/g, '');
    let hours = cleaned.slice(0, 2);
    let minutes = cleaned.slice(2, 4);

    if (hours.length === 2 && parseInt(hours, 10) > 23) hours = '23';
    if (minutes.length === 2 && parseInt(minutes, 10) > 59) minutes = '59';

    if (cleaned.length >= 3) {
      return `${hours}:${minutes}`;
    } else if (cleaned.length === 2 && text.length === 2) {
      return `${hours}:`;
    }
    return cleaned;
  };

  const formatDateInput = (text: string, prevText: string) => {
    if (text.length < prevText.length) return text;
    const cleaned = text.replace(/\D/g, '');
    let year = cleaned.slice(0, 4);
    let month = cleaned.slice(4, 6);
    let day = cleaned.slice(6, 8);

    if (month.length === 2 && parseInt(month, 10) > 12) month = '12';
    if (day.length === 2 && parseInt(day, 10) > 31) day = '31';

    if (cleaned.length >= 7) {
      return `${year}/${month}/${day}`;
    } else if (cleaned.length >= 5) {
      return `${year}/${month}`;
    } else if (cleaned.length >= 4 && text.length === 4) {
      return `${year}/`;
    }
    return cleaned;
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDateInput(text, dateText);
    setDateText(formatted);

    // Auto-fill day of week
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          if (DAYS.includes(dayName)) {
            setSelectedDay(dayName);
          }
        }
      }
    }
  };

  const handleSave = () => {
    if (!selectedSubjectId || !selectedDay || !startTime || !endTime) return;
    onSave({
      semesterId: selectedSemesterId || undefined,
      subjectId: selectedSubjectId,
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      roomNumber: roomNumber.trim() || undefined,
      class_type: classType,
      default_teacher: defaultTeacher || undefined,
      date: dateText.replace(/\//g, '-') || undefined,
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
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          </View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={[styles.sheetContainer, { maxHeight: Platform.OS === 'ios' ? '95%' : '100%' }]}>
            {Platform.OS !== 'web' && (
              <View style={styles.handleContainer}>
                <View style={styles.handleIndicator} />
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{initialData ? 'Edit Class' : 'Add Class'}</Text>
                <Text style={styles.subtitle}>{initialData ? 'Update timetable entry' : 'Schedule a lecture in your timetable'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={textColors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>SELECT SUBJECT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {subjects.map(sub => (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.chip, selectedSubjectId === sub.id && styles.chipActive, { borderColor: sub.color }]}
                      onPress={() => setSelectedSubjectId(sub.id)}
                    >
                      <Text style={[styles.chipText, selectedSubjectId === sub.id && styles.chipTextActive]}>
                        {sub.short_name || sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {selectedSubjectId && subjects.find(s => s.id === selectedSubjectId)?.teachers?.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>DEFAULT TEACHER (OPTIONAL)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
                    {subjects.find(s => s.id === selectedSubjectId)?.teachers.map((t: string) => {
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
                            defaultTeacher === t && { backgroundColor: accent.primary, borderColor: accent.primary }
                          ]}
                          onPress={() => setDefaultTeacher(defaultTeacher === t ? '' : t)}
                        >
                          <Text style={[{ fontSize: 12, color: textColors.secondary }, defaultTeacher === t && { color: '#fff' }]}>{display}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>CLASS TYPE</Text>
                <View style={{ flexDirection: 'row', backgroundColor: glass.medium, borderRadius: radius.md, padding: 4 }}>
                  {(['theory', 'lab', 'tutorial'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm }, classType === type && { backgroundColor: glass.light }]}
                      onPress={() => setClassType(type)}
                    >
                      <Text style={[styles.chipText, classType === type && { color: textColors.primary, fontFamily: fontFamily.bold }]}>
                        {type === 'theory' ? 'Theory' : type === 'lab' ? 'Lab' : 'Tutorial'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>SPECIFIC DATE (OPTIONAL)</Text>
                <TextInput
                  style={styles.roomInput}
                  value={dateText}
                  onChangeText={handleDateChange}
                  placeholder="YYYY/MM/DD"
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={textColors.tertiary}
                />
              </View>

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

              <View style={styles.timeRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>START TIME (HH:MM)</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={startTime}
                    onChangeText={(t) => setStartTime(formatTimeInput(t, startTime))}
                    placeholder="e.g. 09:00"
                    keyboardType="numeric"
                    maxLength={5}
                    placeholderTextColor={textColors.tertiary}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>END TIME (HH:MM)</Text>
                  <TextInput
                    style={[styles.timeInput, { textAlign: 'right' }]}
                    value={endTime}
                    onChangeText={(t) => setEndTime(formatTimeInput(t, endTime))}
                    placeholder="e.g. 10:30"
                    keyboardType="numeric"
                    maxLength={5}
                    placeholderTextColor={textColors.tertiary}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>ROOM NUMBER (OPTIONAL)</Text>
                <TextInput
                  style={styles.roomInput}
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                  placeholder="e.g. 402, LH-1, TBA"
                  placeholderTextColor={textColors.tertiary}
                />
              </View>

              <Text style={styles.helperText}>
                Enter times in 24-hour format (HH:MM).
              </Text>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={[styles.saveButton, initialData && { flex: 1 }]} onPress={handleSave} activeOpacity={0.8}>
                <LinearGradient colors={[accent.primary, accent.primaryHover]} style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>{initialData ? 'Save Changes' : 'Add to Timetable'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {initialData && onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDelete()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color={'#DC2626'} />
                </TouchableOpacity>
              )}
              </View>
            </ScrollView>
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
    borderTopLeftRadius: Platform.OS === 'web' ? radius['2xl'] : radius['3xl'],
    borderTopRightRadius: Platform.OS === 'web' ? radius['2xl'] : radius['3xl'],
    borderBottomLeftRadius: Platform.OS === 'web' ? radius['2xl'] : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? radius['2xl'] : 0,
    borderWidth: 1,
    borderColor: border.default,
    paddingHorizontal: spacing['2xl'],
    paddingTop: Platform.OS === 'web' ? spacing['2xl'] : 0,
    paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing['2xl'],
    ...shadow.strong,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handleIndicator: {
    backgroundColor: border.subtle,
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
    backgroundColor: glass.subtle,
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
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 1.5,
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
    ...shadow.glow(accent.primary),
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
  roomInput: {
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
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  saveButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.glow(accent.primary),
  },
  saveButtonGradient: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#fff',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: '#DC2626' + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DC2626' + '40',
  },
});
