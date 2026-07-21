/**
 * Attendance Tracker — Forgot Password Screen
 * 
 * PRD 3.18 compliant password recovery flow:
 * Forgot Password → Enter Email → Verification Process → Create New Password → Login Again
 * 
 * Security: Never reveals whether an email exists in the system.
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { canvas, glass, border, text, accent, feedback, shadow } from '../../theme/colors';
import { textStyle, fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({
  onNavigateToLogin,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationRef.current) animationRef.current.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const showError = (message: string) => {
    setError(message);
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.sequence([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(4000),
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);
    animationRef.current.start(({ finished }) => {
      if (finished) {
        setError(null);
      }
    });
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (authError) throw authError;

      setIsSent(true);
      // Wait a moment then navigate back to login
      timeoutRef.current = setTimeout(() => {
        onNavigateToLogin();
      }, 3000);
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      showError('Unable to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Back to Login ─── */}
          <TouchableOpacity
            onPress={onNavigateToLogin}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>← Back to sign in</Text>
          </TouchableOpacity>

          {/* ─── Header ─── */}
          <View style={styles.header}>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>
              Enter the email associated with your account and we'll send a
              password reset link.
            </Text>
          </View>

          {/* ─── Error Banner ─── */}
          {error && (
            <Animated.View
              style={[styles.errorBanner, { opacity: errorOpacity }]}
            >
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {isSent ? (
            /* ─── Success State ─── */
            <Animated.View
              style={[styles.successCard, { opacity: successOpacity }]}
            >
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✉️</Text>
              </View>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successBody}>
                If an account exists for{' '}
                <Text style={styles.emailHighlight}>{email}</Text>, you'll
                receive a password reset link shortly.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  onNavigateToLogin();
                }}
                style={styles.backToLoginButton}
              >
                <Text style={styles.backToLoginText}>
                  Return to sign in
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* ─── Glass Card Form ─── */
            <View style={styles.formCard}>
              {/* Email Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={text.disabled}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    editable={!isLoading}
                    onSubmitEditing={handleResetPassword}
                  />
                </View>
              </View>

              {/* Send Reset Link Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                  disabled={isLoading}
                  style={styles.buttonWrapper}
                >
                  <LinearGradient
                    colors={
                      isLoading
                        ? [accent.primary + '80', accent.primaryHover + '80']
                        : [accent.primary, accent.primaryHover]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.resetButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={text.primary} size="small" />
                    ) : (
                      <Text style={styles.resetButtonText}>
                        Send Reset Link
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing['4xl'],
  },

  // ── Back Button
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing['2xl'],
  },
  backText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: accent.secondary,
  },

  // ── Header
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    ...textStyle.pageTitle,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyle.body,
    lineHeight: fontSize.base * 1.7,
  },

  // ── Error Banner
  errorBanner: {
    backgroundColor: feedback.error + '18',
    borderWidth: 1,
    borderColor: feedback.error + '30',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: feedback.error,
    textAlign: 'center',
  },

  // ── Glass Card Form
  formCard: {
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    gap: spacing.xl,
  },

  // ── Form Fields
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...textStyle.label,
  },
  inputContainer: {
    backgroundColor: canvas.elevated,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: accent.primary + '60',
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: text.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },

  // ── Button
  buttonWrapper: {
    marginTop: spacing.xs,
    width: '100%',
  },
  resetButton: {
    width: '100%',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadow.glow(accent.primary),
  },
  resetButtonText: {
    ...textStyle.button,
    color: '#FFFFFF',
  },

  // ── Success Card
  successCard: {
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: feedback.success + '25',
    borderRadius: radius.xl,
    padding: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.lg,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: feedback.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successEmoji: {
    fontSize: 28,
  },
  successTitle: {
    ...textStyle.sectionTitle,
    textAlign: 'center',
  },
  successBody: {
    ...textStyle.body,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.7,
  },
  emailHighlight: {
    fontFamily: fontFamily.semiBold,
    color: text.primary,
  },
  backToLoginButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderWidth: 1,
    borderColor: border.medium,
    borderRadius: radius.md,
  },
  backToLoginText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: accent.secondary,
  },
});
