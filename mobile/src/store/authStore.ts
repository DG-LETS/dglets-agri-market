import { create } from 'zustand';
import { storage } from '@utils/storage';
import { User, AuthTokens } from '@types/index';
import { authApi, usersApi } from '@services/api';

interface AuthState {
  user:           User | null;
  accessToken:    string | null;
  isAuthenticated: boolean;
  isLoading:      boolean;
  isInitialized:  boolean;

  initialize:   () => Promise<void>;
  login:        (identifier: string, password?: string) => Promise<any>;
  verifyOtp:    (userId: string, token: string, purpose: string) => Promise<any>;
  register:     (data: any) => Promise<any>;
  logout:       () => Promise<void>;
  refreshUser:  () => Promise<void>;
  setTokens:    (tokens: AuthTokens) => Promise<void>;
  setDemoUser:  (user: any) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       false,
  isInitialized:   false,

  /* ── Initialize: restore session from SecureStore ── */
  initialize: async () => {
    try {
      const accessToken  = await storage.getItem('accessToken');
      const refreshToken = await storage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        const { data } = await usersApi.getMe();
        set({ user: data, accessToken, isAuthenticated: true });
      }
    } catch {
      await storage.deleteItem('accessToken');
      await storage.deleteItem('refreshToken');
    } finally {
      set({ isInitialized: true });
    }
  },

  /* ── Login ── */
  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ identifier, password });
      if (data.otpSent) return data;
      await get().setTokens(data);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  /* ── Verify OTP ── */
  verifyOtp: async (userId, token, purpose) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.verifyOtp({ userId, token, purpose });
      await get().setTokens(data);
      return data; /* return full response including registrationFee */
    } finally {
      set({ isLoading: false });
    }
  },

  /* ── Register ── */
  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      return response.data;
    } finally {
      set({ isLoading: false });
    }
  },

  /* ── Logout ── */
  logout: async () => {
    const refreshToken = await storage.getItem('refreshToken');
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    await storage.deleteItem('accessToken');
    await storage.deleteItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  /* ── Refresh user data ── */
  refreshUser: async () => {
    try {
      const { data } = await usersApi.getMe();
      set({ user: data });
    } catch { /* ignore */ }
  },

  /* ── Save tokens and set state ── */
  setTokens: async (tokens: AuthTokens) => {
    await storage.setItem('accessToken',  tokens.accessToken);
    await storage.setItem('refreshToken', tokens.refreshToken);
    set({ user: tokens.user, accessToken: tokens.accessToken, isAuthenticated: true });
  },

  /* ── Demo mode: inject mock user without API ── */
  setDemoUser: (user: any) => {
    set({ user, accessToken: 'demo-token', isAuthenticated: true, isInitialized: true });
  },
}));
