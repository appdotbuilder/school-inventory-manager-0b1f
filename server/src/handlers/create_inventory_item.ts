
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type CreateInventoryItemInput, type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createInventoryItem = async (input: CreateInventoryItemInput): Promise<InventoryItem> => {
  try {
    // Verify location exists before creating inventory item
    const location = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.location_id))
      .execute();

    if (location.length === 0) {
      throw new Error(`Location with id ${input.location_id} does not exist`);
    }

    // Insert inventory item record
    const result = await db.insert(inventoryItemsTable)
      .values({
        name: input.name,
        category: input.category,
        serial_number: input.serial_number,
        condition: input.condition,
        location_id: input.location_id,
        location_details: input.location_details,
        brand: input.brand,
        model: input.model,
        specifications: input.specifications,
        purchase_date: input.purchase_date,
        notes: input.notes
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inventory item creation failed:', error);
    throw error;
  }
};
