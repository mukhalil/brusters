"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { QRCodeDisplay } from "@/components/staff/qr-code";
import { StaffBottomNav } from "@/components/staff/staff-bottom-nav";
import {
  EventForm,
  initialValues,
  valuesToBody,
  type EventFormValues,
} from "@/components/staff/event-form";
import {
  STATUS_LABELS,
  getStatusFlow,
  getNextStatusAction,
  type OrderStatus,
  type Order,
} from "@/types/order";
import type { Event } from "@/types/event";

interface EventDetailData {
  event: Event;
  stats: {
    ordersPlaced: number;
    ordersReady: number;
    ordersCompleted: number;
    revenue: number;
  };
}

function getNextStatus(current: OrderStatus, locationType: string): OrderStatus | null {
  const flow = getStatusFlow(locationType);
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

const STATUS_BADGE: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function StaffEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [staffPin, setStaffPin] = useState<string | null>(null);
  const [tab, setTab] = useState<"queue" | "settings" | "qr">("queue");
  const [data, setData] = useState<EventDetailData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [formValue, setFormValue] = useState<EventFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    const pin = sessionStorage.getItem("staff-pin");
    if (!pin) {
      router.push("/staff");
      return;
    }
    setStaffPin(pin);
  }, [router]);

  const fetchEvent = useCallback(async () => {
    if (!staffPin) return;
    try {
      const res = await fetch(`/api/staff/events/${id}`, {
        headers: { "x-staff-pin": staffPin },
      });
      if (res.ok) {
        const payload: EventDetailData = await res.json();
        setData(payload);
        setFormValue((prev) => prev ?? initialValues(payload.event));
      }
    } finally {
      setLoading(false);
    }
  }, [staffPin, id]);

  const fetchOrders = useCallback(async () => {
    if (!staffPin) return;
    try {
      const res = await fetch(`/api/staff/events/${id}/orders`, {
        headers: { "x-staff-pin": staffPin },
      });
      if (res.ok) {
        const rows = await res.json();
        setOrders(rows);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [staffPin, id]);

  useEffect(() => {
    if (!staffPin) return;
    fetchEvent();
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
      fetchEvent();
    }, 5000);
    return () => clearInterval(interval);
  }, [staffPin, fetchEvent, fetchOrders]);

  async function advanceOrder(order: Order, next: OrderStatus) {
    if (!staffPin) return;
    await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-staff-pin": staffPin,
      },
      body: JSON.stringify({ status: next }),
    });
    fetchOrders();
  }

  async function saveEvent() {
    if (!staffPin || !formValue) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/staff/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-staff-pin": staffPin,
        },
        body: JSON.stringify(valuesToBody(formValue)),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Failed to save");
      }
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1800);
      fetchEvent();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!staffPin) return null;
  if (loading || !data || !formValue) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const event = data.event;
  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/event/${event.slug}`
      : `/event/${event.slug}`;
  const name = event.brandName || event.name;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-3">
        <Link
          href="/staff/events"
          aria-label="Back"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex flex-1 flex-col items-center leading-tight">
          <span className="truncate max-w-[220px] text-sm font-bold text-charcoal">{name}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted">
            {event.status}
          </span>
        </div>
        <div className="w-11" />
      </header>

      {/* Tab bar */}
      <div className="sticky top-14 z-40 flex justify-center gap-1 border-b border-border bg-white px-3 py-2">
        {(
          [
            { id: "queue", label: `Queue (${data.stats.ordersPlaced - data.stats.ordersCompleted})` },
            { id: "qr", label: "QR code" },
            { id: "settings", label: "Settings" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-brand text-white"
                : "bg-surface text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-28">
        {tab === "queue" && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <StatTile label="Placed" value={data.stats.ordersPlaced} />
              <StatTile label="Ready" value={data.stats.ordersReady} accent="green" />
              <StatTile label="Done" value={data.stats.ordersCompleted} />
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
                <p className="text-sm text-muted">No orders yet at this event.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {orders.map((order) => {
                  const next = getNextStatus(order.status, order.locationType);
                  const actionLabel = getNextStatusAction(order.locationType)[order.status];
                  const isTerminal = order.status === "completed" || order.status === "cancelled";
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border bg-white p-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/5 text-brand">
                            <span className="text-lg font-black">
                              #{String(order.queueNumber ?? 0).padStart(2, "0")}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-charcoal">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-muted">
                              {timeAgo(order.createdAt)}
                              {order.phoneNumber ? ` · ${order.phoneNumber}` : ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-700"
                          )}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>

                      <div className="mb-3 space-y-0.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-muted">
                            <span className="font-medium text-charcoal">
                              {item.quantity}x {item.name}
                            </span>
                            {item.flavors && item.flavors.length > 0 && (
                              <span className="ml-1">— {item.flavors.join(", ")}</span>
                            )}
                            {item.extras && item.extras.length > 0 && (
                              <span className="ml-1 text-brand/70">
                                + {item.extras.join(", ")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isTerminal && (
                        <div className="flex items-center gap-3">
                          {next && actionLabel && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => advanceOrder(order, next)}
                            >
                              {actionLabel}
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => advanceOrder(order, "cancelled")}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "qr" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-white p-6 text-center">
            <QRCodeDisplay value={eventUrl} size={260} />
            <div>
              <p className="text-sm font-semibold text-charcoal">Scan to order</p>
              <p className="mt-1 break-all text-xs text-muted">{eventUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(eventUrl);
                }}
              >
                Copy link
              </Button>
              <a href={`/event/${event.slug}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="primary">
                  Open preview
                </Button>
              </a>
            </div>
            {event.status !== "active" && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This event is <strong>{event.status}</strong>. Switch it to <strong>active</strong>{" "}
                in Settings so guests can place orders.
              </p>
            )}

            {/* Contact summary share */}
            <div className="mt-4 w-full rounded-xl border border-border bg-white p-4 text-left">
              <p className="text-sm font-semibold text-charcoal">
                Share order summary with the contact
              </p>
              {event.contactPin ? (
                <>
                  <p className="mt-1 text-xs text-muted">
                    The contact can enter the PIN to see what each guest ordered
                    and the dollar total.
                  </p>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg border border-border bg-surface px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Link
                      </p>
                      <p className="break-all text-xs text-charcoal">
                        {`${typeof window !== "undefined" ? window.location.origin : ""}/event/${event.slug}/summary`}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        PIN
                      </p>
                      <p className="font-mono text-base tracking-[0.3em] text-charcoal">
                        {event.contactPin}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          `${window.location.origin}/event/${event.slug}/summary`
                        )
                      }
                    >
                      Copy link
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        navigator.clipboard?.writeText(event.contactPin ?? "")
                      }
                    >
                      Copy PIN
                    </Button>
                    <a
                      href={`/event/${event.slug}/summary`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="primary">
                        Open
                      </Button>
                    </a>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  Set a 4–8 digit <strong>Contact PIN</strong> in{" "}
                  <button
                    type="button"
                    onClick={() => setTab("settings")}
                    className="text-brand underline"
                  >
                    Settings
                  </button>{" "}
                  to enable sharing.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="pb-24">
            {savedTick && (
              <div className="mb-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Saved.
              </div>
            )}
            <EventForm
              value={formValue}
              onChange={setFormValue}
              onSubmit={saveEvent}
              submitting={saving}
              submitLabel="Save changes"
              error={saveError}
            />
          </div>
        )}
      </main>

      <StaffBottomNav />
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: "green";
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "font-bold leading-tight text-charcoal",
          small ? "text-sm" : "text-xl",
          accent === "green" && "text-green-600"
        )}
      >
        {value}
      </p>
    </div>
  );
}
