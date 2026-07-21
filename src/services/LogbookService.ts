import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogEntry {
  id: string;
  timestamp: string;
  actionType: 'create' | 'update' | 'delete' | 'restore' | 'auth';
  category: 'subject' | 'attendance' | 'semester' | 'timetable' | 'holiday' | 'auth';
  description: string;
  details?: string;
}

const STORAGE_KEY = 'attendance_tracker_logbook_v1';

export const LogbookService = {
  async fetchLogs(): Promise<LogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as LogEntry[];
      // Sort newest first
      return parsed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (e) {
      console.warn('Failed to fetch logbook', e);
      return [];
    }
  },

  async addLog(
    actionType: LogEntry['actionType'],
    category: LogEntry['category'],
    description: string,
    details?: string
  ): Promise<void> {
    try {
      const logs = await this.fetchLogs();
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        actionType,
        category,
        description,
        details,
      };
      
      logs.unshift(newEntry);
      
      // Limit to 500 logs to prevent storage bloat
      const trimmed = logs.slice(0, 500);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to add log to logbook', e);
    }
  },

  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear logbook', e);
    }
  }
};
