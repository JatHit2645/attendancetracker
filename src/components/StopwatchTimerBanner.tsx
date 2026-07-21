import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { canvas, text as textColors, accent, shadow, gauge, glass, border } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { TimerState } from '../services/TimerService';

interface StopwatchTimerBannerProps {
  timer: TimerState;
  onStop: () => void;
}

export default function StopwatchTimerBanner({
  timer,
  onStop,
}: StopwatchTimerBannerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

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

  const handleStopPress = () => {
    if (Platform.OS === 'web') {
      const confirmEnd = window.confirm(`Are you sure you want to end the timer for ${timer.subjectShortName}? You can mark your attendance in the next step.`);
      if (confirmEnd) {
        onStop();
      }
    } else {
      Alert.alert(
        "End Lecture?",
        `Are you sure you want to end the timer for ${timer.subjectShortName}? You can mark your attendance in the next step.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "End & Save", style: "destructive", onPress: onStop }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, shadow.glow(timer.color)]}>
      <LinearGradient
        colors={[timer.color + '30', timer.color + '05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
      />
      <View style={[styles.borderGlow, { borderColor: timer.color + '60' }]} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Animated.View style={[styles.pulseIndicator, { opacity: pulseAnim }]}>
            <View style={[styles.pulseCore, { backgroundColor: gauge.danger }]} />
          </Animated.View>
          <Text style={styles.liveText}>TIMER RUNNING</Text>
          <View style={{ flex: 1 }} />
          <Text 
            style={styles.timerText}
            accessible={true}
            accessibilityLabel={`Elapsed time: ${elapsed}`}
          >{elapsed}</Text>
        </View>

        <Text style={styles.subjectCode}>{timer.subjectShortName}</Text>
        <Text style={styles.subjectName} numberOfLines={1}>{timer.subjectName}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.stopButton} 
            activeOpacity={0.8} 
            onPress={handleStopPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="End and save lecture"
          >
            <Ionicons name="stop" size={16} color="#FFF" style={{ marginRight: spacing.sm }} />
            <Text style={styles.stopButtonText}>End & Save Lecture</Text>
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
    backgroundColor: glass.strong,
    borderWidth: 1,
    borderColor: border.default,
  },
  borderGlow: {
    ...StyleSheet.absoluteFill,
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
    ...shadow.glow(gauge.danger),
  },
  liveText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: gauge.danger,
    letterSpacing: 1.5,
  },
  timerText: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.xl,
    color: textColors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  subjectCode: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: textColors.primary,
    marginBottom: 2,
    letterSpacing: -0.5,
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
    borderColor: '#F43F5E',
    backgroundColor: '#F43F5E18',
    ...shadow.glow('#F43F5E'),
  },
  stopButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
