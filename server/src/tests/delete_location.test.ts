
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { deleteLocation } from '../handlers/delete_location';
import { eq } from 'drizzle-orm';

describe('deleteLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing location', async () => {
    // Create a location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'A room for testing'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Delete the location
    await deleteLocation(locationId);

    // Verify location is deleted
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(0);
  });

  it('should throw error when location does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteLocation(nonExistentId))
      .rejects
      .toThrow(/not found/i);
  });

  it('should prevent deletion when location has inventory items', async () => {
    // Create a location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Office',
        description: 'Main office room'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create an inventory item in this location
    await db.insert(inventoryItemsTable)
      .values({
        name: 'Office Chair',
        category: 'furniture',
        serial_number: 'CHAIR-001',
        condition: 'good',
        location_id: locationId,
        location_details: 'Next to desk',
        brand: 'OfficeMax',
        model: 'Comfort Pro',
        specifications: 'Ergonomic with lumbar support',
        purchase_date: new Date('2023-01-15'),
        notes: 'Black leather chair'
      })
      .execute();

    // Attempt to delete location should fail
    await expect(deleteLocation(locationId))
      .rejects
      .toThrow(/cannot delete location.*inventory items/i);

    // Verify location still exists
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].room_name).toEqual('Office');
  });

  it('should provide specific count in error message', async () => {
    // Create a location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Storage Room',
        description: 'Storage area'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create multiple inventory items in this location
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Laptop',
          category: 'electronic',
          serial_number: 'LAP-001',
          condition: 'good',
          location_id: locationId,
          location_details: 'Shelf A',
          brand: 'Dell',
          model: 'Latitude',
          specifications: 'Intel i5, 8GB RAM',
          purchase_date: new Date('2023-03-01'),
          notes: 'Company laptop'
        },
        {
          name: 'Monitor',
          category: 'electronic',
          serial_number: 'MON-001',
          condition: 'good',
          location_id: locationId,
          location_details: 'Shelf B',
          brand: 'Samsung',
          model: '24 inch',
          specifications: '1920x1080 resolution',
          purchase_date: new Date('2023-03-01'),
          notes: 'Secondary monitor'
        }
      ])
      .execute();

    // Attempt to delete should fail with specific count
    await expect(deleteLocation(locationId))
      .rejects
      .toThrow(/2 inventory items/i);
  });
});
