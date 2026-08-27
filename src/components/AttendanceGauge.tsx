import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform, TextInput, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { gauge, text } from '../theme/colors';
import { textStyle } from '../theme/typography';

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

export default React.memo(function AttendanceGauge({
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
  const inputRef = useRef<TextInput>(null);
  const webPathRef = useRef<any>(null);

  const safePercentage = (percentage == null || isNaN(percentage)) ? 0 : percentage;
  const clampedPercentage = Math.min(100, Math.max(0, safePercentage));

  const halfSize = size / 2;
  const radius = halfSize - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const ringColor = color || getGaugeColor(clampedPercentage, threshold);

  useEffect(() => {
    let lastUpdate = Date.now();
    const listenerId = animatedValue.addListener(({ value }) => {
      const rounded = Math.round(value);
      
      // Throttle Web updates
      if (Platform.OS === 'web') {
        const now = Date.now();
        if (now - lastUpdate > 33 || value === clampedPercentage) {
          if (inputRef.current) {
            if (typeof inputRef.current.setNativeProps === 'function') {
              inputRef.current.setNativeProps({ text: `${rounded}%` });
            } else {
              (inputRef.current as any).value = `${rounded}%`;
            }
          }
          if (webPathRef.current) {
            const dash = circumference - (value / 100) * circumference;
            if (typeof webPathRef.current.setNativeProps === 'function') {
              webPathRef.current.setNativeProps({ strokeDashoffset: dash });
            } else if (typeof webPathRef.current.setAttribute === 'function') {
              webPathRef.current.setAttribute('stroke-dashoffset', dash.toString());
            }
          }
          lastUpdate = now;
        }
      } else {
        if (inputRef.current && typeof inputRef.current.setNativeProps === 'function') {
          inputRef.current.setNativeProps({ text: `${rounded}%` });
        }
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

  const initialDisplayValue = Math.round(clampedPercentage);
  const initialWebDashoffset = circumference - (initialDisplayValue / 100) * circumference;

  return (
    <View 
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Attendance is ${initialDisplayValue}%`}
    >
      {/* Outer glow ring using native View for perfect circular rendering on Android */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth + 8,
          borderColor: ringColor,
          opacity: 0.15,
        }}
      />

      {/* Base track circle using native View for perfect circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: gauge.track,
        }}
      />

      {/* Inner solid circular background using native View */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: '#12131C',
        }}
      />

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.4" />
          </SvgGradient>
        </Defs>

        {Platform.OS === 'web' ? (
          <circle
            ref={webPathRef}
            cx={halfSize}
            cy={halfSize}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={initialWebDashoffset}
            strokeLinecap="round"
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
            } as any}
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
          <TextInput
            ref={inputRef}
            underlineColorAndroid="transparent"
            editable={false}
            style={[
              textStyle.displayNumber, 
              { 
                color: text.primary, 
                fontSize: size * 0.22, 
                lineHeight: size * 0.28, 
                textAlign: 'center',
                fontWeight: '800',
                padding: 0,
                margin: 0,
              }
            ]}
            defaultValue={`${initialDisplayValue}%`}
          />
          <Text style={[
            textStyle.label, 
            { 
              marginTop: 4, 
              color: text.secondary, 
              fontSize: Math.max(9, size * 0.05),
              textAlign: 'center'
            }
          ]}>
            {label}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <TextInput
            ref={inputRef}
            underlineColorAndroid="transparent"
            editable={false}
            style={[
              textStyle.displayNumber, 
              { 
                color: text.primary, 
                fontSize: size * 0.22, 
                lineHeight: size * 0.28, 
                textAlign: 'center',
                fontWeight: '800',
                padding: 0,
                margin: 0,
              }
            ]}
            defaultValue={`${initialDisplayValue}%`}
          />
        </View>
      )}
    </View>
  );
});

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
