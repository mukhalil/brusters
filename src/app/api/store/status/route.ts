import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/store/status — public, returns { isOpen: boolean }
 */
export async function GET() {
  try {
    const row = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, "store_open"))
      .limit(1);

    // Default to open if no row exists yet
    const isOpen = row.length === 0 ? true : row[0].value === "true";

    return NextResponse.json({ isOpen });
  } catch (error) {
    console.error("Error fetching store status:", error);
    return NextResponse.json({ isOpen: true }); // fail-open
  }
}

/**
 * PATCH /api/store/status — staff-only, toggles store open/closed
 * Body: { isOpen: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const staffPin = request.headers.get("x-staff-pin");
    if (!staffPin || staffPin !== process.env.STAFF_PIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isOpen } = body;

    if (typeof isOpen !== "boolean") {
      return NextResponse.json(
        { error: "isOpen must be a boolean" },
        { status: 400 }
      );
    }

    // Upsert the store_open setting
    await db
      .insert(storeSettings)
      .values({
        key: "store_open",
        value: String(isOpen),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeSettings.key,
        set: {
          value: String(isOpen),
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ isOpen });
  } catch (error) {
    console.error("Error updating store status:", error);
    return NextResponse.json(
      { error: "Failed to update store status" },
      { status: 500 }
    );
  }
}
