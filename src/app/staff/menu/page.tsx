"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { categories, getItemsByCategory, flavors } from "@/lib/menu-data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StaffNav } from "@/components/staff/staff-nav";
import { StaffBottomNav } from "@/components/staff/staff-bottom-nav";
import type { MenuItem } from "@/types/menu";

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  itemName,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  itemName: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={`${itemName} is ${checked ? "available" : "unavailable"}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-green-500" : "bg-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function MenuItemRow({
  item,
  available,
  toggling,
  onToggle,
}: {
  item: MenuItem;
  available: boolean;
  toggling: boolean;
  onToggle: (itemId: string, available: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 transition-opacity",
        !available && "opacity-60"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium text-charcoal">{item.name}</span>
        <span className="text-sm text-muted">{formatCurrency(item.price)}</span>
      </div>
      <ToggleSwitch
        checked={available}
        onChange={(val) => onToggle(item.id, val)}
        disabled={toggling}
        itemName={item.name}
      />
    </div>
  );
}

export default function StaffMenuPage() {
  const router = useRouter();
  const [staffPin, setStaffPin] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const pin = sessionStorage.getItem("staff-pin");
    if (!pin) {
      router.push("/staff");
      return;
    }
    setStaffPin(pin);
  }, [router]);

  // Fetch availability
  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/menu/availability");
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!staffPin) return;
    fetchAvailability();
  }, [staffPin, fetchAvailability]);

  async function handleToggle(itemId: string, newAvailable: boolean) {
    if (!staffPin) return;

    // Optimistic update
    setToggling((prev) => new Set(prev).add(itemId));
    setAvailability((prev) => {
      const next = { ...prev };
      if (newAvailable) {
        delete next[itemId]; // Remove from map = available
      } else {
        next[itemId] = false;
      }
      return next;
    });

    try {
      const res = await fetch(`/api/menu/${itemId}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-staff-pin": staffPin,
        },
        body: JSON.stringify({ available: newAvailable }),
      });

      if (!res.ok) {
        // Revert on failure
        setAvailability((prev) => {
          const next = { ...prev };
          if (newAvailable) {
            next[itemId] = false;
          } else {
            delete next[itemId];
          }
          return next;
        });
      }
    } catch {
      // Revert on error
      setAvailability((prev) => {
        const next = { ...prev };
        if (newAvailable) {
          next[itemId] = false;
        } else {
          delete next[itemId];
        }
        return next;
      });
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  if (!staffPin) return null;

  const unavailableCount = Object.keys(availability).length;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header with tab nav */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <StaffNav />
        {unavailableCount > 0 && (
          <span className="text-xs text-red-500 font-medium">
            {unavailableCount} unavailable
          </span>
        )}
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-16" role="status">
            <LoadingSpinner size="lg" />
            <span className="sr-only">Loading menu items</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Flavors section */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-charcoal">
                Flavors
              </h2>
              <div className="flex flex-col gap-2">
                {flavors.map((flavor) => (
                  <div
                    key={flavor.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 transition-opacity",
                      availability[flavor.id] === false && "opacity-60"
                    )}
                  >
                    <span className="font-medium text-charcoal">{flavor.name}</span>
                    <ToggleSwitch
                      checked={availability[flavor.id] !== false}
                      onChange={(val) => handleToggle(flavor.id, val)}
                      disabled={toggling.has(flavor.id)}
                      itemName={flavor.name}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Menu items by category */}
            {categories.map((cat) => {
              const items = getItemsByCategory(cat.id);
              return (
                <section key={cat.id}>
                  <h2 className="mb-3 text-lg font-semibold text-charcoal">
                    {cat.name}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        available={availability[item.id] !== false}
                        toggling={toggling.has(item.id)}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <StaffBottomNav />
    </div>
  );
}
