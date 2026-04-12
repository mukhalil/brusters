"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, getCartTotalItems } from "@/stores/cart-store";

export function Header() {
  const items = useCartStore((state) => state.items);
  const totalItems = getCartTotalItems(items);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-white px-4 relative">
      <Link href="/menu" className="flex items-center">
        <Image
          src="/BrustersLogo.svg"
          alt="Bruster's Real Ice Cream"
          width={110}
          height={43}
          className="h-8 w-auto"
          priority
        />
      </Link>

      {/* Centered location label */}
      <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-charcoal tracking-wide pointer-events-none">
        La Ca&ntilde;ada
      </span>

      <Link href="/cart" className="relative min-h-[44px] min-w-[44px] flex items-center justify-center">
        {/* Shopping bag icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-charcoal"
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

        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>
    </header>
  );
}
