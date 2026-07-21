/**
 * Attendance Tracker — Stopwatch Timer Banner (Phase 4)
 * 
 * Floating stopwatch banner displayed at the top of the dashboard.
 * Counts UP from the start time in HH:MM:SS format.
 * Connects to TimerService state.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { canvas, text as textColors, accent, shadow, gauge, attendance } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { TimerState } from '../../services/TimerService';

interface StopwatchTimerBannerProps {
  timer: TimerState;
  onStop: () => void;
}

export default function StopwatchTimerBanner({
  timer,
  onStop,
}: StopwatchTimerBannerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const updateTimer = () => {
      const startMs = new Date(timer.startTimeIso).getTime();
      const nowMs = new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      
      const h = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
      const m = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diffSecs % 60).toString().padStart(2, '0');
      
      setElapsed(`${h}:${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timer.startTimeIso]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[timer.color + '25', timer.color + '05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
      />
      <View style={[styles.borderGlow, { borderColor: timer.color + '50' }]} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.pulseIndicator}>
            <View style={[styles.pulseCore, { backgroundColor: gauge.danger }]} />
          </View>
          <Text style={styles.liveText}>TIMER RUNNING</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.timerText}>{elapsed}</Text>
        </View>

        <Text style={styles.subjectCode}>{timer.subjectShortName}</Text>
        <Text style={styles.subjectName} numberOfLines={1}>{timer.subjectName}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.stopButton, { backgroundColor: gauge.danger + '20' }]} 
            activeOpacity={0.8} 
            onPress={onStop}
          >
            <Ionicons name="stop" size={16} color={gauge.danger} style={{ marginRight: spacing.sm }} />
            <Text style={[styles.stopButtonText, { color: gauge.danger }]}>End & Save Lecture</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: canvas.elevated,
    ...shadow.medium,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  content: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: gauge.danger + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  pulseCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  liveText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: gauge.danger,
    letterSpacing: 1,
  },
  timerText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: textColors.primary,
    fontVariant: ['tabular-nums'],
  },
  subjectCode: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: textColors.primary,
    marginBottom: 2,
  },
  subjectName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: gauge.danger + '40',
  },
  stopButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
});
