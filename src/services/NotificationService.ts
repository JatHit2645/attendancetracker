import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
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
      trigger: {
        date: triggerTime
      } as any,
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

  /**
   * Schedules weekly pre-class alerts for all timetable slots
   */
  static async schedulePreClassAlerts(slots: any[]) {
    if (Platform.OS === 'web') return;

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.title === 'Class starting soon!') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (e) {
      console.warn("Error cancelling previous notifications", e);
    }

    for (const slot of slots) {
      if (!slot.startTime) continue;
      const [hourStr, minuteStr] = slot.startTime.split(':');
      let hour = parseInt(hourStr, 10);
      let minute = parseInt(minuteStr, 10);

      minute -= 10;
      if (minute < 0) {
        minute += 60;
        hour -= 1;
        if (hour < 0) hour += 24;
      }

      // DB dayOfWeek: 0 = Sun, 1 = Mon ... 6 = Sat
      // Expo weekday: 1 = Sun, 2 = Mon ... 7 = Sat
      const expoWeekday = slot.dayOfWeek + 1;

      let body = `${slot.subjectName}`;
      if (slot.roomNumber && slot.roomNumber !== "TBA") {
        body += ` in ${slot.roomNumber}`;
      }
      if (slot.teacher) {
        body += ` with ${slot.teacher}`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Class starting soon!',
          body: body,
          sound: true,
        },
        trigger: {
          weekday: expoWeekday,
          hour,
          minute,
          repeats: true,
        } as any,
      });
    }
  }
}
