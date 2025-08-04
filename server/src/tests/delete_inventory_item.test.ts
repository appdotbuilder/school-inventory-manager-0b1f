
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type CreateLocationInput, type CreateInventoryItemInput } from '../schema';
import { deleteInventoryItem } from '../handlers/delete_inventory_item';
import { eq } from 'drizzle-orm';

// Test data setup
const testLocationInput: CreateLocationInput = {
  room_name: 'Test Room',
  description: 'A room for testing'
};

const testInventoryItemInput: CreateInventoryItemInput = {
  name: 'Test Laptop',
  category: 'electronic',
  serial_number: 'TEST123',
  condition: 'good',
  location_id: 1, // Will be set after location creation
  location_details: 'Desk area',
  brand: 'TestBrand',
  model: 'TestModel',
  specifications: 'Test specs',
  purchase_date: new Date('2023-01-01'),
  notes: 'Test notes'
};

describe('deleteInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing inventory item', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    // Create inventory item to delete
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        ...testInventoryItemInput,
        location_id: locationResult[0].id
      })
      .returning()
      .execute();

    const itemId = itemResult[0].id;

    // Delete the item
    await deleteInventoryItem(itemId);

    // Verify item no longer exists
    const deletedItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, itemId))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent item', async () => {
    const nonExistentId = 99999;

    expect(deleteInventoryItem(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should not affect other inventory items', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values(testLocationInput)
      .returning()
      .execute();

    // Create two inventory items
    const item1Result = await db.insert(inventoryItemsTable)
      .values({
        ...testInventoryItemInput,
        location_id: locationResult[0].id,
        name: 'Test Item 1',
        serial_number: 'TEST001'
      })
      .returning()
      .execute();

    const item2Result = await db.insert(inventoryItemsTable)
      .values({
        ...testInventoryItemInput,
        location_id: locationResult[0].id,
        name: 'Test Item 2',
        serial_number: 'TEST002'
      })
      .returning()
      .execute();

    const item1Id = item1Result[0].id;
    const item2Id = item2Result[0].id;

    // Delete first item
    await deleteInventoryItem(item1Id);

    // Verify first item is deleted
    const deletedItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, item1Id))
      .execute();

    expect(deletedItems).toHaveLength(0);

    // Verify second item still exists
    const remainingItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, item2Id))
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].name).toEqual('Test Item 2');
  });
});
