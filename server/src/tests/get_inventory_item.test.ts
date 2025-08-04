
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { getInventoryItem } from '../handlers/get_inventory_item';

describe('getInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return inventory item when found', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Office',
        description: 'Main office room'
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create test inventory item
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'Test Laptop',
        category: 'electronic',
        serial_number: 'ABC123',
        condition: 'good',
        location_id: location.id,
        location_details: 'Desk 1',
        brand: 'Dell',
        model: 'XPS 13',
        specifications: '16GB RAM, 512GB SSD',
        purchase_date: new Date('2023-01-15'),
        notes: 'Primary work laptop'
      })
      .returning()
      .execute();

    const createdItem = itemResult[0];

    // Test the handler
    const result = await getInventoryItem(createdItem.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdItem.id);
    expect(result!.name).toEqual('Test Laptop');
    expect(result!.category).toEqual('electronic');
    expect(result!.serial_number).toEqual('ABC123');
    expect(result!.condition).toEqual('good');
    expect(result!.location_id).toEqual(location.id);
    expect(result!.location_details).toEqual('Desk 1');
    expect(result!.brand).toEqual('Dell');
    expect(result!.model).toEqual('XPS 13');
    expect(result!.specifications).toEqual('16GB RAM, 512GB SSD');
    expect(result!.purchase_date).toBeInstanceOf(Date);
    expect(result!.notes).toEqual('Primary work laptop');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when item not found', async () => {
    const result = await getInventoryItem(999);
    expect(result).toBeNull();
  });

  it('should handle items with null optional fields', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Storage',
        description: null
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create item with minimal required fields
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'Basic Chair',
        category: 'furniture',
        serial_number: 'CHAIR001',
        condition: 'damaged',
        location_id: location.id,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2022-06-01'),
        notes: null
      })
      .returning()
      .execute();

    const createdItem = itemResult[0];

    // Test the handler
    const result = await getInventoryItem(createdItem.id);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Basic Chair');
    expect(result!.category).toEqual('furniture');
    expect(result!.condition).toEqual('damaged');
    expect(result!.location_details).toBeNull();
    expect(result!.brand).toBeNull();
    expect(result!.model).toBeNull();
    expect(result!.specifications).toBeNull();
    expect(result!.notes).toBeNull();
  });

  it('should work with different categories and conditions', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Lab',
        description: 'Research lab'
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create PC item that needs repair
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'Gaming PC',
        category: 'pc',
        serial_number: 'PC-2023-001',
        condition: 'needs_repair',
        location_id: location.id,
        location_details: 'Workstation 3',
        brand: 'Custom Build',
        model: 'Gaming Rig v2',
        specifications: 'RTX 4080, 32GB RAM, 1TB NVMe',
        purchase_date: new Date('2023-03-20'),
        notes: 'GPU fan making noise'
      })
      .returning()
      .execute();

    const createdItem = itemResult[0];

    // Test the handler
    const result = await getInventoryItem(createdItem.id);

    expect(result).not.toBeNull();
    expect(result!.category).toEqual('pc');
    expect(result!.condition).toEqual('needs_repair');
    expect(result!.brand).toEqual('Custom Build');
    expect(result!.specifications).toEqual('RTX 4080, 32GB RAM, 1TB NVMe');
  });
});
