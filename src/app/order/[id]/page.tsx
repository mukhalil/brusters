"use client";

import { use } from "react";
import Link from "next/link";
import { formatCurrency, cn, shortOrderId } from "@/lib/utils";
import { useOrderPolling } from "@/hooks/use-order-polling";
import {
  ORDER_STATUS_FLOW,
  STATUS_LABELS,
  getStatusFlow,
  getStatusMessages,
} from "@/types/order";
import type { OrderStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function StatusIcon({
  state,
}: {
  state: "completed" | "current" | "future";
}) {
  if (state === "completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
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

function StatusTimeline({ currentStatus, locationType }: { currentStatus: OrderStatus; locationType: string }) {
  const flow = getStatusFlow(locationType);
  const currentIndex = flow.indexOf(currentStatus);

  return (
    <div className="flex flex-col gap-0">
      {flow.map((status, idx) => {
        let state: "completed" | "current" | "future";
        if (idx < currentIndex) state = "completed";
        else if (idx === currentIndex) state = "current";
        else state = "future";

        const isLast = idx === flow.length - 1;

        return (
          <div key={status} className="flex gap-4">
            {/* Icon + Line column */}
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

            {/* Label */}
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
  );
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { order, error, loading } = useOrderPolling(id);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-center border-b border-border bg-white px-4">
          <h1 className="text-lg font-bold text-charcoal">Order Status</h1>
        </header>
        <div className="flex flex-1 items-center justify-center" role="status">
          <LoadingSpinner size="lg" />
          <span className="sr-only">Loading order status</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-center border-b border-border bg-white px-4">
          <h1 className="text-lg font-bold text-charcoal">Order Status</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <p className="text-muted">{error || "Order not found"}</p>
          <Link href="/menu">
            <Button variant="primary">Back to Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isCompleted = order.status === "completed";

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <div className="w-11" />
        <h1 className="text-lg font-bold text-charcoal">Order Status</h1>
        <span className="w-11 text-right text-sm font-medium text-muted">
          {shortOrderId(order.id)}
        </span>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {/* Order code hero */}
        <div className="mb-6 flex flex-col items-center gap-1 rounded-2xl border border-border bg-white py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Order Code
          </p>
          <p className="text-6xl font-black tracking-tight text-brand">
            {shortOrderId(order.id)}
          </p>
        </div>

        {/* Main status message */}
        <div className="mb-6 text-center" role="status" aria-live="polite" aria-atomic="true">
          <p className="text-xl font-bold text-charcoal">
            {getStatusMessages(order.locationType)[order.status]}
          </p>
        </div>

        {/* Cancelled state */}
        {isCancelled && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-medium text-red-700">Order cancelled</p>
            <Link href="/menu" className="mt-3 inline-block">
              <Button variant="primary" size="sm">
                Order Again
              </Button>
            </Link>
          </div>
        )}

        {/* Timeline - not shown for cancelled orders */}
        {!isCancelled && (
          <div className="mb-6 rounded-xl border border-border bg-white p-5">
            <StatusTimeline currentStatus={order.status} locationType={order.locationType} />
          </div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <div className="mb-6 text-center">
            <Link href="/menu">
              <Button variant="primary" size="lg">
                Order Again
              </Button>
            </Link>
          </div>
        )}

        {/* Order details */}
        <div className="rounded-xl border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-charcoal">
            Order Details
          </h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-charcoal">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-muted">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold text-charcoal">
              <span>Total</span>
              <span>{formatCurrency(parseFloat(order.total))}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
