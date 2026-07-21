/**
 * Attendance Tracker — Main App Shell
 * 
 * The authenticated application container.
 * Manages bottom tab navigation between:
 * - Dashboard (Phase 2 - built)
 * - Subjects (Phase 3 - placeholder)
 * - Timetable (Phase 3 - placeholder)
 * - Analytics (Phase 5 - placeholder)
 * - Profile (Phase 7 - placeholder)
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar, { TabName } from '../../components/BottomTabBar';
import DashboardScreen from './DashboardScreen';
import SubjectsScreen from './SubjectsScreen';
import TimetableScreen from './TimetableScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ProfileScreen from './ProfileScreen';
import PlaceholderScreen from './PlaceholderScreen';
import { canvas } from '../../theme/colors';
import { DatabaseService } from '../../services/DatabaseService';

export default function MainAppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  useEffect(() => {
    const checkAutoActivateSemester = async () => {
      try {
        const semesters = await DatabaseService.fetchSemesters();
        const activeSem = await DatabaseService.fetchActiveSemester();
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const matchingSemester = semesters.find(sem => {
          if (!sem.start_date) return false;
          const start = sem.start_date;
          const end = sem.end_date || '9999-12-31';
          return todayStr >= start && todayStr <= end;
        });

        if (matchingSemester && (!activeSem || activeSem.id !== matchingSemester.id)) {
          await DatabaseService.activateSemester(matchingSemester.id);
        }
      } catch (e) {
        console.warn('Auto-semester date activation check failed', e);
      }
    };

    checkAutoActivateSemester();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.contentContainer}>
        <View style={[styles.screenWrapper, activeTab !== 'dashboard' && styles.hidden]}>
          <DashboardScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'subjects' && styles.hidden]}>
          <SubjectsScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'timetable' && styles.hidden]}>
          <TimetableScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'analytics' && styles.hidden]}>
          <AnalyticsScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'profile' && styles.hidden]}>
          <ProfileScreen />
        </View>
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: canvas.base,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  screenWrapper: {
    ...StyleSheet.absoluteFill,
  },
  hidden: {
    display: 'none',
  },
});
