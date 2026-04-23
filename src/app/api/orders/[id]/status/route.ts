import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { type OrderStatus, getValidTransitions } from "@/types/order";
import { sendSms } from "@/lib/sms";
import { shortOrderId } from "@/lib/utils";
import { loadEventById, eventDisplayName } from "@/lib/events";

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
    const body = await request.json();
    const newStatus = body.status as OrderStatus;

    if (!newStatus) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    // Get current order
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate status transition
    const currentStatus = currentOrder.status as OrderStatus;
    const transitions = getValidTransitions(currentOrder.locationType);
    const allowedTransitions = transitions[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        },
        { status: 400 }
      );
    }

    // Update status
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    // Send SMS when order is ready
    if (newStatus === "ready" && currentOrder.phoneNumber) {
      const orderCode = shortOrderId(currentOrder.id);
      const isCounter = currentOrder.locationType === "counter";
      const isEvent = currentOrder.locationType === "event";

      let message: string;
      if (isEvent && currentOrder.eventId) {
        const event = await loadEventById(currentOrder.eventId);
        const brand = event ? eventDisplayName(event) : "Park and Order";
        const pickup = event?.pickupInstructions
          ? event.pickupInstructions
          : "the pickup station";
        const queueTag =
          typeof currentOrder.queueNumber === "number"
            ? `#${String(currentOrder.queueNumber).padStart(2, "0")}`
            : orderCode;
        message = `Order ${queueTag} is ready! Pick up at ${pickup}. — ${brand}`;
      } else if (isCounter) {
        message = `Your order ${orderCode} is ready! Head to the counter to pick it up. - Park and Order`;
      } else {
        message = `Your order ${orderCode} is ready! A server will bring it to your car shortly. - Park and Order`;
      }

      try {
        await sendSms(currentOrder.phoneNumber, message);
      } catch (smsError) {
        // Log but don't fail the status update
        console.error("Failed to send SMS notification:", smsError);
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
