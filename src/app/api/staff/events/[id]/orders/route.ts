import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/staff-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireStaff(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("status") ?? "all";

    const baseWhere = eq(orders.eventId, id);
    const where =
      filter === "active"
        ? and(
            baseWhere,
            sql`${orders.status} in ('received','preparing','ready')`
          )
        : baseWhere;

    const rows = await db
      .select()
      .from(orders)
      .where(where)
      .orderBy(sql`${orders.queueNumber} asc nulls last, ${orders.createdAt} asc`);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error listing event orders:", error);
    return NextResponse.json({ error: "Failed to list orders" }, { status: 500 });
  }
}
