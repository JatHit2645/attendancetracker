import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  /**
   * Request permissions from the user (Required for iOS, Android 13+)
   */
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Schedules a class reminder notification
   */
  static async scheduleClassReminder(subjectName: string, room: string, startTime: Date) {
    if (Platform.OS === 'web') return;

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
      trigger: triggerTime,
    });
  }

  /**
   * Schedules a daily evening log reminder
   */
  static async scheduleDailyLogReminder() {
    if (Platform.OS === 'web') return;

    // Schedule daily at 18:00 (6:00 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Attendance Check ✅',
        body: 'Did you log all your classes for today? Keep your stats accurate!',
        sound: true,
      },
      trigger: {
        hour: 18,
        minute: 0,
        repeats: true,
        type: 'daily' // Use explicit property or structure required by latest expo-notifications
      } as any, 
    });
  }

  /**
   * Send an immediate warning for critical attendance drops
   */
  static async sendThresholdWarning(subjectName: string, percentage: number) {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Attendance Warning',
        body: `Critical! Your attendance for ${subjectName} has dropped to ${percentage}%.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // trigger immediately
    });
  }
}
