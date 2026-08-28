import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import { TaskService, AcademicTask } from '../services/TaskService';
import { canvas, text as textColors, border, glass, shadow } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export interface TaskSheetRef {
  open: () => void;
  close: () => void;
}

interface TaskSheetProps {
  onTaskAdded?: (task: AcademicTask) => void;
}

export const TaskSheet = forwardRef<TaskSheetRef, TaskSheetProps>(({ onTaskAdded }, ref) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'assignment' | 'exam' | 'quiz'>('assignment');
  const [priority, setPriority] = useState<'low'|'medium'|'high'|'critical'>('medium');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0].replace(/-/g, '/');
  });

  const formatDateInput = (text: string, prevText: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 8; i++) {
      if (i === 4 || i === 6) formatted += '/';
      formatted += cleaned[i];
    }
    if (prevText.endsWith('/') && text.length < prevText.length) {
      return formatted.slice(0, -1);
    }
    return formatted;
  };

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const handleSave = async () => {
    if (!title.trim() || !dueDate.trim()) return;
    try {
      const parsedDate = new Date(dueDate.replace(/\//g, '-'));
      if (isNaN(parsedDate.getTime())) {
        alert('Invalid Date format. Use YYYY/MM/DD');
        return;
      }
      const newTask = await TaskService.createTask({
        title,
        task_type: taskType,
        priority,
        due_date: parsedDate.toISOString(),
      });
      if (onTaskAdded) onTaskAdded(newTask);
      setTitle('');
      setVisible(false);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      alert('Error saving task: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={() => setVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.backdrop}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: canvas.backdrop }]} />
            {Platform.OS !== 'web' && (
              <BlurView intensity={20} style={StyleSheet.absoluteFill as any} tint="dark" />
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />
          
          <Text style={styles.headerTitle}>Add New Task</Text>

          <TextInput
            style={styles.input}
            placeholder="Task Title"
            placeholderTextColor={textColors.tertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.label}>Due Date (YYYY/MM/DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024/12/31"
                placeholderTextColor={textColors.tertiary}
                value={dueDate}
                onChangeText={(t) => setDueDate(formatDateInput(t, dueDate))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityDot,
                      { backgroundColor: p === 'critical' ? '#ef4444' : p === 'high' ? '#f59e0b' : p === 'medium' ? '#3b82f6' : '#94a3b8' },
                      priority === p ? styles.priorityDotActive : null
                    ]}
                    onPress={() => setPriority(p)}
                  />
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>Task Type</Text>
          <View style={styles.typeContainer}>
            {['assignment', 'exam', 'quiz'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, taskType === type && styles.typeButtonActive]}
                onPress={() => setTaskType(type as any)}
              >
                <Text style={taskType === type ? styles.typeTextActive : styles.typeText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Task</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as any,
  },
  sheet: {
    backgroundColor: canvas.elevated,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    borderWidth: 1,
    borderColor: border.default,
    borderBottomWidth: 0,
    ...shadow.medium,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: border.strong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: canvas.base,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: textColors.primary,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
    marginBottom: spacing.xs,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: canvas.base,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 50,
  },
  priorityDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  priorityDotActive: {
    borderColor: textColors.primary,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: glass.subtle,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  typeText: {
    fontFamily: fontFamily.medium,
    color: textColors.secondary,
  },
  typeTextActive: {
    fontFamily: fontFamily.bold,
    color: '#3B82F6',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: fontFamily.bold,
    color: 'white',
    fontSize: fontSize.base,
  },
});
