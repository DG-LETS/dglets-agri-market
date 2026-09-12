// ═══════════════════════════════════════
// DG-LETS Agri Market — Shared Types
// ═══════════════════════════════════════

export type UserRole =
  | 'FARMER' | 'BUYER' | 'TRADER'
  | 'AGGREGATOR' | 'PROCESSOR'
  | 'EXPORTER' | 'HAULAGE' | 'ADMIN';

export type UserStatus =
  | 'ACTIVE' | 'INACTIVE'
  | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface User {
  id:          string;
  firstName:   string;
  lastName:    string;
  phone:       string;
  email?:      string;
  role:        UserRole;
  status:      UserStatus;
  profileImage?: string;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  user:         User;
}

export interface Product {
  id:               string;
  name:             string;
  price:            number;
  priceUnit:        string;
  quantity:         number;
  quantityUnit:     string;
  moq:              number;
  images:           string[];
  state:            string;
  lga?:             string;
  description?:     string;
  qualityGrade?:    string;
  status:           string;
  deliveryAvailable: boolean;
  sellerId:         string;
  categoryId:       string;
  seller?:          Partial<User>;
  category?:        Category;
}

export interface Category {
  id:       string;
  name:     string;
  slug:     string;
  icon?:    string;
  image?:   string;
}

export interface Order {
  id:            string;
  orderNumber:   string;
  status:        string;
  paymentStatus: string;
  subtotal:      number;
  platformFee:   number;
  deliveryFee:   number;
  total:         number;
  items:         OrderItem[];
  buyer?:        Partial<User>;
  seller?:       Partial<User>;
  createdAt:     string;
}

export interface OrderItem {
  id:        string;
  productId: string;
  quantity:  number;
  unitPrice: number;
  subtotal:  number;
  product?:  Partial<Product>;
}

export interface Notification {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  readAt?:   string;
  createdAt: string;
}

export interface MarketPrice {
  id:         string;
  product:    string;
  state:      string;
  priceMin:   number;
  priceMax:   number;
  priceAvg:   number;
  unit:       string;
  recordedAt: string;
}

export interface ApiResponse<T> {
  data:    T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}
