
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import { createInventoryItem } from '../handlers/create_inventory_item';
import { eq } from 'drizzle-orm';

describe('createInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test location
  const createTestLocation = async () => {
    const result = await db.insert(locationsTable)
      .values({
        room_name: 'Test Room',
        description: 'A room for testing'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create an inventory item', async () => {
    const location = await createTestLocation();
    
    const testInput: CreateInventoryItemInput = {
      name: 'Test Laptop',
      category: 'electronic',
      serial_number: 'SN123456',
      condition: 'good',
      location_id: location.id,
      location_details: 'Desk 1',
      brand: 'Dell',
      model: 'XPS 13',
      specifications: '16GB RAM, 512GB SSD',
      purchase_date: new Date('2023-01-15'),
      notes: 'Company laptop'
    };

    const result = await createInventoryItem(testInput);

    expect(result.name).toEqual('Test Laptop');
    expect(result.category).toEqual('electronic');
    expect(result.serial_number).toEqual('SN123456');
    expect(result.condition).toEqual('good');
    expect(result.location_id).toEqual(location.id);
    expect(result.location_details).toEqual('Desk 1');
    expect(result.brand).toEqual('Dell');
    expect(result.model).toEqual('XPS 13');
    expect(result.specifications).toEqual('16GB RAM, 512GB SSD');
    expect(result.purchase_date).toEqual(new Date('2023-01-15'));
    expect(result.notes).toEqual('Company laptop');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save inventory item to database', async () => {
    const location = await createTestLocation();
    
    const testInput: CreateInventoryItemInput = {
      name: 'Test PC',
      category: 'pc',
      serial_number: 'PC789012',
      condition: 'damaged',
      location_id: location.id,
      location_details: null,
      brand: 'HP',
      model: 'ProDesk',
      specifications: '8GB RAM, 256GB SSD',
      purchase_date: new Date('2022-06-10'),
      notes: null
    };

    const result = await createInventoryItem(testInput);

    const items = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Test PC');
    expect(items[0].category).toEqual('pc');
    expect(items[0].serial_number).toEqual('PC789012');
    expect(items[0].condition).toEqual('damaged');
    expect(items[0].location_id).toEqual(location.id);
    expect(items[0].location_details).toBeNull();
    expect(items[0].brand).toEqual('HP');
    expect(items[0].model).toEqual('ProDesk');
    expect(items[0].specifications).toEqual('8GB RAM, 256GB SSD');
    expect(items[0].purchase_date).toEqual(new Date('2022-06-10'));
    expect(items[0].notes).toBeNull();
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create furniture item with minimal data', async () => {
    const location = await createTestLocation();
    
    const testInput: CreateInventoryItemInput = {
      name: 'Office Chair',
      category: 'furniture',
      serial_number: 'CHAIR001',
      condition: 'needs_repair',
      location_id: location.id,
      location_details: null,
      brand: null,
      model: null,
      specifications: null,
      purchase_date: new Date('2021-03-20'),
      notes: null
    };

    const result = await createInventoryItem(testInput);

    expect(result.name).toEqual('Office Chair');
    expect(result.category).toEqual('furniture');
    expect(result.condition).toEqual('needs_repair');
    expect(result.location_details).toBeNull();
    expect(result.brand).toBeNull();
    expect(result.model).toBeNull();
    expect(result.specifications).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should throw error when location does not exist', async () => {
    const testInput: CreateInventoryItemInput = {
      name: 'Test Item',
      category: 'electronic',
      serial_number: 'INVALID001',
      condition: 'good',
      location_id: 999, // Non-existent location ID
      location_details: null,
      brand: null,
      model: null,
      specifications: null,
      purchase_date: new Date('2023-01-01'),
      notes: null
    };

    await expect(createInventoryItem(testInput)).rejects.toThrow(/location.*does not exist/i);
  });
});
