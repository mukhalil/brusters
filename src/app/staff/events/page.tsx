"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StaffNav } from "@/components/staff/staff-nav";
import type { Event } from "@/types/event";

type EventWithStats = Event & {
  ordersPlaced: number;
  revenue: number;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  closed: "bg-red-100 text-red-700",
};

export default function StaffEventsPage() {
  const router = useRouter();
  const [staffPin, setStaffPin] = useState<string | null>(null);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pin = sessionStorage.getItem("staff-pin");
    if (!pin) {
      router.push("/staff");
      return;
    }
    setStaffPin(pin);
  }, [router]);

  const fetchEvents = useCallback(async () => {
    if (!staffPin) return;
    try {
      const res = await fetch("/api/staff/events", {
        headers: { "x-staff-pin": staffPin },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } finally {
      setLoading(false);
    }
  }, [staffPin]);

  useEffect(() => {
    if (!staffPin) return;
    fetchEvents();
  }, [staffPin, fetchEvents]);

  if (!staffPin) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <StaffNav />
        <Link href="/staff/events/new">
          <Button variant="primary" size="sm">
            New Event
          </Button>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="mb-1 text-lg font-medium text-charcoal">No events yet</p>
            <p className="mb-6 text-sm text-muted">
              Create a catering event to get a QR code guests can scan to order from their phones.
            </p>
            <Link href="/staff/events/new">
              <Button variant="primary">Create your first event</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/staff/events/${ev.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 transition-colors hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-charcoal">
                      {ev.brandName || ev.name}
                    </p>
                    {ev.brandName && (
                      <p className="truncate text-xs text-muted">{ev.name}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[ev.status] ?? "bg-gray-100 text-gray-700"
                    )}
                  >
                    {ev.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium text-charcoal">{ev.ordersPlaced}</span>{" "}
                    order{ev.ordersPlaced === 1 ? "" : "s"}
                  </span>
                  <span>&middot;</span>
                  <span>
                    {ev.paymentMode === "prepaid" ? "Host-paid" : "Individual pay"}
                  </span>
                  {ev.paymentMode === "individual" && ev.revenue > 0 && (
                    <>
                      <span>&middot;</span>
                      <span>{formatCurrency(ev.revenue)}</span>
                    </>
                  )}
                  {ev.eventDate && (
                    <>
                      <span>&middot;</span>
                      <span>{ev.eventDate}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-surface px-1.5 py-0.5 font-mono">
                    /event/{ev.slug}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
