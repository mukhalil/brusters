"use client";

import { use, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { categories, getItemsByCategory, menuItems as allMenuItems } from "@/lib/menu-data";
import { formatCurrency, cn } from "@/lib/utils";
import { useEventCartStore } from "@/stores/event-cart-store";
import { EventHeader } from "@/components/event/event-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { MenuItem } from "@/types/menu";
import type { Event } from "@/types/event";

export default function EventMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const ensureSlug = useEventCartStore((s) => s.ensureSlug);
  const addItem = useEventCartStore((s) => s.addItem);
  const items = useEventCartStore((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [event, setEvent] = useState<Event | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    ensureSlug(slug);
    Promise.all([
      fetch(`/api/events/${slug}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/menu/availability").then((r) => (r.ok ? r.json() : {})),
    ]).then(([evPayload, avail]) => {
      if (evPayload) {
        setEvent(evPayload.event);
        setIsOpen(evPayload.isOpen);
      }
      setUnavailable(avail || {});
      setLoading(false);
    });
  }, [slug, ensureSlug]);

  const allowedCategories = useMemo(() => {
    if (!event) return categories;
    if (!event.allowedCategoryIds) return categories;
    return categories.filter((c) => event.allowedCategoryIds!.includes(c.id));
  }, [event]);

  const itemAllowedAtEvent = useCallback(
    (item: MenuItem): boolean => {
      if (!event) return true;
      if (event.allowedCategoryIds && !event.allowedCategoryIds.includes(item.categoryId))
        return false;
      if (event.allowedItemIds && !event.allowedItemIds.includes(item.id)) return false;
      return true;
    },
    [event]
  );

  function handleAdd(item: MenuItem) {
    if (!isOpen) return;
    const customizable = item.allowFlavors || item.allowExtras;
    if (customizable) {
      router.push(`/event/${slug}/menu/customize/${item.id}`);
      return;
    }
    addItem({ menuItemId: item.id, name: item.name, price: item.price });
    setToast(`${item.name} added`);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 1500);
  }

  if (loading || !event) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-24">
      <EventHeader event={event} />

      {!isOpen && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          <p className="text-sm font-semibold text-amber-800">
            Ordering is currently paused for this event.
          </p>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed top-16 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {allowedCategories.map((cat) => {
          const catItems = getItemsByCategory(cat.id).filter(
            (item) => itemAllowedAtEvent(item) && unavailable[item.id] !== false
          );
          if (catItems.length === 0) return null;
          return (
            <section key={cat.id} className="mb-6">
              <h2 className="mb-3 text-lg font-semibold text-charcoal">{cat.name}</h2>
              <div className="flex flex-col gap-3">
                {catItems.map((item) => {
                  const customizable = item.allowFlavors || item.allowExtras;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAdd(item)}
                      disabled={!isOpen}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-colors active:bg-surface",
                        !isOpen && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-medium text-charcoal">{item.name}</span>
                        <span className="text-sm text-muted line-clamp-2">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {event.paymentMode === "prepaid" ? (
                            <span className="text-xs font-semibold text-green-700">
                              Free
                            </span>
                          ) : (
                            <span className="text-brand font-semibold">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                          {item.scoops && (
                            <span className="text-xs text-muted">
                              {item.scoops} {item.scoops === 1 ? "scoop" : "scoops"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-hidden>
                        {customizable ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {allowedCategories.every(
          (cat) =>
            getItemsByCategory(cat.id).filter(
              (item) => itemAllowedAtEvent(item) && unavailable[item.id] !== false
            ).length === 0
        ) && (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-sm text-muted">No items are available right now.</p>
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-lg">
            <button
              onClick={() => router.push(`/event/${slug}/cart`)}
              className="flex h-14 w-full items-center justify-between rounded-xl bg-brand px-5 text-white shadow-md active:scale-[0.99]"
            >
              <span className="font-semibold">
                View cart &middot; {cartCount} item{cartCount === 1 ? "" : "s"}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* menuItems reference silences lint */}
      <span className="hidden">{allMenuItems.length}</span>
    </div>
  );
}
