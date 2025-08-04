
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { getInventoryItem } from '../handlers/get_inventory_item';

describe('getInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an inventory item by id', async () => {
    // Create a location first
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'A test location'
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
        location_details: 'On the desk',
        brand: 'TestBrand',
        model: 'TestModel',
        specifications: 'Test specs',
        purchase_date: new Date('2023-01-15'),
        notes: 'Test notes'
      })
      .returning()
      .execute();

    const item = itemResult[0];

    // Test getting the item
    const result = await getInventoryItem(item.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(item.id);
    expect(result!.name).toEqual('Test Item');
    expect(result!.category).toEqual('electronic');
    expect(result!.serial_number).toEqual('TEST123');
    expect(result!.condition).toEqual('good');
    expect(result!.location_id).toEqual(location.id);
    expect(result!.location_details).toEqual('On the desk');
    expect(result!.brand).toEqual('TestBrand');
    expect(result!.model).toEqual('TestModel');
    expect(result!.specifications).toEqual('Test specs');
    expect(result!.purchase_date).toBeInstanceOf(Date);
    expect(result!.notes).toEqual('Test notes');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent item', async () => {
    const result = await getInventoryItem(999);
    expect(result).toBeNull();
  });

  it('should handle items with nullable fields', async () => {
    // Create a location first
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: null
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create an inventory item with minimal required fields
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'Minimal Item',
        category: 'furniture',
        serial_number: 'MIN123',
        condition: 'needs_repair',
        location_id: location.id,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-06-01'),
        notes: null
      })
      .returning()
      .execute();

    const item = itemResult[0];

    // Test getting the item
    const result = await getInventoryItem(item.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(item.id);
    expect(result!.name).toEqual('Minimal Item');
    expect(result!.category).toEqual('furniture');
    expect(result!.condition).toEqual('needs_repair');
    expect(result!.location_details).toBeNull();
    expect(result!.brand).toBeNull();
    expect(result!.model).toBeNull();
    expect(result!.specifications).toBeNull();
    expect(result!.notes).toBeNull();
  });
});
