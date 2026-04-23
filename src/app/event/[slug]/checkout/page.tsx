"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import {
  useEventCartStore,
  getEventCartSubtotal,
} from "@/stores/event-cart-store";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  SquareCardForm,
  type SquareCardFormHandle,
} from "@/components/checkout/square-card-form";
import type { Event } from "@/types/event";

export default function EventCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const ensureSlug = useEventCartStore((s) => s.ensureSlug);
  const items = useEventCartStore((s) => s.items);
  const clearCart = useEventCartStore((s) => s.clearCart);
  const isSquarePayment = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === "square";

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const cardFormRef = useRef<SquareCardFormHandle>(null);

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

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Your cart is empty</p>
        <Link href={`/event/${slug}/menu`}>
          <Button variant="primary">Browse menu</Button>
        </Link>
      </div>
    );
  }

  const isPrepaid = event.paymentMode === "prepaid";
  const subtotal = getEventCartSubtotal(items);
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 10;
  const needsCard = !isPrepaid && isSquarePayment;
  const canSubmit =
    !!customerName.trim() && phoneOk && (!needsCard || cardReady);

  async function submit(paymentNonce?: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = {
        customerName: customerName.trim(),
        phoneNumber: phoneDigits,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          flavors: i.flavors,
          extras: i.extras,
        })),
        paymentNonce,
      };
      const res = await fetch(`/api/events/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to place order");
      }
      const order = await res.json();
      clearCart();
      router.push(`/event/${slug}/order/${order.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    let paymentNonce: string | undefined;
    if (needsCard) {
      try {
        const result = await cardFormRef.current?.tokenize();
        paymentNonce = result?.token;
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Card verification failed");
        return;
      }
    }
    await submit(paymentNonce);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-32">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <Link
          href={`/event/${slug}/cart`}
          aria-label="Back"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-charcoal">
          {isPrepaid ? "Place order" : "Checkout"}
        </h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <section className="mb-5 rounded-xl border border-border bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-charcoal">Your order</p>
          <div className="flex flex-col gap-1.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-charcoal">
                  {item.quantity}x {item.name}
                </span>
                {!isPrepaid && (
                  <span className="text-muted">
                    {formatCurrency(
                      (item.price + (item.extrasPrice || 0)) * item.quantity
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
          {!isPrepaid && (
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold text-charcoal">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          )}
          {isPrepaid && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              Covered by the host — no payment needed.
            </div>
          )}
        </section>

        <section className="mb-5">
          <label htmlFor="guest-name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Your name
          </label>
          <input
            id="guest-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="First name"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </section>

        <section className="mb-5">
          <label htmlFor="guest-phone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Mobile number
          </label>
          <input
            id="guest-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              let formatted = digits;
              if (digits.length > 6) {
                formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
              } else if (digits.length > 3) {
                formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
              } else if (digits.length > 0) {
                formatted = `(${digits}`;
              }
              setPhoneNumber(formatted);
            }}
            placeholder="(555) 123-4567"
            className={cn(
              "w-full rounded-xl border bg-white px-4 py-3 text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-1",
              phoneNumber.length > 0 && !phoneOk
                ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                : phoneOk
                  ? "border-green-300 focus:border-green-400 focus:ring-green-200"
                  : "border-border focus:border-brand focus:ring-brand"
            )}
          />
          <p className="mt-1.5 text-xs text-muted">
            We&apos;ll text you when your order is ready for pickup.
          </p>
        </section>

        {event.maxOrdersPerGuest != null && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Limit: {event.maxOrdersPerGuest} order
            {event.maxOrdersPerGuest === 1 ? "" : "s"} per guest. Orders are tracked by phone number.
          </p>
        )}

        {needsCard && (
          <section className="mb-5">
            <p className="mb-2 text-sm font-semibold text-charcoal">Payment</p>
            <div className="rounded-xl border border-border bg-white p-4">
              <SquareCardForm
                ref={cardFormRef}
                onReady={() => setCardReady(true)}
                onError={(msg) => setSubmitError(msg)}
                onApplePayToken={(t) => submit(t)}
                totalAmount={subtotal.toFixed(2)}
              />
            </div>
          </section>
        )}

        {submitError && (
          <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isPrepaid
              ? "Place order"
              : `Place order · ${formatCurrency(subtotal)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
