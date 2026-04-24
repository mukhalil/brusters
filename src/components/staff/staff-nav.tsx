"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sub-tabs within the Drive Up section. Events lives on its own bottom tab.
const DRIVE_UP_TABS = [
  { href: "/staff/dashboard", label: "Orders" },
  { href: "/staff/menu", label: "Menu" },
];

export function StaffNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {DRIVE_UP_TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-brand text-white" : "text-muted hover:text-charcoal"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
