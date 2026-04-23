import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, orders } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/staff-auth";
import { rowToEvent } from "@/lib/events";
import { validateLogoUrl } from "@/lib/event-helpers";
import type { EventPaymentMode, EventStatus } from "@/types/event";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireStaff(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const [row] = await db.select().from(events).where(eq(events.id, id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        ready: sql<number>`count(*) filter (where ${orders.status} = 'ready')::int`,
        completed: sql<number>`count(*) filter (where ${orders.status} = 'completed')::int`,
        revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} != 'cancelled')::float, 0)`,
      })
      .from(orders)
      .where(and(eq(orders.eventId, id)));

    return NextResponse.json({
      event: rowToEvent(row),
      stats: {
        ordersPlaced: stats?.total ?? 0,
        ordersReady: stats?.ready ?? 0,
        ordersCompleted: stats?.completed ?? 0,
        revenue: stats?.revenue ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireStaff(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { updatedAt: new Date() };

    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if ("customerContactName" in body) update.customerContactName = body.customerContactName ?? null;
    if ("customerContactPhone" in body) update.customerContactPhone = body.customerContactPhone ?? null;
    if ("eventDate" in body) update.eventDate = body.eventDate ?? null;
    if ("startsAt" in body) update.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if ("endsAt" in body) update.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.paymentMode === "individual" || body.paymentMode === "prepaid") {
      update.paymentMode = body.paymentMode as EventPaymentMode;
    }
    if ("maxOrdersPerGuest" in body) {
      update.maxOrdersPerGuest =
        typeof body.maxOrdersPerGuest === "number" && body.maxOrdersPerGuest > 0
          ? body.maxOrdersPerGuest
          : null;
    }
    if ("allowedCategoryIds" in body)
      update.allowedCategoryIds = Array.isArray(body.allowedCategoryIds)
        ? body.allowedCategoryIds
        : null;
    if ("allowedItemIds" in body)
      update.allowedItemIds = Array.isArray(body.allowedItemIds) ? body.allowedItemIds : null;
    if ("allowedFlavorIds" in body)
      update.allowedFlavorIds = Array.isArray(body.allowedFlavorIds)
        ? body.allowedFlavorIds
        : null;
    if ("allowedExtraIds" in body)
      update.allowedExtraIds = Array.isArray(body.allowedExtraIds) ? body.allowedExtraIds : null;

    if (["draft", "active", "paused", "closed"].includes(body.status)) {
      update.status = body.status as EventStatus;
    }
    if ("pickupInstructions" in body) update.pickupInstructions = body.pickupInstructions ?? null;
    if ("brandName" in body) update.brandName = body.brandName ?? null;
    if ("brandLogoUrl" in body) {
      const check = validateLogoUrl(body.brandLogoUrl);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      update.brandLogoUrl = body.brandLogoUrl ?? null;
    }
    if ("brandPrimaryColor" in body) update.brandPrimaryColor = body.brandPrimaryColor ?? null;
    if ("brandAccentColor" in body) update.brandAccentColor = body.brandAccentColor ?? null;
    if ("welcomeMessage" in body) update.welcomeMessage = body.welcomeMessage ?? null;

    const [updated] = await db
      .update(events)
      .set(update)
      .where(eq(events.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rowToEvent(updated));
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
