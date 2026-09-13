/**
 * Cross-platform secure storage.
 * - Native (iOS/Android): uses expo-secure-store
 * - Web: falls back to localStorage (not encrypted, fine for dev/testing)
 */
import { Platform } from 'react-native';

let SecureStore: typeof import('expo-secure-store') | null = null;

/* Only import SecureStore on native — avoids web bundle hang */
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore!.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore!.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore!.deleteItemAsync(key);
  },
};
