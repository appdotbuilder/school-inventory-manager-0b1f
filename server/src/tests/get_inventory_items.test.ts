
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

  it('should return all inventory items', async () => {
    // Create test location first
    const locationResult = await db.insert(locationsTable)
      .values({
        room_name: 'Office',
        description: 'Main office room'
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create test inventory items
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Dell Laptop',
          category: 'electronic',
          serial_number: 'DL001',
          condition: 'good',
          location_id: location.id,
          location_details: 'Desk 1',
          brand: 'Dell',
          model: 'Inspiron 15',
          specifications: '16GB RAM, 512GB SSD',
          purchase_date: new Date('2023-01-15'),
          notes: 'Primary work laptop'
        },
        {
          name: 'Office Chair',
          category: 'furniture',
          serial_number: 'OC001',
          condition: 'damaged',
          location_id: location.id,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2022-06-10'),
          notes: 'Needs wheel replacement'
        }
      ])
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(2);
    
    // Check first item (Dell Laptop)
    const laptop = result.find(item => item.name === 'Dell Laptop');
    expect(laptop).toBeDefined();
    expect(laptop!.category).toEqual('electronic');
    expect(laptop!.serial_number).toEqual('DL001');
    expect(laptop!.condition).toEqual('good');
    expect(laptop!.location_id).toEqual(location.id);
    expect(laptop!.location_details).toEqual('Desk 1');
    expect(laptop!.brand).toEqual('Dell');
    expect(laptop!.model).toEqual('Inspiron 15');
    expect(laptop!.specifications).toEqual('16GB RAM, 512GB SSD');
    expect(laptop!.purchase_date).toBeInstanceOf(Date);
    expect(laptop!.notes).toEqual('Primary work laptop');
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    // Check second item (Office Chair)
    const chair = result.find(item => item.name === 'Office Chair');
    expect(chair).toBeDefined();
    expect(chair!.category).toEqual('furniture');
    expect(chair!.serial_number).toEqual('OC001');
    expect(chair!.condition).toEqual('damaged');
    expect(chair!.location_id).toEqual(location.id);
    expect(chair!.location_details).toBeNull();
    expect(chair!.brand).toBeNull();
    expect(chair!.model).toBeNull();
    expect(chair!.specifications).toBeNull();
    expect(chair!.purchase_date).toBeInstanceOf(Date);
    expect(chair!.notes).toEqual('Needs wheel replacement');
  });

  it('should handle items from multiple locations', async () => {
    // Create multiple test locations
    const locationResults = await db.insert(locationsTable)
      .values([
        { room_name: 'Office', description: 'Main office' },
        { room_name: 'Storage', description: 'Storage room' }
      ])
      .returning()
      .execute();

    const [office, storage] = locationResults;

    // Create items in different locations
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Desktop PC',
          category: 'pc',
          serial_number: 'PC001',
          condition: 'good',
          location_id: office.id,
          location_details: 'Workstation 1',
          brand: 'HP',
          model: 'ProDesk 600',
          specifications: '32GB RAM, 1TB SSD',
          purchase_date: new Date('2023-03-20'),
          notes: null
        },
        {
          name: 'Spare Monitor',
          category: 'electronic',
          serial_number: 'MON001',
          condition: 'needs_repair',
          location_id: storage.id,
          location_details: 'Shelf B',
          brand: 'Samsung',
          model: '24 inch',
          specifications: '1920x1080',
          purchase_date: new Date('2022-11-05'),
          notes: 'Screen flickering issue'
        }
      ])
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(2);
    
    const pc = result.find(item => item.name === 'Desktop PC');
    const monitor = result.find(item => item.name === 'Spare Monitor');
    
    expect(pc!.location_id).toEqual(office.id);
    expect(monitor!.location_id).toEqual(storage.id);
    
    // Verify different conditions are handled
    expect(pc!.condition).toEqual('good');
    expect(monitor!.condition).toEqual('needs_repair');
  });
});
