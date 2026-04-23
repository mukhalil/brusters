"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";

function getKey(item: Omit<CartItem, "quantity">): string {
  const flavors = item.flavors ? [...item.flavors].sort().join(",") : "";
  const extras = item.extras ? [...item.extras].sort().join(",") : "";
  return `${item.menuItemId}|${flavors}|${extras}`;
}

interface EventCartState {
  slug: string | null;
  items: CartItem[];
  ensureSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

export const useEventCartStore = create<EventCartState>()(
  persist(
    (set) => ({
      slug: null,
      items: [],
      // If we navigate to a different event's slug, wipe the cart so items don't bleed across events.
      ensureSlug: (slug) =>
        set((state) => {
          if (state.slug === slug) return state;
          return { slug, items: [] };
        }),
      addItem: (item) =>
        set((state) => {
          const key = getKey(item);
          const existing = state.items.find((i) => getKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                getKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => getKey(i) !== key),
        })),
      updateQuantity: (key, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => getKey(i) !== key) };
          }
          return {
            items: state.items.map((i) =>
              getKey(i) === key ? { ...i, quantity } : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "brusters-event-cart",
      partialize: (state) => ({ slug: state.slug, items: state.items }),
    }
  )
);

export { getKey as getEventCartItemKey };

export function getEventCartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function getEventCartSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, i) => sum + (i.price + (i.extrasPrice || 0)) * i.quantity,
    0
  );
}
