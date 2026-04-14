"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { formatCurrency } from "@/lib/utils";
import {
  useCartStore,
  getCartItemKey,
  getCartSubtotal,
  getCartTax,
  getCartTotal,
} from "@/stores/cart-store";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const posthog = usePostHog();
  const subtotal = getCartSubtotal(items);
  const tax = getCartTax(items);
  const total = getCartTotal(items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [storeOpen, setStoreOpen] = useState(true);

  useEffect(() => {
    fetch("/api/menu/availability")
      .then((r) => r.json())
      .then((data) => setUnavailable(data))
      .catch(() => {});
    fetch("/api/store/status")
      .then((r) => r.json())
      .then((data) => setStoreOpen(data.isOpen))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      posthog.capture("cart_viewed", { itemCount, cartTotal: total });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unavailableInCart = items.filter(
    (i) => unavailable[i.menuItemId] === false
  );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header />

      <PageContainer>
        <h1 className="mb-4 text-xl font-bold text-charcoal">Your Cart</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-muted/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
              />
            </svg>
            <p className="text-lg font-medium text-muted">
              Your cart is empty
            </p>
            <Link href="/menu">
              <Button variant="primary">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <>
            {!storeOpen && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Mobile ordering is currently closed</p>
                  <p className="text-xs text-red-600/80">Please check back later to place your order.</p>
                </div>
              </div>
            )}

            {unavailableInCart.length > 0 && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                <p className="font-medium">
                  Some items are no longer available:
                </p>
                <ul className="mt-1 list-disc pl-4">
                  {unavailableInCart.map((item) => (
                    <li key={getCartItemKey(item)}>{item.name}</li>
                  ))}
                </ul>
                <p className="mt-1">
                  Please remove them before checking out.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const key = getCartItemKey(item);
                const lineTotal =
                  (item.price + (item.extrasPrice || 0)) * item.quantity;

                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 rounded-xl border border-border bg-white p-4"
                  >
                    {/* Name, flavors, extras, price */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium text-charcoal">
                        {item.name}
                      </span>
                      {item.flavors && item.flavors.length > 0 && (
                        <span className="text-xs text-muted mt-0.5">
                          {item.flavors.join(", ")}
                        </span>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <span className="text-xs text-brand/70 mt-0.5">
                          + {item.extras.join(", ")}
                        </span>
                      )}
                      <span className="text-sm text-muted mt-0.5">
                        {formatCurrency(item.price + (item.extrasPrice || 0))}
                        {item.extrasPrice
                          ? ` (${formatCurrency(item.price)} + ${formatCurrency(item.extrasPrice)} extras)`
                          : ""}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(key, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:bg-surface active:bg-surface"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 12h-15"
                          />
                        </svg>
                      </button>

                      <span className="w-6 text-center text-sm font-semibold text-charcoal">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          addItem({
                            menuItemId: item.menuItemId,
                            name: item.name,
                            price: item.price,
                            flavors: item.flavors,
                            extras: item.extras,
                            extrasPrice: item.extrasPrice,
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal transition-colors hover:bg-surface active:bg-surface"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(key)}
                      className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-red-500"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-border" />

            {/* Summary */}
            <div className="flex flex-col gap-2 px-1">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-charcoal">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Sticky checkout button */}
            <div className="sticky bottom-16 mt-6 pb-2">
              {!storeOpen ? (
                <Button variant="primary" size="lg" fullWidth disabled>
                  Mobile Ordering is Closed
                </Button>
              ) : unavailableInCart.length > 0 ? (
                <Button variant="primary" size="lg" fullWidth disabled>
                  Remove Unavailable Items to Continue
                </Button>
              ) : (
                <Link href="/checkout">
                  <Button variant="primary" size="lg" fullWidth>
                    Proceed to Checkout
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </PageContainer>

      <BottomNav />
    </div>
  );
}
