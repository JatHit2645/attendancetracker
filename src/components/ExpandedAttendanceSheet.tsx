import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { canvas, text as textColors, border, glass, shadow } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface ExpandedAttendanceSheetProps {
  visible: boolean;
  onClose: () => void;
  subjects: any[];
  records: any[];
}

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
      if (filterType !== 'all' && r.class_type && r.class_type !== filterType) return false;
      if (selectedTeacher && r.teacher_name !== selectedTeacher) return false;
      return true;
    });
  }, [records, filterType, selectedTeacher]);

  const calculatePercentage = (attended: number, conducted: number) => {
    return conducted === 0 ? 100 : Math.round((attended / conducted) * 100);
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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.sheetContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Detailed Attendance</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={textColors.secondary} />
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm, marginTop: spacing.sm }}>
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

          <ScrollView style={styles.list} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
            {subjectStats.map(stat => (
              <View key={stat.id} style={[styles.subjectCard, shadow.low, { borderLeftColor: stat.color, borderLeftWidth: 4 }]}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{stat.name}</Text>
                  <Text style={[styles.percentage, { color: stat.percentage >= stat.target_threshold ? '#10B981' : '#EF4444' }]}>
                    {stat.percentage}%
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>Attended: <Text style={{ color: textColors.primary }}>{stat.attended}</Text></Text>
                  <Text style={styles.statText}>Missed: <Text style={{ color: textColors.primary }}>{stat.missed}</Text></Text>
                  <Text style={styles.statText}>Total: <Text style={{ color: textColors.primary }}>{stat.conducted}</Text></Text>
                </View>
              </View>
            ))}
            {subjectStats.length === 0 && (
              <Text style={{ color: textColors.tertiary, textAlign: 'center', marginTop: spacing.xl }}>No data available for these filters.</Text>
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
    maxHeight: '80%',
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
    fontSize: fontSize.lg,
    color: textColors.primary,
  },
  filterSection: {
    paddingVertical: spacing.md,
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
  },
  list: {
    flexShrink: 1,
  },
  subjectCard: {
    backgroundColor: canvas.elevated,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: border.subtle,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subjectName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: textColors.primary,
    flex: 1,
  },
  percentage: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },
});
