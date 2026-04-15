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

  // Step 1 or Step 2
  const [step, setStep] = useState<1 | 2>(1);

  const [customerName, setCustomerName] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"curbside" | "counter" | null>(null);
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(null);
  const [carColor, setCarColor] = useState<string | null>(null);
  const [carType, setCarType] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(true);

  const totalItems = getCartTotalItems(items);
  const subtotal = getCartSubtotal(items);
  const total = getCartTotal(items);

  useEffect(() => {
    if (items.length > 0) {
      posthog.capture("checkout_started", {
        itemCount: totalItems,
        cartTotal: total,
      });
    }
    fetch("/api/store/status")
      .then((r) => r.json())
      .then((data) => setStoreOpen(data.isOpen))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build car description from visual selections
  const carDescription = [carColor, carType].filter(Boolean).join(" ");

  const phoneReady = phoneNumber.replace(/\D/g, "").length === 10;
  const carReady = carColor !== null && carType !== null;
  const locationReady =
    (deliveryMode === "curbside" && carReady && phoneReady) ||
    (locationMethod === "counter" && phoneReady);

  // Step 1 gating: name + delivery + phone must be complete + store open
  const canProceedToPayment =
    storeOpen &&
    customerName.trim() !== "" &&
    locationReady &&
    items.length > 0;

  // Step 2 gating: additionally need card ready if using Square
  const canSubmit = canProceedToPayment && (!isSquarePayment || cardReady);

  async function submitOrder(paymentNonce?: string) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // For curbside, send car description always; send GPS coords if shared
      const isCurbside = deliveryMode === "curbside";
      const body = {
        customerName: customerName.trim(),
        locationType: location ? "gps" : (isCurbside ? "car" : "counter"),
        latitude: location?.lat ?? undefined,
        longitude: location?.lng ?? undefined,
        carDescription: isCurbside ? carDescription.trim() : undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        paymentNonce,
        additionalNotes: additionalNotes.trim() || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          flavors: i.flavors,
          extras: i.extras,
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

  // Called when user taps "Place Order" — tokenizes card first
  async function handleSubmit() {
    if (!canSubmit) return;

    let paymentNonce: string | undefined;
    if (isSquarePayment) {
      if (!cardFormRef.current) {
        setSubmitError("Payment form not ready. Please wait.");
        return;
      }
      try {
        const tokenResult = await cardFormRef.current.tokenize();
        paymentNonce = tokenResult.token;
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Card verification failed"
        );
        return;
      }
    }

    await submitOrder(paymentNonce);
  }

  // Called when Apple Pay completes — token already obtained, submit immediately
  async function handleApplePayToken(token: string) {
    await submitOrder(token);
  }

  function handleContinueToPayment() {
    if (!canProceedToPayment) return;
    posthog.capture("checkout_step1_completed", {
      locationType: locationMethod,
    });
    setStep(2);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Human-readable delivery summary for Step 2 recap
  function deliverySummary() {
    if (locationMethod === "counter") return "Counter Pickup";
    if (deliveryMode === "curbside") {
      const parts = [`Curbside · ${carDescription}`];
      if (location) parts.push("+ GPS");
      return parts.join(" ");
    }
    return "";
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
          <Link
            href="/cart"
            aria-label="Back to cart"
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
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <button
          onClick={() => {
            if (step === 2) {
              setStep(1);
              setCardReady(false);
              setCardError(null);
              setSubmitError(null);
            } else {
              router.push("/cart");
            }
          }}
          aria-label={step === 2 ? "Back to details" : "Back to cart"}
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
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-charcoal">
          {step === 1 ? "Your Details" : "Payment"}
        </h1>
        <div className="w-11" />
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 border-b border-border bg-white px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
            step === 1 ? "bg-brand text-white" : "bg-green-500 text-white"
          )}>
            {step === 2 ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : "1"}
          </div>
          <span className={cn(
            "text-xs font-medium",
            step === 1 ? "text-charcoal" : "text-muted"
          )}>Details</span>
        </div>
        <div className="h-px w-6 bg-border" />
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
            step === 2 ? "bg-brand text-white" : "bg-surface border border-border text-muted"
          )}>
            2
          </div>
          <span className={cn(
            "text-xs font-medium",
            step === 2 ? "text-charcoal" : "text-muted"
          )}>Payment</span>
        </div>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-32">
          {/* Store closed banner */}
          {!storeOpen && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">Mobile ordering is currently closed</p>
                <p className="text-xs text-red-600/80">Orders cannot be placed right now. Please try again later.</p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <section className="mb-5">
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              aria-expanded={summaryExpanded}
              aria-label="Toggle order summary"
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

          {/* Phone Number */}
          <section className="mb-5">
            <label
              htmlFor="phone-number"
              className="mb-2 block text-sm font-semibold text-charcoal"
            >
              Phone number
            </label>
            <input
              id="phone-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-describedby="phone-error phone-help"
              aria-invalid={phoneNumber.length > 0 && phoneNumber.replace(/\D/g, "").length < 10 ? "true" : undefined}
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
                phoneNumber.length > 0 && phoneNumber.replace(/\D/g, "").length < 10
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : phoneNumber.replace(/\D/g, "").length === 10
                    ? "border-green-300 focus:border-green-400 focus:ring-green-200"
                    : "border-border focus:border-brand focus:ring-brand"
              )}
            />
            {phoneNumber.length > 0 && phoneNumber.replace(/\D/g, "").length < 10 && (
              <p id="phone-error" role="alert" className="mt-1 text-xs text-red-500">
                Please enter a valid 10-digit US phone number
              </p>
            )}
            <p id="phone-help" className="mt-1.5 text-xs text-muted">
              We&apos;ll text you when your order is ready. By providing your number, you consent to receive a one-time SMS notification about this order. Standard messaging rates may apply. See our{" "}
              <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* Delivery Method */}
          <section className="mb-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-charcoal">
                How would you like your order?
              </legend>

              <div role="radiogroup" aria-label="Delivery method" className="flex flex-col gap-3">
                {/* ── Deliver to My Car ── */}
                <div
                  className={cn(
                    "rounded-xl border overflow-hidden transition-colors",
                    deliveryMode === "curbside"
                      ? "border-brand bg-white ring-1 ring-brand"
                      : "border-border bg-white"
                  )}
                >
                  <button
                    role="radio"
                    aria-checked={deliveryMode === "curbside"}
                    onClick={() => {
                      setDeliveryMode("curbside");
                      setLocationMethod("car");
                      posthog.capture("location_method_selected", { method: "curbside" });
                    }}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-lg" aria-hidden="true">
                      🚗
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-charcoal">
                        Deliver to My Car
                      </p>
                      <p className="text-sm text-muted">
                        We&apos;ll bring it right to you
                      </p>
                    </div>
                  </button>

                  {/* Vehicle info + optional GPS — shown when curbside selected */}
                  {deliveryMode === "curbside" && (
                    <div className="border-t border-border bg-surface/50 px-4 pb-4 pt-3 flex flex-col gap-4">
                      {/* Car color picker */}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          Vehicle color
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
                                  : "border-border bg-white text-charcoal"
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

                      {/* Vehicle type picker */}
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
                                  : "border-border bg-white text-charcoal"
                              )}
                            >
                              <span>{t.emoji}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Vehicle preview */}
                      {carColor && carType && (
                        <div className="flex items-center gap-2 rounded-lg bg-white border border-border px-3 py-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span className="text-sm text-charcoal">
                            {carColor} {carType}
                          </span>
                        </div>
                      )}

                      {/* Optional GPS share */}
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!location && !geoLoading) {
                              requestLocation();
                              posthog.capture("location_method_selected", { method: "gps" });
                            }
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                            location
                              ? "border-green-300 bg-green-50"
                              : "border-border bg-white"
                          )}
                        >
                          <span className="text-base" aria-hidden="true">📍</span>
                          <div className="flex-1">
                            {geoLoading ? (
                              <div className="flex items-center gap-2 text-sm text-muted">
                                <LoadingSpinner size="sm" />
                                <span>Getting your location...</span>
                              </div>
                            ) : location ? (
                              <span className="text-sm font-medium text-green-700">GPS location shared</span>
                            ) : (
                              <div>
                                <span className="text-sm font-medium text-charcoal">Share GPS location</span>
                                <span className="ml-1 text-xs text-muted">(optional)</span>
                              </div>
                            )}
                          </div>
                        </button>
                        {geoError && !geoLoading && (
                          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-sm text-red-600 leading-snug">{geoError}</p>
                          </div>
                        )}
                      </div>

                      {/* Optional notes */}
                      <div>
                        <label htmlFor="additional-notes" className="sr-only">Additional notes (optional)</label>
                        <input
                          id="additional-notes"
                          type="text"
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          placeholder="Anything else? (e.g. &quot;near the sign&quot;)"
                          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Counter Pickup ── */}
                <button
                  role="radio"
                  aria-checked={deliveryMode === "counter"}
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
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-lg" aria-hidden="true">
                      🏪
                    </span>
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
              </div>
            </fieldset>
          </section>

        </main>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-32">
          {/* Order recap */}
          <section className="mb-5 rounded-xl border border-border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-charcoal">Order Summary</p>
            <div className="flex flex-col gap-1.5">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex justify-between text-sm">
                  <span className="text-charcoal">{item.quantity}x {item.name}</span>
                  <span className="text-muted">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3 flex justify-between text-sm font-bold text-charcoal">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="mt-3 border-t border-border pt-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span>{customerName.trim()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{deliverySummary()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>{phoneNumber}</span>
              </div>
            </div>
          </section>

          {/* Payment form */}
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
                  onApplePayToken={handleApplePayToken}
                  totalAmount={total.toFixed(2)}
                />
                {cardError && (
                  <p className="mt-2 text-sm text-red-600">{cardError}</p>
                )}
              </div>
            </section>
          )}

          {submitError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {submitError}
            </div>
          )}
        </main>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          {step === 1 ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canProceedToPayment}
              onClick={handleContinueToPayment}
            >
              Continue to Payment
            </Button>
          ) : (
            <>
              <p className="mb-2 text-center text-[11px] leading-tight text-muted">
                By placing this order, you agree to our{" "}
                <Link href="/terms" className="text-brand underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.
              </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
