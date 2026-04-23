import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, menuItemAvailability } from "@/lib/db/schema";
import {
  getMenuItemById,
  TAX_RATE,
  EXTRA_PRICE,
  flavors as allFlavors,
  extras as allExtras,
} from "@/lib/menu-data";
import { getPaymentProvider } from "@/lib/payment";
import { loadEventBySlug, isEventOrderingOpen } from "@/lib/events";
import { and, eq, inArray, sql } from "drizzle-orm";

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
    if (!isEventOrderingOpen(event)) {
      return NextResponse.json(
        { error: "Ordering is not open for this event." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { customerName, phoneNumber, items, paymentNonce } = body;

    if (!customerName || typeof customerName !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      return NextResponse.json(
        { error: "Please provide a valid 10-digit US phone number" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
    }

    // Per-guest cap
    if (event.maxOrdersPerGuest != null) {
      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.eventId, event.id),
            eq(orders.phoneNumber, digits),
            sql`${orders.status} != 'cancelled'`
          )
        );
      const used = countRow?.count ?? 0;
      if (used >= event.maxOrdersPerGuest) {
        return NextResponse.json(
          {
            error: `You've reached the limit of ${event.maxOrdersPerGuest} order${event.maxOrdersPerGuest === 1 ? "" : "s"} per guest for this event.`,
            reason: "limit",
            limit: event.maxOrdersPerGuest,
            used,
          },
          { status: 429 }
        );
      }
    }

    const validFlavorNames = new Set(allFlavors.map((f) => f.name));
    const validExtraNames = new Set(allExtras.map((e) => e.name));

    const allowedFlavorNames = event.allowedFlavorIds
      ? new Set(
          allFlavors
            .filter((f) => event.allowedFlavorIds!.includes(f.id))
            .map((f) => f.name)
        )
      : null;
    const allowedExtraNames = event.allowedExtraIds
      ? new Set(
          allExtras
            .filter((e) => event.allowedExtraIds!.includes(e.id))
            .map((e) => e.name)
        )
      : null;

    const verifiedItems: Array<{
      menuItemId: string;
      name: string;
      price: number;
      quantity: number;
      flavors?: string[];
      extras?: string[];
      extrasPrice?: number;
    }> = [];

    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: `Invalid item: ${JSON.stringify(item)}` },
          { status: 400 }
        );
      }

      const menuItem = getMenuItemById(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item not found: ${item.menuItemId}` },
          { status: 400 }
        );
      }

      // Event allowlist — category + item
      if (
        event.allowedCategoryIds &&
        !event.allowedCategoryIds.includes(menuItem.categoryId)
      ) {
        return NextResponse.json(
          { error: `${menuItem.name} is not available at this event` },
          { status: 400 }
        );
      }
      if (event.allowedItemIds && !event.allowedItemIds.includes(menuItem.id)) {
        return NextResponse.json(
          { error: `${menuItem.name} is not available at this event` },
          { status: 400 }
        );
      }

      const itemFlavors: string[] | undefined = item.flavors;
      if (itemFlavors && Array.isArray(itemFlavors)) {
        if (menuItem.scoops && itemFlavors.length > menuItem.scoops) {
          return NextResponse.json(
            { error: `Too many flavors for ${menuItem.name}. Max: ${menuItem.scoops}` },
            { status: 400 }
          );
        }
        for (const f of itemFlavors) {
          if (!validFlavorNames.has(f)) {
            return NextResponse.json({ error: `Invalid flavor: ${f}` }, { status: 400 });
          }
          if (allowedFlavorNames && !allowedFlavorNames.has(f)) {
            return NextResponse.json(
              { error: `Flavor "${f}" is not available at this event` },
              { status: 400 }
            );
          }
        }
      }

      const itemExtras: string[] | undefined = item.extras;
      let extrasPrice = 0;
      if (itemExtras && Array.isArray(itemExtras)) {
        if (itemExtras.length > 10) {
          return NextResponse.json(
            { error: `Too many extras for ${menuItem.name}. Max: 10` },
            { status: 400 }
          );
        }
        for (const e of itemExtras) {
          if (!validExtraNames.has(e)) {
            return NextResponse.json({ error: `Invalid extra: ${e}` }, { status: 400 });
          }
          if (allowedExtraNames && !allowedExtraNames.has(e)) {
            return NextResponse.json(
              { error: `Topping "${e}" is not available at this event` },
              { status: 400 }
            );
          }
        }
        extrasPrice = itemExtras.length * EXTRA_PRICE;
      }

      verifiedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        flavors: itemFlavors,
        extras: itemExtras,
        extrasPrice: extrasPrice > 0 ? extrasPrice : undefined,
      });
    }

    // Per-item availability (staff-managed) still respected at events
    const itemIds = verifiedItems.map((i) => i.menuItemId);
    const unavailableRows = await db
      .select()
      .from(menuItemAvailability)
      .where(
        and(
          inArray(menuItemAvailability.itemId, itemIds),
          eq(menuItemAvailability.available, false)
        )
      );
    if (unavailableRows.length > 0) {
      const names = unavailableRows
        .map((r) => verifiedItems.find((i) => i.menuItemId === r.itemId)?.name ?? r.itemId)
        .join(", ");
      return NextResponse.json(
        { error: `Temporarily unavailable: ${names}` },
        { status: 400 }
      );
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + (item.price + (item.extrasPrice || 0)) * item.quantity,
      0
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    // Payment branching
    let paymentMethod = "prepaid";
    let paymentId: string | null = null;

    if (event.paymentMode === "individual") {
      if (process.env.PAYMENT_PROVIDER === "square" && !paymentNonce) {
        return NextResponse.json(
          { error: "Payment is required" },
          { status: 400 }
        );
      }
      const paymentResult = await getPaymentProvider().processPayment(total, paymentNonce);
      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error || "Payment failed" },
          { status: 400 }
        );
      }
      paymentMethod = process.env.PAYMENT_PROVIDER === "square" ? "square" : "mock";
      paymentId = paymentResult.paymentId ?? null;
    }

    // Assign queue number: max(existing) + 1 for this event
    const [maxRow] = await db
      .select({ max: sql<number>`coalesce(max(${orders.queueNumber}), 0)::int` })
      .from(orders)
      .where(eq(orders.eventId, event.id));
    const queueNumber = (maxRow?.max ?? 0) + 1;

    const [order] = await db
      .insert(orders)
      .values({
        customerName: customerName.trim(),
        locationType: "event",
        phoneNumber: digits,
        items: verifiedItems,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentMethod,
        paymentId,
        eventId: event.id,
        queueNumber,
      })
      .returning();

    // Auto-advance to "preparing" after 2 seconds (matches regular flow)
    const orderId = order.id;
    setTimeout(async () => {
      try {
        await db
          .update(orders)
          .set({ status: "preparing", updatedAt: new Date() })
          .where(and(eq(orders.id, orderId), eq(orders.status, "received")));
      } catch (err) {
        console.error("Failed to auto-advance order:", err);
      }
    }, 2000);

    return NextResponse.json({ id: order.id, queueNumber }, { status: 201 });
  } catch (error) {
    console.error("Error creating event order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
