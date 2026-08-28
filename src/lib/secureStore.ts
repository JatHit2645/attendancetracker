import AsyncStorage from '@react-native-async-storage/async-storage';

export const secureStore = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`SecureStore getItem error for key ${key}:`, e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`SecureStore setItem error for key ${key}:`, e);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`SecureStore deleteItem error for key ${key}:`, e);
    }
  }
};
