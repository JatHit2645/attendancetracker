import { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Platform , useWindowDimensions, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { canvas, text as textColors, accent, glass, border, shadow, palette } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { DatabaseService } from '../services/DatabaseService';
import { supabase } from '../lib/supabase';
import { LogbookService } from '../services/LogbookService';
import { Database } from '../lib/database.types';

type Holiday = Database['public']['Tables']['holidays']['Row'];

interface HolidayManagerSheetProps {
  visible: boolean;
  semesterId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function HolidayManagerSheet({ visible, semesterId, onClose, onRefresh }: HolidayManagerSheetProps) {
  const { height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    } else if (cleaned.length === 4 && text.length === 4) {
      return `${year}/`;
    } else if (cleaned.length === 6 && text.length === 7) {
      return `${year}/${month}/`;
    }
    return cleaned;
  };

  const handleStartDateChange = (text: string) => setStartDate(formatDateInput(text, startDate));
  const handleEndDateChange = (text: string) => setEndDate(formatDateInput(text, endDate));

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchHolidaysList = async () => {
    if (!semesterId) return;
    try {
      setFetching(true);
      const data = await DatabaseService.fetchHolidays(semesterId);
      setHolidays(data || []);
    } catch (e) {
      console.warn('Failed to fetch holidays in sheet', e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchHolidaysList();
      setActiveTab('add');
      resetForm();
    }
  }, [visible, semesterId]);

  const resetForm = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    setEditingHoliday(null);
  };

  const handleEditClick = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setTitle(holiday.title);
    setStartDate(holiday.date.replace(/-/g, '/'));
    setEndDate(holiday.date.replace(/-/g, '/'));
    setActiveTab('add');
  };

  const handleDeleteClick = async (holiday: Holiday) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Are you sure you want to permanently delete the holiday "${holiday.title}"?`)
      : await new Promise<boolean>(resolve => {
          Alert.alert(
            "Delete Holiday?",
            `Are you sure you want to remove the exemption for "${holiday.title}"?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) }
            ]
          );
        });

    if (confirmDelete) {
      try {
        setLoading(true);
        await DatabaseService.deleteHoliday(holiday.id);
        fetchHolidaysList();
        onRefresh();
      } catch (e: any) {
        Alert.alert('Error', 'Failed to delete holiday: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !startDate.trim() || (!editingHoliday && !endDate.trim())) {
      Alert.alert('Error', 'Please fill in all date fields (YYYY/MM/DD)');
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

      if (editingHoliday) {
        // Edit mode (single date updates)
        await DatabaseService.updateHoliday(editingHoliday.id, {
          title: title.trim(),
          date: startDate.replace(/\//g, '-').trim()
        });
      } else {
        // Add mode (allows date ranges)
        const start = new Date(startDate.replace(/\//g, '-'));
        const end = endDate ? new Date(endDate.replace(/\//g, '-')) : start;
        
        if (start > end) {
          Alert.alert('Error', 'End date must be after start date');
          setLoading(false);
          return;
        }

        const inserts = [];
        const current = new Date(start);
        
        while (current <= end) {
          inserts.push({
            user_id: user.id,
            semester_id: semesterId,
            date: current.toISOString().split('T')[0],
            title: title.trim(),
            type: 'holiday' as const
          });
          current.setDate(current.getDate() + 1);
        }

        // Insert using bulk Supabase operation
        const { error } = await supabase.from('holidays').insert(inserts);
        if (error) throw error;
        
        await LogbookService.addLog('create', 'holiday', `Marked ${inserts.length} holidays: ${title.trim()}`);
      }

      resetForm();
      fetchHolidaysList();
      onRefresh();
      
      if (editingHoliday) {
        setActiveTab('list');
      } else {
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingHoliday ? 'Edit Holiday' : 'Mark Holiday'}</Text>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={textColors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Premium Segmented Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" 
              style={[styles.tabBtn, activeTab === 'add' && styles.tabBtnActive]} 
              onPress={() => setActiveTab('add')}
            >
              <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>
                {editingHoliday ? 'Edit Exemption' : 'Add Exemption'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" 
              style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]} 
              onPress={() => setActiveTab('list')}
            >
              <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
                Exemptions List ({holidays.length})
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior="padding" style={{ width: '100%' }}>
          {activeTab === 'add' ? (
            <ScrollView 
              style={{ flexShrink: 1, maxHeight: height * 0.7 }} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.subtitle}>Exclude dates from attendance calculations (e.g. Festivals, Exam weeks, or class cancellations).</Text>

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

              <View style={styles.dateInputsRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>{editingHoliday ? 'Date (YYYY/MM/DD)' : 'Start Date'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY/MM/DD"
                    placeholderTextColor={textColors.tertiary}
                    value={startDate}
                    onChangeText={handleStartDateChange}
                    maxLength={10}
                    keyboardType="numeric"
                  />
                </View>
                
                {!editingHoliday && (
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>End Date</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY/MM/DD"
                      placeholderTextColor={textColors.tertiary}
                      value={endDate}
                      onChangeText={handleEndDateChange}
                      maxLength={10}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                {editingHoliday && (
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" style={styles.cancelEditBtn} onPress={resetForm}>
                    <Text style={styles.cancelEditText}>Cancel Edit</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" style={styles.saveButton} onPress={handleSave} disabled={loading}>
                  <LinearGradient colors={[accent.primary, accent.primaryHover]} style={styles.saveGradient}>
                    {loading ? <ActivityIndicator color={palette.white} /> : <Text style={styles.saveText}>{editingHoliday ? 'Save Changes' : 'Save Exemption'}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={[styles.listScroll, { maxHeight: height * 0.7, flexShrink: 1 }]} showsVerticalScrollIndicator={false}>
              {fetching ? (
                <ActivityIndicator color={accent.primary} style={{ marginTop: spacing.xl }} />
              ) : holidays.length > 0 ? (
                holidays.map(h => (
                  <View key={h.id} style={styles.holidayItem}>
                    <View style={styles.holidayInfo}>
                      <Text style={styles.holidayTitleText}>{h.title}</Text>
                      <Text style={styles.holidayDateText}>{h.date}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" onPress={() => handleEditClick(h)} style={styles.iconBtn}>
                        <Ionicons name="pencil" size={16} color={accent.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" onPress={() => handleDeleteClick(h)} style={styles.iconBtn}>
                        <Ionicons name="trash" size={16} color={palette.red[600]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No holidays created yet.</Text>
              )}
            </ScrollView>
          )}
          </KeyboardAvoidingView>
        </View>
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
    backgroundColor: 'rgba(6, 9, 18, 0.85)',
  },
  sheet: {
    backgroundColor: canvas.elevated,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : '100%',
    borderTopLeftRadius: Platform.OS === 'web' ? radius['2xl'] : radius['3xl'],
    borderTopRightRadius: Platform.OS === 'web' ? radius['2xl'] : radius['3xl'],
    borderBottomLeftRadius: Platform.OS === 'web' ? radius['2xl'] : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? radius['2xl'] : 0,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: border.default,
    ...shadow.strong,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: glass.subtle,
    borderRadius: radius.md,
    padding: 2,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: glass.strong,
    borderWidth: 1,
    borderColor: border.default,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },
  tabTextActive: {
    color: textColors.primary,
    fontFamily: fontFamily.bold,
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
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
  dateInputsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  saveButton: {
    flex: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadow.glow(accent.primary),
  },
  saveGradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: palette.white,
    letterSpacing: 0.5,
  },
  cancelEditBtn: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: border.default,
    backgroundColor: glass.light,
  },
  cancelEditText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
  },
  listScroll: {
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayTitleText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: textColors.primary,
  },
  holidayDateText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.secondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: glass.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border.default,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: textColors.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
