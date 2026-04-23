import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { loadEventBySlug } from "@/lib/events";

// Returns how many orders are ahead of this one (same event, not-yet-ready).
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;
    const event = await loadEventBySlug(slug);
    if (!event) return NextResponse.json({ ahead: 0 });

    const [self] = await db
      .select({
        status: orders.status,
        queueNumber: orders.queueNumber,
      })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.eventId, event.id)));

    if (!self || self.queueNumber == null) {
      return NextResponse.json({ ahead: 0 });
    }

    const [aheadRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.eventId, event.id),
          sql`${orders.status} in ('received','preparing')`,
          sql`${orders.queueNumber} < ${self.queueNumber}`
        )
      );

    return NextResponse.json({
      ahead: aheadRow?.count ?? 0,
      queueNumber: self.queueNumber,
      status: self.status,
    });
  } catch (error) {
    console.error("Queue lookup failed:", error);
    return NextResponse.json({ ahead: 0 });
  }
}
