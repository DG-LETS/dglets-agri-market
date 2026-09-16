import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@utils/storage';

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
  /* Short timeout in demo mode so failed requests fail fast, not slow */
  timeout: API_URL.includes('localhost') || API_URL === 'http://10.217.112.100:3000/api/v1' ? 3000 : 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor: attach access token ── */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItem('accessToken');
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
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await storage.setItem('accessToken',  data.accessToken);
        await storage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
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
  registerPushToken:   (token: string, platform: string) =>
    api.post('/users/me/push-token', { token, platform }),
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

/* ── Haulage ── */
export const haulageApi = {
  /** Get open delivery jobs (orders needing haulage), optionally filtered by state */
  getJobs: (params?: { state?: string; page?: number; limit?: number }) =>
    api.get('/haulage/jobs', { params }),

  /** Express interest in a delivery job */
  applyForJob: (orderId: string) =>
    api.post(`/haulage/jobs/${orderId}/apply`),

  /** Get jobs the current haulage partner has applied for */
  getMyApplications: () =>
    api.get('/haulage/jobs/my-applications'),

  /** Get jobs currently assigned to the haulage partner */
  getMyActiveJobs: () =>
    api.get('/haulage/jobs/my-active'),

  /** Create or update haulage profile */
  createProfile: (data: any) =>
    api.post('/haulage/profile', data),

  /** Get own haulage profile */
  getProfile: () =>
    api.get('/haulage/profile'),

  /** Get applications for a specific job (seller) */
  getJobApplications: (jobId: string) =>
    api.get(`/haulage/jobs/${jobId}/applications`),

  /** Award a job to an applicant (seller) */
  awardJob: (jobId: string, applicationId: string) =>
    api.patch(`/haulage/jobs/${jobId}/award/${applicationId}`),

  /** Mark a job as delivered (haulage provider) */
  completeJob: (jobId: string) =>
    api.patch(`/haulage/jobs/${jobId}/complete`),
};

/* ── Messages ── */
export const messagesApi = {
  /** Get all conversations (inbox) */
  getConversations: () =>
    api.get('/messages'),

  /** Get unread message count */
  getUnreadCount: () =>
    api.get('/messages/unread'),

  /** Get or create a conversation with another user */
  getOrCreateConversation: (recipientId: string, productId?: string, orderId?: string) =>
    api.post('/messages/conversations', { recipientId, productId, orderId }),

  /** Get messages in a conversation */
  getMessages: (conversationId: string, page = 1, limit = 30) =>
    api.get(`/messages/${conversationId}`, { params: { page, limit } }),

  /** Send a message */
  sendMessage: (conversationId: string, body: string) =>
    api.post(`/messages/${conversationId}/send`, { body }),

  /** Report a user */
  reportUser: (conversationId: string, reportedId: string, reason: string) =>
    api.post(`/messages/${conversationId}/report`, { reportedId, reason }),
};

/* ── Platform Fees ── */
export const feesApi = {
  /** Check if registration fee is required and its status */
  getRegistrationStatus: () =>
    api.get('/fees/registration-status'),

  /** Initiate Paystack payment for registration fee */
  initRegistrationPayment: () =>
    api.post('/fees/registration/pay'),

  /** List fees for current user */
  listMyFees: (params?: { type?: string; status?: string }) =>
    api.get('/fees', { params }),
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
