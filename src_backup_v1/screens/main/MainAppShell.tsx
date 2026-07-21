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

import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomTabBar, { TabName } from '../../components/BottomTabBar';
import DashboardScreen from './DashboardScreen';
import SubjectsScreen from './SubjectsScreen';
import TimetableScreen from './TimetableScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ProfileScreen from './ProfileScreen';
import { canvas } from '../../theme/colors';

export default function MainAppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'subjects':
        return <SubjectsScreen />;
      case 'timetable':
        return <TimetableScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: canvas.base,
  },
});
