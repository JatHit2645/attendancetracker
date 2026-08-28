import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface LogEntry {
  id: string;
  timestamp: string;
  actionType: 'create' | 'update' | 'delete' | 'restore' | 'auth';
  category: 'subject' | 'attendance' | 'semester' | 'timetable' | 'holiday' | 'auth';
  description: string;
  details?: string;
}

const getStorageKey = async () => {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id || 'anon';
  return `@logbook_v1_${uid}`;
};

export const LogbookService = {
  async fetchLogs(): Promise<LogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(await getStorageKey());
      if (!data) return [];
      const parsed = JSON.parse(data) as LogEntry[];
      return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      return [];
    }
  },

  async addLog(actionType: LogEntry['actionType'], category: LogEntry['category'], description: string, details?: string): Promise<void> {
    try {
      const logs = await this.fetchLogs();
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        actionType,
        category,
        description,
        details,
      };
      
      logs.unshift(newLog);
      
      if (logs.length > 500) {
        logs.pop();
      }
      
      await AsyncStorage.setItem(await getStorageKey(), JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to add log', e);
    }
  },

  async clearLogs(): Promise<void> {
    await AsyncStorage.removeItem(await getStorageKey());
  }
};
