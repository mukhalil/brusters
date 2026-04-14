"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { formatCurrency, timeAgo, shortOrderId, cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  getStatusFlow,
  getNextStatusAction,
} from "@/types/order";
import type { Order, OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type FilterMode = "active" | "all";

function getNextStatus(current: OrderStatus, locationType: string): OrderStatus | null {
  const flow = getStatusFlow(locationType);
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function OrderCard({
  order,
  staffPin,
  onStatusChange,
}: {
  order: Order;
  staffPin: string;
  onStatusChange: () => void;
}) {
  const posthog = usePostHog();
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const nextStatus = getNextStatus(order.status, order.locationType);
  const actionLabel = getNextStatusAction(order.locationType)[order.status];
  const isTerminal =
    order.status === "completed" || order.status === "cancelled";

  async function handleAdvance() {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-staff-pin": staffPin,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      posthog.capture("order_status_changed", {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextStatus,
      });
      onStatusChange();
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-staff-pin": staffPin,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      posthog.capture("order_status_changed", {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "cancelled",
      });
      onStatusChange();
    } finally {
      setCancelling(false);
    }
  }

  // Build condensed items string
  const itemsSummary = order.items
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(", ");

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-charcoal">
            {shortOrderId(order.id)}
          </span>
          <span className="text-xs text-muted">
            {timeAgo(order.createdAt)}
          </span>
        </div>
        <Badge variant={order.status}>
          {STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {/* Customer name */}
      <p className="mb-1 text-sm font-medium text-charcoal">
        {order.customerName}
      </p>

      {/* Location */}
      <div className="mb-2 text-sm text-muted">
        {order.locationType === "counter" ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Counter Pickup
            </span>
            {order.phoneNumber && (
              <a
                href={`tel:${order.phoneNumber}`}
                className="text-brand underline"
              >
                {order.phoneNumber}
              </a>
            )}
          </div>
        ) : order.locationType === "gps" && order.latitude && order.longitude ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Curbside
            </span>
            <a
              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline"
            >
              View on Map
            </a>
            {order.phoneNumber && (
              <a href={`tel:${order.phoneNumber}`} className="text-brand underline">
                {order.phoneNumber}
              </a>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Curbside
              </span>
              {order.phoneNumber && (
                <a href={`tel:${order.phoneNumber}`} className="text-brand underline">
                  {order.phoneNumber}
                </a>
              )}
            </div>
            {order.carDescription && <p>{order.carDescription}</p>}
            {order.additionalNotes && (
              <p className="text-xs text-muted">{order.additionalNotes}</p>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mb-2 space-y-1">
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

      {/* Total */}
      <p className="mb-3 text-sm font-semibold text-charcoal">
        {formatCurrency(parseFloat(order.total))}
      </p>

      {/* Actions */}
      {!isTerminal && (
        <div className="flex items-center gap-3">
          {actionLabel && (
            <Button
              variant="primary"
              size="sm"
              loading={updating}
              onClick={handleAdvance}
            >
              {actionLabel}
            </Button>
          )}
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className={cn(
              "text-sm text-red-500 hover:text-red-700",
              cancelling && "opacity-50"
            )}
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [staffPin, setStaffPin] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const pin = sessionStorage.getItem("staff-pin");
    if (!pin) {
      router.push("/staff");
      return;
    }
    setStaffPin(pin);
  }, [router]);

  // Fetch store status
  useEffect(() => {
    fetch("/api/store/status")
      .then((r) => r.json())
      .then((data) => setStoreOpen(data.isOpen))
      .catch(() => {});
  }, []);

  async function toggleStore() {
    if (!staffPin) return;
    setTogglingStore(true);
    try {
      const res = await fetch("/api/store/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-staff-pin": staffPin,
        },
        body: JSON.stringify({ isOpen: !storeOpen }),
      });
      if (res.ok) {
        const data = await res.json();
        setStoreOpen(data.isOpen);
      }
    } finally {
      setTogglingStore(false);
    }
  }

  const fetchOrders = useCallback(async () => {
    if (!staffPin) return;
    try {
      const url =
        filter === "active"
          ? "/api/orders?status=active"
          : "/api/orders";
      const res = await fetch(url, {
        headers: { "x-staff-pin": staffPin },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // silent fail on poll
    } finally {
      setLoading(false);
    }
  }, [staffPin, filter]);

  // Initial fetch + polling
  useEffect(() => {
    if (!staffPin) return;
    setLoading(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [staffPin, filter, fetchOrders]);

  // Sort oldest first
  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (!staffPin) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <div className="flex items-center gap-1">
          <Link
            href="/staff/dashboard"
            className="rounded-full px-3 py-1.5 text-sm font-medium bg-brand text-white"
          >
            Orders
          </Link>
          <Link
            href="/staff/menu"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted"
          >
            Menu
          </Link>
        </div>

        {/* Filter toggle */}
        <div className="flex rounded-full border border-border bg-surface p-0.5">
          <button
            onClick={() => setFilter("active")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === "active"
                ? "bg-brand text-white"
                : "text-muted"
            )}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === "all"
                ? "bg-brand text-white"
                : "text-muted"
            )}
          >
            All
          </button>
        </div>
      </header>

      {/* Store open/closed toggle */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        storeOpen
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex h-2.5 w-2.5 rounded-full",
            storeOpen ? "bg-green-500" : "bg-red-500"
          )} />
          <span className={cn(
            "text-sm font-semibold",
            storeOpen ? "text-green-700" : "text-red-700"
          )}>
            {storeOpen ? "Store is Open" : "Store is Closed"}
          </span>
        </div>
        <button
          onClick={toggleStore}
          disabled={togglingStore}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
            storeOpen
              ? "bg-green-500 focus:ring-green-400"
              : "bg-red-400 focus:ring-red-300",
            togglingStore && "opacity-60 cursor-not-allowed"
          )}
          role="switch"
          aria-checked={storeOpen}
          aria-label={storeOpen ? "Close store" : "Open store"}
        >
          <span className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            storeOpen ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted">No active orders</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                staffPin={staffPin}
                onStatusChange={fetchOrders}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
