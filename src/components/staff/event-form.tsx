"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { categories, flavors, extras, menuItems } from "@/lib/menu-data";
import type { Event, EventPaymentMode, EventStatus } from "@/types/event";

export interface EventFormValues {
  name: string;
  customerContactName: string;
  customerContactPhone: string;
  eventDate: string;
  startsAt: string;
  endsAt: string;
  paymentMode: EventPaymentMode;
  maxOrdersPerGuest: string; // text input; parsed on submit
  allowedCategoryIds: string[] | null;
  allowedItemIds: string[] | null;
  allowedFlavorIds: string[] | null;
  allowedExtraIds: string[] | null;
  status: EventStatus;
  pickupInstructions: string;
  contactPin: string;
  brandName: string;
  brandLogoUrl: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
  welcomeMessage: string;
}

export function initialValues(event?: Event): EventFormValues {
  return {
    name: event?.name ?? "",
    customerContactName: event?.customerContactName ?? "",
    customerContactPhone: event?.customerContactPhone ?? "",
    eventDate: event?.eventDate ?? "",
    startsAt: event?.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : "",
    endsAt: event?.endsAt ? new Date(event.endsAt).toISOString().slice(0, 16) : "",
    paymentMode: event?.paymentMode ?? "prepaid",
    maxOrdersPerGuest:
      event?.maxOrdersPerGuest != null ? String(event.maxOrdersPerGuest) : "",
    allowedCategoryIds: event?.allowedCategoryIds ?? null,
    allowedItemIds: event?.allowedItemIds ?? null,
    allowedFlavorIds: event?.allowedFlavorIds ?? null,
    allowedExtraIds: event?.allowedExtraIds ?? null,
    status: event?.status ?? "draft",
    pickupInstructions: event?.pickupInstructions ?? "",
    contactPin: event?.contactPin ?? "",
    brandName: event?.brandName ?? "",
    brandLogoUrl: event?.brandLogoUrl ?? "",
    brandPrimaryColor: event?.brandPrimaryColor ?? "",
    brandAccentColor: event?.brandAccentColor ?? "",
    welcomeMessage: event?.welcomeMessage ?? "",
  };
}

