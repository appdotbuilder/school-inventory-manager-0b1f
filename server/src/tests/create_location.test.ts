
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateLocationInput = {
  room_name: 'Test Room',
  description: 'A room for testing'
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a location', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.room_name).toEqual('Test Room');
    expect(result.description).toEqual('A room for testing');
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
    expect(locations[0].room_name).toEqual('Test Room');
    expect(locations[0].description).toEqual('A room for testing');
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });

  it('should create a location with null description', async () => {
    const inputWithNullDescription: CreateLocationInput = {
      room_name: 'Storage Room',
      description: null
    };

    const result = await createLocation(inputWithNullDescription);

    // Basic field validation
    expect(result.room_name).toEqual('Storage Room');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save location with null description to database', async () => {
    const inputWithNullDescription: CreateLocationInput = {
      room_name: 'Storage Room',
      description: null
    };

    const result = await createLocation(inputWithNullDescription);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].room_name).toEqual('Storage Room');
    expect(locations[0].description).toBeNull();
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });
});
