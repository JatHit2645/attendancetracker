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

import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  border,
  text as textColors,
  accent,
  shadow,
} from '../theme/colors';
import { fontFamily, textStyle } from '../theme/typography';
import { spacing, radius, layout } from '../theme/spacing';

export type TabName = 'dashboard' | 'subjects' | 'timetable' | 'analytics' | 'profile' | 'campus_map';

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
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabPress(tab.name)}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={22}
                  color={isActive ? accent.primary : textColors.tertiary}
                />
              </View>

              <Text
                style={[
                  textStyle.tabLabel,
                  styles.label,
                  isActive && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
              
              {isActive ? (
                <View style={styles.activeDot} />
              ) : (
                <View style={styles.inactiveDotSpace} />
              )}
            </Pressable>
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
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.md,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12131C', // 100% solid dark background
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    ...shadow.strong,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    height: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
  },
  iconContainer: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: textColors.tertiary,
  },
  labelActive: {
    color: accent.primary,
    fontFamily: fontFamily.bold,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: accent.primary,
    marginTop: 2,
  },
  inactiveDotSpace: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});
