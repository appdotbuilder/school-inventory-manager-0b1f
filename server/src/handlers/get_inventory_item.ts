
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getInventoryItem = async (id: number): Promise<InventoryItem | null> => {
  try {
    // Query with join to get complete item data including location info
    const results = await db.select()
      .from(inventoryItemsTable)
      .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id))
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract the inventory item data from joined result
    const result = results[0];
    const item = result.inventory_items;

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      serial_number: item.serial_number,
      condition: item.condition,
      location_id: item.location_id,
      location_details: item.location_details,
      brand: item.brand,
      model: item.model,
      specifications: item.specifications,
      purchase_date: item.purchase_date,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  } catch (error) {
    console.error('Failed to get inventory item:', error);
    throw error;
  }
};
