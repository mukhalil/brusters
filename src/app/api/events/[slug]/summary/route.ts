import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { loadEventBySlug } from "@/lib/events";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const event = await loadEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!event.contactPin) {
      return NextResponse.json(
        { error: "Order summary sharing is not enabled for this event." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    if (!pin || pin !== event.contactPin) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    // Aggregate by phone (the natural identity key) but display the most-recent name.
    // Cancelled orders excluded from totals.
    const rows = await db
      .select({
        phoneNumber: orders.phoneNumber,
        name: sql<string>`(array_agg(${orders.customerName} order by ${orders.createdAt} desc))[1]`,
        orderCount: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${orders.total})::float, 0)`,
        firstAt: sql<string>`min(${orders.createdAt})`,
        lastAt: sql<string>`max(${orders.createdAt})`,
      })
      .from(orders)
      .where(sql`${orders.eventId} = ${event.id} and ${orders.status} != 'cancelled'`)
      .groupBy(orders.phoneNumber)
      .orderBy(sql`coalesce(sum(${orders.total})::float, 0) desc`);

    // Cancelled stats — separate so the contact can see they happened without inflating revenue.
    const [cancelled] = await db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${orders.total})::float, 0)`,
      })
      .from(orders)
      .where(sql`${orders.eventId} = ${event.id} and ${orders.status} = 'cancelled'`);

    const totalRevenue = rows.reduce((sum, r) => sum + r.total, 0);
    const totalOrders = rows.reduce((sum, r) => sum + r.orderCount, 0);

    return NextResponse.json({
      event: {
        slug: event.slug,
        name: event.name,
        brandName: event.brandName,
        eventDate: event.eventDate,
        paymentMode: event.paymentMode,
        status: event.status,
      },
      summary: {
        guestCount: rows.length,
        totalOrders,
        totalRevenue,
        cancelledCount: cancelled?.count ?? 0,
        cancelledTotal: cancelled?.total ?? 0,
      },
      guests: rows.map((r) => ({
        name: r.name,
        phoneNumber: r.phoneNumber,
        orderCount: r.orderCount,
        total: r.total,
        firstAt: r.firstAt,
        lastAt: r.lastAt,
      })),
    });

    // Note: phoneNumber returned to the contact (who is the host paying for or
    // organizing this event) is intentional — they need it for follow-up. If
    // we ever expose this to a less-trusted role, mask it.
  } catch (error) {
    console.error("Error building event summary:", error);
    return NextResponse.json({ error: "Failed to build summary" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // Cheap pre-flight so the customer page can show "PIN required" vs. "not enabled"
  // without leaking guest data.
  try {
    const { slug } = await context.params;
    const event = await loadEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({
      enabled: !!event.contactPin,
      eventName: event.brandName || event.name,
    });
  } catch (error) {
    console.error("Error checking summary availability:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
