import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { canvas, text as textColors, accent, glass, border, shadow } from '../theme/colors';
import { fontFamily, fontSize, textStyle } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { DatabaseService } from '../services/DatabaseService';
import { supabase } from '../lib/supabase';

interface HolidayManagerSheetProps {
  visible: boolean;
  semesterId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function HolidayManagerSheet({ visible, semesterId, onClose, onRefresh }: HolidayManagerSheetProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !startDate.trim() || !endDate.trim()) {
      Alert.alert('Error', 'Please fill in all fields (YYYY-MM-DD)');
      return;
    }
    if (!semesterId) {
      Alert.alert('Error', 'No active semester');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const start = new Date(startDate);
      const end = new Date(endDate);
      const inserts = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        inserts.push({
          user_id: user.id,
          semester_id: semesterId,
          date: d.toLocaleDateString('en-CA'),
          title,
          type: 'holiday'
        });
      }

      const { error } = await supabase.from('holidays').insert(inserts);
      
      if (error) throw error;
      setTitle('');
      setStartDate('');
      setEndDate('');
      onRefresh();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Mark Holiday</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={textColors.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>Exclude a specific date from attendance calculations (e.g. Festival, Exam day, Cancelled class).</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Holiday Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Diwali Break"
              placeholderTextColor={textColors.tertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-10-24"
              placeholderTextColor={textColors.tertiary}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-10-28"
              placeholderTextColor={textColors.tertiary}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={[accent.primary, accent.primaryHover]} style={styles.saveGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Exemption</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: canvas.elevated,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing['2xl'],
    borderTopWidth: 1,
    borderColor: border.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: textColors.secondary,
    marginBottom: spacing.xl,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: textColors.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: canvas.base,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    padding: spacing.md,
    color: textColors.primary,
    fontFamily: fontFamily.medium,
  },
  saveButton: {
    marginTop: spacing.md,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  saveGradient: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: '#fff',
  },
});
