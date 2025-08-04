
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type CreateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

// Test inputs
const testLocationInput: CreateLocationInput = {
  room_name: 'Original Room',
  description: 'Original description'
};

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update location name only', async () => {
    // Create initial location
    const [createdLocation] = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      room_name: 'Updated Room Name'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.room_name).toEqual('Updated Room Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update description only', async () => {
    // Create initial location
    const [createdLocation] = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      description: 'Updated description'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.room_name).toEqual('Original Room'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create initial location
    const [createdLocation] = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      room_name: 'Completely New Room',
      description: 'Completely new description'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.room_name).toEqual('Completely New Room');
    expect(result.description).toEqual('Completely new description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create initial location
    const [createdLocation] = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      description: null
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.room_name).toEqual('Original Room'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create initial location
    const [createdLocation] = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      room_name: 'Database Updated Room'
    };

    await updateLocation(updateInput);

    // Verify changes were persisted
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].room_name).toEqual('Database Updated Room');
    expect(locations[0].description).toEqual('Original description');
  });

  it('should throw error when location does not exist', async () => {
    const updateInput: UpdateLocationInput = {
      id: 99999, // Non-existent ID
      room_name: 'Non-existent Room'
    };

    await expect(updateLocation(updateInput)).rejects.toThrow(/Location with id 99999 not found/i);
  });

  it('should handle location with null description', async () => {
    // Create location with null description
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        room_name: 'Room with no description',
        description: null
      })
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      room_name: 'Updated Room Name'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.room_name).toEqual('Updated Room Name');
    expect(result.description).toBeNull(); // Should remain null
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
