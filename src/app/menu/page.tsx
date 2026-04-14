"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { categories, getItemsByCategory } from "@/lib/menu-data";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageContainer } from "@/components/layout/page-container";
import type { MenuItem } from "@/types/menu";

function AddedToast({ item, visible }: { item: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "fixed top-18 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0 pointer-events-none"
      )}
    >
      {item} added to cart
    </div>
  );
}

function MenuItemCard({
  item,
  available = true,
}: {
  item: MenuItem;
  available?: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const posthog = usePostHog();
  const [toastVisible, setToastVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const isCustomizable = item.allowFlavors || item.allowExtras;

  const handleAdd = useCallback(() => {
    if (!available) return;

    if (isCustomizable) {
      router.push(`/menu/customize/${item.id}`);
      return;
    }

    // Non-customizable items go straight to cart
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
    });
    posthog.capture("menu_item_added", {
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      categoryId: item.categoryId,
    });
    setToastVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToastVisible(false), 1500);
  }, [addItem, item, posthog, available, isCustomizable, router]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <AddedToast item={item.name} visible={toastVisible} />
      <button
        onClick={handleAdd}
        disabled={!available}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-colors active:bg-surface",
          !available && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Text info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium text-charcoal">{item.name}</span>
          <span className="text-sm text-muted line-clamp-2">
            {item.description}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-brand font-semibold">
              {formatCurrency(item.price)}
            </span>
            {item.scoops && (
              <span className="text-xs text-muted">
                {item.scoops} {item.scoops === 1 ? "scoop" : "scoops"}
              </span>
            )}
          </div>
        </div>

        {/* Action indicator */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            available
              ? "bg-brand text-white"
              : "bg-gray-200 text-gray-400"
          )}
          aria-hidden="true"
        >
          {isCustomizable ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          )}
        </div>
      </button>
    </>
  );
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [storeOpen, setStoreOpen] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/menu/availability")
      .then((r) => r.json())
      .then((data) => setUnavailable(data))
      .catch(() => {});
    fetch("/api/store/status")
      .then((r) => r.json())
      .then((data) => setStoreOpen(data.isOpen))
      .catch(() => {});
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    const section = sectionRefs.current[categoryId];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header />

      {/* Category pills - sticky below header */}
      <div className="sticky top-14 z-40 border-b border-border bg-white">
        <div
          ref={pillsRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-brand text-white"
                  : "bg-surface text-charcoal border border-border"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Store closed banner */}
      {!storeOpen && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">Store is currently closed</p>
            <p className="text-xs text-red-600/80">You can browse the menu, but ordering is unavailable right now.</p>
          </div>
        </div>
      )}

      <PageContainer>
        {categories.map((cat) => {
          const items = getItemsByCategory(cat.id);
          const availableItems = items.filter(
            (item) => unavailable[item.id] !== false
          );
          if (availableItems.length === 0) return null;
          return (
            <section
              key={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="mb-6 scroll-mt-32"
            >
              <h2 className="mb-3 text-lg font-semibold text-charcoal">
                {cat.name}
              </h2>
              <div className="flex flex-col gap-3">
                {availableItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </PageContainer>

      <BottomNav />
    </div>
  );
}
