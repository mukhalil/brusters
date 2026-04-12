import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, menuItemAvailability } from "@/lib/db/schema";
import { getMenuItemById, TAX_RATE, EXTRA_PRICE, flavors as allFlavors, extras as allExtras } from "@/lib/menu-data";
import { getPaymentProvider } from "@/lib/payment";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      locationType,
      latitude,
      longitude,
      carDescription,
      phoneNumber,
      additionalNotes,
      paymentNonce,
      items,
    } = body;

    // Validate required fields
    if (!customerName || typeof customerName !== "string") {
      return NextResponse.json(
        { error: "customerName is required" },
        { status: 400 }
      );
    }

    if (!["gps", "car", "counter"].includes(locationType)) {
      return NextResponse.json(
        { error: "locationType must be 'gps', 'car', or 'counter'" },
        { status: 400 }
      );
    }

    if (locationType === "gps") {
      if (latitude == null || longitude == null) {
        return NextResponse.json(
          { error: "latitude and longitude are required for GPS location" },
          { status: 400 }
        );
      }
    }

    if (locationType === "car") {
      if (!carDescription || typeof carDescription !== "string") {
        return NextResponse.json(
          { error: "carDescription is required for car location" },
          { status: 400 }
        );
      }
    }

    if (locationType === "counter") {
      if (!phoneNumber || typeof phoneNumber !== "string") {
        return NextResponse.json(
          { error: "phoneNumber is required for counter pickup" },
          { status: 400 }
        );
      }
      const digits = phoneNumber.replace(/\D/g, "");
      if (digits.length !== 10) {
        return NextResponse.json(
          { error: "Please provide a valid 10-digit US phone number" },
          { status: 400 }
        );
      }
    }

    // Validate payment nonce when Square is active
    if (process.env.PAYMENT_PROVIDER === "square" && !paymentNonce) {
      return NextResponse.json(
        { error: "Payment nonce is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Look up real prices from menu data — never trust client prices
    const validFlavorNames = new Set(allFlavors.map((f) => f.name));
    const validExtraNames = new Set(allExtras.map((e) => e.name));

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

      // Validate flavors if provided
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
            return NextResponse.json(
              { error: `Invalid flavor: ${f}` },
              { status: 400 }
            );
          }
        }
      }

      // Validate extras if provided
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
            return NextResponse.json(
              { error: `Invalid extra: ${e}` },
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

    // Check availability for all ordered items
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
        .map((r) => {
          const item = verifiedItems.find((i) => i.menuItemId === r.itemId);
          return item?.name || r.itemId;
        })
        .join(", ");
      return NextResponse.json(
        {
          error: `The following items are currently unavailable: ${names}. Please remove them and try again.`,
        },
        { status: 400 }
      );
    }

    // Calculate totals with verified prices (including extras)
    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + (item.price + (item.extrasPrice || 0)) * item.quantity,
      0
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    // Process payment
    const paymentProvider = getPaymentProvider();
    const paymentResult = await paymentProvider.processPayment(total, paymentNonce);

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Payment failed" },
        { status: 400 }
      );
    }

    // Insert order
    const [order] = await db
      .insert(orders)
      .values({
        customerName,
        locationType,
        latitude: locationType === "gps" ? String(latitude) : null,
        longitude: locationType === "gps" ? String(longitude) : null,
        carDescription: locationType === "car" ? carDescription : null,
        phoneNumber: phoneNumber || null,
        additionalNotes: additionalNotes || null,
        items: verifiedItems,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: process.env.PAYMENT_PROVIDER === "square" ? "square" : "mock",
        paymentId: paymentResult.paymentId,
      })
      .returning();

    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const staffPin = request.headers.get("x-staff-pin");
    if (!staffPin || staffPin !== process.env.STAFF_PIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    let result;

    if (status === "active") {
      result = await db
        .select()
        .from(orders)
        .where(
          inArray(orders.status, [
            "received",
            "preparing",
            "ready",
            "delivering",
          ])
        )
        .orderBy(sql`${orders.createdAt} asc`);
    } else {
      result = await db
        .select()
        .from(orders)
        .orderBy(sql`${orders.createdAt} asc`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing orders:", error);
    return NextResponse.json(
      { error: "Failed to list orders" },
      { status: 500 }
    );
  }
}
