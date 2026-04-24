"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Guest {
  name: string;
  phoneNumber: string | null;
  orderCount: number;
  total: number;
  firstAt: string;
  lastAt: string;
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
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-3 py-2.5">Guest</th>
                  <th className="px-3 py-2.5 text-right">Orders</th>
                  <th className="px-3 py-2.5 text-right">{isPrepaid ? "Value" : "Total"}</th>
                </tr>
              </thead>
              <tbody>
                {data.guests.map((g, idx) => (
                  <tr
                    key={`${g.phoneNumber || g.name}-${idx}`}
                    className={cn(idx % 2 === 1 && "bg-surface/50")}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-charcoal">{g.name}</p>
                      {g.phoneNumber && (
                        <p className="text-xs text-muted">
                          {g.phoneNumber.length === 10
                            ? `(${g.phoneNumber.slice(0, 3)}) ${g.phoneNumber.slice(3, 6)}-${g.phoneNumber.slice(6)}`
                            : g.phoneNumber}
                        </p>
                      )}
                      <p className="text-[10px] text-muted/70">
                        {g.orderCount === 1
                          ? formatDate(g.firstAt)
                          : `${formatDate(g.firstAt)} → ${formatDate(g.lastAt)}`}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-charcoal">
                      {g.orderCount}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-charcoal">
                      {formatCurrency(g.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface text-sm font-bold text-charcoal">
                  <td className="px-3 py-3">Total</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {data.summary.totalOrders}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatCurrency(data.summary.totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
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
