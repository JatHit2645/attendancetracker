/**
 * Attendance Tracker — Registration Screen
 * 
 * New account creation with:
 * - Name, Email, Password, Confirm Password fields
 * - Real-time password match validation
 * - Gradient accent button with glow
 * - PRD 3.5 compliant: optional name, required email + password
 */

import { useState, useRef } from 'react';
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
import { DatabaseService } from '../../services/DatabaseService';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export default function RegisterScreen({
  onNavigateToLogin,
  onRegisterSuccess,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

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

  const handleRegister = async () => {
    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      showError('Please enter your email address.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      showError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }
    if (!password.trim()) {
      showError('Please create a password.');
      return;
    }
    if (password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (authError) throw authError;

      // Seed the database with an initial semester for the new user
      await DatabaseService.initializeNewUser();

      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err: any) {
      // PRD 3.9: Never reveal whether email exists to prevent enumeration leaks
      showError('Unable to create account. Please ensure your details are correct or try signing in.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

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
          {/* ─── Header ─── */}
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Start tracking your academic attendance
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

          {/* ─── Glass Card Form ─── */}
          <View style={styles.formCard}>
            {/* Name Field (Optional per PRD 3.5) */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>NAME</Text>
                <Text style={styles.optionalBadge}>OPTIONAL</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'name' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={text.disabled}
                  autoCapitalize="words"
                  autoComplete="name"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  editable={!isLoading}
                />
              </View>
            </View>

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
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={text.disabled}
                  secureTextEntry
                  autoComplete="new-password"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'confirm' && styles.inputFocused,
                  passwordsMatch && styles.inputSuccess,
                  passwordsMismatch && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={text.disabled}
                  secureTextEntry
                  autoComplete="new-password"
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  editable={!isLoading}
                  onSubmitEditing={handleRegister}
                />
              </View>
              {passwordsMismatch && (
                <Text style={styles.fieldError}>Passwords do not match</Text>
              )}
              {passwordsMatch && (
                <Text style={styles.fieldSuccess}>Passwords match ✓</Text>
              )}
            </View>

            {/* Create Account Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={handleRegister}
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
                  style={styles.createButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color={text.primary} size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ─── Login Link ─── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
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

  // ── Header
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    ...textStyle.pageTitle,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyle.body,
    textAlign: 'center',
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
    gap: spacing.lg,
  },

  // ── Form Fields
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...textStyle.label,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalBadge: {
    fontFamily: fontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    color: text.tertiary,
    backgroundColor: glass.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    overflow: 'hidden',
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
  inputSuccess: {
    borderColor: feedback.success + '60',
  },
  inputError: {
    borderColor: feedback.error + '60',
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: text.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  fieldError: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: feedback.error,
    marginTop: 2,
  },
  fieldSuccess: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: feedback.success,
    marginTop: 2,
  },

  // ── Button
  buttonWrapper: {
    marginTop: spacing.sm,
    width: '100%',
  },
  createButton: {
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
  createButtonText: {
    ...textStyle.button,
    color: '#FFFFFF',
  },

  // ── Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  footerText: {
    ...textStyle.body,
  },
  loginLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: accent.primary,
  },
});
