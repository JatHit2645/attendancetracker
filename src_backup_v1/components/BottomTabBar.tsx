/**
 * Attendance Tracker — Bottom Tab Navigation
 * 
 * Arc Browser-inspired floating bottom navigation bar.
 * Features:
 * - Frosted glass background
 * - 5 tabs: Dashboard, Subjects, Timetable, Analytics, Profile
 * - Active tab has glowing accent indicator
 * - Smooth icon transitions
 */

import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  shadow,
} from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius, layout } from '../theme/spacing';

export type TabName = 'dashboard' | 'subjects' | 'timetable' | 'analytics' | 'profile';

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabConfig {
  name: TabName;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const tabs: TabConfig[] = [
  {
    name: 'dashboard',
    label: 'Home',
    iconActive: 'home',
    iconInactive: 'home-outline',
  },
  {
    name: 'subjects',
    label: 'Subjects',
    iconActive: 'book',
    iconInactive: 'book-outline',
  },
  {
    name: 'timetable',
    label: 'Timetable',
    iconActive: 'calendar',
    iconInactive: 'calendar-outline',
  },
  {
    name: 'analytics',
    label: 'Analytics',
    iconActive: 'bar-chart',
    iconInactive: 'bar-chart-outline',
  },
  {
    name: 'profile',
    label: 'Profile',
    iconActive: 'person',
    iconInactive: 'person-outline',
  },
];

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.7}
            >
              {/* Active indicator line */}
              {isActive && <View style={styles.activeIndicator} />}

              {/* Icon */}
              <Ionicons
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={22}
                color={isActive ? accent.primary : textColors.tertiary}
              />

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: canvas.elevated + 'F0',
    borderWidth: 1,
    borderColor: border.muted,
    borderRadius: radius['2xl'],
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    ...shadow.medium,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 3,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -spacing.sm,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: accent.primary,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.tertiary,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: accent.primary,
    fontFamily: fontFamily.semiBold,
  },
});
