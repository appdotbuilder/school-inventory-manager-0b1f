
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteInventoryItem = async (id: number): Promise<void> => {
  try {
    // Delete the inventory item by ID
    const result = await db.delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    // Check if any rows were affected (item existed and was deleted)
    if (result.rowCount === 0) {
      throw new Error(`Inventory item with id ${id} not found`);
    }
  } catch (error) {
    console.error('Inventory item deletion failed:', error);
    throw error;
  }
};
