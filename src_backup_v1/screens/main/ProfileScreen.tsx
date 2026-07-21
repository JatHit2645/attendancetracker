import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { canvas, text as textColors, accent, glass, border, shadow } from '../../theme/colors';
import { fontFamily, fontSize, textStyle } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [name, setName] = useState('Loading...');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        setName(userName);
        setEmail(user.email || '');
      } else {
        setName('User');
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Not logged in.');
        return;
      }
      
      const [semesters, subjects, records, timetable, holidays] = await Promise.all([
        supabase.from('academic_semesters').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('attendance_records').select('*'),
        supabase.from('timetable_slots').select('*'),
        supabase.from('holidays').select('*'),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        userEmail: user.email,
        semesters: semesters.data || [],
        subjects: subjects.data || [],
        attendanceRecords: records.data || [],
        timetableSlots: timetable.data || [],
        holidays: holidays.data || [],
      };

      if (Platform.OS === 'web') {
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Attendance_Tracker_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Your data archive has been successfully downloaded!');
      } else {
        alert('Data export: ' + JSON.stringify(backupData, null, 2).substring(0, 200) + '...');
      }
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    }
  };

  const renderSettingItem = (
    icon: any,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    isFirst = false,
    isLast = false
  ) => (
    <View style={[
      styles.settingItem,
      isFirst && styles.settingItemFirst,
      isLast && styles.settingItemLast,
    ]}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={20} color={textColors.primary} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: glass.light, true: accent.primary }}
        thumbColor={Platform.OS === 'ios' ? '#fff' : (value ? '#fff' : textColors.tertiary)}
        ios_backgroundColor={glass.light}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <Text style={styles.subtitle}>Manage your account preferences</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[accent.primary + '20', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{name}</Text>
            {email ? <Text style={styles.profileBadge}>{email}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              'notifications',
              'Push Notifications',
              'Get reminded about upcoming classes',
              notificationsEnabled,
              setNotificationsEnabled,
              true
            )}
            {renderSettingItem(
              'finger-print',
              'Biometric Lock',
              'Require fingerprint to open app',
              biometricsEnabled,
              setBiometricsEnabled,
              false,
              true
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity 
              style={styles.actionRow} 
              activeOpacity={0.7}
              onPress={handleExportData}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="cloud-download-outline" size={20} color={textColors.primary} />
              </View>
              <Text style={styles.actionText}>Export My Data</Text>
              <Ionicons name="chevron-forward" size={20} color={textColors.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: layout.bottomNavHeight + spacing['2xl'] }} />
      </ScrollView>
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
    paddingTop: Platform.OS === 'web' ? spacing['3xl'] : spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    ...textStyle.pageTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.subtle,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    marginBottom: 4,
  },
  profileBadge: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: accent.primary,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: textColors.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  settingsGroup: {
    backgroundColor: glass.subtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: border.default,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  settingItemFirst: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  settingItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: glass.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: textColors.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: textColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: border.default,
    marginLeft: 40 + spacing.lg + spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444' + '15',
    borderWidth: 1,
    borderColor: '#EF4444' + '30',
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  logoutText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#EF4444',
  },
});
