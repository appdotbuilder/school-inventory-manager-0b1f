
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    // Join inventory items with their locations to get complete data
    const results = await db.select()
      .from(inventoryItemsTable)
      .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id))
      .execute();

    // Map joined results to inventory item format
    return results.map(result => ({
      id: result.inventory_items.id,
      name: result.inventory_items.name,
      category: result.inventory_items.category,
      serial_number: result.inventory_items.serial_number,
      condition: result.inventory_items.condition,
      location_id: result.inventory_items.location_id,
      location_details: result.inventory_items.location_details,
      brand: result.inventory_items.brand,
      model: result.inventory_items.model,
      specifications: result.inventory_items.specifications,
      purchase_date: result.inventory_items.purchase_date,
      notes: result.inventory_items.notes,
      created_at: result.inventory_items.created_at,
      updated_at: result.inventory_items.updated_at
    }));
  } catch (error) {
    console.error('Failed to get inventory items:', error);
    throw error;
  }
};
