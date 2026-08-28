import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { canvas, glass, border, text, accent, palette } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { DatabaseService } from '../services/DatabaseService';
import { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type TimetableVersion = Database['public']['Tables']['timetable_versions']['Row'];

interface TimetableManagerProps {
  visible: boolean;
  semesterId: string;
  onClose: () => void;
  onVersionSelected: (versionId: string) => void;
  activeVersionId?: string;
}

export default function TimetableManager({ visible, semesterId, onClose, onVersionSelected, activeVersionId }: TimetableManagerProps) {
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVersionId, setEditVersionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState('');
  const [copyFromId, setCopyFromId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && semesterId) {
      loadVersions();
    }
  }, [visible, semesterId]);

  const loadVersions = async () => {
    try {
      const data = await DatabaseService.fetchTimetableVersions(semesterId);
      setVersions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !newStartDate || isSaving) return;
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const newVersion = await DatabaseService.createTimetableVersion({
        user_id: user.id,
        semester_id: semesterId,
        name: newName.trim(),
        start_date: newStartDate,
        is_active: true,
      }, copyFromId || undefined);
      
      setIsCreating(false);
      setNewName('');
      setCopyFromId(null);
      await loadVersions();
      onVersionSelected(newVersion.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editVersionId || !newName.trim() || !newStartDate || isSaving) return;
    try {
      setIsSaving(true);
      await DatabaseService.updateTimetableVersion(editVersionId, {
        name: newName.trim(),
        start_date: newStartDate,
        end_date: newEndDate.trim() || null,
      });
      setIsEditing(false);
      setEditVersionId(null);
      await loadVersions();
    } catch (e) {
      console.error(e);
      alert("Failed to update version.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Timetable Versions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={text.secondary} />
            </TouchableOpacity>
          </View>

          {isCreating ? (
            <View style={styles.createForm}>
              <Text style={styles.label}>VERSION NAME</Text>
              <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="e.g. Mid-Sem Revised Timetable" placeholderTextColor={text.disabled} />
              
              <Text style={styles.label}>EFFECTIVE FROM (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={newStartDate} onChangeText={setNewStartDate} placeholder="2024-08-15" placeholderTextColor={text.disabled} />

              <Text style={styles.label}>COPY SCHEDULE FROM</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                <TouchableOpacity onPress={() => setCopyFromId(null)} style={[styles.chip, !copyFromId && styles.chipActive]}>
                  <Text style={[styles.chipText, !copyFromId && styles.chipTextActive]}>None (Blank)</Text>
                </TouchableOpacity>
                {versions.map(v => (
                  <TouchableOpacity key={v.id} onPress={() => setCopyFromId(v.id)} style={[styles.chip, copyFromId === v.id && styles.chipActive]}>
                    <Text style={[styles.chipText, copyFromId === v.id && styles.chipTextActive]}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity onPress={() => setIsCreating(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={[styles.createBtn, isSaving && { opacity: 0.5 }]} disabled={isSaving}>
                  <Text style={styles.createBtnText}>{isSaving ? 'Creating...' : 'Create Version'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={styles.list}>
                {versions.map((v) => (
                  <View key={v.id} style={[styles.versionCard, v.id === activeVersionId && styles.versionCardActive]}>
                    <TouchableOpacity 
                      style={styles.versionInfo}
                      onPress={() => onVersionSelected(v.id)}
                    >
                      <Text style={styles.versionName}>{v.name}</Text>
                      <Text style={styles.versionDates}>
                        From: {v.start_date} {v.end_date ? `To: ${v.end_date}` : '(Current)'}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      {v.id === activeVersionId && <Ionicons name="checkmark-circle" size={24} color={accent.primary} />}
                      <TouchableOpacity 
                        onPress={() => {
                          setEditVersionId(v.id);
                          setNewName(v.name);
                          setNewStartDate(v.start_date);
                          setNewEndDate(v.end_date || '');
                          setIsEditing(true);
                        }}
                        style={{ padding: spacing.xs }}
                      >
                        <Ionicons name="pencil" size={18} color={text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={async () => {
                          if (versions.length === 1) {
                            alert("Cannot delete the only timetable version.");
                            return;
                          }
                          try {
                            await DatabaseService.deleteTimetableVersion(v.id);
                            loadVersions();
                            if (v.id === activeVersionId) {
                              onVersionSelected(versions.find(ver => ver.id !== v.id)!.id);
                            }
                          } catch(e) {
                            console.error(e);
                            alert("Failed to delete version.");
                          }
                        }}
                        style={{ padding: spacing.xs }}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setIsCreating(true)} style={styles.addBtn}>
                <Ionicons name="add" size={20} color={text.primary} />
                <Text style={styles.addBtnText}>New Timetable Version</Text>
              </TouchableOpacity>
            </>
          )}

          {isEditing && (
            <Modal transparent visible={isEditing} onRequestClose={() => setIsEditing(false)}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
                <View style={styles.sheet}>
                  <Text style={styles.title}>Edit Version</Text>
                  <Text style={styles.label}>VERSION NAME</Text>
                  <TextInput style={styles.input} value={newName} onChangeText={setNewName} />
                  
                  <Text style={styles.label}>START DATE</Text>
                  <TextInput style={styles.input} value={newStartDate} onChangeText={setNewStartDate} />

                  <Text style={styles.label}>END DATE (OPTIONAL)</Text>
                  <TextInput style={styles.input} value={newEndDate} onChangeText={setNewEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={text.disabled} />

                  <View style={styles.formActions}>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEditSave} style={[styles.createBtn, isSaving && { opacity: 0.5 }]} disabled={isSaving}>
                      <Text style={styles.createBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: canvas.elevated, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: spacing.xl, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: text.primary },
  closeBtn: { backgroundColor: glass.medium, padding: spacing.sm, borderRadius: radius.full },
  list: { marginBottom: spacing.xl },
  versionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, backgroundColor: glass.medium, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: border.default },
  versionCardActive: { borderColor: accent.primary, backgroundColor: accent.primary + '15' },
  versionInfo: { flex: 1 },
  versionName: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: text.primary },
  versionDates: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: text.secondary, marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: glass.medium, borderRadius: radius.lg, borderWidth: 1, borderColor: border.default, borderStyle: 'dashed' },
  addBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: text.primary, marginLeft: spacing.sm },
  createForm: { gap: spacing.md },
  label: { fontFamily: fontFamily.bold, fontSize: 10, color: text.tertiary, letterSpacing: 1 },
  input: { backgroundColor: glass.light, borderWidth: 1, borderColor: border.default, borderRadius: radius.lg, padding: spacing.md, color: text.primary, fontFamily: fontFamily.medium },
  chipsRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: glass.medium, borderRadius: radius.full, marginRight: spacing.sm, borderWidth: 1, borderColor: border.default },
  chipActive: { backgroundColor: accent.primary, borderColor: accent.primary },
  chipText: { color: text.secondary, fontFamily: fontFamily.medium, fontSize: fontSize.xs },
  chipTextActive: { color: palette.white },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: spacing.md, alignItems: 'center', backgroundColor: glass.medium, borderRadius: radius.lg },
  cancelBtnText: { color: text.secondary, fontFamily: fontFamily.bold },
  createBtn: { flex: 1, padding: spacing.md, alignItems: 'center', backgroundColor: accent.primary, borderRadius: radius.lg },
  createBtnText: { color: palette.white, fontFamily: fontFamily.bold },
});
