import { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { gauge } from '../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AttendanceGaugeProps {
  /** Current attendance percentage (0-100) */
  percentage: number;
  /** Target threshold percentage */
  threshold: number;
  /** Outer diameter of the gauge */
  size: number;
  /** Width of the progress ring stroke */
  strokeWidth?: number;
  /** Whether to animate on mount */
  animated?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Content rendered in the center of the gauge */
  children?: React.ReactNode;
  /** Override the automatic status-based color */
  color?: string;
  /** Optional label to display under the animated percentage */
  label?: string;
}

/** Get gauge color based on attendance status relative to threshold */
function getGaugeColor(percentage: number, threshold: number): string {
  const safeGauge = gauge || {};
  if (percentage >= threshold + 10) return safeGauge.safe || '#10B981';
  if (percentage >= threshold) return safeGauge.warning || '#F59E0B';
  if (percentage >= threshold - 10) return safeGauge.danger || '#F43F5E';
  return safeGauge.critical || '#DC2626';
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
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, safePercentage));

  // Calculate SVG circle properties
  const halfSize = size / 2;
  const radius = halfSize - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Determine ring color
  const ringColor = color || getGaugeColor(clampedPercentage, threshold);

  useEffect(() => {
    // Add listener for text animation
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    if (animated) {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: clampedPercentage,
        duration: animationDuration,
        useNativeDriver: false, // strokeDashoffset doesn't support native driver
      }).start();
    } else {
      animatedValue.setValue(clampedPercentage);
    }

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [clampedPercentage, animated, animationDuration]);

  // Interpolate the strokeDashoffset for native animated component
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const targetOffset = circumference - (clampedPercentage / 100) * circumference;
  const webDashoffset = circumference - (displayValue / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.7" />
          </SvgGradient>
        </Defs>

        {/* Track (background ring) */}
        <Circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          stroke={gauge?.track || 'rgba(255, 255, 255, 0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring */}
        {Platform.OS === 'web' ? (
          <Circle
            cx={halfSize}
            cy={halfSize}
            r={radius}
            stroke={ringColor}
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
            stroke={ringColor}
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
          <Animated.Text style={styles.gaugePercentageText}>{displayValue}%</Animated.Text>
          <Animated.Text style={styles.gaugeLabelText}>{label}</Animated.Text>
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentageText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    color: '#F8FAFC',
    lineHeight: 48,
  },
  gaugeLabelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 2,
    marginTop: 4,
  },
});
