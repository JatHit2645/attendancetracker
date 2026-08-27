import React, { useState, useEffect } from "react";
import { 
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  DeviceEventEmitter,
  useWindowDimensions
} from 'react-native';
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  shadow,
} from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import { spacing, radius } from "../theme/spacing";
import { DatabaseService } from "../services/DatabaseService";
import { supabase } from "../lib/supabase";

interface SemesterSwitchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSwitch: () => void; // Triggered when semester changes
}

export default function SemesterSwitchSheet({
  visible,
  onClose,
  onSwitch,
}: SemesterSwitchSheetProps) {
  const { height } = useWindowDimensions();
  const [semesters, setSemesters] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadSemesters();
    }
  }, [visible]);

  const loadSemesters = async () => {
    const { data } = await (supabase as any)
      .from("academic_semesters")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      // Self-healing check: Ensure exactly one semester is marked active to prevent layout confusion
      const activeSemesters = data.filter((s: any) => s.is_active);
      if (activeSemesters.length > 1) {
        const keepActiveId = activeSemesters[0].id;
        const deactivateIds = activeSemesters.slice(1).map((s: any) => s.id);

        // Asynchronously update DB
        await (supabase as any)
          .from("academic_semesters")
          .update({ is_active: false } as any)
          .in("id", deactivateIds);

        // Update state
        const healedData = data.map((s: any) =>
          deactivateIds.includes(s.id) ? { ...s, is_active: false } : s,
        );
        setSemesters(healedData);
      } else {
        setSemesters(data);
      }
    }
  };

  const handleSelect = async (sem: any) => {
    if (sem.is_active) {
      onClose();
      return;
    }

    await DatabaseService.activateSemester(sem.id);
    DeviceEventEmitter.emit("semesterChanged");
    onSwitch();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === "web" ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button"           style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          {Platform.OS !== "web" ? (
            <BlurView
              intensity={30}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.7)" },
              ]}
            />
          )}
        </TouchableOpacity>

        <View style={styles.sheetContainer}>
          {Platform.OS !== "web" && (
            <View style={styles.handleContainer}>
              <View style={styles.handleIndicator} />
            </View>
          )}

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Switch Semester</Text>
              <Text style={styles.subtitle}>
                Select your active academic term
              </Text>
            </View>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={textColors.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.list, { maxHeight: height * 0.7, flexShrink: 1 }]} showsVerticalScrollIndicator={false}>
            {semesters.map((sem) => (
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button"                 key={sem.id}
                style={[styles.item, sem.is_active && styles.itemActive]}
                onPress={() => handleSelect(sem)}
              >
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemText,
                      sem.is_active && styles.itemTextActive,
                    ]}
                  >
                    {sem.name}
                  </Text>
                  {sem.is_active && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={accent.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {semesters.length === 0 && (
              <Text style={styles.emptyText}>No semesters found</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: Platform.OS === "web" ? "center" : "flex-end",
    alignItems: "center",
  },
  backdrop: { ...StyleSheet.absoluteFill },
  sheetContainer: {
    backgroundColor: canvas.elevated,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 400 : "100%",
    borderTopLeftRadius: Platform.OS === "web" ? radius["2xl"] : radius["3xl"],
    borderTopRightRadius: Platform.OS === "web" ? radius["2xl"] : radius["3xl"],
    borderBottomLeftRadius: Platform.OS === "web" ? radius["2xl"] : 0,
    borderBottomRightRadius: Platform.OS === "web" ? radius["2xl"] : 0,
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["3xl"],
    borderWidth: 1,
    borderColor: border.default,
    ...shadow.strong,
  },
  handleContainer: { alignItems: "center", paddingVertical: spacing.md },
  handleIndicator: {
    backgroundColor: border.subtle,
    width: 36,
    height: 4,
    borderRadius: radius.full,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: textColors.secondary,
  },
  closeButton: {
    backgroundColor: glass.subtle,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: border.default,
  },
  list: {},
  item: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#1E202E",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: border.default,
  },
  itemActive: {
    backgroundColor: accent.primary + "20",
    borderColor: accent.primary,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: {
    flex: 1,
    marginRight: spacing.sm,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: textColors.primary,
  },
  itemTextActive: { color: accent.primary, fontFamily: fontFamily.bold },
  emptyText: {
    fontFamily: fontFamily.regular,
    color: textColors.tertiary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
