import { create } from 'zustand';
import { storage } from '@utils/storage';

interface SettingsState {
  darkMode:             boolean;
  notificationsEnabled: boolean;
  isLoaded:             boolean;

  loadSettings:            () => Promise<void>;
  toggleDarkMode:          () => Promise<void>;
  toggleNotifications:     () => Promise<void>;
  setDarkMode:             (val: boolean) => Promise<void>;
  setNotificationsEnabled: (val: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  darkMode:             false,
  notificationsEnabled: true,
  isLoaded:             false,

  loadSettings: async () => {
    try {
      const dm    = await storage.getItem('darkMode');
      const notif = await storage.getItem('notifications');
      set({
        darkMode:             dm    === 'true',
        notificationsEnabled: notif !== 'false', /* default on */
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleDarkMode: async () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    await storage.setItem('darkMode', String(next));
  },

  toggleNotifications: async () => {
    const next = !get().notificationsEnabled;
    set({ notificationsEnabled: next });
    await storage.setItem('notifications', String(next));
  },

  setDarkMode: async (val: boolean) => {
    set({ darkMode: val });
    await storage.setItem('darkMode', String(val));
  },

  setNotificationsEnabled: async (val: boolean) => {
    set({ notificationsEnabled: val });
    await storage.setItem('notifications', String(val));
  },
}));
