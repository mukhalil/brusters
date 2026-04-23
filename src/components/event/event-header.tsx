"use client";

import Link from "next/link";
import { useCartStore, getCartTotalItems } from "@/stores/cart-store";
import type { Event } from "@/types/event";
import { eventDisplayName } from "@/lib/event-helpers";

interface EventHeaderProps {
  event: Event;
  showCart?: boolean;
  backHref?: string;
}

export function EventHeader({ event, showCart = true, backHref }: EventHeaderProps) {
  const items = useCartStore((state) => state.items);
  const totalItems = getCartTotalItems(items);
  const name = eventDisplayName(event);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4 relative">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
      ) : (
        <div className="min-w-[44px]" />
      )}

      <Link
        href={`/event/${event.slug}/menu`}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[60%]"
      >
        {event.brandLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.brandLogoUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover border border-border"
          />
        )}
        <span className="truncate text-sm font-bold text-charcoal">{name}</span>
      </Link>

      {showCart ? (
        <Link
          href={`/event/${event.slug}/cart`}
          aria-label={`View cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
          className="relative min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
          {totalItems > 0 && (
            <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Link>
      ) : (
        <div className="min-w-[44px]" />
      )}
    </header>
  );
}
