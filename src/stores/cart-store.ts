"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
import { TAX_RATE } from "@/lib/menu-data";

// Generate a unique key for a customized item (same item + same flavors + same extras = same line)
function getCartItemKey(item: Omit<CartItem, "quantity">): string {
  const flavors = item.flavors ? [...item.flavors].sort().join(",") : "";
  const extras = item.extras ? [...item.extras].sort().join(",") : "";
  return `${item.menuItemId}|${flavors}|${extras}`;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = getCartItemKey(item);
          const existing = state.items.find(
            (i) => getCartItemKey(i) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                getCartItemKey(i) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => getCartItemKey(i) !== key),
        })),
      updateQuantity: (key, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => getCartItemKey(i) !== key),
            };
          }
          return {
            items: state.items.map((i) =>
              getCartItemKey(i) === key ? { ...i, quantity } : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "brusters-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Export key generator so components can use it
export { getCartItemKey };

// Selector helpers (call these from components)
export function getCartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.price + (item.extrasPrice || 0)) * item.quantity,
    0
  );
}

export function getCartTax(items: CartItem[]): number {
  return getCartSubtotal(items) * TAX_RATE;
}

export function getCartTotal(items: CartItem[]): number {
  const subtotal = getCartSubtotal(items);
  return subtotal + subtotal * TAX_RATE;
}
