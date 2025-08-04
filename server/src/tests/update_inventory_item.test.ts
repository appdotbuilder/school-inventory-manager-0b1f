
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type UpdateInventoryItemInput, type CreateLocationInput, type CreateInventoryItemInput } from '../schema';
import { updateInventoryItem } from '../handlers/update_inventory_item';
import { eq } from 'drizzle-orm';

describe('updateInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let locationId: number;
  let itemId: number;

  beforeEach(async () => {
    // Create a test location
    const locationInput: CreateLocationInput = {
      room_name: 'Test Room',
      description: 'A room for testing'
    };

    const locationResult = await db.insert(locationsTable)
      .values(locationInput)
      .returning()
      .execute();

    locationId = locationResult[0].id;

    // Create a test inventory item
    const itemInput: CreateInventoryItemInput = {
      name: 'Test Item',
      category: 'electronic',
      serial_number: 'TEST123',
      condition: 'good',
      location_id: locationId,
      location_details: 'On desk',
      brand: 'TestBrand',
      model: 'TestModel',
      specifications: 'Test specs',
      purchase_date: new Date('2023-01-01'),
      notes: 'Test notes'
    };

    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        ...itemInput,
        purchase_date: itemInput.purchase_date
      })
      .returning()
      .execute();

    itemId = itemResult[0].id;
  });

  it('should update inventory item with all fields', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: itemId,
      name: 'Updated Item',
      category: 'pc',
      serial_number: 'UPDATED123',
      condition: 'damaged',
      location_id: locationId,
      location_details: 'Updated location',
      brand: 'UpdatedBrand',
      model: 'UpdatedModel',
      specifications: 'Updated specs',
      purchase_date: new Date('2023-06-01'),
      notes: 'Updated notes'
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.id).toEqual(itemId);
    expect(result.name).toEqual('Updated Item');
    expect(result.category).toEqual('pc');
    expect(result.serial_number).toEqual('UPDATED123');
    expect(result.condition).toEqual('damaged');
    expect(result.location_id).toEqual(locationId);
    expect(result.location_details).toEqual('Updated location');
    expect(result.brand).toEqual('UpdatedBrand');
    expect(result.model).toEqual('UpdatedModel');
    expect(result.specifications).toEqual('Updated specs');
    expect(result.purchase_date).toEqual(new Date('2023-06-01'));
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: itemId,
      name: 'Partially Updated Item',
      condition: 'needs_repair'
    };

    const result = await updateInventoryItem(updateInput);

    // Updated fields
    expect(result.name).toEqual('Partially Updated Item');
    expect(result.condition).toEqual('needs_repair');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Unchanged fields
    expect(result.category).toEqual('electronic');
    expect(result.serial_number).toEqual('TEST123');
    expect(result.location_id).toEqual(locationId);
    expect(result.brand).toEqual('TestBrand');
    expect(result.model).toEqual('TestModel');
  });

  it('should save updated item to database', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: itemId,
      name: 'Database Updated Item',
      category: 'furniture'
    };

    const result = await updateInventoryItem(updateInput);

    // Verify in database
    const items = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, itemId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Database Updated Item');
    expect(items[0].category).toEqual('furniture');
    expect(items[0].updated_at).toBeInstanceOf(Date);
    expect(items[0].updated_at.getTime()).toBeGreaterThan(items[0].created_at.getTime());
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: itemId,
      location_details: null,
      brand: null,
      model: null,
      specifications: null,
      notes: null
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.location_details).toBeNull();
    expect(result.brand).toBeNull();
    expect(result.model).toBeNull();
    expect(result.specifications).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should throw error for non-existent item', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: 99999,
      name: 'Non-existent Item'
    };

    expect(updateInventoryItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error for non-existent location', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: itemId,
      location_id: 99999
    };

    expect(updateInventoryItem(updateInput)).rejects.toThrow(/location.*not found/i);
  });

  it('should validate location exists when updating location_id', async () => {
    // Create another location
    const newLocationResult = await db.insert(locationsTable)
      .values({
        room_name: 'New Room',
        description: 'Another room'
      })
      .returning()
      .execute();

    const newLocationId = newLocationResult[0].id;

    const updateInput: UpdateInventoryItemInput = {
      id: itemId,
      location_id: newLocationId
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.location_id).toEqual(newLocationId);

    // Verify in database
    const items = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, itemId))
      .execute();

    expect(items[0].location_id).toEqual(newLocationId);
  });
});
