
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const categoryEnum = pgEnum('category', ['electronic', 'pc', 'furniture']);
export const conditionEnum = pgEnum('condition', ['good', 'damaged', 'needs_repair']);

// Locations table
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  room_name: text('room_name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Inventory items table
export const inventoryItemsTable = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: categoryEnum('category').notNull(),
  serial_number: text('serial_number').notNull(),
  condition: conditionEnum('condition').notNull(),
  location_id: integer('location_id').notNull().references(() => locationsTable.id),
  location_details: text('location_details'), // Nullable - specific location within room
  brand: text('brand'), // Nullable - mainly for electronics/PCs
  model: text('model'), // Nullable - mainly for electronics/PCs
  specifications: text('specifications'), // Nullable - technical specs
  purchase_date: timestamp('purchase_date').notNull(),
  notes: text('notes'), // Nullable - additional notes
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const locationsRelations = relations(locationsTable, ({ many }) => ({
  items: many(inventoryItemsTable),
}));

export const inventoryItemsRelations = relations(inventoryItemsTable, ({ one }) => ({
  location: one(locationsTable, {
    fields: [inventoryItemsTable.location_id],
    references: [locationsTable.id],
  }),
}));

// TypeScript types for table schemas
export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
export type NewInventoryItem = typeof inventoryItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  locations: locationsTable, 
  inventoryItems: inventoryItemsTable 
};
