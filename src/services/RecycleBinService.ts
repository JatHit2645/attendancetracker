import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { LogbookService } from './LogbookService';

export interface DeletedItem {
  id: string; // generated recycle ID
  originalId: string;
  deletedAt: string;
  expiryAt: string; // 30 days from deletedAt
  table: 'academic_semesters' | 'subjects' | 'timetable_slots' | 'attendance_records' | 'holidays';
  data: any; // original record data
  label: string; // human-readable description (e.g. "Physics (PHY)")
}

const STORAGE_KEY = 'attendance_tracker_recycle_bin_v1';

export const RecycleBinService = {
  async fetchItems(): Promise<DeletedItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as DeletedItem[];
      
      // Auto-cleanup expired items (older than 30 days)
      const now = new Date().toISOString();
      const nonExpired = parsed.filter(item => item.expiryAt > now);
      
      if (nonExpired.length !== parsed.length) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nonExpired));
      }
      
      // Sort newest deleted first
      return nonExpired.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
    } catch (e) {
      console.warn('Failed to fetch recycle bin', e);
      return [];
    }
  },

  async archiveItem(
    table: DeletedItem['table'],
    data: any,
    label: string
  ): Promise<void> {
    try {
      const items = await this.fetchItems();
      const deletedAt = new Date();
      const expiryAt = new Date();
      expiryAt.setDate(expiryAt.getDate() + 30); // 30 days retention

      const newItem: DeletedItem = {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        originalId: data.id,
        deletedAt: deletedAt.toISOString(),
        expiryAt: expiryAt.toISOString(),
        table,
        data,
        label,
      };

      items.unshift(newItem);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to archive item to recycle bin', e);
    }
  },

  async restoreItem(id: string): Promise<void> {
    const items = await this.fetchItems();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found in Recycle Bin');

    try {
      // 1. Insert parent/item back into Supabase
      const { error } = await (supabase as any).from(item.table).insert([item.data]);
      if (error) {
        if (error.code === '23503') {
          throw new Error('Foreign key violation: Please restore the parent semester or subject first!');
        }
        throw error;
      }

      const restoredIds: string[] = [id];

      // 2. Cascade restoration for subjects
      if (item.table === 'subjects') {
        const childSlots = items.filter(i => i.table === 'timetable_slots' && i.data.subject_id === item.data.id);
        for (const slot of childSlots) {
          await (supabase as any).from('timetable_slots').insert([slot.data]).catch(console.warn);
          restoredIds.push(slot.id);
        }
        const childRecords = items.filter(i => i.table === 'attendance_records' && i.data.subject_id === item.data.id);
        for (const rec of childRecords) {
          await (supabase as any).from('attendance_records').insert([rec.data]).catch(console.warn);
          restoredIds.push(rec.id);
        }
      }

      // 3. Cascade restoration for semesters
      if (item.table === 'academic_semesters') {
        // Restore holidays
        const holidays = items.filter(i => i.table === 'holidays' && i.data.semester_id === item.data.id);
        for (const h of holidays) {
          await (supabase as any).from('holidays').insert([h.data]).catch(console.warn);
          restoredIds.push(h.id);
        }
        // Restore subjects
        const subjects = items.filter(i => i.table === 'subjects' && i.data.semester_id === item.data.id);
        for (const sub of subjects) {
          await (supabase as any).from('subjects').insert([sub.data]).catch(console.warn);
          restoredIds.push(sub.id);
          
          // Restore slots & records for this subject
          const childSlots = items.filter(i => i.table === 'timetable_slots' && i.data.subject_id === sub.data.id);
          for (const slot of childSlots) {
            await (supabase as any).from('timetable_slots').insert([slot.data]).catch(console.warn);
            restoredIds.push(slot.id);
          }
          const childRecords = items.filter(i => i.table === 'attendance_records' && i.data.subject_id === sub.data.id);
          for (const rec of childRecords) {
            await (supabase as any).from('attendance_records').insert([rec.data]).catch(console.warn);
            restoredIds.push(rec.id);
          }
        }
      }

      // 4. Log restoration
      let logCategory: 'semester' | 'subject' | 'timetable' | 'attendance' | 'holiday' = 'subject';
      if (item.table === 'academic_semesters') logCategory = 'semester';
      else if (item.table === 'timetable_slots') logCategory = 'timetable';
      else if (item.table === 'attendance_records') logCategory = 'attendance';
      else if (item.table === 'holidays') logCategory = 'holiday';

      await LogbookService.addLog('restore', logCategory, `Restored deleted ${logCategory}: ${item.label}`);

      // 5. Remove restored items from Recycle Bin
      const remaining = items.filter(i => !restoredIds.includes(i.id));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e: any) {
      console.warn('Failed to restore item', e);
      throw e;
    }
  },

  async deletePermanently(id: string): Promise<void> {
    try {
      const items = await this.fetchItems();
      const remaining = items.filter(i => i.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn('Failed to delete permanently', e);
    }
  }
};
