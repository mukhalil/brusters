"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  SquareCardForm,
  type SquareCardFormHandle,
} from "@/components/checkout/square-card-form";

type LocationMethod = "gps" | "car" | "counter" | null;

const CAR_COLORS = [
  { name: "White", hex: "#FFFFFF", border: "border-gray-300" },
  { name: "Black", hex: "#1a1a1a", border: "border-gray-700" },
  { name: "Silver", hex: "#C0C0C0", border: "border-gray-400" },
  { name: "Gray", hex: "#6B7280", border: "border-gray-500" },
  { name: "Red", hex: "#DC2626", border: "border-red-400" },
  { name: "Blue", hex: "#2563EB", border: "border-blue-400" },
  { name: "Green", hex: "#16A34A", border: "border-green-400" },
  { name: "Brown", hex: "#92400E", border: "border-amber-700" },
  { name: "Gold", hex: "#D4A017", border: "border-yellow-500" },
  { name: "Orange", hex: "#EA580C", border: "border-orange-400" },
] as const;

const CAR_TYPES = [
  { label: "Sedan",       emoji: "🚗" },
  { label: "SUV",         emoji: "🚙" },
  { label: "Truck",       emoji: "🛻" },
  { label: "Van",         emoji: "🚐" },
  { label: "Hatchback",   emoji: "🚘" },
  { label: "Coupe",       emoji: "🏎️" },
  { label: "Convertible", emoji: "🚗" },
  { label: "Crossover",   emoji: "🚙" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  const posthog = usePostHog();
  const isSquarePayment = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === "square";
  const cardFormRef = useRef<SquareCardFormHandle>(null);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (items.length > 0) {
      posthog.capture("checkout_started", {
        itemCount: totalItems,
        cartTotal: total,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [deliveryMode, setDeliveryMode] = useState<"curbside" | "counter" | null>(null);
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(null);
  const [carColor, setCarColor] = useState<string | null>(null);
  const [carType, setCarType] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalItems = getCartTotalItems(items);
  const subtotal = getCartSubtotal(items);
  const tax = getCartTax(items);
  const total = getCartTotal(items);

  // Build car description from visual selections
  const carDescription = [carColor, carType].filter(Boolean).join(" ");

  const locationReady =
    (locationMethod === "gps" && location !== null) ||
    (locationMethod === "car" && carColor !== null && carType !== null) ||
    (locationMethod === "counter" && phoneNumber.replace(/\D/g, "").length === 10);

  const canSubmit =
    customerName.trim() !== "" &&
    locationReady &&
    items.length > 0 &&
    (!isSquarePayment || cardReady);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Tokenize card if Square is active
      let paymentNonce: string | undefined;
      if (isSquarePayment) {
        if (!cardFormRef.current) {
          setSubmitError("Payment form not ready. Please wait.");
          setSubmitting(false);
          return;
        }
        const tokenResult = await cardFormRef.current.tokenize();
        paymentNonce = tokenResult.token;
      }

      const body = {
        customerName: customerName.trim(),
        locationType: locationMethod,
        latitude: locationMethod === "gps" ? location?.lat : undefined,
        longitude: locationMethod === "gps" ? location?.lng : undefined,
        carDescription: locationMethod === "car" ? carDescription.trim() : undefined,
        phoneNumber: locationMethod === "counter" ? phoneNumber.trim() : undefined,
        paymentNonce,
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
                    <span>Tax (10.5%)</span>
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
            How would you like your order?
          </p>

          <div className="flex flex-col gap-3">
            {/* Curbside delivery option */}
            <button
              onClick={() => {
                setDeliveryMode("curbside");
                if (locationMethod === "counter") setLocationMethod(null);
                posthog.capture("location_method_selected", { method: "curbside" });
              }}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                deliveryMode === "curbside"
                  ? "border-brand bg-white ring-1 ring-brand"
                  : "border-border bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    deliveryMode === "curbside"
                      ? "border-brand"
                      : "border-muted/40"
                  )}
                >
                  {deliveryMode === "curbside" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-charcoal">
                    Deliver to My Car
                  </p>
                  <p className="text-sm text-muted">
                    We&apos;ll bring it right to you
                  </p>
                </div>
              </div>
            </button>

            {/* Curbside sub-options */}
            {deliveryMode === "curbside" && (
              <div className="flex flex-col gap-3 pl-4">
                {/* GPS sub-option */}
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
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-sm text-red-600 leading-snug">{geoError}</p>
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Car description sub-option */}
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
              </div>
            )}

            {/* Counter pickup option */}
            <button
              onClick={() => {
                setDeliveryMode("counter");
                setLocationMethod("counter");
                posthog.capture("location_method_selected", { method: "counter" });
              }}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                deliveryMode === "counter"
                  ? "border-brand bg-white ring-1 ring-brand"
                  : "border-border bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    deliveryMode === "counter"
                      ? "border-brand"
                      : "border-muted/40"
                  )}
                >
                  {deliveryMode === "counter" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-charcoal">
                    Counter Pickup
                  </p>
                  <p className="text-sm text-muted">
                    Order ahead, skip the line
                  </p>
                </div>
              </div>
            </button>

            {deliveryMode === "counter" && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
                <div>
                  <label
                    htmlFor="phone-number"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Auto-format as US number: (XXX) XXX-XXXX
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
                      "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:ring-1",
                      phoneNumber.length > 0 && phoneNumber.replace(/\D/g, "").length < 10
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : phoneNumber.replace(/\D/g, "").length === 10
                          ? "border-green-300 focus:border-green-400 focus:ring-green-200"
                          : "border-border focus:border-brand focus:ring-brand"
                    )}
                  />
                  {phoneNumber.length > 0 && phoneNumber.replace(/\D/g, "").length < 10 && (
                    <p className="mt-1 text-xs text-red-500">
                      Please enter a valid 10-digit US phone number
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted">
                    We&apos;ll text you when your order is ready. By providing your number, you consent to receive a one-time SMS notification about this order. Standard messaging rates may apply.
                  </p>
                </div>
              </div>
            )}

            {locationMethod === "car" && (
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4">
                {/* Color picker */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CAR_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setCarColor(c.name)}
                        className={cn(
                          "flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all",
                          carColor === c.name
                            ? "border-brand ring-2 ring-brand/30 bg-white"
                            : "border-border bg-surface text-charcoal"
                        )}
                        aria-label={c.name}
                      >
                        <span
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full border",
                            c.border
                          )}
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle type */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Vehicle type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CAR_TYPES.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setCarType(t.label)}
                        className={cn(
                          "h-11 rounded-full border px-4 text-sm font-medium transition-all flex items-center gap-1.5",
                          carType === t.label
                            ? "border-brand bg-brand text-white"
                            : "border-border bg-surface text-charcoal"
                        )}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {carColor && carType && (
                  <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-charcoal">
                      {carColor} {carType}
                    </span>
                  </div>
                )}

                {/* Optional notes */}
                <div>
                  <input
                    type="text"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Anything else? (e.g. &quot;near the sign&quot;)"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Payment - only shown when Square is active */}
        {isSquarePayment && (
          <section className="mb-5">
            <p className="mb-2 text-sm font-semibold text-charcoal">
              Payment
            </p>
            <div className="rounded-xl border border-border bg-white p-4">
              <SquareCardForm
                ref={cardFormRef}
                onReady={() => setCardReady(true)}
                onError={(msg) => setCardError(msg)}
              />
              {cardError && (
                <p className="mt-2 text-sm text-red-600">{cardError}</p>
              )}
            </div>
          </section>
        )}

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
