"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Drive-up tabs are grouped together because Menu controls availability for the
// Orders side. Events is a separate ordering mode and lives in its own group.
const PRIMARY_TABS = [
  { href: "/staff/dashboard", label: "Orders" },
  { href: "/staff/menu", label: "Menu" },
];

const SECONDARY_TABS = [{ href: "/staff/events", label: "Events" }];

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand text-white" : "text-muted hover:text-charcoal"
      )}
    >
      {label}
    </Link>
  );
}

export function StaffNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex items-center gap-1">
      {PRIMARY_TABS.map((tab) => (
        <Tab key={tab.href} href={tab.href} label={tab.label} active={isActive(tab.href)} />
      ))}
      <span aria-hidden="true" className="mx-2 h-5 w-px bg-border" />
      {SECONDARY_TABS.map((tab) => (
        <Tab key={tab.href} href={tab.href} label={tab.label} active={isActive(tab.href)} />
      ))}
    </div>
  );
}
