/**
 * Attendance Tracker — Timetable Screen (Phase 3)
 *
 * Premium weekly schedule builder and viewer.
 * Features:
 * - Horizontal week day selector (Pill style)
 * - Vertical timeline with glassmorphic lecture blocks
 * - Empty states for days without lectures
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  DeviceEventEmitter,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  palette,
} from "../../theme/colors";
import { fontFamily, fontSize, textStyle } from "../../theme/typography";
import { spacing, radius, layout } from "../../theme/spacing";
import { DatabaseService } from "../../services/DatabaseService";
import AddClassSheet from "../../components/AddClassSheet";
import TimetableManager from "../../components/TimetableManager";
import { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";
import { NotificationService } from "../../services/NotificationService";

type TimetableSlot = Database["public"]["Tables"]["timetable_slots"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const getTodayDayString = () => {
  const dayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames[dayIndex];
};

export default function TimetableScreen({ isActive = true }: { isActive?: boolean }) {
  const [selectedDay, setSelectedDay] = useState(getTodayDayString());
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Record<string, SubjectRow>>({});
  const [semesters, setSemesters] = useState<any[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string>("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [managerVisible, setManagerVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const activeSem = await DatabaseService.fetchActiveSemester();
      if (!activeSem) return;
      setActiveSemesterId(activeSem.id);

      const fetchedSubjects = await DatabaseService.fetchSubjects();
      const subjectMap: Record<string, SubjectRow> = {};
      fetchedSubjects.forEach((s) => {
        subjectMap[s.id] = s;
      });
      setSubjects(subjectMap);

      // Load versions to find active one if not set
      const versions = await DatabaseService.fetchTimetableVersions(activeSem.id);
      let targetVersionId = activeVersionId;
      
      if (!targetVersionId && versions.length > 0) {
        targetVersionId = versions[0].id;
        setActiveVersionId(targetVersionId);
      }

      if (targetVersionId) {
        const fetchedSlots = await DatabaseService.fetchTimetableByVersion(targetVersionId);
        setSlots(fetchedSlots);

        const mappedSlots = fetchedSlots.map(slot => {
           const subject = subjectMap[slot.subject_id];
           let teacherStr = slot.default_teacher || "";
           try {
             if (teacherStr.startsWith('{')) {
               const obj = JSON.parse(teacherStr);
               teacherStr = obj.s || obj.n;
             }
           } catch(e) {}
           
           return {
             id: slot.id,
             subjectName: subject?.name || "Unknown Subject",
             roomNumber: slot.room_number || "TBA",
             teacher: teacherStr,
             dayOfWeek: slot.day_of_week,
             startTime: slot.start_time
           };
        });
        NotificationService.schedulePreClassAlerts(mappedSlots);
      } else {
        setSlots([]);
        NotificationService.schedulePreClassAlerts([]);
      }

    } catch (error) {
      console.warn("Failed to fetch timetable from Supabase", error);
    } finally {
    }
  }, [activeVersionId]);

  useEffect(() => {
    if (!isActive) return;

    loadData();

    // Subscribe to realtime changes
    const slotsSubscription = supabase
      .channel("public:timetable_slots_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timetable_slots" },
        (_payload) => {
          loadData();
        },
      )
      .subscribe();

    const subjectsSubscription = supabase
      .channel("public:timetable_subjects_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subjects" },
        (_payload) => {
          loadData();
        },
      )
      .subscribe();

    const semestersSubscription = supabase
      .channel("public:timetable_semesters_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "academic_semesters" },
        (_payload) => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(slotsSubscription);
      supabase.removeChannel(subjectsSubscription);
      supabase.removeChannel(semestersSubscription);
    };
  }, [loadData, isActive]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("semesterChanged", () => {
      loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  // Filter slots for the selected day and map to UI structure
  const selectedDayIndex = DAY_MAP[selectedDay];

  const scheduleForDay = useMemo(() => slots
    .filter((slot) => slot.day_of_week === selectedDayIndex)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((slot) => {
      const subject = subjects[slot.subject_id];
      
      let teacherStr = "";
      if (slot.default_teacher) {
        teacherStr = slot.default_teacher;
        try {
          if (teacherStr.startsWith('{')) {
            const obj = JSON.parse(teacherStr);
            teacherStr = obj.s || obj.n; // Use short name if available
          }
        } catch(e) {}
      }

      return {
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        subjectName: subject?.name || "Unknown",
        subjectShortName: subject?.short_name || "UNK",
        color: subject?.color || textColors.secondary,
        teacher: teacherStr,
        classType: slot.class_type,
      };
    }), [slots, selectedDayIndex, subjects]);

  const handleEditClass = useCallback((item: any) => {
    const fullSlot = slots.find((s) => s.id === item.id);
    if (fullSlot) {
      setSelectedSlot(fullSlot);
      setSheetVisible(true);
    }
  }, [slots]);

  const handleCloseSheet = useCallback(() => {
    setSelectedSlot(null);
    setSheetVisible(false);
  }, []);

  const handleSaveClass = useCallback(async (data: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const dayMap: Record<string, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 0,
      };
      const dayOfWeek = dayMap[data.dayOfWeek];

      const normStart =
        data.startTime.length === 5 ? data.startTime + ":00" : data.startTime;
      const normEnd =
        data.endTime.length === 5 ? data.endTime + ":00" : data.endTime;

      // Prevent overlapping slots on the same day (excluding itself in edit mode)
      const overlap = slots.some((slot) => {
        if (selectedSlot && slot.id === selectedSlot.id) return false;
        if (slot.day_of_week !== dayOfWeek) return false;
        return normStart < slot.end_time && normEnd > slot.start_time;
      });

      if (overlap) {
        Alert.alert("This time slot overlaps with an existing class in your timetable!");
        return;
      }

      if (selectedSlot) {
        await DatabaseService.updateTimetableSlot(selectedSlot.id, {
          semester_id: data.semesterId || activeSemesterId,
          version_id: activeVersionId,
          subject_id: data.subjectId,
          day_of_week: dayOfWeek,
          start_time: normStart,
          end_time: normEnd,
          room_number: data.roomNumber || "TBA",
          class_type: data.class_type || 'theory',
          default_teacher: data.default_teacher || null,
        });
      } else {
        await DatabaseService.createTimetableSlot({
          user_id: user.id,
          semester_id: data.semesterId || activeSemesterId,
          version_id: activeVersionId,
          subject_id: data.subjectId,
          day_of_week: dayOfWeek,
          start_time: normStart,
          end_time: normEnd,
          room_number: data.roomNumber || "TBA",
          class_type: data.class_type || 'theory',
          default_teacher: data.default_teacher || null,
        });

        // Auto-create a blank attendance record for the specific date if provided
        if (data.date) {
          const [sh, sm] = data.startTime.split(":").map(Number);
          const [eh, em] = data.endTime.split(":").map(Number);
          const durationMins = eh * 60 + em - (sh * 60 + sm);

          await (supabase as any)
            .from("attendance_records")
            .insert([
              {
                user_id: user.id,
                subject_id: data.subjectId,
                date: data.date,
                ist_start_time: normStart,
                ist_end_time: normEnd,
                duration_minutes: durationMins > 0 ? durationMins : 60,
              },
            ]);
        }
      }

      handleCloseSheet();
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save class");
    }
  }, [slots, selectedSlot, handleCloseSheet, loadData, activeVersionId]);

  const handleDeleteSlot = async (slotId: string) => {
    Alert.alert(
      "Delete Class",
      "Are you sure you want to permanently delete this timetable entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await DatabaseService.deleteTimetableSlot(slotId);
              setSlots(slots.filter((s) => s.id !== slotId));
              setSelectedSlot(null);
              handleCloseSheet();
              loadData();
            } catch (e: any) {
              Alert.alert("Error deleting class: " + e.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteClass = useCallback(async () => {
    if (!selectedSlot) return;
  }, [selectedSlot, handleCloseSheet, loadData]);

  return (
    <View style={styles.screen}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Timetable</Text>
          <Text style={styles.subtitle}>Your weekly academic schedule.</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.managerBtn} onPress={() => setManagerVisible(true)}>
          <Ionicons name="calendar-outline" size={20} color={textColors.secondary} />
          <Text style={styles.managerBtnText}>Versions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => {
            setSelectedSlot(null);
            setSheetVisible(true);
          }}
        >
          <LinearGradient
            colors={[accent.primary, accent.primaryHover]}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={20} color={palette.white} />
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
                    isActive
                      ? styles.dayPillTextActive
                      : styles.dayPillTextInactive,
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

            {scheduleForDay.map((item, _index) => (
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
                    colors={[item.color + "10", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.subjectShortName} numberOfLines={1}>
                      {item.subjectShortName}
                    </Text>
                    {item.teacher ? (
                      <View style={{ backgroundColor: item.color + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: item.color, fontSize: 10, fontFamily: fontFamily.bold }}>
                          {item.classType === 'lab' ? '🧪 ' : item.classType === 'tutorial' ? '📚 ' : ''}{item.teacher}
                        </Text>
                      </View>
                    ) : null}
                  </View>
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
              <Ionicons
                name="cafe-outline"
                size={32}
                color={textColors.secondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No classes today</Text>
            <Text style={styles.emptySub}>Enjoy your free time!</Text>
          </View>
        )}

        {/* Bottom padding for nav bar */}
        <View style={{ height: layout.bottomNavHeight + spacing["2xl"] }} />
      </ScrollView>

      <AddClassSheet
        visible={sheetVisible}
        slots={slots}
        semesters={semesters}
        subjects={Object.values(subjects)}
        initialSemesterId={activeSemesterId}
        initialDayOfWeek={selectedDay}
        initialData={
          selectedSlot
            ? {
                id: selectedSlot.id,
                semesterId: selectedSlot.semester_id,
                subjectId: selectedSlot.subject_id,
                dayOfWeek: [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][selectedSlot.day_of_week],
                startTime: selectedSlot.start_time,
                endTime: selectedSlot.end_time,
                roomNumber: selectedSlot.room_number || "",
                class_type: selectedSlot.class_type,
                default_teacher: selectedSlot.default_teacher,
              }
            : undefined
        }
        onClose={handleCloseSheet}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
      />
      <TimetableManager
        visible={managerVisible}
        semesterId={activeSemesterId}
        activeVersionId={activeVersionId || undefined}
        onClose={() => setManagerVisible(false)}
        onVersionSelected={(vid) => {
          setActiveVersionId(vid);
          setManagerVisible(false);
        }}
      />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 100,
          right: 24,
          backgroundColor: '#3b82f6',
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
        onPress={() => DeviceEventEmitter.emit('navigate_tab', 'campus_map')}
      >
        <Ionicons name="map-outline" size={28} color="#fff" />
      </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing["2xl"],
    marginTop: spacing.xl,
    paddingHorizontal: layout.screenPaddingH,
  },
  title: {
    ...textStyle.pageTitle,
  },
  subtitle: {
    ...textStyle.body,
    marginTop: spacing.xs,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },
  managerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: glass.medium,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: border.default,
  },
  managerBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: textColors.primary,
  },

  // ── Action Bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.lg,
  },
  addButton: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  addButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: palette.white,
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
    position: "relative",
  },
  timelineBackgroundLine: {
    position: "absolute",
    left: 64, // Center of nodeCol
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: border.default,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  timeCol: {
    width: 48,
    alignItems: "flex-end",
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
    alignItems: "center",
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
    overflow: "hidden",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["4xl"],
    backgroundColor: glass.subtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: border.default,
    borderStyle: "dashed",
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: canvas.elevated,
    alignItems: "center",
    justifyContent: "center",
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
