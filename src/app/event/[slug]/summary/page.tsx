"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface GuestOrder {
  id: string;
  total: number;
  createdAt: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    flavors?: string[];
    extras?: string[];
  }>;
}

interface Guest {
  name: string;
  phoneNumber: string | null;
  orderCount: number;
  total: number;
  firstAt: string;
  lastAt: string;
  orders: GuestOrder[];
}

interface SummaryResponse {
  event: {
    slug: string;
    name: string;
    brandName: string | null;
    eventDate: string | null;
    paymentMode: "prepaid" | "individual";
    status: string;
  };
  summary: {
    guestCount: number;
    totalOrders: number;
    totalRevenue: number;
    cancelledCount: number;
    cancelledTotal: number;
  };
  guests: Guest[];
}

type AvailabilityState = "checking" | "enabled" | "not-enabled" | "not-found";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function EventSummaryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [availability, setAvailability] = useState<AvailabilityState>("checking");
  const [eventName, setEventName] = useState<string>("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    fetch(`/api/events/${slug}/summary`)
      .then(async (res) => {
        if (res.status === 404) {
          setAvailability("not-found");
          return;
        }
        const payload = await res.json();
        if (payload.enabled) {
          setEventName(payload.eventName);
          setAvailability("enabled");
        } else {
          setEventName(payload.eventName);
          setAvailability("not-enabled");
        }
      })
      .catch(() => setAvailability("not-found"));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${slug}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to load summary");
      }
      const payload: SummaryResponse = await res.json();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (availability === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (availability === "not-found") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-charcoal">This event link is no longer valid.</p>
        <Link href="/" className="mt-3 text-sm text-brand underline">
          Home
        </Link>
      </div>
    );
  }

  if (availability === "not-enabled") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-1 text-lg font-bold text-charcoal">{eventName}</h1>
        <p className="max-w-sm text-sm text-muted">
          Order summary sharing isn&apos;t enabled for this event yet. Ask the
          shop staff to enable it from the event&apos;s settings.
        </p>
      </div>
    );
  }

  // Locked state — PIN form
  if (!data) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-center border-b border-border bg-white px-4">
          <h1 className="truncate text-base font-bold text-charcoal">{eventName}</h1>
        </header>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-center text-lg font-bold text-charcoal">
              Order Summary
            </h2>
            <p className="mt-1 text-center text-sm text-muted">
              Enter the PIN you were given to view what each guest ordered.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <label htmlFor="contact-pin" className="sr-only">
                PIN
              </label>
              <input
                id="contact-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="Enter PIN"
                autoFocus
                aria-invalid={error ? "true" : undefined}
                className={cn(
                  "w-full rounded-xl border bg-surface px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] text-charcoal placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 focus:outline-none focus:ring-1",
                  error
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-border focus:border-brand focus:ring-brand"
                )}
              />
              {error && (
                <p role="alert" className="text-center text-sm text-red-500">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={pin.length < 4}
              >
                View summary
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Unlocked — render the summary
  const display = data.event.brandName || data.event.name;
  const isPrepaid = data.event.paymentMode === "prepaid";
  const totalsLabel = isPrepaid ? "Total covered" : "Total revenue";

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-charcoal">{display}</p>
          <p className="text-xs text-muted">Order summary</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setData(null);
            setPin("");
          }}
          className="text-xs text-muted underline"
        >
          Lock
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">
        {/* Top tiles */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Tile label="Guests" value={data.summary.guestCount} />
          <Tile label="Orders" value={data.summary.totalOrders} />
          <Tile
            label={totalsLabel}
            value={formatCurrency(data.summary.totalRevenue)}
            small
          />
        </div>

        {data.summary.cancelledCount > 0 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {data.summary.cancelledCount} cancelled order
            {data.summary.cancelledCount === 1 ? "" : "s"} excluded ·{" "}
            {formatCurrency(data.summary.cancelledTotal)}
          </p>
        )}

        {data.guests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
            No orders placed yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.guests.map((g, idx) => (
              <GuestCard
                key={`${g.phoneNumber || g.name}-${idx}`}
                guest={g}
                isPrepaid={isPrepaid}
              />
            ))}

            <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-charcoal">
              <span>Total</span>
              <span className="tabular-nums">
                {data.summary.totalOrders} order
                {data.summary.totalOrders === 1 ? "" : "s"} ·{" "}
                {formatCurrency(data.summary.totalRevenue)}
              </span>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          {isPrepaid
            ? "Amounts shown are the menu value of items ordered. The host covers payment for prepaid events."
            : "Amounts shown are what each guest paid at checkout."}
        </p>
      </main>
    </div>
  );
}

function GuestCard({ guest, isPrepaid }: { guest: Guest; isPrepaid: boolean }) {
  const [expanded, setExpanded] = useState(guest.orders.length === 1);

  // Pretty-print phone (10-digit US)
  const phoneFormatted =
    guest.phoneNumber && guest.phoneNumber.length === 10
      ? `(${guest.phoneNumber.slice(0, 3)}) ${guest.phoneNumber.slice(3, 6)}-${guest.phoneNumber.slice(6)}`
      : guest.phoneNumber;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`guest-${guest.phoneNumber || guest.name}-items`}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/40"
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-charcoal">{guest.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            {phoneFormatted && <span>{phoneFormatted}</span>}
            <span>&middot;</span>
            <span>
              {guest.orderCount} order{guest.orderCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-base font-bold tabular-nums text-charcoal">
            {formatCurrency(guest.total)}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "h-4 w-4 text-muted transition-transform",
              expanded && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div
          id={`guest-${guest.phoneNumber || guest.name}-items`}
          className="border-t border-border bg-surface/40 px-4 py-3"
        >
          <ol className="flex flex-col gap-3">
            {guest.orders.map((order, oi) => (
              <li key={order.id} className="text-sm">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>
                    Order {oi + 1} of {guest.orders.length} &middot;{" "}
                    {formatDate(order.createdAt)}
                  </span>
                  {!isPrepaid && (
                    <span className="font-medium text-charcoal tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-1">
                  {order.items.map((item, ii) => (
                    <li key={ii} className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-charcoal">
                          <span className="font-medium">{item.quantity}×</span> {item.name}
                        </p>
                        {item.flavors && item.flavors.length > 0 && (
                          <p className="text-xs text-muted">
                            {item.flavors.join(", ")}
                          </p>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-brand/70">
                            + {item.extras.join(", ")}
                          </p>
                        )}
                      </div>
                      {!isPrepaid && (
                        <span className="shrink-0 text-xs text-muted tabular-nums">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "font-bold leading-tight text-charcoal",
          small ? "text-base" : "text-2xl"
        )}
      >
        {value}
      </p>
    </div>
  );
}
