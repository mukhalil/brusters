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

    // Pull raw orders and group in JS — keeps line items accessible per guest
    // without an awkward jsonb_agg in SQL. For typical event volume (sub-1k
    // orders) the in-memory grouping is trivial.
    const rawOrders = await db
      .select({
        id: orders.id,
        phoneNumber: orders.phoneNumber,
        customerName: orders.customerName,
        items: orders.items,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(sql`${orders.eventId} = ${event.id} and ${orders.status} != 'cancelled'`)
      .orderBy(sql`${orders.createdAt} asc`);

    interface GuestOrder {
      id: string;
      total: number;
      createdAt: string;
      items: Array<{
        menuItemId: string;
        name: string;
        price: number;
        quantity: number;
        flavors?: string[];
        extras?: string[];
      }>;
    }
    interface GuestAgg {
      phoneNumber: string | null;
      name: string;
      orderCount: number;
      total: number;
      firstAt: string;
      lastAt: string;
      orders: GuestOrder[];
    }

    const byKey = new Map<string, GuestAgg>();
    for (const row of rawOrders) {
      const key = row.phoneNumber ?? `__noname__${row.customerName}`;
      const total = parseFloat(row.total as unknown as string);
      const createdAt = new Date(row.createdAt).toISOString();
      const order: GuestOrder = {
        id: row.id,
        total,
        createdAt,
        items: (row.items as GuestOrder["items"]) ?? [],
      };
      const existing = byKey.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.total += total;
        // Most recent name wins
        if (createdAt > existing.lastAt) {
          existing.name = row.customerName;
          existing.lastAt = createdAt;
        }
        if (createdAt < existing.firstAt) existing.firstAt = createdAt;
        existing.orders.push(order);
      } else {
        byKey.set(key, {
          phoneNumber: row.phoneNumber,
          name: row.customerName,
          orderCount: 1,
          total,
          firstAt: createdAt,
          lastAt: createdAt,
          orders: [order],
        });
      }
    }

    const rows = Array.from(byKey.values()).sort((a, b) => b.total - a.total);

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
        orders: r.orders,
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
