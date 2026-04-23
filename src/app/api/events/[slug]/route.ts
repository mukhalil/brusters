import { NextRequest, NextResponse } from "next/server";
import { loadEventBySlug, isEventOrderingOpen } from "@/lib/events";

// Public info about an event — safe to expose what a guest with the QR code can see.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const event = await loadEventBySlug(slug);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({
      event,
      isOpen: isEventOrderingOpen(event),
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
