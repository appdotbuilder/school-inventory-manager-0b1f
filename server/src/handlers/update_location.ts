
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type Location } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLocation = async (input: UpdateLocationInput): Promise<Location> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof locationsTable.$inferInsert> = {};
    
    if (input.room_name !== undefined) {
      updateData.room_name = input.room_name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Perform update and return the updated record
    const result = await db.update(locationsTable)
      .set(updateData)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Location with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
};
