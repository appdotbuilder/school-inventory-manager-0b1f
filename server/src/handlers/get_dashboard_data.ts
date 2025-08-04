
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type DashboardData, type CategorySummary, type LocationSummary } from '../schema';
import { sql, eq, desc } from 'drizzle-orm';

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Get total items count
    const totalItemsResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(inventoryItemsTable)
    .execute();
    
    const total_items = Number(totalItemsResult[0]?.count || 0);

    // Get category summaries
    const categorySummariesResult = await db.select({
      category: inventoryItemsTable.category,
      total_count: sql<number>`count(*)`,
      good_count: sql<number>`count(*) filter (where condition = 'good')`,
      damaged_count: sql<number>`count(*) filter (where condition = 'damaged')`,
      needs_repair_count: sql<number>`count(*) filter (where condition = 'needs_repair')`
    })
    .from(inventoryItemsTable)
    .groupBy(inventoryItemsTable.category)
    .execute();

    const category_summaries: CategorySummary[] = categorySummariesResult.map(row => ({
      category: row.category,
      total_count: Number(row.total_count),
      good_count: Number(row.good_count),
      damaged_count: Number(row.damaged_count),
      needs_repair_count: Number(row.needs_repair_count)
    }));

    // Get condition summary
    const conditionSummaryResult = await db.select({
      condition: inventoryItemsTable.condition,
      count: sql<number>`count(*)`
    })
    .from(inventoryItemsTable)
    .groupBy(inventoryItemsTable.condition)
    .execute();

    const condition_summary = {
      good: 0,
      damaged: 0,
      needs_repair: 0
    };

    conditionSummaryResult.forEach(row => {
      condition_summary[row.condition] = Number(row.count);
    });

    // Get location summaries with joined location data
    const locationSummariesResult = await db.select({
      location_id: inventoryItemsTable.location_id,
      room_name: locationsTable.room_name,
      total_items: sql<number>`count(*)`,
      good_items: sql<number>`count(*) filter (where condition = 'good')`,
      damaged_items: sql<number>`count(*) filter (where condition = 'damaged')`,
      needs_repair_items: sql<number>`count(*) filter (where condition = 'needs_repair')`
    })
    .from(inventoryItemsTable)
    .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id))
    .groupBy(inventoryItemsTable.location_id, locationsTable.room_name)
    .execute();

    const location_summaries: LocationSummary[] = locationSummariesResult.map(row => ({
      location_id: row.location_id,
      room_name: row.room_name,
      total_items: Number(row.total_items),
      good_items: Number(row.good_items),
      damaged_items: Number(row.damaged_items),
      needs_repair_items: Number(row.needs_repair_items)
    }));

    // Get recent items (last 10 created)
    const recentItemsResult = await db.select()
      .from(inventoryItemsTable)
      .orderBy(desc(inventoryItemsTable.created_at))
      .limit(10)
      .execute();

    const recent_items = recentItemsResult.map(item => ({
      ...item,
      created_at: item.created_at,
      updated_at: item.updated_at,
      purchase_date: item.purchase_date
    }));

    return {
      total_items,
      category_summaries,
      condition_summary,
      location_summaries,
      recent_items
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
};
