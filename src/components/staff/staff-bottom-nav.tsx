"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BottomTab {
  href: string;
  label: string;
  // True when the pathname belongs to this tab's section.
  matches: (path: string) => boolean;
  icon: React.ReactNode;
}

const TABS: BottomTab[] = [
  {
    href: "/staff/dashboard",
    label: "Drive Up",
    matches: (p) => p.startsWith("/staff/dashboard") || p.startsWith("/staff/menu"),
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25 5.5 7a2 2 0 0 1 1.86-1.25h9.28A2 2 0 0 1 18.5 7l1.75 4.25M5 11.25h14m-14 0v6.75A.75.75 0 0 0 5.75 18.75h.5a.75.75 0 0 0 .75-.75v-1.5h10v1.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75v-6.75M7.5 14.25h.008v.008H7.5v-.008Zm9 0h.008v.008H16.5v-.008Z" />
      </svg>
    ),
  },
  {
    href: "/staff/events",
    label: "Events",
    matches: (p) => p.startsWith("/staff/events"),
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
];

export function StaffBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Staff sections"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-18 items-stretch border-t border-border bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map((tab) => {
        const active = tab.matches(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 text-[11px] transition-colors",
              active ? "text-brand" : "text-muted hover:text-charcoal"
            )}
          >
            {/* Top accent bar — solid brand color across the active tab */}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px] bg-brand"
              />
            )}
            {/* Icon container — filled pill on active, ghost on inactive */}
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-all",
                active
                  ? "bg-brand text-white [&_svg]:stroke-[2.25]"
                  : "[&_svg]:stroke-[1.75]"
              )}
            >
              {tab.icon}
            </span>
            <span className={cn("leading-none", active ? "font-bold" : "font-medium")}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
