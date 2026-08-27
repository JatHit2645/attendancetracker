/**
 * Attendance Tracker — Subjects Screen (Phase 3)
 *
 * Bento-box inspired grid layout for subject management.
 * High-end UI features:
 * - Glassmorphic cards with translucent borders
 * - Staggered/Bento grid layout
 * - Subtle haptic feedback and scaling interactions
 * - Monochromatic dark obsidian aesthetic with neon accent glows
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  DeviceEventEmitter,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useEffect } from "react";
import SubjectBottomSheet from "../../components/SubjectBottomSheet";
import SemesterSwitchSheet from "../../components/SemesterSwitchSheet";
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  shadow,
  palette,
} from "../../theme/colors";
import { fontFamily, fontSize, textStyle } from "../../theme/typography";
import { spacing, radius, layout } from "../../theme/spacing";
import { calculatePercentage, getAttendanceStatus } from "../../data/mockData";
import { DatabaseService } from "../../services/DatabaseService";
import { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";

type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type RecordRow = Database["public"]["Tables"]["attendance_records"]["Row"];

export default function SubjectsScreen({ isActive = true }: { isActive?: boolean }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  
  // Modals
  const [sheetVisible, setSheetVisible] = useState(false);
  const [semesterSheetVisible, setSemesterSheetVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{
    id?: string;
    name: string;
    shortName: string;
    threshold: number;
    teachers?: string[];
  } | null>(null);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [semesterName, setSemesterName] = useState<string>(
    "Loading Semester...",
  );

  const loadData = useCallback(async () => {
    try {
            const activeSem = await DatabaseService.fetchActiveSemester();
      if (!activeSem) {
        setSemesterName("No active semester");
        return;
      }
      setActiveSemesterId(activeSem.id);
      setSemesterName(activeSem.name);

      // Fetch all subjects and all records for the semester
      const [fetchedSubjects, fetchedRecords] = await Promise.all([
        DatabaseService.fetchSubjects(activeSem.id),
        DatabaseService.fetchAttendanceRecords(activeSem.id),
      ]);
      setSubjects(fetchedSubjects);
      setRecords(fetchedRecords);
    } catch (error) {
      console.warn(
        "Failed to fetch from Supabase. Ensure backend is running.",
        error,
      );
    } finally {
          }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    loadData();

    // Realtime changes listener for automatic updates
    const subscription = supabase
      .channel("public:attendance_records_subjects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_records" },
        (_payload) => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "academic_semesters" },
        (_payload) => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subjects" },
        (_payload) => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadData, isActive]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("semesterChanged", () => {
      loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  const handleOpenSheet = useCallback(() => {
    setSelectedSubject(null);
    setSheetVisible(true);
  }, []);

  const handleEditSubject = useCallback((subject: any) => {
    setSelectedSubject({
      id: subject.id,
      name: subject.name,
      shortName: subject.short_name,
      threshold: subject.target_threshold,
      teachers: subject.teachers, // Pass teachers to populate UI correctly on edit!
    });
    setSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleSaveSubject = useCallback(
    async (data: any) => {
      try {
        if (!activeSemesterId) return;

        if (selectedSubject) {
          await DatabaseService.updateSubject(selectedSubject.id, {
            name: data.name,
            short_name: data.shortName,
            color: data.color || palette.emerald[400],
            target_threshold: data.threshold,
            teachers: data.teachers || [],
          });
        } else {
          await DatabaseService.createSubject({
            semester_id: activeSemesterId,
            name: data.name,
            short_name: data.shortName,
            color: data.color || palette.emerald[400],
            target_threshold: data.threshold,
            teachers: data.teachers || [],
          });
        }
        loadData();
      } catch (e) {
        console.error("Save failed", e);
      }
    },
    [selectedSubject, activeSemesterId, loadData],
  );

  const handleDeleteSubject = useCallback(async () => {
    if (!selectedSubject) return;

    const confirmDelete =
      Platform.OS === "web"
        ? window.confirm(
            `Are you sure you want to permanently delete the subject "${selectedSubject.name}"? This will delete all attendance records and timetable slots for this subject.`,
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Delete Subject?",
              `Are you sure you want to permanently delete the subject "${selectedSubject.name}"? All associated attendance and timetable slots will be lost.`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (confirmDelete) {
      try {
        await DatabaseService.deleteSubject(selectedSubject.id);
        setSheetVisible(false);
        loadData();
      } catch (e: any) {
        Alert.alert("Error", "Error deleting subject: " + e.message);
      }
    }
  }, [selectedSubject, loadData]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Area */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.semesterBanner}
            activeOpacity={0.7}
            onPress={() => setSemesterSheetVisible(true)}
          >
            <Ionicons name="school" size={16} color={accent.primary} />
            <Text style={styles.semesterText}>{semesterName}</Text>
            <View style={styles.semesterEditButton}>
              <Ionicons
                name="chevron-down"
                size={14}
                color={textColors.tertiary}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.title}>Subjects</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  activeOpacity={0.8}
                  onPress={handleOpenSheet}
                >
                  <LinearGradient
                    colors={[accent.primary, accent.primaryHover]}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons name="add" size={20} color={palette.white} />
                    <Text style={styles.addButtonText}>New</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                {subjects.length} active subjects this semester
              </Text>
            </View>
          </View>
        </View>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {subjects.map((subject, index) => {
            const subjectRecords = records.filter(
              (r) => r.subject_id === subject.id,
            );
            const totalConducted = subjectRecords.filter((r) => r.status !== "cancelled").length;
            const totalAttended = subjectRecords.filter(
              (r) => r.status === "present",
            ).length;

            const percentage = calculatePercentage(
              totalAttended,
              totalConducted,
            );
            const _status = getAttendanceStatus(
              percentage,
              subject.target_threshold,
            );

            return (
              <TouchableOpacity
                key={subject.id}
                activeOpacity={0.7}
                onPress={() => handleEditSubject(subject)}
                style={[
                  styles.bentoCard,
                  isTablet ? styles.bentoCardHalf : styles.bentoCardFull,
                  {
                    borderTopColor: subject.color,
                    borderTopWidth: 2,
                  },
                ]}
              >
                {/* Glow effect matching subject color */}
                <LinearGradient
                  colors={[subject.color + "15", "transparent"]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.cardHeader}>
                  <View style={styles.shortNameBadge}>
                    <Text style={[styles.shortName, { color: subject.color }]}>
                      {subject.short_name}
                    </Text>
                  </View>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={textColors.tertiary}
                  />
                </View>

                <Text style={styles.subjectName} numberOfLines={1}>
                  {subject.name}
                </Text>

                <View style={styles.cardBottom}>
                  <View style={styles.targetSection}>
                    <Text style={styles.targetLabel}>TARGET</Text>
                    <Text style={styles.targetValue}>
                      {subject.target_threshold}%
                    </Text>
                  </View>

                  <View style={styles.currentSection}>
                    <Text style={styles.currentLabel}>CURRENT</Text>
                    <Text style={styles.currentValue}>{percentage}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom padding for nav bar */}
        <View style={{ height: layout.bottomNavHeight + spacing["2xl"] }} />
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <SubjectBottomSheet
        visible={sheetVisible}
        initialData={selectedSubject}
        onClose={handleCloseSheet}
        onSave={handleSaveSubject}
        onDelete={handleDeleteSubject}
      />

      <SemesterSwitchSheet
        visible={semesterSheetVisible}
        onClose={() => setSemesterSheetVisible(false)}
        onSwitch={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.xl,
  },

  // ── Header
  header: {
    paddingTop: Platform.OS === "web" ? spacing["3xl"] : spacing.xl,
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.xl,
  },
  semesterBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: glass.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: border.default,
  },
  semesterText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: textColors.secondary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  semesterEditButton: {
    padding: 2,
  },
  headerTop: {
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyle.pageTitle,
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },

  // ── Action Bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.xl,
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

  // ── Bento Grid
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  bentoCard: {
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
    position: "relative",
    ...shadow.low,
  },
  bentoCardFull: {
    width: "100%",
    minHeight: 140,
  },
  bentoCardHalf: {
    width: "47.5%",
    minHeight: 160,
  },

  // ── Card Content
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  shortNameBadge: {
    backgroundColor: glass.heavy,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  shortName: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  subjectName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    marginBottom: spacing.xl,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  targetSection: {
    gap: 2,
  },
  targetLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 0.5,
  },
  targetValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },
  currentSection: {
    alignItems: "flex-end",
    gap: 2,
  },
  currentLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 0.5,
  },
  currentValue: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.xl,
    color: textColors.primary,
  },
});
