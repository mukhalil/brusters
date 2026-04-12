"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import {
  getMenuItemById,
  flavors,
  extras,
  EXTRA_PRICE,
} from "@/lib/menu-data";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

export default function CustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const posthog = usePostHog();

  const item = getMenuItemById(id);

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/menu/availability")
      .then((r) => r.json())
      .then((data) => setUnavailable(data))
      .catch(() => {});
  }, []);

  if (!item) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6">
        <p className="text-muted">Item not found</p>
        <Link href="/menu" className="mt-4 text-brand underline">
          Back to Menu
        </Link>
      </div>
    );
  }

  const maxFlavors = item.scoops || 1;
  const extrasTotal = selectedExtras.length * EXTRA_PRICE;
  const itemTotal = item.price + extrasTotal;

  // Filter flavors if item has a restricted set
  const availableFlavors = item.flavorSet
    ? flavors.filter((f) => item.flavorSet!.includes(f.id))
    : flavors;

  const canAddToCart =
    item.allowFlavors ? selectedFlavors.length >= 1 : true;

  function toggleFlavor(flavorName: string) {
    setSelectedFlavors((prev) => {
      if (prev.includes(flavorName)) {
        return prev.filter((f) => f !== flavorName);
      }
      if (prev.length >= maxFlavors) {
        return prev; // Max reached, don't add more
      }
      return [...prev, flavorName];
    });
  }

  function toggleExtra(extraName: string) {
    setSelectedExtras((prev) => {
      if (prev.includes(extraName)) {
        return prev.filter((e) => e !== extraName);
      }
      if (prev.length >= 10) return prev; // max 10 extras
      return [...prev, extraName];
    });
  }

  function handleAddToCart() {
    if (!canAddToCart || !item) return;

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      flavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      extras: selectedExtras.length > 0 ? selectedExtras : undefined,
      extrasPrice: extrasTotal > 0 ? extrasTotal : undefined,
    });

    posthog.capture("menu_item_added", {
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      categoryId: item.categoryId,
      flavors: selectedFlavors,
      extras: selectedExtras,
      extrasTotal,
    });

    router.push("/menu");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <Link
          href="/menu"
          aria-label="Back to menu"
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
          Customize
        </h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-32">
        {/* Item header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-charcoal">{item.name}</h2>
          <p className="text-sm text-muted">{item.description}</p>
          <p className="mt-1 text-lg font-semibold text-brand">
            {formatCurrency(item.price)}
          </p>
        </div>

        {/* Flavor selection */}
        {item.allowFlavors && (
          <section className="mb-6">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-charcoal">Flavors</h3>
              <p className="text-xs text-muted">
                Select up to {maxFlavors} &middot;{" "}
                <span
                  className={cn(
                    "font-medium",
                    selectedFlavors.length === 0
                      ? "text-red-500"
                      : "text-green-600"
                  )}
                >
                  {selectedFlavors.length} of {maxFlavors} selected
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {availableFlavors.map((flavor) => {
                const isSelected = selectedFlavors.includes(flavor.name);
                const isFlavorUnavailable = unavailable[flavor.id] === false;
                const isAtMax = selectedFlavors.length >= maxFlavors && !isSelected;

                if (isFlavorUnavailable) return null;

                return (
                  <button
                    key={flavor.id}
                    onClick={() => toggleFlavor(flavor.name)}
                    disabled={isAtMax}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      isSelected
                        ? "border-brand bg-brand/5 text-charcoal"
                        : "border-border bg-white text-charcoal",
                      isAtMax && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        isSelected
                          ? "border-brand bg-brand"
                          : "border-muted/40 bg-white"
                      )}
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={4}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1">{flavor.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Extras selection */}
        {item.allowExtras && (
          <section className="mb-6">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-charcoal">Extras</h3>
              <p className="text-xs text-muted">
                Optional &middot; Up to 10 &middot; +{formatCurrency(EXTRA_PRICE)} each
                {selectedExtras.length > 0 && (
                  <span className="ml-1 font-medium text-brand">
                    &middot; {selectedExtras.length} selected (+
                    {formatCurrency(extrasTotal)})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {extras.map((extra) => {
                const isSelected = selectedExtras.includes(extra.name);
                const isAtMax = selectedExtras.length >= 10 && !isSelected;

                return (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra.name)}
                    disabled={isAtMax}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      isSelected
                        ? "border-brand bg-brand/5 text-charcoal"
                        : "border-border bg-white text-charcoal",
                      isAtMax && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        isSelected
                          ? "border-brand bg-brand"
                          : "border-muted/40 bg-white"
                      )}
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={4}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1">{extra.name}</span>
                    <span className="text-xs text-muted">
                      +{formatCurrency(extra.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Add to Cart button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={cn(
              "flex h-14 w-full items-center justify-center rounded-xl text-lg font-semibold text-white shadow-md transition-all",
              canAddToCart
                ? "bg-brand active:scale-95"
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            Add to Cart &middot; {formatCurrency(itemTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
