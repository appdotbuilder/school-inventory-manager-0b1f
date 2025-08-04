
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

// Helper function to add delay between insertions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard data when no items exist', async () => {
    const result = await getDashboardData();

    expect(result.total_items).toEqual(0);
    expect(result.category_summaries).toEqual([]);
    expect(result.condition_summary).toEqual({
      good: 0,
      damaged: 0,
      needs_repair: 0
    });
    expect(result.location_summaries).toEqual([]);
    expect(result.recent_items).toEqual([]);
  });

  it('should return correct dashboard data with inventory items', async () => {
    // Create test locations
    const locationsResult = await db.insert(locationsTable)
      .values([
        { room_name: 'Office', description: 'Main office' },
        { room_name: 'Storage', description: 'Storage room' }
      ])
      .returning()
      .execute();

    const officeId = locationsResult[0].id;
    const storageId = locationsResult[1].id;

    // Create test inventory items with delays to ensure proper ordering
    await db.insert(inventoryItemsTable)
      .values({
        name: 'Laptop Dell',
        category: 'electronic',
        serial_number: 'DELL001',
        condition: 'good',
        location_id: officeId,
        location_details: 'Desk 1',
        brand: 'Dell',
        model: 'Inspiron',
        specifications: '8GB RAM, 256GB SSD',
        purchase_date: new Date('2023-01-15'),
        notes: 'Primary work laptop'
      })
      .execute();

    await delay(10);

    await db.insert(inventoryItemsTable)
      .values({
        name: 'Office Chair',
        category: 'furniture',
        serial_number: 'CHAIR001',
        condition: 'damaged',
        location_id: officeId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-02-01'),
        notes: 'Needs wheel replacement'
      })
      .execute();

    await delay(10);

    await db.insert(inventoryItemsTable)
      .values({
        name: 'Desktop PC',
        category: 'pc',
        serial_number: 'PC001',
        condition: 'needs_repair',
        location_id: storageId,
        location_details: 'Shelf A',
        brand: 'HP',
        model: 'EliteDesk',
        specifications: '16GB RAM, 512GB SSD',
        purchase_date: new Date('2023-01-20'),
        notes: 'Hard drive failure'
      })
      .execute();

    await delay(10);

    await db.insert(inventoryItemsTable)
      .values({
        name: 'Monitor',
        category: 'electronic',
        serial_number: 'MON001',
        condition: 'good',
        location_id: storageId,
        location_details: 'Shelf B',
        brand: 'Samsung',
        model: '24" LED',
        specifications: '1920x1080, 60Hz',
        purchase_date: new Date('2023-03-01'),
        notes: null
      })
      .execute();

    const result = await getDashboardData();

    // Test total items
    expect(result.total_items).toEqual(4);

    // Test category summaries
    expect(result.category_summaries).toHaveLength(3);
    
    const electronicSummary = result.category_summaries.find(c => c.category === 'electronic');
    expect(electronicSummary).toBeDefined();
    expect(electronicSummary!.total_count).toEqual(2);
    expect(electronicSummary!.good_count).toEqual(2);
    expect(electronicSummary!.damaged_count).toEqual(0);
    expect(electronicSummary!.needs_repair_count).toEqual(0);

    const furnitureSummary = result.category_summaries.find(c => c.category === 'furniture');
    expect(furnitureSummary).toBeDefined();
    expect(furnitureSummary!.total_count).toEqual(1);
    expect(furnitureSummary!.good_count).toEqual(0);
    expect(furnitureSummary!.damaged_count).toEqual(1);
    expect(furnitureSummary!.needs_repair_count).toEqual(0);

    const pcSummary = result.category_summaries.find(c => c.category === 'pc');
    expect(pcSummary).toBeDefined();
    expect(pcSummary!.total_count).toEqual(1);
    expect(pcSummary!.good_count).toEqual(0);
    expect(pcSummary!.damaged_count).toEqual(0);
    expect(pcSummary!.needs_repair_count).toEqual(1);

    // Test condition summary
    expect(result.condition_summary).toEqual({
      good: 2,
      damaged: 1,
      needs_repair: 1
    });

    // Test location summaries
    expect(result.location_summaries).toHaveLength(2);
    
    const officeSummary = result.location_summaries.find(l => l.location_id === officeId);
    expect(officeSummary).toBeDefined();
    expect(officeSummary!.room_name).toEqual('Office');
    expect(officeSummary!.total_items).toEqual(2);
    expect(officeSummary!.good_items).toEqual(1);
    expect(officeSummary!.damaged_items).toEqual(1);
    expect(officeSummary!.needs_repair_items).toEqual(0);

    const storageSummary = result.location_summaries.find(l => l.location_id === storageId);
    expect(storageSummary).toBeDefined();
    expect(storageSummary!.room_name).toEqual('Storage');
    expect(storageSummary!.total_items).toEqual(2);
    expect(storageSummary!.good_items).toEqual(1);
    expect(storageSummary!.damaged_items).toEqual(0);
    expect(storageSummary!.needs_repair_items).toEqual(1);

    // Test recent items (should be ordered by created_at desc)
    expect(result.recent_items).toHaveLength(4);
    expect(result.recent_items[0].name).toEqual('Monitor'); // Most recent
    expect(result.recent_items[0].created_at).toBeInstanceOf(Date);
    expect(result.recent_items[0].updated_at).toBeInstanceOf(Date);
    expect(result.recent_items[0].purchase_date).toBeInstanceOf(Date);
    
    // Verify ordering - more recent items should come first
    expect(result.recent_items[0].created_at >= result.recent_items[1].created_at).toBe(true);
    expect(result.recent_items[1].created_at >= result.recent_items[2].created_at).toBe(true);
    expect(result.recent_items[2].created_at >= result.recent_items[3].created_at).toBe(true);
  });

  it('should limit recent items to 5', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({ room_name: 'Test Room', description: null })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create 7 test items with delays to ensure proper ordering
    for (let i = 0; i < 7; i++) {
      await db.insert(inventoryItemsTable)
        .values({
          name: `Item ${i + 1}`,
          category: 'electronic',
          serial_number: `SERIAL${i + 1}`,
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
          notes: null
        })
        .execute();
      
      if (i < 6) await delay(10); // Add delay between insertions except for the last one
    }

    const result = await getDashboardData();

    expect(result.total_items).toEqual(7);
    expect(result.recent_items).toHaveLength(5);
    
    // Should be ordered by created_at desc, so most recent first
    expect(result.recent_items[0].name).toEqual('Item 7');
    expect(result.recent_items[4].name).toEqual('Item 3');
    
    // Verify all recent items are properly ordered
    for (let i = 0; i < 4; i++) {
      expect(result.recent_items[i].created_at >= result.recent_items[i + 1].created_at).toBe(true);
    }
  });

  it('should handle single location with multiple conditions', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({ room_name: 'Mixed Room', description: null })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create items with different conditions (individual insertions with delays)
    await db.insert(inventoryItemsTable)
      .values({
        name: 'Good Item',
        category: 'electronic',
        serial_number: 'GOOD001',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-01-01'),
        notes: null
      })
      .execute();

    await delay(10);

    await db.insert(inventoryItemsTable)
      .values({
        name: 'Damaged Item',
        category: 'electronic',
        serial_number: 'DAMAGED001',
        condition: 'damaged',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-01-02'),
        notes: null
      })
      .execute();

    await delay(10);

    await db.insert(inventoryItemsTable)
      .values({
        name: 'Repair Item',
        category: 'electronic',
        serial_number: 'REPAIR001',
        condition: 'needs_repair',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-01-03'),
        notes: null
      })
      .execute();

    const result = await getDashboardData();

    expect(result.location_summaries).toHaveLength(1);
    
    const locationSummary = result.location_summaries[0];
    expect(locationSummary.room_name).toEqual('Mixed Room');
    expect(locationSummary.total_items).toEqual(3);
    expect(locationSummary.good_items).toEqual(1);
    expect(locationSummary.damaged_items).toEqual(1);
    expect(locationSummary.needs_repair_items).toEqual(1);

    expect(result.condition_summary).toEqual({
      good: 1,
      damaged: 1,
      needs_repair: 1
    });
  });
});
