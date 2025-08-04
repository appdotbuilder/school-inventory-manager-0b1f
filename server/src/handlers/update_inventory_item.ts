
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type UpdateInventoryItemInput, type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInventoryItem = async (input: UpdateInventoryItemInput): Promise<InventoryItem> => {
  try {
    // First verify the item exists
    const existingItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, input.id))
      .execute();

    if (existingItems.length === 0) {
      throw new Error(`Inventory item with id ${input.id} not found`);
    }

    // If location_id is being updated, verify the location exists
    if (input.location_id !== undefined) {
      const locations = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.location_id))
        .execute();

      if (locations.length === 0) {
        throw new Error(`Location with id ${input.location_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.serial_number !== undefined) updateData.serial_number = input.serial_number;
    if (input.condition !== undefined) updateData.condition = input.condition;
    if (input.location_id !== undefined) updateData.location_id = input.location_id;
    if (input.location_details !== undefined) updateData.location_details = input.location_details;
    if (input.brand !== undefined) updateData.brand = input.brand;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.specifications !== undefined) updateData.specifications = input.specifications;
    if (input.purchase_date !== undefined) updateData.purchase_date = input.purchase_date;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Update the inventory item
    const result = await db.update(inventoryItemsTable)
      .set(updateData)
      .where(eq(inventoryItemsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inventory item update failed:', error);
    throw error;
  }
};
