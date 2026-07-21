/**
 * Attendance Tracker — Dashboard Screen
 * 
 * The central hub of the application (PRD Chapter 9/14).
 * Displays:
 * - Hero attendance gauge with overall percentage
 * - Quick stats bar (Attended, Conducted, Missed, Cancelled)
 * - Today's schedule with timeline
 * - All subjects with attendance cards
 * 
 * All values are dynamically calculated from raw data (PRD Single Source of Truth).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AttendanceGauge from '../../components/AttendanceGauge';
import SubjectCard from '../../components/SubjectCard';
import ScheduleItem from '../../components/ScheduleItem';
import QuickStatsBar from '../../components/QuickStatsBar';
import StopwatchTimerBanner from '../../components/StopwatchTimerBanner';
import TimerConfirmationSheet from '../../components/TimerConfirmationSheet';
import SemesterSwitchSheet from '../../components/SemesterSwitchSheet';
import { TimerService, TimerState } from '../../services/TimerService';
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  gauge as gaugeColors,
} from '../../theme/colors';
import { fontFamily, fontSize, textStyle } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';
import { DatabaseService } from '../../services/DatabaseService';
import { SyncService } from '../../services/SyncService';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type SubjectRow = Database['public']['Tables']['subjects']['Row'];
type RecordRow = Database['public']['Tables']['attendance_records']['Row'];
type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row'];

const calculatePercentage = (attended: number, conducted: number) => {
  if (conducted === 0) return 0;
  return Math.round((attended / conducted) * 100);
};

const getAttendanceStatus = (percentage: number, threshold: number) => {
  if (percentage >= threshold + 10) return 'safe';
  if (percentage >= threshold) return 'warning';
  return 'danger';
};

const lecturesCanMiss = (attended: number, conducted: number, threshold: number) => {
  if (conducted === 0) return 0;
  let currentPercentage = (attended / conducted) * 100;
  let canMiss = 0;
  let virtualConducted = conducted;

  while (currentPercentage >= threshold) {
    virtualConducted++;
    currentPercentage = (attended / virtualConducted) * 100;
    if (currentPercentage >= threshold) {
      canMiss++;
    }
  }
  return canMiss;
};

export default function DashboardScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [semesterSheetVisible, setSemesterSheetVisible] = useState(false);

  // Data States
  const [activeSemester, setActiveSemester] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [schedule, setSchedule] = useState<TimetableSlot[]>([]);
  
  const loadData = React.useCallback(async () => {
    try {
      const activeSem = await DatabaseService.fetchActiveSemester();
      setActiveSemester(activeSem);
      if (!activeSem) return; // No active semester yet

      const [fetchedSubjects, fetchedRecords, fetchedSchedule] = await Promise.all([
        DatabaseService.fetchSubjects(activeSem.id),
        DatabaseService.fetchAttendanceRecords(activeSem.id),
        DatabaseService.fetchTimetable(activeSem.id)
      ]);
      setSubjects(fetchedSubjects);
      setRecords(fetchedRecords);
      setSchedule(fetchedSchedule);
    } catch (error) {
      console.warn('Failed to load dashboard data from Supabase', error);
    }
  }, []);

  useEffect(() => {
    // Load active timer and data on mount
    TimerService.getActiveTimer().then(setActiveTimer);
    loadData();

    // Setup Realtime Sync Subscription for attendance records
    const subscription = supabase
      .channel('public:attendance_records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, payload => {
        console.log('Realtime update received!', payload);
        loadData(); // Re-fetch on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadData]);

  const handleSignOut = async () => {
    try {
      await SyncService.clearQueue();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const handleStartTimer = async (subject: any) => {
    // Check collision logic here (simplified for mock phase)
    const newTimer = await TimerService.startTimer(subject.id, subject.name, subject.short_name, subject.color);
    setActiveTimer(newTimer);
    
    // Scroll to top so timer banner is visible
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleStopTimer = () => {
    setShowConfirmSheet(true);
  };

  const handleConfirmTimer = async (start: Date, end: Date) => {
    // In a real app, check collision here with actual IST Date parsing
    // Mock collision logic: if end time is before start time (just basic validation)
    if (end.getTime() <= start.getTime()) {
      Alert.alert('Time Error', 'End time cannot be before start time.');
      return;
    }

    console.log(`Saved session for ${activeTimer?.subjectShortName} from ${start.toISOString()} to ${end.toISOString()} as PRESENT`);
    
    // Log to Supabase
    if (activeTimer) {
      try {
        await DatabaseService.logAttendanceSession({
          subject_id: activeTimer.subjectId,
          date: new Date().toLocaleDateString('en-CA'), // Fixes IST timezone bug
          status: 'present',
          ist_start_time: start.toLocaleTimeString('en-US', { hour12: false }),
          ist_end_time: end.toLocaleTimeString('en-US', { hour12: false }),
          duration_minutes: Math.round((end.getTime() - start.getTime()) / 60000)
        });
        loadData(); // Refresh stats
      } catch (e) {
        console.error('Failed to log session', e);
      }
    }

    await TimerService.clearTimer();
    setActiveTimer(null);
    setShowConfirmSheet(false);
  };

  const handleDiscardTimer = () => {
    setShowConfirmSheet(false);
  };

  const handleMarkAttendance = async (item: any, status: 'present' | 'absent' | 'cancelled') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const todayDateStr = new Date().toLocaleDateString('en-CA');
      
      const [sh, sm] = item.startTime.split(':').map(Number);
      const [eh, em] = item.endTime.split(':').map(Number);
      const durationMins = (eh * 60 + em) - (sh * 60 + sm);

      const { error } = await supabase.from('attendance_records').insert([{
        user_id: user.id,
        subject_id: item.subjectId,
        date: todayDateStr,
        status: status,
        ist_start_time: item.startTime + (item.startTime.length === 5 ? ':00' : ''),
        ist_end_time: item.endTime + (item.endTime.length === 5 ? ':00' : ''),
        duration_minutes: durationMins > 0 ? durationMins : 60
      }]);

      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Error marking attendance: ' + e.message);
    }
  };

  const handleResetAttendance = async (recordId: string) => {
    try {
      const { error } = await supabase.from('attendance_records').delete().eq('id', recordId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('Error resetting attendance: ' + e.message);
    }
  };

  // --- Calculate Stats ---
  const defaultThreshold = 75; // Or avg of subjects
  let totalConducted = records.length;
  let totalAttended = records.filter(r => r.status === 'present').length;
  let totalMissed = records.filter(r => r.status === 'absent').length;
  let totalCancelled = records.filter(r => r.status === 'cancelled').length;

  const stats = {
    overallPercentage: calculatePercentage(totalAttended, totalConducted),
    totalAttended,
    totalConducted,
    totalMissed,
    totalCancelled,
    totalSubjects: subjects.length,
    defaultThreshold
  };

  const overallStatus = getAttendanceStatus(stats.overallPercentage, stats.defaultThreshold);
  const overallCanMiss = lecturesCanMiss(
    stats.totalAttended,
    stats.totalConducted,
    stats.defaultThreshold
  );

  // Get greeting based on time of day
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 0 && hour < 5) greeting = 'Good night';
  else if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  // Today's date formatted
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ─── Today's Schedule Mapping ───
  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const todayScheduleItems = useMemo(() => {
    const todaySlots = schedule.filter(slot => slot.day_of_week === todayDayOfWeek);
    return todaySlots
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(slot => {
        const subject = subjects.find(s => s.id === slot.subject_id);
        const record = records.find(r => {
          if (r.date !== todayDateStr) return false;
          if (r.subject_id !== slot.subject_id) return false;
          return r.ist_start_time === slot.start_time || r.ist_start_time?.startsWith(slot.start_time.substring(0, 5));
        });

        return {
          id: slot.id,
          subjectId: slot.subject_id,
          subjectName: subject?.name || 'Unknown Subject',
          subjectShortName: subject?.short_name || 'UNK',
          color: subject?.color || '#94A3B8',
          startTime: slot.start_time,
          endTime: slot.end_time,
          roomNumber: slot.room_number || 'TBA',
          recordStatus: record?.status as 'present' | 'absent' | 'cancelled' | undefined,
          recordId: record?.id
        };
      });
  }, [schedule, subjects, records, todayDayOfWeek, todayDateStr]);

  const todayTotal = todayScheduleItems.length;
  const todayCompleted = todayScheduleItems.filter(item => item.recordStatus !== undefined).length;

  const ongoingLecture = useMemo(() => {
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    return todayScheduleItems.find(item => item.startTime <= nowTimeStr && item.endTime >= nowTimeStr && item.recordStatus === undefined) || null;
  }, [todayScheduleItems]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Ionicons name="log-out-outline" size={24} color={textColors.secondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.headerPill} 
          activeOpacity={0.7}
          onPress={() => setSemesterSheetVisible(true)}
        >
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>{activeSemester ? activeSemester.name : 'Loading Semester...'}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Stopwatch Timer Banner ─── */}
      {activeTimer ? (
        <StopwatchTimerBanner
          timer={activeTimer}
          onStop={handleStopTimer}
        />
      ) : ongoingLecture ? (
        <View style={{ paddingHorizontal: layout.screenPaddingH, marginBottom: spacing.lg }}>
           <Text style={{ fontFamily: fontFamily.semiBold, color: textColors.secondary, marginBottom: spacing.md }}>Next Up:</Text>
           <Text style={{ color: ongoingLecture.color, fontFamily: fontFamily.bold, fontSize: fontSize.lg }}>{ongoingLecture.subjectName} at {ongoingLecture.startTime}</Text>
        </View>
      ) : null}

      <TimerConfirmationSheet
        visible={showConfirmSheet}
        timer={activeTimer}
        records={records}
        onConfirm={handleConfirmTimer}
        onDiscard={handleDiscardTimer}
      />
      
      <SemesterSwitchSheet 
        visible={semesterSheetVisible}
        onClose={() => setSemesterSheetVisible(false)}
        onSwitch={loadData}
      />

      {/* ─── Hero Gauge Section ─── */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[glass.medium, glass.subtle]}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            {/* Main Gauge */}
            <AttendanceGauge
              percentage={stats.overallPercentage}
              threshold={stats.defaultThreshold}
              size={180}
              strokeWidth={14}
              animated={true}
              animationDuration={1500}
              label="OVERALL"
            />

            {/* Status text below gauge */}
            <View style={styles.heroStatus}>
              <View
                style={[
                  styles.heroStatusBadge,
                  {
                    backgroundColor:
                      overallStatus === 'safe'
                        ? gaugeColors.safe + '18'
                        : overallStatus === 'warning'
                        ? gaugeColors.warning + '18'
                        : gaugeColors.danger + '18',
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroStatusDot,
                    {
                      backgroundColor:
                        overallStatus === 'safe'
                          ? gaugeColors.safe
                          : overallStatus === 'warning'
                          ? gaugeColors.warning
                          : gaugeColors.danger,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.heroStatusText,
                    {
                      color:
                        overallStatus === 'safe'
                          ? gaugeColors.safe
                          : overallStatus === 'warning'
                          ? gaugeColors.warning
                          : gaugeColors.danger,
                    },
                  ]}
                >
                  {overallStatus === 'safe'
                    ? `On Track — Keep it up!`
                    : overallStatus === 'warning'
                    ? 'Borderline — Be careful'
                    : 'Below Target — Attend more classes'}
                </Text>
              </View>
            </View>
          </View>

          {/* Threshold line */}
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdLine} />
            <Text style={styles.thresholdText}>
              Target: {stats.defaultThreshold}%
            </Text>
            <View style={styles.thresholdLine} />
          </View>
        </LinearGradient>
      </View>

      {/* ─── Quick Stats ─── */}
      <View style={styles.section}>
        <QuickStatsBar stats={stats} />
      </View>

      {/* ─── Today's Schedule ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Text style={styles.sectionBadge}>
            {todayCompleted}/{todayTotal}
          </Text>
        </View>

        <View style={styles.scheduleList}>
          {todayScheduleItems.map((item) => (
            <View key={item.id} style={[styles.scheduleCard, { borderLeftColor: item.color }]}>
              <View style={styles.scheduleCardHeader}>
                <View style={styles.scheduleSubjectInfo}>
                  <Text style={styles.scheduleSubjectShort}>{item.subjectShortName}</Text>
                  <Text style={styles.scheduleTimeText}>{item.startTime} - {item.endTime}</Text>
                </View>
                {item.roomNumber ? <Text style={styles.scheduleRoomText}>Room {item.roomNumber}</Text> : null}
              </View>

              {item.recordStatus ? (
                <View style={styles.statusRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: item.recordStatus === 'present' ? '#10B981' : item.recordStatus === 'absent' ? '#EF4444' : '#6B7280' }]} />
                  <Text style={[styles.statusText, { color: item.recordStatus === 'present' ? '#10B981' : item.recordStatus === 'absent' ? '#EF4444' : '#6B7280' }]}>
                    {item.recordStatus.toUpperCase()}
                  </Text>
                  <TouchableOpacity onPress={() => handleResetAttendance(item.recordId!)} style={styles.resetBtn}>
                    <Ionicons name="refresh-outline" size={14} color={textColors.tertiary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity 
                    onPress={() => handleMarkAttendance(item, 'present')} 
                    style={[styles.actionBtn, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}
                  >
                    <Text style={{ color: '#10B981', fontFamily: fontFamily.bold, fontSize: 12 }}>Present</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleMarkAttendance(item, 'absent')} 
                    style={[styles.actionBtn, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
                  >
                    <Text style={{ color: '#EF4444', fontFamily: fontFamily.bold, fontSize: 12 }}>Absent</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleMarkAttendance(item, 'cancelled')} 
                    style={[styles.actionBtn, { backgroundColor: '#6B728020', borderColor: '#6B7280' }]}
                  >
                    <Text style={{ color: '#9CA3AF', fontFamily: fontFamily.bold, fontSize: 12 }}>Cancelled</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {todayScheduleItems.length === 0 && (
             <Text style={{ color: textColors.tertiary, padding: spacing.md, fontFamily: fontFamily.regular }}>
               No schedule for today.
             </Text>
          )}
        </View>
      </View>

      {/* ─── All Subjects ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <Text style={styles.sectionMeta}>
            {stats.totalSubjects} active
          </Text>
        </View>

        <View style={styles.subjectsList}>
          {subjects
            .sort((a, b) => {
              const aRecords = records.filter(r => r.subject_id === a.id);
              const bRecords = records.filter(r => r.subject_id === b.id);
              const pA = calculatePercentage(aRecords.filter(r=>r.status==='present').length, aRecords.length);
              const pB = calculatePercentage(bRecords.filter(r=>r.status==='present').length, bRecords.length);
              return pA - pB;
            })
            .map((subject) => {
              const subjectRecords = records.filter(r => r.subject_id === subject.id);
              const mappedSubject = {
                id: subject.id,
                name: subject.name,
                shortName: subject.short_name,
                color: subject.color,
                threshold: subject.target_threshold,
                totalAttended: subjectRecords.filter(r=>r.status==='present').length,
                totalConducted: subjectRecords.length
              };
              return <SubjectCard key={subject.id} subject={mappedSubject as any} onStartTimer={handleStartTimer} />
            })}
        </View>
      </View>

      {/* Bottom padding for nav bar */}
      <View style={{ height: layout.bottomNavHeight + spacing['2xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? spacing['2xl'] : spacing.lg,
  },

  // ── Header
  header: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.xl,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },

  // ── Hero Gauge
  heroSection: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.xl,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugePercentage: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['3xl'],
    color: textColors.primary,
    letterSpacing: -1,
  },
  gaugeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 2,
    marginTop: 2,
  },
  heroStatus: {
    alignItems: 'center',
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  thresholdLine: {
    flex: 1,
    height: 1,
    backgroundColor: border.default,
  },
  thresholdText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
    letterSpacing: 0.5,
  },

  // ── Section
  section: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyle.sectionTitle,
  },
  sectionBadge: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: accent.secondary,
  },
  sectionMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: textColors.tertiary,
  },

  // ── Schedule
  scheduleList: {
    gap: spacing.md,
  },
  scheduleCard: {
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    gap: spacing.sm,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleSubjectInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  scheduleSubjectShort: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: textColors.primary,
  },
  scheduleTimeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },
  scheduleRoomText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  resetBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Subjects
  subjectsList: {
    gap: spacing.sm + 2,
  },
});
