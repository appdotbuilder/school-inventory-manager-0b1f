
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { getLocations } from '../handlers/get_locations';

describe('getLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no locations exist', async () => {
    const result = await getLocations();
    expect(result).toEqual([]);
  });

  it('should return all locations', async () => {
    // Create test locations
    await db.insert(locationsTable)
      .values([
        {
          room_name: 'Living Room',
          description: 'Main living area'
        },
        {
          room_name: 'Kitchen',
          description: 'Cooking area'
        },
        {
          room_name: 'Office',
          description: null
        }
      ])
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(3);
    
    // Check structure and types
    result.forEach(location => {
      expect(location.id).toBeDefined();
      expect(typeof location.room_name).toBe('string');
      expect(location.created_at).toBeInstanceOf(Date);
      expect(location.description === null || typeof location.description === 'string').toBe(true);
    });

    // Check specific values
    const roomNames = result.map(loc => loc.room_name).sort();
    expect(roomNames).toEqual(['Kitchen', 'Living Room', 'Office']);
  });

  it('should return locations with correct field types', async () => {
    await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'Test description'
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    const location = result[0];
    
    expect(typeof location.id).toBe('number');
    expect(typeof location.room_name).toBe('string');
    expect(typeof location.description).toBe('string');
    expect(location.created_at).toBeInstanceOf(Date);
  });

  it('should handle locations with null descriptions', async () => {
    await db.insert(locationsTable)
      .values({
        room_name: 'Room Without Description',
        description: null
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].room_name).toBe('Room Without Description');
    expect(result[0].description).toBeNull();
  });
});
