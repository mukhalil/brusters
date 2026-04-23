"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMenuItemById,
  flavors as allFlavors,
  extras as allExtras,
  EXTRA_PRICE,
} from "@/lib/menu-data";
import { formatCurrency, cn } from "@/lib/utils";
import { useEventCartStore } from "@/stores/event-cart-store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Event } from "@/types/event";

export default function EventCustomizePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const router = useRouter();
  const ensureSlug = useEventCartStore((s) => s.ensureSlug);
  const addItem = useEventCartStore((s) => s.addItem);
  const item = getMenuItemById(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSlug(slug);
    fetch(`/api/events/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload) setEvent(payload.event);
        setLoading(false);
      });
  }, [slug, ensureSlug]);

  const availableFlavors = useMemo(() => {
    if (!item) return [];
    let list = item.flavorSet
      ? allFlavors.filter((f) => item.flavorSet!.includes(f.id))
      : allFlavors;
    if (event?.allowedFlavorIds) {
      list = list.filter((f) => event.allowedFlavorIds!.includes(f.id));
    }
    return list;
  }, [item, event]);

  const availableExtras = useMemo(() => {
    if (!event?.allowedExtraIds) return allExtras;
    return allExtras.filter((e) => event.allowedExtraIds!.includes(e.id));
  }, [event]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6">
        <p className="text-muted">Item not found</p>
        <Link href={`/event/${slug}/menu`} className="mt-4 text-brand underline">
          Back to Menu
        </Link>
      </div>
    );
  }

  const isPrepaid = event?.paymentMode === "prepaid";
  const maxFlavors = item.scoops || 1;
  const extrasTotal = selectedExtras.length * EXTRA_PRICE;
  const itemTotal = item.price + extrasTotal;
  const canAdd = item.allowFlavors ? selectedFlavors.length >= 1 : true;

  function toggleFlavor(name: string) {
    setSelectedFlavors((prev) => {
      if (prev.includes(name)) return prev.filter((f) => f !== name);
      if (prev.length >= maxFlavors) return prev;
      return [...prev, name];
    });
  }

  function toggleExtra(name: string) {
    setSelectedExtras((prev) => {
      if (prev.includes(name)) return prev.filter((e) => e !== name);
      if (prev.length >= 10) return prev;
      return [...prev, name];
    });
  }

  function handleAddToCart() {
    if (!canAdd || !item) return;
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      flavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      extras: selectedExtras.length > 0 ? selectedExtras : undefined,
      extrasPrice: extrasTotal > 0 ? extrasTotal : undefined,
    });
    router.push(`/event/${slug}/menu`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <Link
          href={`/event/${slug}/menu`}
          aria-label="Back"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-charcoal">Customize</h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-32">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-charcoal">{item.name}</h2>
          <p className="text-sm text-muted">{item.description}</p>
          {!isPrepaid && (
            <p className="mt-1 text-lg font-semibold text-brand">
              {formatCurrency(item.price)}
            </p>
          )}
        </div>

        {item.allowFlavors && (
          <section className="mb-6">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-charcoal">Flavors</h3>
              <p className="text-xs text-muted">
                Select up to {maxFlavors} &middot;{" "}
                <span
                  className={cn(
                    "font-medium",
                    selectedFlavors.length === 0 ? "text-red-500" : "text-green-600"
                  )}
                >
                  {selectedFlavors.length} of {maxFlavors}
                </span>
              </p>
            </div>

            {availableFlavors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-white p-4 text-center text-sm text-muted">
                No flavors configured for this event.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {availableFlavors.map((flavor) => {
                  const isSelected = selectedFlavors.includes(flavor.name);
                  const atMax = selectedFlavors.length >= maxFlavors && !isSelected;
                  return (
                    <button
                      key={flavor.id}
                      onClick={() => toggleFlavor(flavor.name)}
                      disabled={atMax}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "border-brand bg-brand/5 text-charcoal"
                          : "border-border bg-white text-charcoal",
                        atMax && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                          isSelected ? "border-brand bg-brand" : "border-muted/40 bg-white"
                        )}
                      >
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1">{flavor.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {item.allowExtras && availableExtras.length > 0 && (
          <section className="mb-6">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-charcoal">Toppings</h3>
              <p className="text-xs text-muted">
                Optional
                {!isPrepaid && ` · +${formatCurrency(EXTRA_PRICE)} each`}
                {selectedExtras.length > 0 && (
                  <span className="ml-1 font-medium text-brand">
                    &middot; {selectedExtras.length} selected
                    {!isPrepaid && ` (+${formatCurrency(extrasTotal)})`}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {availableExtras.map((extra) => {
                const isSelected = selectedExtras.includes(extra.name);
                const atMax = selectedExtras.length >= 10 && !isSelected;
                return (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra.name)}
                    disabled={atMax}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      isSelected
                        ? "border-brand bg-brand/5 text-charcoal"
                        : "border-border bg-white text-charcoal",
                      atMax && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        isSelected ? "border-brand bg-brand" : "border-muted/40 bg-white"
                      )}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1">{extra.name}</span>
                    {!isPrepaid && (
                      <span className="text-xs text-muted">+{formatCurrency(extra.price)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            className={cn(
              "flex h-14 w-full items-center justify-center rounded-xl text-lg font-semibold text-white shadow-md transition-all",
              canAdd ? "bg-brand active:scale-95" : "bg-gray-300 cursor-not-allowed"
            )}
          >
            {isPrepaid ? "Add to order" : `Add to cart · ${formatCurrency(itemTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
