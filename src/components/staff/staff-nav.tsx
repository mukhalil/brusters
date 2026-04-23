"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/staff/dashboard", label: "Orders" },
  { href: "/staff/events", label: "Events" },
  { href: "/staff/menu", label: "Menu" },
];

export function StaffNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              active ? "bg-brand text-white" : "text-muted"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
