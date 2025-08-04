
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { getInventoryItems } from '../handlers/get_inventory_items';

describe('getInventoryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getInventoryItems();
    expect(result).toEqual([]);
  });

  it('should return all inventory items with complete data', async () => {
    // Create test location first
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Office',
        description: 'Main office room'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create test inventory items
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Dell Laptop',
          category: 'pc',
          serial_number: 'DL001',
          condition: 'good',
          location_id: locationId,
          location_details: 'Desk 1',
          brand: 'Dell',
          model: 'Latitude 5520',
          specifications: '16GB RAM, 512GB SSD',
          purchase_date: new Date('2023-01-15'),
          notes: 'Primary work laptop'
        },
        {
          name: 'Office Chair',
          category: 'furniture',
          serial_number: 'CH001',
          condition: 'damaged',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2022-03-10'),
          notes: 'Needs new wheels'
        }
      ])
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(2);

    // Verify first item
    const laptop = result.find(item => item.name === 'Dell Laptop');
    expect(laptop).toBeDefined();
    expect(laptop!.category).toBe('pc');
    expect(laptop!.serial_number).toBe('DL001');
    expect(laptop!.condition).toBe('good');
    expect(laptop!.location_id).toBe(locationId);
    expect(laptop!.location_details).toBe('Desk 1');
    expect(laptop!.brand).toBe('Dell');
    expect(laptop!.model).toBe('Latitude 5520');
    expect(laptop!.specifications).toBe('16GB RAM, 512GB SSD');
    expect(laptop!.purchase_date).toBeInstanceOf(Date);
    expect(laptop!.notes).toBe('Primary work laptop');
    expect(laptop!.id).toBeDefined();
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    // Verify second item
    const chair = result.find(item => item.name === 'Office Chair');
    expect(chair).toBeDefined();
    expect(chair!.category).toBe('furniture');
    expect(chair!.serial_number).toBe('CH001');
    expect(chair!.condition).toBe('damaged');
    expect(chair!.location_id).toBe(locationId);
    expect(chair!.location_details).toBeNull();
    expect(chair!.brand).toBeNull();
    expect(chair!.model).toBeNull();
    expect(chair!.specifications).toBeNull();
    expect(chair!.purchase_date).toBeInstanceOf(Date);
    expect(chair!.notes).toBe('Needs new wheels');
  });

  it('should handle multiple locations correctly', async () => {
    // Create multiple locations
    const locations = await db.insert(locationsTable)
      .values([
        { room_name: 'Office', description: 'Main office' },
        { room_name: 'Storage', description: 'Storage room' }
      ])
      .returning()
      .execute();

    // Create items in different locations
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Monitor',
          category: 'electronic',
          serial_number: 'MON001',
          condition: 'good',
          location_id: locations[0].id,
          location_details: 'Desk 1',
          brand: 'Samsung',
          model: 'U28E590D',
          specifications: '28" 4K',
          purchase_date: new Date('2023-02-01'),
          notes: null
        },
        {
          name: 'Old Printer',
          category: 'electronic',
          serial_number: 'PR001',
          condition: 'needs_repair',
          location_id: locations[1].id,
          location_details: 'Shelf B',
          brand: 'HP',
          model: 'LaserJet',
          specifications: null,
          purchase_date: new Date('2020-05-15'),
          notes: 'Paper jam issue'
        }
      ])
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(2);
    
    const monitor = result.find(item => item.name === 'Monitor');
    const printer = result.find(item => item.name === 'Old Printer');

    expect(monitor!.location_id).toBe(locations[0].id);
    expect(printer!.location_id).toBe(locations[1].id);
  });
});
