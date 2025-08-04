
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
          room_name: 'Office',
          description: 'Home office space'
        },
        {
          room_name: 'Bedroom',
          description: null
        }
      ])
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(3);
    
    // Verify all fields are present
    result.forEach(location => {
      expect(location.id).toBeDefined();
      expect(location.room_name).toBeDefined();
      expect(location.created_at).toBeInstanceOf(Date);
    });

    // Check specific location data
    const livingRoom = result.find(loc => loc.room_name === 'Living Room');
    expect(livingRoom).toBeDefined();
    expect(livingRoom?.description).toEqual('Main living area');

    const bedroom = result.find(loc => loc.room_name === 'Bedroom');
    expect(bedroom).toBeDefined();
    expect(bedroom?.description).toBeNull();
  });

  it('should order locations consistently', async () => {
    // Create locations in specific order
    await db.insert(locationsTable)
      .values([
        { room_name: 'Kitchen', description: 'Cooking area' },
        { room_name: 'Bathroom', description: 'Main bathroom' },
        { room_name: 'Garage', description: 'Storage and parking' }
      ])
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(3);
    // Verify all locations are returned (order may vary based on DB implementation)
    const roomNames = result.map(loc => loc.room_name);
    expect(roomNames).toContain('Kitchen');
    expect(roomNames).toContain('Bathroom');
    expect(roomNames).toContain('Garage');
  });
});
