
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getInventoryItem = async (id: number): Promise<InventoryItem | null> => {
  try {
    // Query with location join for complete data
    const results = await db.select()
      .from(inventoryItemsTable)
      .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id))
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract inventory item data from joined result
    const result = results[0];
    const inventoryItem = result.inventory_items;

    return {
      id: inventoryItem.id,
      name: inventoryItem.name,
      category: inventoryItem.category,
      serial_number: inventoryItem.serial_number,
      condition: inventoryItem.condition,
      location_id: inventoryItem.location_id,
      location_details: inventoryItem.location_details,
      brand: inventoryItem.brand,
      model: inventoryItem.model,
      specifications: inventoryItem.specifications,
      purchase_date: inventoryItem.purchase_date,
      notes: inventoryItem.notes,
      created_at: inventoryItem.created_at,
      updated_at: inventoryItem.updated_at
    };
  } catch (error) {
    console.error('Failed to get inventory item:', error);
    throw error;
  }
};
