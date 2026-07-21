import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { canvas, text as textColors, accent, glass, border, shadow } from '../../theme/colors';
import { fontFamily, fontSize, textStyle } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { SecurityService } from '../../services/SecurityService';
import { supabase } from '../../lib/supabase';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
}

export default function LockScreen({ onUnlock, onLogout }: LockScreenProps) {
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });

    if (Platform.OS !== 'web') {
      // Auto-trigger biometric prompt on mount if available
      triggerBiometrics();
    }
  }, []);

  const triggerBiometrics = async () => {
    const availability = await SecurityService.checkBiometricAvailability();
    if (!availability.available) {
      setShowOtp(true);
      return;
    }

    const authResult = await SecurityService.authenticate();
    if (authResult.success) {
      onUnlock();
    } else {
      // User cancelled or failed
      setShowOtp(true);
    }
  };

  const handleSendOtp = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: userEmail });
      if (error) throw error;
      setOtpSent(true);
      Alert.alert('OTP Sent', 'Please check your email for the verification code.');
    } catch (e: any) {
      Alert.alert('Error', 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!userEmail || !otpCode) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode,
        type: 'email',
      });
      if (error) throw error;
      onUnlock();
    } catch (e: any) {
      Alert.alert('Error', 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color={accent.primary} />
        </View>
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>Verify your identity to access your attendance data.</Text>

        {!showOtp ? (
          <TouchableOpacity style={styles.primaryButton} onPress={triggerBiometrics}>
            <LinearGradient colors={[accent.primary, accent.primaryHover]} style={styles.buttonGradient}>
              <Ionicons name="finger-print" size={24} color="#fff" />
              <Text style={styles.buttonText}>Unlock with Biometrics</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.otpContainer}>
            {!otpSent ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={loading}>
                <LinearGradient colors={[glass.medium, glass.heavy]} style={styles.buttonGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP via Email</Text>}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpInputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={textColors.tertiary}
                  keyboardType="number-pad"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  maxLength={6}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp} disabled={loading}>
                  <LinearGradient colors={[accent.primary, accent.primaryHover]} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  content: {
    alignItems: 'center',
    backgroundColor: glass.light,
    padding: spacing['3xl'],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: border.default,
    ...shadow.medium,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: glass.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: border.default,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  primaryButton: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#fff',
  },
  otpContainer: {
    width: '100%',
  },
  otpInputGroup: {
    width: '100%',
    gap: spacing.md,
  },
  input: {
    width: '100%',
    backgroundColor: canvas.elevated,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    padding: spacing.lg,
    color: textColors.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    textAlign: 'center',
    letterSpacing: 4,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
  logoutText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.tertiary,
    textDecorationLine: 'underline',
  },
});
