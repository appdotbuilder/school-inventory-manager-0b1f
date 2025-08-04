
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type CreateLocationInput, type CreateInventoryItemInput } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

// Test location data
const testLocation: CreateLocationInput = {
  room_name: 'Office',
  description: 'Main office room'
};

const testLocation2: CreateLocationInput = {
  room_name: 'Storage',
  description: 'Storage room'
};

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard data when no items exist', async () => {
    const result = await getDashboardData();

    expect(result.total_items).toEqual(0);
    expect(result.category_summaries).toHaveLength(0);
    expect(result.condition_summary).toEqual({
      good: 0,
      damaged: 0,
      needs_repair: 0
    });
    expect(result.location_summaries).toHaveLength(0);
    expect(result.recent_items).toHaveLength(0);
  });

  it('should return correct dashboard data with inventory items', async () => {
    // Create locations first
    const locationResult1 = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    
    const locationResult2 = await db.insert(locationsTable)
      .values(testLocation2)
      .returning()
      .execute();

    const location1Id = locationResult1[0].id;
    const location2Id = locationResult2[0].id;

    // Create test inventory items
    const testItems: CreateInventoryItemInput[] = [
      {
        name: 'Laptop',
        category: 'electronic',
        serial_number: 'LP001',
        condition: 'good',
        location_id: location1Id,
        location_details: 'Desk 1',
        brand: 'Dell',
        model: 'XPS 13',
        specifications: '16GB RAM, 512GB SSD',
        purchase_date: new Date('2023-01-15'),
        notes: 'Primary work laptop'
      },
      {
        name: 'Desktop PC',
        category: 'pc',
        serial_number: 'PC001',
        condition: 'damaged',
        location_id: location1Id,
        location_details: 'Desk 2',
        brand: 'HP',
        model: 'ProDesk 400',
        specifications: '8GB RAM, 256GB SSD',
        purchase_date: new Date('2023-02-10'),
        notes: 'Screen flickering issue'
      },
      {
        name: 'Office Chair',
        category: 'furniture',
        serial_number: 'CH001',
        condition: 'needs_repair',
        location_id: location2Id,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2023-03-05'),
        notes: 'Broken wheel'
      },
      {
        name: 'Monitor',
        category: 'electronic',
        serial_number: 'MON001',
        condition: 'good',
        location_id: location2Id,
        location_details: 'Shelf A',
        brand: 'Samsung',
        model: '27" 4K',
        specifications: '3840x2160, 60Hz',
        purchase_date: new Date('2023-04-12'),
        notes: null
      }
    ];

    // Insert all test items
    for (const item of testItems) {
      await db.insert(inventoryItemsTable)
        .values({
          ...item,
          purchase_date: item.purchase_date
        })
        .execute();
    }

    const result = await getDashboardData();

    // Check total items
    expect(result.total_items).toEqual(4);

    // Check category summaries
    expect(result.category_summaries).toHaveLength(3);
    
    const electronicSummary = result.category_summaries.find(c => c.category === 'electronic');
    expect(electronicSummary).toBeDefined();
    expect(electronicSummary!.total_count).toEqual(2);
    expect(electronicSummary!.good_count).toEqual(2);
    expect(electronicSummary!.damaged_count).toEqual(0);
    expect(electronicSummary!.needs_repair_count).toEqual(0);

    const pcSummary = result.category_summaries.find(c => c.category === 'pc');
    expect(pcSummary).toBeDefined();
    expect(pcSummary!.total_count).toEqual(1);
    expect(pcSummary!.good_count).toEqual(0);
    expect(pcSummary!.damaged_count).toEqual(1);
    expect(pcSummary!.needs_repair_count).toEqual(0);

    const furnitureSummary = result.category_summaries.find(c => c.category === 'furniture');
    expect(furnitureSummary).toBeDefined();
    expect(furnitureSummary!.total_count).toEqual(1);
    expect(furnitureSummary!.good_count).toEqual(0);
    expect(furnitureSummary!.damaged_count).toEqual(0);
    expect(furnitureSummary!.needs_repair_count).toEqual(1);

    // Check condition summary
    expect(result.condition_summary).toEqual({
      good: 2,
      damaged: 1,
      needs_repair: 1
    });

    // Check location summaries
    expect(result.location_summaries).toHaveLength(2);
    
    const officeSummary = result.location_summaries.find(l => l.room_name === 'Office');
    expect(officeSummary).toBeDefined();
    expect(officeSummary!.location_id).toEqual(location1Id);
    expect(officeSummary!.total_items).toEqual(2);
    expect(officeSummary!.good_items).toEqual(1);
    expect(officeSummary!.damaged_items).toEqual(1);
    expect(officeSummary!.needs_repair_items).toEqual(0);

    const storageSummary = result.location_summaries.find(l => l.room_name === 'Storage');
    expect(storageSummary).toBeDefined();
    expect(storageSummary!.location_id).toEqual(location2Id);
    expect(storageSummary!.total_items).toEqual(2);
    expect(storageSummary!.good_items).toEqual(1);
    expect(storageSummary!.damaged_items).toEqual(0);
    expect(storageSummary!.needs_repair_items).toEqual(1);

    // Check recent items (should be ordered by created_at desc)
    expect(result.recent_items).toHaveLength(4);
    expect(result.recent_items[0].name).toEqual('Monitor'); // Most recent
    expect(result.recent_items[3].name).toEqual('Laptop'); // Oldest
    
    // Verify date fields are proper Date objects
    result.recent_items.forEach(item => {
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
      expect(item.purchase_date).toBeInstanceOf(Date);
    });
  });

  it('should limit recent items to 10', async () => {
    // Create a location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    
    const locationId = locationResult[0].id;

    // Create 15 test items
    for (let i = 1; i <= 15; i++) {
      await db.insert(inventoryItemsTable)
        .values({
          name: `Item ${i}`,
          category: 'electronic',
          serial_number: `SN${i.toString().padStart(3, '0')}`,
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
    }

    const result = await getDashboardData();

    expect(result.total_items).toEqual(15);
    expect(result.recent_items).toHaveLength(10); // Should be limited to 10
  });
});
