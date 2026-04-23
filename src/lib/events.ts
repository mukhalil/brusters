import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Event } from "@/types/event";

export { generateSlug, isEventOrderingOpen, eventDisplayName, formatShortQueue } from "@/lib/event-helpers";

export async function loadEventBySlug(slug: string): Promise<Event | null> {
  const [row] = await db.select().from(events).where(eq(events.slug, slug));
  if (!row) return null;
  return rowToEvent(row);
}

export async function loadEventById(id: string): Promise<Event | null> {
  const [row] = await db.select().from(events).where(eq(events.id, id));
  if (!row) return null;
  return rowToEvent(row);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToEvent(row: any): Event {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    customerContactName: row.customerContactName,
    customerContactPhone: row.customerContactPhone,
    eventDate: row.eventDate,
    startsAt: row.startsAt ? new Date(row.startsAt).toISOString() : null,
    endsAt: row.endsAt ? new Date(row.endsAt).toISOString() : null,
    paymentMode: row.paymentMode,
    maxOrdersPerGuest: row.maxOrdersPerGuest,
    allowedCategoryIds: row.allowedCategoryIds ?? null,
    allowedItemIds: row.allowedItemIds ?? null,
    allowedFlavorIds: row.allowedFlavorIds ?? null,
    allowedExtraIds: row.allowedExtraIds ?? null,
    status: row.status,
    pickupInstructions: row.pickupInstructions,
    brandName: row.brandName,
    brandLogoUrl: row.brandLogoUrl,
    brandPrimaryColor: row.brandPrimaryColor,
    brandAccentColor: row.brandAccentColor,
    welcomeMessage: row.welcomeMessage,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
