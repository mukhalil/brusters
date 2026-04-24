import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, orders } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/staff-auth";
import { generateSlug, rowToEvent } from "@/lib/events";
import { validateLogoUrl } from "@/lib/event-helpers";
import type { EventPaymentMode, EventStatus } from "@/types/event";

export async function GET(request: NextRequest) {
  const unauthorized = requireStaff(request);
  if (unauthorized) return unauthorized;

  try {
    const rows = await db.select().from(events).orderBy(desc(events.createdAt));

    // Aggregate order counts per event
    const countsRows = await db
      .select({
        eventId: orders.eventId,
        total: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${orders.total})::float, 0)`,
      })
      .from(orders)
      .where(sql`${orders.eventId} is not null and ${orders.status} != 'cancelled'`)
      .groupBy(orders.eventId);

    const countsByEvent = new Map<string, { total: number; revenue: number }>();
    for (const row of countsRows) {
      if (row.eventId) {
        countsByEvent.set(row.eventId, { total: row.total, revenue: row.revenue });
      }
    }

    return NextResponse.json(
      rows.map((r) => ({
        ...rowToEvent(r),
        ordersPlaced: countsByEvent.get(r.id)?.total ?? 0,
        revenue: countsByEvent.get(r.id)?.revenue ?? 0,
      }))
    );
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json({ error: "Failed to list events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireStaff(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const logoCheck = validateLogoUrl(body.brandLogoUrl);
    if (!logoCheck.ok) {
      return NextResponse.json({ error: logoCheck.error }, { status: 400 });
    }

    const paymentMode: EventPaymentMode =
      body.paymentMode === "individual" ? "individual" : "prepaid";

    const status: EventStatus = ["draft", "active", "paused", "closed"].includes(
      body.status
    )
      ? body.status
      : "draft";

    // Unique slug; retry if collision
    let slug = generateSlug();
    for (let i = 0; i < 3; i++) {
      const [existing] = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.slug, slug));
      if (!existing) break;
      slug = generateSlug();
    }

    const [inserted] = await db
      .insert(events)
      .values({
        slug,
        name,
        customerContactName: body.customerContactName ?? null,
        customerContactPhone: body.customerContactPhone ?? null,
        eventDate: body.eventDate ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        paymentMode,
        maxOrdersPerGuest:
          typeof body.maxOrdersPerGuest === "number" && body.maxOrdersPerGuest > 0
            ? body.maxOrdersPerGuest
            : null,
        allowedCategoryIds: Array.isArray(body.allowedCategoryIds) ? body.allowedCategoryIds : null,
        allowedItemIds: Array.isArray(body.allowedItemIds) ? body.allowedItemIds : null,
        allowedFlavorIds: Array.isArray(body.allowedFlavorIds) ? body.allowedFlavorIds : null,
        allowedExtraIds: Array.isArray(body.allowedExtraIds) ? body.allowedExtraIds : null,
        status,
        pickupInstructions: body.pickupInstructions ?? null,
        contactPin: typeof body.contactPin === "string" && /^\d{4,8}$/.test(body.contactPin) ? body.contactPin : null,
        brandName: body.brandName ?? null,
        brandLogoUrl: body.brandLogoUrl ?? null,
        brandPrimaryColor: body.brandPrimaryColor ?? null,
        brandAccentColor: body.brandAccentColor ?? null,
        welcomeMessage: body.welcomeMessage ?? null,
      })
      .returning();

    return NextResponse.json(rowToEvent(inserted), { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
