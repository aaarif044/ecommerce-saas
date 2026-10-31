"use client";

import { create } from "zustand";
import type { CartItem, CartState } from "@/lib/types";
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/services/storage";

export interface CartStore extends CartState {
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  applyCoupon: (code: string | null, discountId: string | null, amount: number) => void;
  setShippingMethod: (methodId: string | null) => void;
  setGiftMessage: (message: string) => void;
  hydrate: () => void;
}

const EMPTY_CART: CartState = {
  items: [],
  couponCode: null,
  discountId: null,
  discountAmount: 0,
  shippingMethodId: null,
  giftMessage: "",
};

function persist(state: CartStore) {
  const payload: CartState = {
    items: state.items,
    couponCode: state.couponCode,
    discountId: state.discountId,
    discountAmount: state.discountAmount,
    shippingMethodId: state.shippingMethodId,
    giftMessage: state.giftMessage,
  };
  writeStorage(STORAGE_KEYS.cart, payload);
}

export const useCartStore = create<CartStore>((set) => ({
  ...EMPTY_CART,
  hydrated: false,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.variantId === item.variantId);
      const items = existing
        ? state.items.map((entry) =>
            entry.variantId === item.variantId
              ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, entry.maxQuantity) }
              : entry,
          )
        : [...state.items, item];
      const next = { ...state, items };
      persist(next);
      return next;
    }),
  removeItem: (id) =>
    set((state) => {
      const next = { ...state, items: state.items.filter((item) => item.id !== id) };
      persist(next);
      return next;
    }),
  updateQuantity: (id, quantity) =>
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
          : item,
      );
      const next = { ...state, items };
      persist(next);
      return next;
    }),
  clear: () =>
    set((state) => {
      const next = { ...state, ...EMPTY_CART };
      persist(next);
      return next;
    }),
  applyCoupon: (code, discountId, amount) =>
    set((state) => {
      const next = { ...state, couponCode: code, discountId, discountAmount: amount };
      persist(next);
      return next;
    }),
  setShippingMethod: (methodId) =>
    set((state) => {
      const next = { ...state, shippingMethodId: methodId };
      persist(next);
      return next;
    }),
  setGiftMessage: (message) =>
    set((state) => {
      const next = { ...state, giftMessage: message };
      persist(next);
      return next;
    }),
  hydrate: () => {
    const stored = readStorage<CartState | null>(STORAGE_KEYS.cart, null);
    set((state) => ({
      ...state,
      ...EMPTY_CART,
      ...(stored && Array.isArray(stored.items) ? stored : {}),
      hydrated: true,
    }));
  },
}));
