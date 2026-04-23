"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { useOrderPolling } from "@/hooks/use-order-polling";
import { EventHeader } from "@/components/event/event-header";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  EVENT_STATUS_FLOW,
  STATUS_LABELS,
  getStatusMessages,
} from "@/types/order";
import type { OrderStatus } from "@/types/order";
import type { Event } from "@/types/event";

function StatusIcon({ state }: { state: "completed" | "current" | "future" }) {
  if (state === "completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    );
  }
  if (state === "current") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand">
        <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
      <div className="h-2 w-2 rounded-full bg-gray-300" />
    </div>
  );
}

export default function EventOrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const { order, error, loading } = useOrderPolling(id);
  const [event, setEvent] = useState<Event | null>(null);
  const [queue, setQueue] = useState<{ ahead: number; queueNumber?: number } | null>(
    null
  );

  useEffect(() => {
    fetch(`/api/events/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) setEvent(p.event);
      });
  }, [slug]);

  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "cancelled") return;
    const fetchQueue = () =>
      fetch(`/api/events/${slug}/queue/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => p && setQueue(p))
        .catch(() => {});
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [slug, id, order]);

  if (loading || !order || !event) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6">
        <p className="text-muted">{error}</p>
        <Link href={`/event/${slug}/menu`} className="mt-4 text-brand underline">
          Back
        </Link>
      </div>
    );
  }

  const queueNumber = order.queueNumber ?? null;
  const queueLabel = queueNumber != null ? `#${String(queueNumber).padStart(2, "0")}` : "";
  const currentIndex = EVENT_STATUS_FLOW.indexOf(order.status as OrderStatus);
  const isReady = order.status === "ready";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const isPrepaid = event.paymentMode === "prepaid";

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <EventHeader event={event} showCart={false} />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {/* Hero: queue number */}
        <div
          className={cn(
            "mb-5 flex flex-col items-center gap-1 rounded-2xl border py-6",
            isReady
              ? "border-green-200 bg-green-50"
              : "border-border bg-white"
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Your number
          </p>
          <p
            className={cn(
              "text-6xl font-black tracking-tight",
              isReady ? "text-green-700" : "text-brand"
            )}
          >
            {queueLabel}
          </p>
        </div>

        {/* Status message */}
        <div className="mb-5 text-center" role="status" aria-live="polite">
          <p className="text-xl font-bold text-charcoal">
            {getStatusMessages("event")[order.status]}
          </p>
          {queue && !isReady && !isCompleted && !isCancelled && queue.ahead > 0 && (
            <p className="mt-1 text-sm text-muted">
              {queue.ahead} order{queue.ahead === 1 ? "" : "s"} ahead of you
            </p>
          )}
          {queue && !isReady && !isCompleted && !isCancelled && queue.ahead === 0 && (
            <p className="mt-1 text-sm text-muted">You&apos;re next!</p>
          )}
        </div>

        {isReady && event.pickupInstructions && (
          <div className="mb-5 rounded-xl border border-green-200 bg-white p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Pickup
            </p>
            <p className="mt-1 text-sm text-charcoal">{event.pickupInstructions}</p>
          </div>
        )}

        {isCancelled ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-medium text-red-700">Order cancelled</p>
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-border bg-white p-5">
            {EVENT_STATUS_FLOW.map((status, idx) => {
              const state: "completed" | "current" | "future" =
                idx < currentIndex ? "completed" : idx === currentIndex ? "current" : "future";
              const isLast = idx === EVENT_STATUS_FLOW.length - 1;
              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StatusIcon state={state} />
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-8",
                          state === "completed" || state === "current"
                            ? "bg-green-500"
                            : "border-l-2 border-dashed border-gray-300"
                        )}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={cn(
                        "text-sm font-medium leading-8",
                        state === "current"
                          ? "text-brand"
                          : state === "completed"
                            ? "text-green-600"
                            : "text-muted"
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order details */}
        <div className="rounded-xl border border-border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-charcoal">Order details</h2>
          <div className="flex flex-col gap-1.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal">
                    {item.quantity}x {item.name}
                  </span>
                  {!isPrepaid && (
                    <span className="text-muted">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  )}
                </div>
                {item.flavors && item.flavors.length > 0 && (
                  <p className="text-xs text-muted">{item.flavors.join(", ")}</p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className="text-xs text-brand/70">+ {item.extras.join(", ")}</p>
                )}
              </div>
            ))}
            {!isPrepaid && (
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold text-charcoal">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(order.total))}</span>
              </div>
            )}
          </div>
        </div>

        {isCompleted && (
          <div className="mt-5 text-center">
            <Link href={`/event/${slug}/menu`}>
              <Button variant="primary" size="lg">
                Order again
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