export function valuesToBody(v: EventFormValues) {
  return {
    name: v.name.trim(),
    customerContactName: v.customerContactName.trim() || null,
    customerContactPhone: v.customerContactPhone.trim() || null,
    eventDate: v.eventDate || null,
    startsAt: v.startsAt || null,
    endsAt: v.endsAt || null,
    paymentMode: v.paymentMode,
    maxOrdersPerGuest: v.maxOrdersPerGuest ? Number(v.maxOrdersPerGuest) : null,
    allowedCategoryIds: v.allowedCategoryIds,
    allowedItemIds: v.allowedItemIds,
    allowedFlavorIds: v.allowedFlavorIds,
    allowedExtraIds: v.allowedExtraIds,
    status: v.status,
    pickupInstructions: v.pickupInstructions.trim() || null,
    contactPin: v.contactPin.trim() || null,
    brandName: v.brandName.trim() || null,
    brandLogoUrl: v.brandLogoUrl.trim() || null,
    brandPrimaryColor: v.brandPrimaryColor.trim() || null,
    brandAccentColor: v.brandAccentColor.trim() || null,
    welcomeMessage: v.welcomeMessage.trim() || null,
  };
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-border bg-white p-4">
      <h3 className="mb-0.5 text-sm font-bold text-charcoal">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-muted">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted"
    >
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

interface EventFormProps {
  value: EventFormValues;
  onChange: (next: EventFormValues) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  error?: string | null;
}

export function EventForm({
  value,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  error,
}: EventFormProps) {
  const [flavorFilter, setFlavorFilter] = useState("");

  function set<K extends keyof EventFormValues>(key: K, next: EventFormValues[K]) {
    onChange({ ...value, [key]: next });
  }

  function toggleInList(
    key: "allowedCategoryIds" | "allowedItemIds" | "allowedFlavorIds" | "allowedExtraIds",
    id: string
  ) {
    const current = value[key];
    if (current == null) {
      // "all" state → treat as all-selected, so toggling off a single one creates an explicit list without that id
      const all =
        key === "allowedCategoryIds"
          ? categories.map((c) => c.id)
          : key === "allowedItemIds"
            ? menuItems.map((m) => m.id)
            : key === "allowedFlavorIds"
              ? flavors.map((f) => f.id)
              : extras.map((e) => e.id);
      set(key, all.filter((x) => x !== id));
      return;
    }
    if (current.includes(id)) {
      set(key, current.filter((x) => x !== id));
    } else {
      set(key, [...current, id]);
    }
  }

  function resetToAll(
    key: "allowedCategoryIds" | "allowedItemIds" | "allowedFlavorIds" | "allowedExtraIds"
  ) {
    set(key, null);
  }

  function selectNone(
    key: "allowedCategoryIds" | "allowedItemIds" | "allowedFlavorIds" | "allowedExtraIds"
  ) {
    set(key, []);
  }

  const filteredFlavors = useMemo(() => {
    const q = flavorFilter.trim().toLowerCase();
    if (!q) return flavors;
    return flavors.filter((f) => f.name.toLowerCase().includes(q));
  }, [flavorFilter]);

  const flavorCount = value.allowedFlavorIds?.length ?? flavors.length;
  const extraCount = value.allowedExtraIds?.length ?? extras.length;
  const categoryCount = value.allowedCategoryIds?.length ?? categories.length;
  const itemCount = value.allowedItemIds?.length ?? menuItems.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basics */}
      <Section title="Basics">
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="name">Event name</Label>
            <input
              id="name"
              className={inputBase}
              placeholder="Smith Wedding"
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contact-name">Contact name</Label>
              <input
                id="contact-name"
                className={inputBase}
                value={value.customerContactName}
                onChange={(e) => set("customerContactName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact phone</Label>
              <input
                id="contact-phone"
                className={inputBase}
                value={value.customerContactPhone}
                onChange={(e) => set("customerContactPhone", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="event-date">Event date</Label>
              <input
                id="event-date"
                type="date"
                className={inputBase}
                value={value.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="starts-at">Opens at</Label>
              <input
                id="starts-at"
                type="datetime-local"
                className={inputBase}
                value={value.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ends-at">Closes at</Label>
              <input
                id="ends-at"
                type="datetime-local"
                className={inputBase}
                value={value.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pickup">Pickup instructions</Label>
            <textarea
              id="pickup"
              rows={2}
              className={inputBase}
              placeholder="Pick up at the tent by the pool"
              value={value.pickupInstructions}
              onChange={(e) => set("pickupInstructions", e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Status + Payment */}
      <Section title="Status & payment">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {(["draft", "active", "paused", "closed"] as EventStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    value.status === s
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-white text-charcoal"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">
              Guests can only order while the event is <strong>active</strong>.
            </p>
          </div>

          <div>
            <Label>Who pays?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set("paymentMode", "prepaid")}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  value.paymentMode === "prepaid"
                    ? "border-brand bg-brand/5"
                    : "border-border bg-white"
                )}
              >
                <p className="font-semibold text-charcoal">Prepaid</p>
                <p className="text-xs text-muted">Host covers the event. No cards collected.</p>
              </button>
              <button
                type="button"
                onClick={() => set("paymentMode", "individual")}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  value.paymentMode === "individual"
                    ? "border-brand bg-brand/5"
                    : "border-border bg-white"
                )}
              >
                <p className="font-semibold text-charcoal">Pay individually</p>
                <p className="text-xs text-muted">Each guest pays at checkout.</p>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="max-orders">Max orders per guest</Label>
            <input
              id="max-orders"
              type="number"
              min={1}
              placeholder="No limit"
              className={inputBase + " max-w-[180px]"}
              value={value.maxOrdersPerGuest}
              onChange={(e) => set("maxOrdersPerGuest", e.target.value.replace(/\D/g, ""))}
            />
            <p className="mt-1 text-xs text-muted">
              Counted per phone number. Leave blank for unlimited.
            </p>
          </div>
        </div>
      </Section>

      {/* Share with contact */}
      <Section
        title="Share with contact"
        subtitle="Set a 4–8 digit PIN so the event contact can view a per-guest order summary."
      >
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="contact-pin">Contact PIN</Label>
            <input
              id="contact-pin"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              placeholder="Disabled"
              className={inputBase + " max-w-[180px] tracking-[0.3em] font-mono"}
              value={value.contactPin}
              onChange={(e) => set("contactPin", e.target.value.replace(/\D/g, "").slice(0, 8))}
            />
            <p className="mt-1 text-xs text-muted">
              Leave blank to disable summary sharing. Share the PIN with the
              event contact via your usual channel.
            </p>
          </div>
          {value.contactPin && (
            <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
              <p className="font-semibold text-charcoal">Share link</p>
              <p className="mt-0.5 break-all text-muted">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /event/<span className="font-mono">[event-slug]</span>/summary
              </p>
              <p className="mt-1 text-muted/80">
                Find the exact link with the slug on the event detail page once saved.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Menu subset */}
      <Section
        title="Menu"
        subtitle={`Customize what's on offer at this event. Full menu has ${categories.length} categories, ${menuItems.length} items, ${flavors.length} flavors, ${extras.length} toppings.`}
      >
        <div className="flex flex-col gap-5">
          <SubsetPicker
            label="Categories"
            count={categoryCount}
            total={categories.length}
            isAll={value.allowedCategoryIds == null}
            onAll={() => resetToAll("allowedCategoryIds")}
            onNone={() => selectNone("allowedCategoryIds")}
          >
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const selected =
                  value.allowedCategoryIds == null ||
                  value.allowedCategoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleInList("allowedCategoryIds", c.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-white text-muted"
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </SubsetPicker>

          <SubsetPicker
            label="Flavors"
            count={flavorCount}
            total={flavors.length}
            isAll={value.allowedFlavorIds == null}
            onAll={() => resetToAll("allowedFlavorIds")}
            onNone={() => selectNone("allowedFlavorIds")}
          >
            <input
              type="text"
              placeholder="Filter flavors…"
              className={inputBase + " mb-2"}
              value={flavorFilter}
              onChange={(e) => setFlavorFilter(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {filteredFlavors.map((f) => {
                const selected =
                  value.allowedFlavorIds == null ||
                  value.allowedFlavorIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleInList("allowedFlavorIds", f.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                      selected
                        ? "border-brand bg-brand/5 text-charcoal"
                        : "border-border bg-white text-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
                        selected ? "border-brand bg-brand" : "border-muted/40 bg-white"
                      )}
                    >
                      {selected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>
          </SubsetPicker>

          <SubsetPicker
            label="Toppings"
            count={extraCount}
            total={extras.length}
            isAll={value.allowedExtraIds == null}
            onAll={() => resetToAll("allowedExtraIds")}
            onNone={() => selectNone("allowedExtraIds")}
          >
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {extras.map((e) => {
                const selected =
                  value.allowedExtraIds == null || value.allowedExtraIds.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleInList("allowedExtraIds", e.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                      selected
                        ? "border-brand bg-brand/5 text-charcoal"
                        : "border-border bg-white text-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
                        selected ? "border-brand bg-brand" : "border-muted/40 bg-white"
                      )}
                    >
                      {selected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{e.name}</span>
                  </button>
                );
              })}
            </div>
          </SubsetPicker>

          <p className="text-xs text-muted">
            {itemCount} of {menuItems.length} menu items allowed based on category selection. Items outside selected categories are automatically hidden.
          </p>
        </div>
      </Section>

      {/* Branding */}
      <Section title="Branding" subtitle="Shown on the event's ordering page.">
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="brand-name">Display name</Label>
            <input
              id="brand-name"
              className={inputBase}
              placeholder="e.g. Smith Wedding Ice Cream Bar"
              value={value.brandName}
              onChange={(e) => set("brandName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="brand-logo">Logo URL</Label>
            <input
              id="brand-logo"
              className={inputBase}
              placeholder="https://..."
              value={value.brandLogoUrl}
              onChange={(e) => set("brandLogoUrl", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="brand-color">Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="brand-color"
                  type="color"
                  value={value.brandPrimaryColor || "#8B1A1A"}
                  onChange={(e) => set("brandPrimaryColor", e.target.value)}
                  className="h-9 w-12 rounded border border-border bg-white p-0.5"
                />
                <input
                  className={inputBase}
                  placeholder="#8B1A1A"
                  value={value.brandPrimaryColor}
                  onChange={(e) => set("brandPrimaryColor", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="brand-accent">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="brand-accent"
                  type="color"
                  value={value.brandAccentColor || "#A52A2A"}
                  onChange={(e) => set("brandAccentColor", e.target.value)}
                  className="h-9 w-12 rounded border border-border bg-white p-0.5"
                />
                <input
                  className={inputBase}
                  placeholder="#A52A2A"
                  value={value.brandAccentColor}
                  onChange={(e) => set("brandAccentColor", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="welcome">Welcome message</Label>
            <textarea
              id="welcome"
              rows={2}
              className={inputBase}
              placeholder="Welcome to the Smith wedding! Help yourself to ice cream, on us."
              value={value.welcomeMessage}
              onChange={(e) => set("welcomeMessage", e.target.value)}
            />
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-white px-4 py-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!value.name.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function SubsetPicker({
  label,
  count,
  total,
  isAll,
  onAll,
  onNone,
  children,
}: {
  label: string;
  count: number;
  total: number;
  isAll: boolean;
  onAll: () => void;
  onNone: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal">
            {label}
          </p>
          <span className="text-xs text-muted">
            {isAll ? `All ${total}` : `${count} of ${total}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button type="button" onClick={onAll} className="text-brand underline">
            All
          </button>
          <span className="text-muted">&middot;</span>
          <button type="button" onClick={onNone} className="text-muted underline">
            None
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
