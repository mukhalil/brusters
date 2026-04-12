import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItemAvailability } from "@/lib/db/schema";
import { getMenuItemById } from "@/lib/menu-data";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staffPin = request.headers.get("x-staff-pin");
    if (!staffPin || staffPin !== process.env.STAFF_PIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const menuItem = getMenuItemById(id);
    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { available } = body;
    if (typeof available !== "boolean") {
      return NextResponse.json(
        { error: "available must be a boolean" },
        { status: 400 }
      );
    }

    await db
      .insert(menuItemAvailability)
      .values({ itemId: id, available, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: menuItemAvailability.itemId,
        set: { available, updatedAt: new Date() },
      });

    return NextResponse.json({ itemId: id, available });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
