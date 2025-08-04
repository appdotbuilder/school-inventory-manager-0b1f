
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { deleteInventoryItem } from '../handlers/delete_inventory_item';
import { eq } from 'drizzle-orm';

describe('deleteInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing inventory item', async () => {
    // Create a location first (required for foreign key)
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'A room for testing'
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create an inventory item
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'Test Item',
        category: 'electronic',
        serial_number: 'TEST123',
        condition: 'good',
        location_id: location.id,
        location_details: 'On desk',
        brand: 'TestBrand',
        model: 'TestModel',
        specifications: 'Test specs',
        purchase_date: new Date('2024-01-01'),
        notes: 'Test notes'
      })
      .returning()
      .execute();

    const item = itemResult[0];

    // Delete the inventory item
    await deleteInventoryItem(item.id);

    // Verify item was deleted
    const deletedItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, item.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent item', async () => {
    const nonExistentId = 999999;

    await expect(deleteInventoryItem(nonExistentId))
      .rejects.toThrow(/not found/i);
  });

  it('should not affect other items when deleting', async () => {
    // Create a location first
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'A room for testing'
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create two inventory items
    const item1Result = await db.insert(inventoryItemsTable)
      .values({
        name: 'Item 1',
        category: 'electronic',
        serial_number: 'ITEM001',
        condition: 'good',
        location_id: location.id,
        location_details: 'Shelf A',
        brand: 'Brand1',
        model: 'Model1',
        specifications: 'Specs 1',
        purchase_date: new Date('2024-01-01'),
        notes: 'Notes 1'
      })
      .returning()
      .execute();

    const item2Result = await db.insert(inventoryItemsTable)
      .values({
        name: 'Item 2',
        category: 'pc',
        serial_number: 'ITEM002',
        condition: 'damaged',
        location_id: location.id,
        location_details: 'Shelf B',
        brand: 'Brand2',
        model: 'Model2',
        specifications: 'Specs 2',
        purchase_date: new Date('2024-01-02'),
        notes: 'Notes 2'
      })
      .returning()
      .execute();

    const item1 = item1Result[0];
    const item2 = item2Result[0];

    // Delete only the first item
    await deleteInventoryItem(item1.id);

    // Verify first item is deleted
    const deletedItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, item1.id))
      .execute();

    expect(deletedItems).toHaveLength(0);

    // Verify second item still exists
    const remainingItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, item2.id))
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].name).toEqual('Item 2');
    expect(remainingItems[0].serial_number).toEqual('ITEM002');
  });
});
