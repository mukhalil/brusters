import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  numeric,
  boolean,
  integer,
  date,
  index,
} from "drizzle-orm/pg-core";

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    slug: varchar("slug", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),

    customerContactName: varchar("customer_contact_name", { length: 100 }),
    customerContactPhone: varchar("customer_contact_phone", { length: 20 }),

    eventDate: date("event_date"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    paymentMode: varchar("payment_mode", { length: 20 }).notNull().default("prepaid"), // 'prepaid' | 'individual'
    maxOrdersPerGuest: integer("max_orders_per_guest"), // null = unlimited

    allowedCategoryIds: jsonb("allowed_category_ids"), // string[] | null (null = all)
    allowedItemIds: jsonb("allowed_item_ids"), // string[] | null
    allowedFlavorIds: jsonb("allowed_flavor_ids"), // string[] | null
    allowedExtraIds: jsonb("allowed_extra_ids"), // string[] | null

    status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft' | 'active' | 'paused' | 'closed'

    pickupInstructions: text("pickup_instructions"),

    // PIN that gates the read-only order summary share link for the host/contact.
    // Stored in cleartext: low-stakes 4–8 digit code that only protects revenue
    // tallies for an already-public-by-QR event.
    contactPin: varchar("contact_pin", { length: 12 }),

    // Branding
    brandName: varchar("brand_name", { length: 120 }),
    brandLogoUrl: text("brand_logo_url"),
    brandPrimaryColor: varchar("brand_primary_color", { length: 9 }),
    brandAccentColor: varchar("brand_accent_color", { length: 9 }),
    welcomeMessage: text("welcome_message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("events_slug_idx").on(table.slug),
    statusIdx: index("events_status_idx").on(table.status),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    customerName: varchar("customer_name", { length: 100 }).notNull(),

    locationType: varchar("location_type", { length: 10 }).notNull(), // 'gps' | 'car' | 'counter' | 'event'
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    carDescription: text("car_description"),
    phoneNumber: varchar("phone_number", { length: 20 }),
    additionalNotes: text("additional_notes"),

    items: jsonb("items").notNull(), // OrderItem[]
    subtotal: numeric("subtotal", { precision: 8, scale: 2 }).notNull(),
    tax: numeric("tax", { precision: 8, scale: 2 }).notNull(),
    total: numeric("total", { precision: 8, scale: 2 }).notNull(),

    status: varchar("status", { length: 20 }).notNull().default("received"),

    paymentMethod: varchar("payment_method", { length: 20 })
      .notNull()
      .default("mock"),
    paymentId: varchar("payment_id", { length: 100 }),

    // Event-mode fields (null for regular park-and-order)
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    queueNumber: integer("queue_number"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index("orders_event_id_idx").on(table.eventId),
  })
);

export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuItemAvailability = pgTable("menu_item_availability", {
  itemId: varchar("item_id", { length: 100 }).primaryKey(),
  available: boolean("available").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
