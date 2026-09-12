import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/* ── Session-expired event bus ── */
type Listener = () => void;
const sessionListeners: Listener[] = [];
export const onSessionExpired = (fn: Listener) => {
  sessionListeners.push(fn);
  return () => {
    const idx = sessionListeners.indexOf(fn);
    if (idx > -1) sessionListeners.splice(idx, 1);
  };
};
const emitSessionExpired = () => sessionListeners.forEach(fn => fn());

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor: attach access token ── */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

/* ── Response interceptor: handle 401, refresh token ── */
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken',  data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        emitSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);

/* ── Auth endpoints ── */
export const authApi = {
  register:             (data: any)    => api.post('/auth/register', data),
  login:                (data: any)    => api.post('/auth/login', data),
  verifyOtp:            (data: any)    => api.post('/auth/verify-otp', data),
  requestPasswordReset: (phone: string) => api.post('/auth/request-password-reset', { phone }),
  resetPassword:        (data: any)    => api.post('/auth/reset-password', data),
  refresh:              (token: string) => api.post('/auth/refresh', { refreshToken: token }),
  logout:               (token: string) => api.post('/auth/logout', { refreshToken: token }),
};

/* ── User endpoints ── */
export const usersApi = {
  getMe:               ()        => api.get('/users/me'),
  updateMe:            (data: any) => api.patch('/users/me', data),
  updateFarmerProfile: (data: any) => api.patch('/users/me/farmer-profile', data),
  updateBuyerProfile:  (data: any) => api.patch('/users/me/buyer-profile', data),
};

/* ── Categories ── */
export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

/* ── Marketplace ── */
export const marketplaceApi = {
  search:         (params: any)       => api.get('/marketplace/products', { params }),
  getProduct:     (id: string)        => api.get(`/marketplace/products/${id}`),
  getMyProducts:  (status?: string)   => api.get('/marketplace/products/my', { params: { status } }),
  createProduct:  (data: any)         => api.post('/marketplace/products', data),
  updateProduct:  (id: string, data: any) => api.patch(`/marketplace/products/${id}`, data),
  deleteProduct:  (id: string)        => api.delete(`/marketplace/products/${id}`),
  toggleSave:     (id: string)        => api.post(`/marketplace/products/${id}/save`),
  getSaved:       ()                  => api.get('/marketplace/saved'),
  getMarketPrices: (params?: any)     => api.get('/marketplace/market-prices', { params }),
};

/* ── Orders ── */
export const ordersApi = {
  create:         (data: any)   => api.post('/orders', data),
  myBuyerOrders:  ()            => api.get('/orders/buying'),
  mySellerOrders: ()            => api.get('/orders/selling'),
  getById:        (id: string)  => api.get(`/orders/${id}`),
  updateStatus:   (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
};

/* ── Notifications ── */
export const notificationsApi = {
  getAll:      (params?: any) => api.get('/notifications', { params }),
  markRead:    (id: string)   => api.patch(`/notifications/${id}/read`),
  markAllRead: ()             => api.patch('/notifications/read-all'),
};

/* ── Payments ── */
export const paymentsApi = {
  initPaystack:    (orderId: string)      => api.post(`/payments/paystack/init/${orderId}`),
  verifyPaystack:  (reference: string)    => api.get(`/payments/paystack/verify/${reference}`),
  getForOrder:     (orderId: string)      => api.get(`/payments/order/${orderId}`),
};

/* ── Upload (multipart/form-data) ── */
export const uploadApi = {
  /** Upload a single image. Pass a FormData with field name "file". */
  image: (formData: FormData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000, // give uploads more time
    }),

  /** Upload up to 5 product images. Pass a FormData with field name "files". */
  images: (formData: FormData) =>
    api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    }),
};
