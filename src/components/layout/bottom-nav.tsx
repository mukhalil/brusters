"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCartStore, getCartTotalItems } from "@/stores/cart-store";

export function BottomNav() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const totalItems = getCartTotalItems(items);

  const tabs = [
    {
      label: "Menu",
      href: "/menu",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      ),
    },
    {
      label: "Cart",
      href: "/cart",
      badge: totalItems > 0 ? (totalItems > 99 ? "99+" : totalItems) : null,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
          />
        </svg>
      ),
    },
    {
      label: "Track Order",
      href: "/menu",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isTrackOrder = tab.label === "Track Order";
        const isActive =
          !isTrackOrder &&
          (pathname === tab.href || pathname.startsWith(tab.href + "/"));

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              isActive && "text-brand",
              !isActive && !isTrackOrder && "text-muted",
              isTrackOrder && "text-muted opacity-50"
            )}
          >
            <div className="relative">
              {tab.icon}
              {"badge" in tab && tab.badge && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-0.5 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
