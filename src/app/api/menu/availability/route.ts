import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItemAvailability } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(menuItemAvailability)
      .where(eq(menuItemAvailability.available, false));

    const map: Record<string, boolean> = {};
    for (const row of rows) {
      map[row.itemId] = false;
    }

    return NextResponse.json(map);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({});
  }
}
