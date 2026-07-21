import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export class SecurityService {
  /**
   * Checks if the device has biometric hardware and if the user has enrolled any biometrics.
   */
  static async checkBiometricAvailability(): Promise<{ available: boolean; error?: string }> {
    if (Platform.OS === 'web') {
      return { available: false, error: 'Web does not support native biometrics.' };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { available: false, error: 'Device does not have biometric hardware.' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { available: false, error: 'No biometrics are enrolled on this device.' };
      }

      return { available: true };
    } catch (e: any) {
      return { available: false, error: e.message };
    }
  }

  /**
   * Prompts the user for biometric authentication (Fingerprint, FaceID, etc).
   */
  static async authenticate(): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'web') {
      return { success: true }; // Web relies on normal session auth, bypass local biometrics
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Attendance Tracker',
        cancelLabel: 'Use OTP Instead',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: (result as any).error };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
