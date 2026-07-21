import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';
import { Database } from '../lib/database.types';

type AttendanceRecordInsert = Omit<Database['public']['Tables']['attendance_records']['Insert'], 'id' | 'created_at'>;

const SYNC_QUEUE_KEY = '@attendance_sync_queue';

export const SyncService = {
  /**
   * Add a new attendance record to the local queue.
   * Useful when the device is offline or the network is unstable.
   */
  async queueAttendanceRecord(record: AttendanceRecordInsert): Promise<void> {
    try {
      const existingQueueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: AttendanceRecordInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      queue.push(record);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log('Record queued for offline sync:', record);
    } catch (e) {
      console.error('Failed to queue attendance record:', e);
    }
  },

  /**
   * Gets the current number of pending items in the queue
   */
  async getQueueLength(): Promise<number> {
    try {
      const existingQueueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: AttendanceRecordInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      return queue.length;
    } catch (e) {
      return 0;
    }
  },

  /**
   * Attempt to push all queued records to Supabase.
   * If successful, removes them from the local queue.
   */
  async flushQueue(): Promise<void> {
    try {
      const existingQueueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: AttendanceRecordInsert[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      
      if (queue.length === 0) return;

      console.log(`Attempting to flush ${queue.length} records to Supabase...`);
      
      const failedQueue: AttendanceRecordInsert[] = [];
      
      for (const record of queue) {
        try {
          await DatabaseService.logAttendanceSession(record);
        } catch (error) {
          console.error('Failed to sync record to Supabase, pushing back to queue:', record, error);
          failedQueue.push(record);
        }
      }

      // Update the queue with only the failed items (if any)
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedQueue));
      if (failedQueue.length === 0) {
        console.log('Successfully flushed all queued records!');
      } else {
        console.warn(`Flushed completed with ${failedQueue.length} items remaining in queue.`);
      }
    } catch (e) {
      console.error('Critical failure in flushQueue:', e);
    }
  },

  /**
   * Clears the sync queue completely.
   * Useful when the user signs out.
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (e) {
      console.error('Failed to clear sync queue:', e);
    }
  }
};
