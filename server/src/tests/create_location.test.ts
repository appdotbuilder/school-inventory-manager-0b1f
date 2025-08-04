
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateLocationInput = {
  room_name: 'Living Room',
  description: 'Main living area with TV and furniture'
};

// Test input with nullable description
const testInputNullDescription: CreateLocationInput = {
  room_name: 'Storage Room',
  description: null
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a location with description', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.room_name).toEqual('Living Room');
    expect(result.description).toEqual('Main living area with TV and furniture');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a location with null description', async () => {
    const result = await createLocation(testInputNullDescription);

    // Verify null description is handled correctly
    expect(result.room_name).toEqual('Storage Room');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save location to database', async () => {
    const result = await createLocation(testInput);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].room_name).toEqual('Living Room');
    expect(locations[0].description).toEqual('Main living area with TV and furniture');
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple locations', async () => {
    const location1 = await createLocation({
      room_name: 'Kitchen',
      description: 'Cooking area'
    });

    const location2 = await createLocation({
      room_name: 'Bedroom',
      description: 'Master bedroom'
    });

    expect(location1.id).not.toEqual(location2.id);
    expect(location1.room_name).toEqual('Kitchen');
    expect(location2.room_name).toEqual('Bedroom');
  });
});
