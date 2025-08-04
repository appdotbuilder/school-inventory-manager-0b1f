
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type UpdateInventoryItemInput, type CreateInventoryItemInput } from '../schema';
import { updateInventoryItem } from '../handlers/update_inventory_item';
import { eq } from 'drizzle-orm';

// Helper to create a test location
const createTestLocation = async () => {
  const locationResult = await db.insert(locationsTable)
    .values({
      room_name: 'Test Room',
      description: 'A room for testing'
    })
    .returning()
    .execute();
  return locationResult[0];
};

// Helper to create a test inventory item
const createTestItem = async (locationId: number) => {
  const itemResult = await db.insert(inventoryItemsTable)
    .values({
      name: 'Original Item',
      category: 'electronic',
      serial_number: 'ORIG123',
      condition: 'good',
      location_id: locationId,
      location_details: 'Original location details',
      brand: 'Original Brand',
      model: 'Original Model',
      specifications: 'Original specs',
      purchase_date: new Date('2023-01-01'),
      notes: 'Original notes'
    })
    .returning()
    .execute();
  return itemResult[0];
};

describe('updateInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update inventory item with all fields', async () => {
    const location = await createTestLocation();
    const item = await createTestItem(location.id);

    const updateInput: UpdateInventoryItemInput = {
      id: item.id,
      name: 'Updated Item',
      category: 'pc',
      serial_number: 'UPD456',
      condition: 'damaged',
      location_id: location.id,
      location_details: 'Updated location details',
      brand: 'Updated Brand',
      model: 'Updated Model',
      specifications: 'Updated specs',
      purchase_date: new Date('2023-12-01'),
      notes: 'Updated notes'
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.id).toEqual(item.id);
    expect(result.name).toEqual('Updated Item');
    expect(result.category).toEqual('pc');
    expect(result.serial_number).toEqual('UPD456');
    expect(result.condition).toEqual('damaged');
    expect(result.location_id).toEqual(location.id);
    expect(result.location_details).toEqual('Updated location details');
    expect(result.brand).toEqual('Updated Brand');
    expect(result.model).toEqual('Updated Model');
    expect(result.specifications).toEqual('Updated specs');
    expect(result.purchase_date).toEqual(new Date('2023-12-01'));
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(item.created_at);
  });

  it('should update only specified fields', async () => {
    const location = await createTestLocation();
    const item = await createTestItem(location.id);

    const updateInput: UpdateInventoryItemInput = {
      id: item.id,
      name: 'Partially Updated Item',
      condition: 'needs_repair'
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.id).toEqual(item.id);
    expect(result.name).toEqual('Partially Updated Item');
    expect(result.condition).toEqual('needs_repair');
    // Other fields should remain unchanged
    expect(result.category).toEqual('electronic');
    expect(result.serial_number).toEqual('ORIG123');
    expect(result.brand).toEqual('Original Brand');
    expect(result.model).toEqual('Original Model');
    expect(result.specifications).toEqual('Original specs');
    expect(result.location_details).toEqual('Original location details');
    expect(result.notes).toEqual('Original notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated item to database', async () => {
    const location = await createTestLocation();
    const item = await createTestItem(location.id);

    const updateInput: UpdateInventoryItemInput = {
      id: item.id,
      name: 'Database Updated Item',
      category: 'furniture'
    };

    const result = await updateInventoryItem(updateInput);

    // Verify in database
    const dbItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, result.id))
      .execute();

    expect(dbItems).toHaveLength(1);
    expect(dbItems[0].name).toEqual('Database Updated Item');
    expect(dbItems[0].category).toEqual('furniture');
    expect(dbItems[0].updated_at).toBeInstanceOf(Date);
    expect(dbItems[0].updated_at > item.updated_at).toBe(true);
  });

  it('should update nullable fields to null', async () => {
    const location = await createTestLocation();
    const item = await createTestItem(location.id);

    const updateInput: UpdateInventoryItemInput = {
      id: item.id,
      brand: null,
      model: null,
      specifications: null,
      location_details: null,
      notes: null
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.brand).toBeNull();
    expect(result.model).toBeNull();
    expect(result.specifications).toBeNull();
    expect(result.location_details).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should throw error when item does not exist', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: 99999,
      name: 'Non-existent Item'
    };

    await expect(updateInventoryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when location does not exist', async () => {
    const location = await createTestLocation();
    const item = await createTestItem(location.id);

    const updateInput: UpdateInventoryItemInput = {
      id: item.id,
      location_id: 99999
    };

    await expect(updateInventoryItem(updateInput)).rejects.toThrow(/location.*not found/i);
  });

  it('should update location_id when valid location provided', async () => {
    const location1 = await createTestLocation();
    const item = await createTestItem(location1.id);

    // Create second location
    const location2Result = await db.insert(locationsTable)
      .values({
        room_name: 'Second Room',
        description: 'Another test room'
      })
      .returning()
      .execute();
    const location2 = location2Result[0];

    const updateInput: UpdateInventoryItemInput = {
      id: item.id,
      location_id: location2.id
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.location_id).toEqual(location2.id);

    // Verify in database
    const dbItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, result.id))
      .execute();

    expect(dbItems[0].location_id).toEqual(location2.id);
  });
});
