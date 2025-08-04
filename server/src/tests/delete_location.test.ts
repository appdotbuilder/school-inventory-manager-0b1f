
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type CreateLocationInput, type CreateInventoryItemInput } from '../schema';
import { deleteLocation } from '../handlers/delete_location';
import { eq } from 'drizzle-orm';

describe('deleteLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a location successfully', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'A room for testing deletion'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Verify location exists
    const beforeDelete = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete the location
    await deleteLocation(locationId);

    // Verify location is deleted
    const afterDelete = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should throw error when location does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteLocation(nonExistentId)).rejects.toThrow(/location with id 999 not found/i);
  });

  it('should prevent deletion when location has inventory items', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Office',
        description: 'Office with equipment'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create an inventory item in this location
    await db.insert(inventoryItemsTable)
      .values({
        name: 'Test Computer',
        category: 'electronic',
        serial_number: 'TC001',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: 'TestBrand',
        model: 'TestModel',
        specifications: null,
        purchase_date: new Date('2023-01-01'),
        notes: null
      })
      .execute();

    // Attempt to delete location should fail
    await expect(deleteLocation(locationId)).rejects.toThrow(/cannot delete location.*inventory items are assigned/i);

    // Verify location still exists
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();
    expect(locations).toHaveLength(1);
  });

  it('should provide accurate count in error message', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Storage Room',
        description: 'Room with multiple items'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create multiple inventory items in this location
    const items = [
      {
        name: 'Item 1',
        category: 'electronic' as const,
        serial_number: 'IT001',
        condition: 'good' as const,
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-01-01'),
        notes: null
      },
      {
        name: 'Item 2',
        category: 'furniture' as const,
        serial_number: 'IT002',
        condition: 'damaged' as const,
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-01-02'),
        notes: null
      },
      {
        name: 'Item 3',
        category: 'pc' as const,
        serial_number: 'IT003',
        condition: 'needs_repair' as const,
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-01-03'),
        notes: null
      }
    ];

    await db.insert(inventoryItemsTable)
      .values(items)
      .execute();

    // Attempt to delete location should fail with accurate count
    await expect(deleteLocation(locationId)).rejects.toThrow(/3 inventory items are assigned/);
  });
});
