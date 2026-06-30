import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null ? { key, value } : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return { key, value };
    } catch {
      return null;
    }
  },

  async delete(key) {
    try {
      await AsyncStorage.removeItem(key);
      return { key, deleted: true };
    } catch {
      return null;
    }
  },
};
