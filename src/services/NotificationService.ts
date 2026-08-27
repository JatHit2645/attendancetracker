import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
// Wrapped in try-catch to prevent crash if the native module isn't properly linked
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

export class NotificationService {
  /**
   * Request permissions from the user (Required for iOS, Android 13+)
   */
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Failed to request notification permissions:', e);
      return false;
    }
  }

  /**
   * Schedules a class reminder notification
   */
  static async scheduleClassReminder(subjectName: string, room: string, startTime: Date) {
    if (Platform.OS === 'web') return;

    try {
      // Schedule for 15 minutes before startTime
      const triggerTime = new Date(startTime.getTime() - 15 * 60000);
      
      // Don't schedule if it's already in the past
      if (triggerTime.getTime() <= Date.now()) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Lecture 📚',
          body: `${subjectName} starts in 15 minutes${room ? ` in ${room}` : ''}. Don't be late!`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
      });
    } catch (e) {
      console.warn('Failed to schedule class reminder:', e);
    }
  }

  /**
   * Schedules a daily evening log reminder
   */
  static async scheduleDailyLogReminder() {
    if (Platform.OS === 'web') return;

    try {
      // Cancel existing daily reminder first to avoid duplicates
      await Notifications.cancelScheduledNotificationAsync('daily-evening-reminder').catch(() => {});

      // Schedule daily at 18:00 (6:00 PM)
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-evening-reminder',
        content: {
          title: 'Daily Attendance Check ✅',
          body: 'Did you log all your classes for today? Keep your stats accurate!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 18,
          minute: 0,
        },
      });
    } catch (e) {
      console.warn('Failed to schedule daily reminder:', e);
    }
  }

  /**
   * Send an immediate warning for critical attendance drops
   */
  static async sendThresholdWarning(subjectName: string, percentage: number) {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Attendance Warning',
          body: `Critical! Your attendance for ${subjectName} has dropped to ${percentage}%.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null as any, // immediate
      });
    } catch (e) {
      console.warn('Failed to send threshold warning:', e);
    }
  }
}
