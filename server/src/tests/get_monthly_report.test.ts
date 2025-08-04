
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type MonthlyReportInput } from '../schema';
import { getMonthlyReport } from '../handlers/get_monthly_report';
import { eq } from 'drizzle-orm';

const testLocation = {
  room_name: 'Test Room',
  description: 'A test location'
};

const testInput: MonthlyReportInput = {
  year: 2024,
  month: 3
};

describe('getMonthlyReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate empty report for month with no items', async () => {
    const result = await getMonthlyReport(testInput);

    expect(result.report_date).toEqual(new Date(2024, 2, 1)); // March 1st, 2024
    expect(result.total_items).toEqual(0);
    expect(result.items_added).toEqual(0);
    expect(result.items_updated).toEqual(0);
    expect(result.category_breakdown).toHaveLength(0);
    expect(result.condition_breakdown.good).toEqual(0);
    expect(result.condition_breakdown.damaged).toEqual(0);
    expect(result.condition_breakdown.needs_repair).toEqual(0);
  });

  it('should count items added during the month', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add items in March 2024
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Test Item 1',
          category: 'electronic',
          serial_number: 'SN001',
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2024-03-15'),
          notes: null,
          created_at: new Date('2024-03-15'),
          updated_at: new Date('2024-03-15')
        },
        {
          name: 'Test Item 2',
          category: 'pc',
          serial_number: 'SN002',
          condition: 'damaged',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2024-03-20'),
          notes: null,
          created_at: new Date('2024-03-20'),
          updated_at: new Date('2024-03-20')
        }
      ])
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(2);
    expect(result.items_added).toEqual(2);
    expect(result.items_updated).toEqual(0);
    expect(result.category_breakdown).toHaveLength(2);
  });

  it('should distinguish between items added and updated', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add item in February (before target month)
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'Old Item',
        category: 'furniture',
        serial_number: 'SN001',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2024-02-15'),
        notes: null,
        created_at: new Date('2024-02-15'),
        updated_at: new Date('2024-02-15')
      })
      .returning()
      .execute();

    // Update the item in March
    await db.update(inventoryItemsTable)
      .set({
        condition: 'needs_repair',
        updated_at: new Date('2024-03-10')
      })
      .where(eq(inventoryItemsTable.id, itemResult[0].id))
      .execute();

    // Add new item in March
    await db.insert(inventoryItemsTable)
      .values({
        name: 'New Item',
        category: 'electronic',
        serial_number: 'SN002',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2024-03-15'),
        notes: null,
        created_at: new Date('2024-03-15'),
        updated_at: new Date('2024-03-15')
      })
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(2);
    expect(result.items_added).toEqual(1);
    expect(result.items_updated).toEqual(1);
  });

  it('should generate category and condition breakdowns', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add diverse items
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Good Electronic',
          category: 'electronic',
          serial_number: 'SN001',
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2024-03-01'),
          notes: null,
          created_at: new Date('2024-03-01'),
          updated_at: new Date('2024-03-01')
        },
        {
          name: 'Damaged Electronic',
          category: 'electronic',
          serial_number: 'SN002',
          condition: 'damaged',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2024-03-02'),
          notes: null,
          created_at: new Date('2024-03-02'),
          updated_at: new Date('2024-03-02')
        },
        {
          name: 'Good PC',
          category: 'pc',
          serial_number: 'SN003',
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date('2024-03-03'),
          notes: null,
          created_at: new Date('2024-03-03'),
          updated_at: new Date('2024-03-03')
        }
      ])
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(3);
    expect(result.category_breakdown).toHaveLength(2);
    
    const electronicCategory = result.category_breakdown.find(c => c.category === 'electronic');
    expect(electronicCategory).toBeDefined();
    expect(electronicCategory!.total_count).toEqual(2);
    expect(electronicCategory!.good_count).toEqual(1);
    expect(electronicCategory!.damaged_count).toEqual(1);
    expect(electronicCategory!.needs_repair_count).toEqual(0);

    const pcCategory = result.category_breakdown.find(c => c.category === 'pc');
    expect(pcCategory).toBeDefined();
    expect(pcCategory!.total_count).toEqual(1);
    expect(pcCategory!.good_count).toEqual(1);
    expect(pcCategory!.damaged_count).toEqual(0);
    expect(pcCategory!.needs_repair_count).toEqual(0);

    expect(result.condition_breakdown.good).toEqual(2);
    expect(result.condition_breakdown.damaged).toEqual(1);
    expect(result.condition_breakdown.needs_repair).toEqual(0);
  });

  it('should only count items created before end of month', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add item in March
    await db.insert(inventoryItemsTable)
      .values({
        name: 'March Item',
        category: 'electronic',
        serial_number: 'SN001',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2024-03-15'),
        notes: null,
        created_at: new Date('2024-03-15'),
        updated_at: new Date('2024-03-15')
      })
      .execute();

    // Add item in April (should not be counted)
    await db.insert(inventoryItemsTable)
      .values({
        name: 'April Item',
        category: 'pc',
        serial_number: 'SN002',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date('2024-04-01'),
        notes: null,
        created_at: new Date('2024-04-01'),
        updated_at: new Date('2024-04-01')
      })
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(1);
    expect(result.items_added).toEqual(1);
    expect(result.category_breakdown).toHaveLength(1);
    expect(result.category_breakdown[0].category).toEqual('electronic');
  });
});
