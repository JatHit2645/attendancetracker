import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { canvas, text as textColors, border, glass, shadow } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import AttendanceGauge from './AttendanceGauge';

interface ExpandedAttendanceSheetProps {
  visible: boolean;
  onClose: () => void;
  subjects: any[];
  records: any[];
}

const AnimatedSubjectCard = ({ stat, index }: { stat: any, index: number }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [index]);

  const target = stat.target_threshold || 75;
  const isSafe = stat.percentage >= target;

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
      <LinearGradient
        colors={[stat.color + '10', canvas.elevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.subjectCard, shadow.medium, { borderLeftColor: stat.color, borderLeftWidth: 4 }]}
      >
        <View style={styles.cardMain}>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectName}>{stat.name}</Text>
            <View style={styles.targetBadge}>
              <Ionicons name="flag" size={12} color={textColors.tertiary} />
              <Text style={styles.targetText}>Target: {target}%</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Attended</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{stat.attended}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Missed</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{stat.missed}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={[styles.statValue, { color: textColors.primary }]}>{stat.conducted}</Text>
              </View>
            </View>
          </View>
          <View style={styles.gaugeContainer}>
            <AttendanceGauge
              percentage={stat.percentage}
              threshold={target}
              size={72}
              strokeWidth={6}
            >
              <Text style={[styles.gaugePercentageText, { color: isSafe ? '#10B981' : '#EF4444' }]}>
                {stat.percentage < 0 ? "-" : `${stat.percentage}%`}
              </Text>
            </AttendanceGauge>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function ExpandedAttendanceSheet({
  visible,
  onClose,
  subjects,
  records,
}: ExpandedAttendanceSheetProps) {
  const [filterType, setFilterType] = useState<'all' | 'theory' | 'lab' | 'tutorial'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  // Extract all unique teachers from DB
  const allTeachers = useMemo(() => {
    const teachersSet = new Set<string>();
    records.forEach(r => {
      if (r.teacher_name) teachersSet.add(r.teacher_name);
    });
    return Array.from(teachersSet).sort();
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterType !== 'all') {
        const rType = r.class_type || 'theory'; // Default legacy records to theory
        if (rType !== filterType) return false;
      }
      if (selectedTeacher && r.teacher_name !== selectedTeacher) return false;
      return true;
    });
  }, [records, filterType, selectedTeacher]);

  const calculatePercentage = (attended: number, conducted: number) => {
    return conducted === 0 ? -1 : Math.round((attended / conducted) * 100);
  };

  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const subRecords = filteredRecords.filter(r => r.subject_id === subject.id);
      const conducted = subRecords.filter(r => r.status !== 'cancelled').length;
      const attended = subRecords.filter(r => r.status === 'present').length;
      const missed = subRecords.filter(r => r.status === 'absent').length;
      const percentage = calculatePercentage(attended, conducted);

      return {
        ...subject,
        conducted,
        attended,
        missed,
        percentage,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [subjects, filteredRecords]);

  const overallAttended = subjectStats.reduce((sum, s) => sum + s.attended, 0);
  const overallConducted = subjectStats.reduce((sum, s) => sum + s.conducted, 0);
  const overallPercentage = calculatePercentage(overallAttended, overallConducted);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.75)' }]} />
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.sheetContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Detailed Attendance</Text>
              <Text style={styles.subtitle}>Filtered Overall: <Text style={{ color: overallPercentage >= 75 ? '#10B981' : '#EF4444', fontFamily: fontFamily.bold }}>{overallPercentage < 0 ? "-" : `${overallPercentage}%`}</Text></Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={textColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
              {(['all', 'theory', 'lab', 'tutorial'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, filterType === type && styles.filterChipActive]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {allTeachers.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: spacing.md }}>
                <TouchableOpacity
                  style={[styles.filterChip, selectedTeacher === null && styles.filterChipActive]}
                  onPress={() => setSelectedTeacher(null)}
                >
                  <Text style={[styles.filterText, selectedTeacher === null && styles.filterTextActive]}>All Faculty</Text>
                </TouchableOpacity>
                {allTeachers.map(teacher => {
                  let display = teacher;
                  try {
                    if (teacher.startsWith('{')) {
                      const obj = JSON.parse(teacher);
                      display = obj.n;
                    }
                  } catch(e) {}
                  
                  return (
                    <TouchableOpacity
                      key={teacher}
                      style={[styles.filterChip, selectedTeacher === teacher && styles.filterChipActive]}
                      onPress={() => setSelectedTeacher(teacher)}
                    >
                      <Text style={[styles.filterText, selectedTeacher === teacher && styles.filterTextActive]}>
                        {display}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <ScrollView style={styles.list} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'], gap: spacing.md }} showsVerticalScrollIndicator={false}>
            {subjectStats.map((stat, index) => (
              <AnimatedSubjectCard key={stat.id} stat={stat} index={index} />
            ))}
            {subjectStats.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: spacing['2xl'] }}>
                <Ionicons name="bar-chart-outline" size={48} color={border.default} />
                <Text style={{ color: textColors.tertiary, marginTop: spacing.md, fontFamily: fontFamily.medium }}>No records match these filters.</Text>
              </View>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContent: {
    backgroundColor: canvas.base,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: border.subtle,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: glass.medium,
    padding: spacing.xs,
    borderRadius: radius.full,
  },
  filterSection: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: border.subtle,
    backgroundColor: glass.light,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: border.default,
    backgroundColor: canvas.elevated,
  },
  filterChipActive: {
    backgroundColor: textColors.primary,
    borderColor: textColors.primary,
  },
  filterText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
  },
  filterTextActive: {
    color: canvas.base,
    fontFamily: fontFamily.bold,
  },
  list: {
    flexShrink: 1,
  },
  subjectCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.subtle,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: textColors.primary,
    marginBottom: 4,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: glass.medium,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  targetText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statBox: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: textColors.tertiary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    backgroundColor: glass.light,
    borderRadius: radius.full,
  },
  gaugePercentageText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
});
