
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { eq, count } from 'drizzle-orm';

export const deleteLocation = async (id: number): Promise<void> => {
  try {
    // Check if location exists
    const existingLocations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, id))
      .execute();

    if (existingLocations.length === 0) {
      throw new Error(`Location with id ${id} not found`);
    }

    // Check if location has inventory items
    const itemCount = await db.select({ count: count() })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.location_id, id))
      .execute();

    if (itemCount[0].count > 0) {
      throw new Error(`Cannot delete location: ${itemCount[0].count} inventory items are assigned to this location`);
    }

    // Delete the location
    await db.delete(locationsTable)
      .where(eq(locationsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Location deletion failed:', error);
    throw error;
  }
};
