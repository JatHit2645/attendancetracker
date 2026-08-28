import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type DeletableEntityType = 'academic_semesters' | 'subjects' | 'timetable_slots' | 'attendance_records' | 'timetable_versions' | 'holidays';

export interface RecycleBinItem {
  id: string;
  type: DeletableEntityType;
  data: any; 
  deletedAt: string;
  label: string; 
}

const getStorageKey = async () => {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id || 'anon';
  return `@recycle_bin_${uid}`;
};

export const RecycleBinService = {
  async archiveItem(type: DeletableEntityType, data: any, label: string): Promise<void> {
    try {
      const key = await getStorageKey();
      const existingStr = await AsyncStorage.getItem(key);
      const items: RecycleBinItem[] = existingStr ? JSON.parse(existingStr) : [];
      
      const newItem: RecycleBinItem = {
        id: data.id || Math.random().toString(),
        type,
        data,
        deletedAt: new Date().toISOString(),
        label
      };
      
      items.push(newItem);
      if (items.length > 50) items.shift();
      await AsyncStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  },

  async getDeletedItems(): Promise<RecycleBinItem[]> {
    try {
      const key = await getStorageKey();
      const str = await AsyncStorage.getItem(key);
      return str ? JSON.parse(str).reverse() : [];
    } catch (e) {
      return [];
    }
  },

  async restoreItem(item: RecycleBinItem): Promise<void> {
    const { type, data } = item;
    const { error } = await supabase.from(type).insert([data]);
    if (error) throw error;
    await this.permanentlyDeleteItem(item.id);
  },

  async permanentlyDeleteItem(itemId: string): Promise<void> {
    try {
      const key = await getStorageKey();
      const str = await AsyncStorage.getItem(key);
      if (!str) return;
      const items: RecycleBinItem[] = JSON.parse(str);
      const filtered = items.filter(i => i.id !== itemId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  },

  async emptyBin(): Promise<void> {
    try {
      const key = await getStorageKey();
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
  }
};
