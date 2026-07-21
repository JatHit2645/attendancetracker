/**
 * Attendance Tracker — Timetable Screen (Phase 3)
 * 
 * Premium weekly schedule builder and viewer.
 * Features:
 * - Horizontal week day selector (Pill style)
 * - Vertical timeline with glassmorphic lecture blocks
 * - Empty states for days without lectures
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
} from '../../theme/colors';
import { fontFamily, fontSize, textStyle } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';
import { DatabaseService } from '../../services/DatabaseService';
import AddClassSheet from '../../components/AddClassSheet';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row'];
type SubjectRow = Database['public']['Tables']['subjects']['Row'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MAP: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

const getTodayDayString = () => {
  const dayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStr = dayNames[dayIndex];
  return dayStr === 'Sun' ? 'Mon' : dayStr;
};

export default function TimetableScreen() {
  const [selectedDay, setSelectedDay] = useState(getTodayDayString());
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Record<string, SubjectRow>>({});
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const activeSem = await DatabaseService.fetchActiveSemester();
      if (!activeSem) return;

      const [fetchedSlots, fetchedSubjects] = await Promise.all([
        DatabaseService.fetchTimetable(activeSem.id),
        DatabaseService.fetchSubjects(activeSem.id)
      ]);
      
      const subjectMap: Record<string, SubjectRow> = {};
      fetchedSubjects.forEach(s => { subjectMap[s.id] = s; });
      
      setSlots(fetchedSlots);
      setSubjects(subjectMap);
    } catch (error) {
      console.warn('Failed to fetch timetable from Supabase', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to realtime timetable slot changes
    const subscription = supabase
      .channel('public:timetable_slots_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_slots' }, payload => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadData]);

  // Filter slots for the selected day and map to UI structure
  const selectedDayIndex = DAY_MAP[selectedDay];
  
  const scheduleForDay = slots
    .filter(slot => slot.day_of_week === selectedDayIndex)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map(slot => {
      const subject = subjects[slot.subject_id];
      return {
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        subjectName: subject?.name || 'Unknown',
        subjectShortName: subject?.short_name || 'UNK',
        color: subject?.color || textColors.secondary,
      };
    });

  const handleEditClass = (item: any) => {
    const fullSlot = slots.find(s => s.id === item.id);
    if (fullSlot) {
      setSelectedSlot(fullSlot);
      setSheetVisible(true);
    }
  };

  const handleCloseSheet = () => {
    setSelectedSlot(null);
    setSheetVisible(false);
  };

  const handleSaveClass = async (data: any) => {
    try {
      const activeSem = await DatabaseService.fetchActiveSemester();
      if (!activeSem) {
        alert('No active semester found');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const dayMap: Record<string, number> = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0 };
      const dayOfWeek = dayMap[data.dayOfWeek];

      // Prevent overlapping slots on the same day (excluding itself in edit mode)
      const overlap = slots.some(slot => {
        if (selectedSlot && slot.id === selectedSlot.id) return false;
        if (slot.day_of_week !== dayOfWeek) return false;
        return data.startTime < slot.end_time && data.endTime > slot.start_time;
      });

      if (overlap) {
        alert('This time slot overlaps with an existing class in your timetable!');
        return;
      }

      if (selectedSlot) {
        await DatabaseService.updateTimetableSlot(selectedSlot.id, {
          subject_id: data.subjectId,
          day_of_week: dayOfWeek,
          start_time: data.startTime,
          end_time: data.endTime,
        });
      } else {
        await DatabaseService.createTimetableSlot({
          user_id: user.id,
          semester_id: activeSem.id,
          subject_id: data.subjectId,
          day_of_week: dayOfWeek,
          start_time: data.startTime,
          end_time: data.endTime,
          room_number: 'TBA'
        });
      }
      
      handleCloseSheet();
      loadData();
    } catch (e: any) {
      alert('Error saving class: ' + e.message);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedSlot) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm("Are you sure you want to permanently delete this timetable entry?")
      : await new Promise<boolean>(resolve => {
          Alert.alert(
            "Delete Class?",
            "Are you sure you want to permanently remove this scheduled slot?",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) }
            ]
          );
        });

    if (confirmDelete) {
      try {
        await DatabaseService.deleteTimetableSlot(selectedSlot.id);
        handleCloseSheet();
        loadData();
      } catch (e: any) {
        alert('Error deleting class: ' + e.message);
      }
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header Area */}
      <View style={styles.header}>
        <Text style={styles.title}>Timetable</Text>
        <Text style={styles.subtitle}>
          Your weekly academic schedule.
        </Text>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={() => setSheetVisible(true)}>
          <LinearGradient
            colors={[accent.primary, accent.primaryHover]}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Class</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Day Selector (Horizontal Scroll) */}
      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
        >
          {DAYS.map((day) => {
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                activeOpacity={0.7}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayPill,
                  isActive ? styles.dayPillActive : styles.dayPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    isActive ? styles.dayPillTextActive : styles.dayPillTextInactive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline Content */}
      <ScrollView
        contentContainerStyle={styles.timelineContent}
        showsVerticalScrollIndicator={false}
      >
        {scheduleForDay.length > 0 ? (
          <View style={styles.timelineGrid}>
            {/* Render a vertical line in the background */}
            <View style={styles.timelineBackgroundLine} />
            
            {scheduleForDay.map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                {/* Time Column */}
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{item.startTime}</Text>
                  <Text style={styles.timeTextFaded}>{item.endTime}</Text>
                </View>

                {/* Node */}
                <View style={styles.nodeCol}>
                  <View style={[styles.nodeDot, { borderColor: item.color }]} />
                </View>

                {/* Card */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.lectureCard, { borderLeftColor: item.color }]}
                  onPress={() => handleEditClass(item)}
                >
                  <LinearGradient
                    colors={[item.color + '10', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.subjectShortName} numberOfLines={1}>
                    {item.subjectShortName}
                  </Text>
                  <Text style={styles.subjectFullName} numberOfLines={1}>
                    {item.subjectName}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cafe-outline" size={32} color={textColors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No classes today</Text>
            <Text style={styles.emptySub}>Enjoy your free time!</Text>
          </View>
        )}

        {/* Bottom padding for nav bar */}
        <View style={{ height: layout.bottomNavHeight + spacing['2xl'] }} />
      </ScrollView>

      <AddClassSheet 
        visible={sheetVisible}
        subjects={Object.values(subjects)}
        initialData={selectedSlot ? {
          id: selectedSlot.id,
          subjectId: selectedSlot.subject_id,
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedSlot.day_of_week],
          startTime: selectedSlot.start_time.substring(0, 5),
          endTime: selectedSlot.end_time.substring(0, 5),
          roomNumber: selectedSlot.room_number || 'TBA'
        } : undefined}
        onClose={handleCloseSheet}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
  },
  
  // ── Header
  header: {
    paddingTop: Platform.OS === 'web' ? spacing['3xl'] : spacing.xl,
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyle.pageTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },

  // ── Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.lg,
  },
  addButton: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  addButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: '#fff',
  },

  // ── Day Selector
  daySelectorContainer: {
    marginBottom: spacing.xl,
  },
  daySelectorContent: {
    paddingHorizontal: layout.screenPaddingH,
    gap: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dayPillActive: {
    backgroundColor: textColors.primary,
    borderColor: textColors.primary,
  },
  dayPillInactive: {
    backgroundColor: glass.subtle,
    borderColor: border.default,
  },
  dayPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  dayPillTextActive: {
    color: canvas.base, // Inverted text color
  },
  dayPillTextInactive: {
    color: textColors.secondary,
  },

  // ── Timeline
  timelineContent: {
    paddingHorizontal: layout.screenPaddingH,
  },
  timelineGrid: {
    position: 'relative',
  },
  timelineBackgroundLine: {
    position: 'absolute',
    left: 64, // Center of nodeCol
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: border.default,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timeCol: {
    width: 48,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  timeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: textColors.primary,
  },
  timeTextFaded: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    marginTop: 2,
  },
  nodeCol: {
    width: 32,
    alignItems: 'center',
    paddingTop: 4, // Align with first line of time/card
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: canvas.base,
    borderWidth: 3,
  },
  lectureCard: {
    flex: 1,
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  subjectShortName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: textColors.primary,
    marginBottom: 2,
  },
  subjectFullName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },

  // ── Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    backgroundColor: glass.subtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: border.default,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: canvas.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: textColors.tertiary,
  },
});
