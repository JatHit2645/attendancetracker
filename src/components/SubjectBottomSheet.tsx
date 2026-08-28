import React, { useState } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  useWindowDimensions
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
  palette,
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface SubjectBottomSheetProps {
  visible: boolean;
  initialData?: { id?: string; name: string; shortName: string; threshold: number } | null;
  onClose: () => void;
  onSave: (data: { name: string; shortName: string; threshold: number }) => void;
  onDelete?: () => void;
}

export default function SubjectBottomSheet({ visible, initialData, onClose, onSave, onDelete }: SubjectBottomSheetProps) {
  const { height } = useWindowDimensions();
  const [name, setName] = React.useState('');
  const [shortName, setShortName] = React.useState('');
  const [threshold, setThreshold] = React.useState('75');
  const [teachers, setTeachers] = React.useState<string[]>([]);
  const [teacherInput, setTeacherInput] = React.useState('');
  const [teacherShortName, setTeacherShortName] = React.useState('');
  const [editingOldTeacher, setEditingOldTeacher] = React.useState<string | null>(null);
  const [renamedTeachers, setRenamedTeachers] = React.useState<{ oldName: string; newName: string }[]>([]);

  React.useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name);
      setShortName(initialData.shortName || (initialData as any).short_name || '');
      setThreshold(initialData.threshold?.toString() || (initialData as any).target_threshold?.toString() || '75');
      setTeachers((initialData as any).teachers || []);
    } else if (visible && !initialData) {
      setName('');
      setShortName('');
      setThreshold('75');
      setTeachers([]);
    }
    setTeacherInput('');
    setTeacherShortName('');
    setEditingOldTeacher(null);
    setRenamedTeachers([]);
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim() || !shortName.trim()) return;
    let parsedThreshold = parseInt(threshold, 10);
    if (isNaN(parsedThreshold)) parsedThreshold = 75;
    parsedThreshold = Math.min(100, Math.max(1, parsedThreshold));

    onSave({
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      threshold: parsedThreshold,
      teachers: teachers,
    } as any);
    setName('');
    setShortName('');
    setThreshold('75');
    setTeachers([]);
    setTeacherInput('');
    setTeacherShortName('');
    setEditingOldTeacher(null);
    setRenamedTeachers([]);
    onClose();
  };

  const handleAddTeacher = () => {
    const tName = teacherInput.trim();
    const tShort = teacherShortName.trim().toUpperCase();
    if (!tName) return;
    
    const newEntry = tShort ? JSON.stringify({ n: tName, s: tShort }) : tName;
    
    if (editingOldTeacher) {
      if (editingOldTeacher !== newEntry) {
        setTeachers(teachers.map(t => t === editingOldTeacher ? newEntry : t));
        setRenamedTeachers([...renamedTeachers, { oldName: editingOldTeacher, newName: newEntry }]);
      }
      setEditingOldTeacher(null);
      setTeacherInput('');
      setTeacherShortName('');
    } else {
      if (!teachers.includes(newEntry)) {
        setTeachers([...teachers, newEntry]);
        setTeacherInput('');
        setTeacherShortName('');
      }
    }
  };

  const handleEditTeacher = (teacher: string) => {
    setEditingOldTeacher(teacher);
    let tName = teacher;
    let tShort = '';
    try {
      if (teacher.startsWith('{')) {
        const obj = JSON.parse(teacher);
        tName = obj.n;
        tShort = obj.s;
      }
    } catch(e) {}
    setTeacherInput(tName);
    setTeacherShortName(tShort);
  };

  const handleRemoveTeacher = (teacher: string) => {
    setTeachers(teachers.filter(t => t !== teacher));
  };

  const handleThresholdChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      if (parsed > 100) parsed = 100;
      setThreshold(parsed.toString());
    } else {
      setThreshold('');
    }
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
            {Platform.OS !== 'web' ? (
              <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
            )}
          </View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior="padding"
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
                  <Text style={styles.title}>{initialData ? 'Edit Subject' : 'New Subject'}</Text>
                  <Text style={styles.subtitle}>{initialData ? 'Update subject targets' : 'Set up a new academic module'}</Text>
                </View>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={textColors.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={{ flexShrink: 1, maxHeight: height * 0.7 }} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>SUBJECT NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Data Structures & Algorithms"
                    placeholderTextColor={textColors.disabled}
                    value={name}
                    onChangeText={setName}
                    autoFocus={Platform.OS === 'web'}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>SHORT CODE (MAX 5 CHARS)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. DSA"
                    placeholderTextColor={textColors.disabled}
                    value={shortName}
                    onChangeText={setShortName}
                    maxLength={5}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>TARGET THRESHOLD (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="75"
                    placeholderTextColor={textColors.disabled}
                    value={threshold}
                    onChangeText={handleThresholdChange}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.helperText}>
                    This is the minimum attendance required for this specific subject.
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>FACULTY / TEACHERS (OPTIONAL)</Text>
                  <View style={styles.teacherInputRow}>
                    <View style={{ flex: 1, flexDirection: 'row', gap: spacing.sm }}>
                      <TextInput
                        style={[styles.input, { flex: 2, paddingVertical: spacing.md }]}
                        placeholder="Name (e.g. Dr. Smith)"
                        placeholderTextColor={textColors.disabled}
                        value={teacherInput}
                        onChangeText={setTeacherInput}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, paddingVertical: spacing.md }]}
                        placeholder="Code"
                        placeholderTextColor={textColors.disabled}
                        value={teacherShortName}
                        onChangeText={setTeacherShortName}
                        maxLength={5}
                        autoCapitalize="characters"
                        onSubmitEditing={handleAddTeacher}
                      />
                    </View>
                    <TouchableOpacity onPress={handleAddTeacher} style={styles.addTeacherBtn}>
                      <Ionicons name={editingOldTeacher ? "checkmark" : "add"} size={20} color={palette.white} />
                    </TouchableOpacity>
                  </View>

                  {teachers.length > 0 && (
                    <View style={styles.teachersList}>
                      {teachers.map((t, index) => {
                        let display = t;
                        try {
                          if (t.startsWith('{')) {
                            const obj = JSON.parse(t);
                            display = `${obj.n} (${obj.s})`;
                          }
                        } catch(e) {}
                        return (
                          <View key={index} style={[styles.teacherChip, editingOldTeacher === t && { borderColor: '#3b82f6', borderWidth: 2 }]}>
                            <Text style={styles.teacherChipText}>{display}</Text>
                            <TouchableOpacity onPress={() => handleEditTeacher(t)} style={[styles.teacherChipRemove, { marginLeft: 8 }]}>
                              <Ionicons name="pencil" size={14} color={textColors.secondary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveTeacher(t)} style={styles.teacherChipRemove}>
                              <Ionicons name="close-circle" size={16} color={textColors.tertiary} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <Text style={styles.helperText}>
                    Add all professors/tutors who teach this subject.
                  </Text>
                </View>
              </View>
            </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button"                   style={[styles.saveButton, initialData && { flex: 1 }]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[accent.primary, accent.primaryHover]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>{initialData ? 'Save Changes' : 'Create Subject'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {initialData && onDelete && (
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button"                     style={styles.deleteButton}
                    onPress={() => onDelete()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={20} color={palette.red[600]} />
                  </TouchableOpacity>
                )}
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
  input: {
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: textColors.primary,
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
    color: palette.white,
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: palette.red[600] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.red[600] + '40',
  },
  teacherInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addTeacherBtn: {
    backgroundColor: glass.light,
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border.default,
  },
  teachersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  teacherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: border.default,
    gap: spacing.xs,
  },
  teacherChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.primary,
  },
  teacherChipRemove: {
    marginLeft: 4,
  },
});
