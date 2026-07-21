import { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Platform, TextInput } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { gauge, shadow, text } from '../theme/colors';
import { textStyle, fontFamily } from '../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AttendanceGaugeProps {
  percentage: number;
  threshold?: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  animationDuration?: number;
  children?: React.ReactNode;
  color?: string;
  label?: string;
}

function getGaugeColor(percentage: number, threshold: number): string {
  if (percentage >= threshold + 10) return gauge.safe;
  if (percentage >= threshold) return gauge.warning;
  if (percentage >= threshold - 10) return gauge.danger;
  return gauge.critical;
}

export default function AttendanceGauge({
  percentage,
  threshold = 75,
  size = 180,
  strokeWidth = 10,
  animated = true,
  animationDuration = 1200,
  children,
  color,
  label,
}: AttendanceGaugeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  const safePercentage = (percentage == null || isNaN(percentage)) ? 0 : percentage;
  const clampedPercentage = Math.min(100, Math.max(0, safePercentage));

  const halfSize = size / 2;
  const radius = halfSize - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const ringColor = color || getGaugeColor(clampedPercentage, threshold);

  useEffect(() => {
    let lastUpdate = Date.now();
    const listenerId = animatedValue.addListener(({ value }) => {
      // Throttle web re-renders to ~15fps (every 66ms) to fix CPU issue
      if (Platform.OS === 'web') {
        const now = Date.now();
        if (now - lastUpdate > 66 || value === clampedPercentage) {
          setDisplayValue(Math.round(value));
          lastUpdate = now;
        }
      } else {
        setDisplayValue(Math.round(value));
      }
    });

    if (animated) {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: clampedPercentage,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(clampedPercentage);
    }

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [clampedPercentage, animated, animationDuration]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const webDashoffset = circumference - (displayValue / 100) * circumference;

  return (
    <View 
      style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: 'transparent' }, shadow.glow(ringColor)]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Attendance is ${displayValue}%`}
      accessibilityValue={{ min: 0, max: 100, now: displayValue }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.4" />
          </SvgGradient>
        </Defs>

        <Circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          stroke={gauge.track}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {Platform.OS === 'web' ? (
          <Circle
            cx={halfSize}
            cy={halfSize}
            r={radius}
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={webDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={halfSize}
            originY={halfSize}
          />
        ) : (
          <AnimatedCircle
            cx={halfSize}
            cy={halfSize}
            r={radius}
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={halfSize}
            originY={halfSize}
          />
        )}
      </Svg>
      {children ? (
        <View style={styles.content}>{children}</View>
      ) : label ? (
        <View style={styles.content}>
          <Animated.Text style={[
            textStyle.displayNumber, 
            { 
              color: text.primary, 
              fontSize: size * 0.22, 
              lineHeight: size * 0.28, 
              textAlign: 'center',
              fontWeight: '800'
            }
          ]}>
            {displayValue}%
          </Animated.Text>
          <Animated.Text style={[
            textStyle.label, 
            { 
              marginTop: 4, 
              color: text.secondary, 
              fontSize: Math.max(9, size * 0.05) 
            }
          ]}>
            {label}
          </Animated.Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
