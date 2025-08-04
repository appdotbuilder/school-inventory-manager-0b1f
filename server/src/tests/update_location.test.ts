
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type CreateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestLocation = async (): Promise<number> => {
    const testLocationInput: CreateLocationInput = {
      room_name: 'Test Room',
      description: 'A room for testing'
    };

    const result = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    return result[0].id;
  };

  it('should update room_name only', async () => {
    const locationId = await createTestLocation();

    const updateInput: UpdateLocationInput = {
      id: locationId,
      room_name: 'Updated Room Name'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(locationId);
    expect(result.room_name).toEqual('Updated Room Name');
    expect(result.description).toEqual('A room for testing'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update description only', async () => {
    const locationId = await createTestLocation();

    const updateInput: UpdateLocationInput = {
      id: locationId,
      description: 'Updated description'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(locationId);
    expect(result.room_name).toEqual('Test Room'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both room_name and description', async () => {
    const locationId = await createTestLocation();

    const updateInput: UpdateLocationInput = {
      id: locationId,
      room_name: 'Completely New Room',
      description: 'Completely new description'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(locationId);
    expect(result.room_name).toEqual('Completely New Room');
    expect(result.description).toEqual('Completely new description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const locationId = await createTestLocation();

    const updateInput: UpdateLocationInput = {
      id: locationId,
      description: null
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(locationId);
    expect(result.room_name).toEqual('Test Room'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const locationId = await createTestLocation();

    const updateInput: UpdateLocationInput = {
      id: locationId,
      room_name: 'Database Test Room',
      description: 'Updated in database'
    };

    await updateLocation(updateInput);

    // Verify changes are persisted
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].room_name).toEqual('Database Test Room');
    expect(locations[0].description).toEqual('Updated in database');
  });

  it('should throw error for non-existent location', async () => {
    const updateInput: UpdateLocationInput = {
      id: 99999,
      room_name: 'Non-existent Room'
    };

    await expect(updateLocation(updateInput)).rejects.toThrow(/Location with id 99999 not found/i);
  });

  it('should handle location with null description initially', async () => {
    // Create location with null description
    const result = await db.insert(locationsTable)
      .values({
        room_name: 'Null Description Room',
        description: null
      })
      .returning()
      .execute();

    const locationId = result[0].id;

    const updateInput: UpdateLocationInput = {
      id: locationId,
      room_name: 'Updated Null Room'
    };

    const updatedLocation = await updateLocation(updateInput);

    expect(updatedLocation.room_name).toEqual('Updated Null Room');
    expect(updatedLocation.description).toBeNull(); // Should remain null
  });
});
