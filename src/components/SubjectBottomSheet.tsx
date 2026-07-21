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
  Keyboard,
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

interface SubjectBottomSheetProps {
  visible: boolean;
  initialData?: { id?: string; name: string; shortName: string; threshold: number } | null;
  onClose: () => void;
  onSave: (data: { name: string; shortName: string; threshold: number }) => void;
  onDelete?: () => void;
}

export default function SubjectBottomSheet({ visible, initialData, onClose, onSave, onDelete }: SubjectBottomSheetProps) {
  const [name, setName] = React.useState('');
  const [shortName, setShortName] = React.useState('');
  const [threshold, setThreshold] = React.useState('75');

  React.useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name);
      setShortName(initialData.shortName);
      setThreshold(initialData.threshold.toString());
    } else if (visible && !initialData) {
      setName('');
      setShortName('');
      setThreshold('75');
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name || !shortName) return;
    onSave({
      name,
      shortName,
      threshold: parseInt(threshold, 10) || 75,
    });
    setName('');
    setShortName('');
    setThreshold('75');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
                  <Text style={styles.title}>{initialData ? 'Edit Subject' : 'New Subject'}</Text>
                  <Text style={styles.subtitle}>{initialData ? 'Update subject targets' : 'Set up a new academic module'}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={textColors.secondary} />
                </TouchableOpacity>
              </View>

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
                    onChangeText={setThreshold}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.helperText}>
                    This is the minimum attendance required for this specific subject.
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.saveButton, initialData && { flex: 1 }]}
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
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDelete()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={20} color={'#DC2626'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
    backgroundColor: glass.strong,
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
