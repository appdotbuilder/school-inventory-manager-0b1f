
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type MonthlyReportInput, type CreateLocationInput } from '../schema';
import { getMonthlyReport } from '../handlers/get_monthly_report';
import { eq } from 'drizzle-orm';

// Test data
const testLocation: CreateLocationInput = {
  room_name: 'Test Room',
  description: 'A room for testing'
};

const testInput: MonthlyReportInput = {
  year: 2024,
  month: 3 // March 2024
};

describe('getMonthlyReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate report with no items', async () => {
    const result = await getMonthlyReport(testInput);

    expect(result.report_date).toEqual(new Date(2024, 2, 1)); // March 1, 2024
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
          name: 'March Item 1',
          category: 'electronic',
          serial_number: 'MAR001',
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 2, 15),
          notes: null,
          created_at: new Date(2024, 2, 15), // March 15, 2024
          updated_at: new Date(2024, 2, 15)
        },
        {
          name: 'March Item 2',
          category: 'pc',
          serial_number: 'MAR002',
          condition: 'damaged',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 2, 20),
          notes: null,
          created_at: new Date(2024, 2, 20), // March 20, 2024
          updated_at: new Date(2024, 2, 20)
        }
      ])
      .execute();

    // Add item before March (should not be counted as added in March)
    await db.insert(inventoryItemsTable)
      .values({
        name: 'February Item',
        category: 'furniture',
        serial_number: 'FEB001',
        condition: 'needs_repair',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date(2024, 1, 15),
        notes: null,
        created_at: new Date(2024, 1, 15), // February 15, 2024
        updated_at: new Date(2024, 1, 15)
      })
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(3); // All items created before April
    expect(result.items_added).toEqual(2); // Only items created in March
    expect(result.items_updated).toEqual(0); // No updates to existing items
  });

  it('should count items updated during the month', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add item before March
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        name: 'February Item',
        category: 'electronic',
        serial_number: 'FEB001',
        condition: 'good',
        location_id: locationId,
        location_details: null,
        brand: null,
        model: null,
        specifications: null,
        purchase_date: new Date(2024, 1, 15),
        notes: null,
        created_at: new Date(2024, 1, 15), // February 15, 2024
        updated_at: new Date(2024, 1, 15)
      })
      .returning()
      .execute();

    const itemId = itemResult[0].id;

    // Update the item in March
    await db.update(inventoryItemsTable)
      .set({
        condition: 'damaged',
        updated_at: new Date(2024, 2, 10) // March 10, 2024
      })
      .where(eq(inventoryItemsTable.id, itemId))
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(1);
    expect(result.items_added).toEqual(0);
    expect(result.items_updated).toEqual(1); // Item updated in March
  });

  it('should generate category and condition breakdowns', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add items with different categories and conditions
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'Electronic Good',
          category: 'electronic',
          serial_number: 'EG001',
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 2, 1),
          notes: null,
          created_at: new Date(2024, 2, 1),
          updated_at: new Date(2024, 2, 1)
        },
        {
          name: 'Electronic Damaged',
          category: 'electronic',
          serial_number: 'ED001',
          condition: 'damaged',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 2, 2),
          notes: null,
          created_at: new Date(2024, 2, 2),
          updated_at: new Date(2024, 2, 2)
        },
        {
          name: 'PC Needs Repair',
          category: 'pc',
          serial_number: 'PC001',
          condition: 'needs_repair',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 2, 3),
          notes: null,
          created_at: new Date(2024, 2, 3),
          updated_at: new Date(2024, 2, 3)
        }
      ])
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(3);
    expect(result.category_breakdown).toHaveLength(2);

    // Find electronic category summary
    const electronicSummary = result.category_breakdown.find(c => c.category === 'electronic');
    expect(electronicSummary).toBeDefined();
    expect(electronicSummary!.total_count).toEqual(2);
    expect(electronicSummary!.good_count).toEqual(1);
    expect(electronicSummary!.damaged_count).toEqual(1);
    expect(electronicSummary!.needs_repair_count).toEqual(0);

    // Find PC category summary
    const pcSummary = result.category_breakdown.find(c => c.category === 'pc');
    expect(pcSummary).toBeDefined();
    expect(pcSummary!.total_count).toEqual(1);
    expect(pcSummary!.good_count).toEqual(0);
    expect(pcSummary!.damaged_count).toEqual(0);
    expect(pcSummary!.needs_repair_count).toEqual(1);

    // Check overall condition breakdown
    expect(result.condition_breakdown.good).toEqual(1);
    expect(result.condition_breakdown.damaged).toEqual(1);
    expect(result.condition_breakdown.needs_repair).toEqual(1);
  });

  it('should exclude items created after the month', async () => {
    // Create location first
    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Add items in March and April
    await db.insert(inventoryItemsTable)
      .values([
        {
          name: 'March Item',
          category: 'electronic',
          serial_number: 'MAR001',
          condition: 'good',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 2, 15),
          notes: null,
          created_at: new Date(2024, 2, 15), // March 15, 2024
          updated_at: new Date(2024, 2, 15)
        },
        {
          name: 'April Item',
          category: 'pc',
          serial_number: 'APR001',
          condition: 'damaged',
          location_id: locationId,
          location_details: null,
          brand: null,
          model: null,
          specifications: null,
          purchase_date: new Date(2024, 3, 5),
          notes: null,
          created_at: new Date(2024, 3, 5), // April 5, 2024
          updated_at: new Date(2024, 3, 5)
        }
      ])
      .execute();

    const result = await getMonthlyReport(testInput);

    expect(result.total_items).toEqual(1); // Only March item
    expect(result.items_added).toEqual(1); // Only March item
    expect(result.category_breakdown).toHaveLength(1);
    expect(result.category_breakdown[0].category).toEqual('electronic');
  });
});
