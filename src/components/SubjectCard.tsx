/**
 * Attendance Tracker — Subject Card
 *
 * Individual subject attendance card for the dashboard.
 * Features:
 * - Mini circular gauge ring
 * - Subject name with short code
 * - Attended/Conducted counts
 * - Status badge (Safe / Warning / Danger / Critical)
 * - Subtle glassmorphic card with colored left accent border
 * - Lectures needed / can skip indicator
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AttendanceGauge from "./AttendanceGauge";
import {
  glass,
  border,
  text as textColors,
  gauge as gaugeColors,
} from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import { spacing, radius } from "../theme/spacing";
import {
  Subject,
  calculatePercentage,
  getAttendanceStatus,
  lecturesNeededForTarget,
  lecturesCanMiss,
} from "../data/mockData";

interface SubjectCardProps {
  subject: Subject;
  onPress?: () => void;
  onStartTimer?: (subject: Subject) => void;
}

function getStatusLabel(
  status: "safe" | "warning" | "danger" | "critical",
): string {
  switch (status) {
    case "safe":
      return "On Track";
    case "warning":
      return "Borderline";
    case "danger":
      return "At Risk";
    case "critical":
      return "Critical";
  }
}

function getStatusColor(
  status: "safe" | "warning" | "danger" | "critical",
): string {
  switch (status) {
    case "safe":
      return gaugeColors.safe;
    case "warning":
      return gaugeColors.warning;
    case "danger":
      return gaugeColors.danger;
    case "critical":
      return gaugeColors.critical;
  }
}

export default React.memo(function SubjectCard({
  subject,
  onPress,
  onStartTimer,
}: SubjectCardProps) {
  const percentage = calculatePercentage(
    subject.totalAttended,
    subject.totalConducted,
  );
  const status = getAttendanceStatus(percentage, subject.threshold);
  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);
  const subjectColor = subject.color || "#6366F1";

  const needed = lecturesNeededForTarget(
    subject.totalAttended,
    subject.totalConducted,
    subject.threshold,
  );
  const canMiss = lecturesCanMiss(
    subject.totalAttended,
    subject.totalConducted,
    subject.threshold,
  );

  let helperText = "";
  if (status === "safe" || status === "warning") {
    if (canMiss > 0) helperText = `Can miss ${canMiss} more`;
    else helperText = "Cannot miss any";
  } else {
    if (needed > 0)
      helperText = `Need ${needed} more to reach ${subject.threshold}%`;
  }

  return (
    <View
      style={styles.cardContainer}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${subject.name}. ${percentage}%. ${statusLabel}. ${helperText}`}
    >
      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button"         activeOpacity={0.7}
        onPress={onPress}
        style={[styles.cardContent, { borderLeftColor: subjectColor }]}
      >
        <View style={styles.infoSection}>
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.subjectName} numberOfLines={1}>
                {subject.name}
              </Text>
              <Text style={[styles.shortName, { color: subjectColor }]}>
                {subject.shortName}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              <Text style={styles.statsHighlight}>{subject.totalAttended}</Text>
              <Text style={styles.statsSeparator}> / </Text>
              <Text style={styles.statsSecondary}>
                {subject.totalConducted}
              </Text>
              <Text style={styles.statsLabel}> lectures</Text>
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            {helperText ? (
              <Text style={styles.helperText} numberOfLines={1}>
                {helperText}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.gaugeSection}>
          <AttendanceGauge
            percentage={percentage}
            threshold={subject.threshold}
            size={56}
            strokeWidth={5}
            animated={true}
            animationDuration={1000}
            color={subjectColor}
          >
            <Text style={styles.gaugePercentage}>{percentage}%</Text>
          </AttendanceGauge>
        </View>
      </TouchableOpacity>

      {onStartTimer && (
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
          style={[styles.timerButton, { backgroundColor: subjectColor + "20" }]}
          activeOpacity={0.7}
          onPress={() => onStartTimer(subject)}
          accessibilityLabel={`Start timer for ${subject.shortName}`}
          accessibilityRole="button"
        >
          <Ionicons name="stopwatch-outline" size={16} color={subjectColor} />
          <Text style={[styles.timerButtonText, { color: subjectColor }]}>
            Start Timer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.xl,
    overflow: "hidden", // Ensure the left border respects the radius
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  infoSection: {
    flex: 1,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameContainer: {
    flex: 1,
    gap: 4,
  },
  subjectName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    letterSpacing: -0.3,
  },
  shortName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statsText: {
    fontSize: fontSize.sm,
  },
  statsHighlight: {
    fontFamily: fontFamily.bold,
    color: textColors.primary,
    fontSize: fontSize.md,
  },
  statsSeparator: {
    fontFamily: fontFamily.medium,
    color: textColors.tertiary,
  },
  statsSecondary: {
    fontFamily: fontFamily.semiBold,
    color: textColors.secondary,
    fontSize: fontSize.md,
  },
  statsLabel: {
    fontFamily: fontFamily.regular,
    color: textColors.tertiary,
    fontSize: fontSize.sm,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  helperText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
    flex: 1,
  },
  gaugeSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugePercentage: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: textColors.primary,
  },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: border.subtle,
  },
  timerButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
});
