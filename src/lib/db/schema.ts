import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),

  customerName: varchar("customer_name", { length: 100 }).notNull(),

  locationType: varchar("location_type", { length: 10 }).notNull(), // 'gps' | 'car' | 'counter'
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

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
