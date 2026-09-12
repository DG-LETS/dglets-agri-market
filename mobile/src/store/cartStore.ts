import { create } from 'zustand';
import type { Product } from '@types/index';

export interface CartItem {
  productId:   string;
  name:        string;
  price:       number;
  priceUnit:   string;
  quantity:    number;
  maxQuantity: number;
  image?:      string;
  sellerId:    string;
  sellerName?: string;
}

interface CartState {
  items:    CartItem[];
  sellerId: string | null;   // all items must be from same seller (MVP constraint)

  addItem:     (product: Product, qty: number, replace?: boolean) => void;
  removeItem:  (productId: string) => void;
  updateQty:   (productId: string, qty: number) => void;
  clearCart:   () => void;

  /* Derived helpers */
  subtotal:    () => number;
  platformFee: () => number;
  total:       () => number;
  itemCount:   () => number;
  toOrderPayload: (opts?: { deliveryAddress?: string; deliveryState?: string; notes?: string }) => any;
}

const FEE_RATE = 0.0205;

export const useCartStore = create<CartState>((set, get) => ({
  items:    [],
  sellerId: null,

  /* ── Add / increase item ── */
  addItem: (product, qty, replace = false) => {
    set(state => {
      /* Replace cart if different seller requested */
      const baseItems = replace ? [] : state.items;
      const baseId    = replace ? null : state.sellerId;

      const existing = baseItems.find(i => i.productId === product.id);
      if (existing) {
        return {
          items: baseItems.map(i =>
            i.productId === product.id
              ? { ...i, quantity: Math.min(i.quantity + qty, i.maxQuantity) }
              : i,
          ),
        };
      }

      const newItem: CartItem = {
        productId:   product.id,
        name:        product.name,
        price:       product.price,
        priceUnit:   product.priceUnit,
        quantity:    Math.min(qty, product.quantity),
        maxQuantity: product.quantity,
        image:       product.images?.[0],
        sellerId:    product.sellerId,
        sellerName:  product.seller
          ? `${product.seller.firstName ?? ''} ${product.seller.lastName ?? ''}`.trim()
          : undefined,
      };

      return {
        items:    [...baseItems, newItem],
        sellerId: baseId ?? product.sellerId,
      };
    });
  },

  /* ── Remove item ── */
  removeItem: (productId) => {
    set(state => {
      const next = state.items.filter(i => i.productId !== productId);
      return { items: next, sellerId: next.length ? state.sellerId : null };
    });
  },

  /* ── Update quantity (removes if qty ≤ 0) ── */
  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return; }
    set(state => ({
      items: state.items.map(i =>
        i.productId === productId
          ? { ...i, quantity: Math.min(qty, i.maxQuantity) }
          : i,
      ),
    }));
  },

  /* ── Clear ── */
  clearCart: () => set({ items: [], sellerId: null }),

  /* ── Derived ── */
  subtotal:    () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  platformFee: () => parseFloat((get().subtotal() * FEE_RATE).toFixed(2)),
  total:       () => get().subtotal() + get().platformFee(),
  itemCount:   () => get().items.reduce((s, i) => s + i.quantity, 0),

  toOrderPayload: (opts = {}) => ({
    items: get().items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    ...opts,
  }),
}));
