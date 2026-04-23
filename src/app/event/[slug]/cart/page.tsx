"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  useEventCartStore,
  getEventCartItemKey,
  getEventCartSubtotal,
} from "@/stores/event-cart-store";
import { EventHeader } from "@/components/event/event-header";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Event } from "@/types/event";

export default function EventCartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const ensureSlug = useEventCartStore((s) => s.ensureSlug);
  const items = useEventCartStore((s) => s.items);
  const addItem = useEventCartStore((s) => s.addItem);
  const updateQuantity = useEventCartStore((s) => s.updateQuantity);
  const removeItem = useEventCartStore((s) => s.removeItem);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSlug(slug);
    fetch(`/api/events/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) setEvent(p.event);
        setLoading(false);
      });
  }, [slug, ensureSlug]);

  if (loading || !event) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const subtotal = getEventCartSubtotal(items);
  const isPrepaid = event.paymentMode === "prepaid";

  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-24">
      <EventHeader event={event} backHref={`/event/${slug}/menu`} showCart={false} />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-charcoal">Your order</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted">Your cart is empty</p>
            <Link href={`/event/${slug}/menu`}>
              <Button variant="primary">Browse menu</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const key = getEventCartItemKey(item);
                const lineTotal =
                  (item.price + (item.extrasPrice || 0)) * item.quantity;
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 rounded-xl border border-border bg-white p-4"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium text-charcoal">{item.name}</span>
                      {item.flavors && item.flavors.length > 0 && (
                        <span className="mt-0.5 text-xs text-muted">
                          {item.flavors.join(", ")}
                        </span>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <span className="mt-0.5 text-xs text-brand/70">
                          + {item.extras.join(", ")}
                        </span>
                      )}
                      {!isPrepaid && (
                        <span className="mt-0.5 text-sm text-muted">
                          {formatCurrency(lineTotal)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
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
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(key)}
                      aria-label="Remove"
                      className="flex h-8 w-8 items-center justify-center text-muted hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {!isPrepaid && (
              <>
                <div className="my-4 border-t border-border" />
                <div className="flex justify-between text-base font-bold text-charcoal">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </>
            )}

            <div className="mt-6">
              <Link href={`/event/${slug}/checkout`}>
                <Button variant="primary" size="lg" fullWidth>
                  {isPrepaid ? "Place order" : "Continue to checkout"}
                </Button>
              </Link>
            </div>

            {event.maxOrdersPerGuest != null && (
              <p className="mt-3 text-center text-xs text-muted">
                Limit: {event.maxOrdersPerGuest} order
                {event.maxOrdersPerGuest === 1 ? "" : "s"} per guest at this event
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
