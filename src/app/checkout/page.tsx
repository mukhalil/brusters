"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  useCartStore,
  getCartTotalItems,
  getCartSubtotal,
  getCartTax,
  getCartTotal,
} from "@/stores/cart-store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type LocationMethod = "gps" | "car" | null;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  const posthog = usePostHog();
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (items.length > 0) {
      posthog.capture("checkout_started", {
        itemCount: totalItems,
        cartTotal: total,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(null);
  const [carDescription, setCarDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalItems = getCartTotalItems(items);
  const subtotal = getCartSubtotal(items);
  const tax = getCartTax(items);
  const total = getCartTotal(items);

  const locationReady =
    (locationMethod === "gps" && location !== null) ||
    (locationMethod === "car" && carDescription.trim() !== "");

  const canSubmit =
    customerName.trim() !== "" && locationReady && items.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        customerName: customerName.trim(),
        locationType: locationMethod,
        latitude: locationMethod === "gps" ? location?.lat : undefined,
        longitude: locationMethod === "gps" ? location?.lng : undefined,
        carDescription: locationMethod === "car" ? carDescription.trim() : undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to place order");
      }

      const order = await res.json();
      posthog.capture("order_placed", {
        orderId: order.id,
        total,
        itemCount: totalItems,
        locationType: locationMethod,
      });
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
          <Link
            href="/cart"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold text-charcoal">
            Checkout
          </h1>
          <div className="w-11" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <p className="text-muted">Your cart is empty</p>
          <Link href="/menu">
            <Button variant="primary">Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <Link
          href="/cart"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-charcoal">
          Checkout
        </h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-32">
        {/* Order Summary */}
        <section className="mb-5">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium text-charcoal">
                Order Summary
              </p>
              <p className="text-sm text-muted">
                {totalItems} {totalItems === 1 ? "item" : "items"} &middot;{" "}
                {formatCurrency(total)}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cn(
                "h-5 w-5 text-muted transition-transform",
                summaryExpanded && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {summaryExpanded && (
            <div className="mt-1 rounded-xl border border-border bg-white p-4">
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-charcoal">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-muted">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 border-t border-border pt-2">
                  <div className="flex justify-between text-sm text-muted">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted">
                    <span>Tax (6%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm font-bold text-charcoal">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Customer Name */}
        <section className="mb-5">
          <label
            htmlFor="customer-name"
            className="mb-2 block text-sm font-semibold text-charcoal"
          >
            What&apos;s your name?
          </label>
          <input
            id="customer-name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </section>

        {/* Location Method */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-semibold text-charcoal">
            How should we find you?
          </p>

          <div className="flex flex-col gap-3">
            {/* GPS option */}
            <button
              onClick={() => {
                setLocationMethod("gps");
                posthog.capture("location_method_selected", { method: "gps" });
                if (!location && !geoLoading) {
                  requestLocation();
                }
              }}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                locationMethod === "gps"
                  ? "border-brand bg-white ring-1 ring-brand"
                  : "border-border bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    locationMethod === "gps"
                      ? "border-brand"
                      : "border-muted/40"
                  )}
                >
                  {locationMethod === "gps" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-charcoal">
                    Share My Location
                  </p>
                  <p className="text-sm text-muted">
                    We&apos;ll use GPS to find you
                  </p>
                </div>
              </div>

              {locationMethod === "gps" && (
                <div className="mt-3 pl-8">
                  {geoLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <LoadingSpinner size="sm" />
                      <span>Getting your location...</span>
                    </div>
                  )}
                  {location && !geoLoading && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
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
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span>Location shared</span>
                    </div>
                  )}
                  {geoError && !geoLoading && (
                    <p className="text-sm text-red-500">{geoError}</p>
                  )}
                </div>
              )}
            </button>

            {/* Car description option */}
            <button
              onClick={() => {
                setLocationMethod("car");
                posthog.capture("location_method_selected", { method: "car" });
              }}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                locationMethod === "car"
                  ? "border-brand bg-white ring-1 ring-brand"
                  : "border-border bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    locationMethod === "car"
                      ? "border-brand"
                      : "border-muted/40"
                  )}
                >
                  {locationMethod === "car" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-charcoal">
                    Describe Your Car
                  </p>
                  <p className="text-sm text-muted">
                    Tell us what to look for
                  </p>
                </div>
              </div>
            </button>

            {locationMethod === "car" && (
              <div className="flex flex-col gap-3 pl-0">
                <input
                  type="text"
                  value={carDescription}
                  onChange={(e) => setCarDescription(e.target.value)}
                  placeholder="Car make, model, and color"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Additional details to help us find you"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-charcoal placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}
          </div>
        </section>

        {submitError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {submitError}
          </div>
        )}
      </main>

      {/* Sticky Place Order button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Place Order &middot; {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
