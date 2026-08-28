import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';
import { Database } from '../lib/database.types';
import { LogbookService } from './LogbookService';
import { supabase } from '../lib/supabase';

type AttendanceRecordInsert = Omit<Database['public']['Tables']['attendance_records']['Insert'], 'id' | 'created_at'>;

const getStorageKey = async () => {
  const { data, error } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id || 'anon';
  return `@attendance_sync_queue_${uid}`;
};

// Mutex queue implementation
let currentPromise: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = currentPromise.then(() => task(), () => task());
  currentPromise = result.then(() => {}, () => {});
  return result;
}

export const SyncService = {
  async queueAttendanceRecord(record: AttendanceRecordInsert): Promise<void> {
    return enqueue(async () => {
      try {
        const key = await getStorageKey();
        const existingQueueStr = await AsyncStorage.getItem(key);
        const queue: AttendanceRecordInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
        queue.push(record);
        await AsyncStorage.setItem(key, JSON.stringify(queue));
        console.log('Record queued for offline sync:', record);
      } catch (e) {
        console.error('Failed to queue attendance record:', e);
      }
    });
  },

  async getQueueLength(): Promise<number> {
    try {
      const key = await getStorageKey();
      const existingQueueStr = await AsyncStorage.getItem(key);
      const queue: AttendanceRecordInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      return queue.length;
    } catch (e) {
      return 0;
    }
  },

  async flushQueue(): Promise<void> {
    return enqueue(async () => {
      try {
        const key = await getStorageKey();
        const existingQueueStr = await AsyncStorage.getItem(key);
        const queue: AttendanceRecordInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
        
        if (queue.length === 0) return;

        console.log('Attempting to flush records to Supabase...');
        
        const failedQueue: AttendanceRecordInsert[] = [];
        
        try {
          const { error } = await supabase.from('attendance_records').insert(queue);
          if (error) throw error;
          await LogbookService.addLog('create', 'attendance', `Bulk synced ${queue.length} offline attendance records`);
        } catch (error) {
          console.error('Failed to bulk sync records to Supabase:', error);
          failedQueue.push(...queue);
        }

        const latestQueueStr = await AsyncStorage.getItem(key);
        const latestQueue: AttendanceRecordInsert[] = latestQueueStr ? JSON.parse(latestQueueStr) : [];
        
        const newItems = latestQueue.slice(queue.length);
        const finalQueue = [...failedQueue, ...newItems];
        
        await AsyncStorage.setItem(key, JSON.stringify(finalQueue));
      } catch (e) {
        console.error('Critical failure in flushQueue:', e);
      }
    });
  },

  async clearQueue(): Promise<void> {
    return enqueue(async () => {
      try {
        const key = await getStorageKey();
        await AsyncStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to clear sync queue:', e);
      }
    });
  }
};
