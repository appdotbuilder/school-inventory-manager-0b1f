
import { db } from '../db';
import { locationsTable, inventoryItemsTable } from '../db/schema';
import { type DashboardData, type CategorySummary, type LocationSummary } from '../schema';
import { sql, desc, eq } from 'drizzle-orm';

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Get total items count
    const totalItemsResult = await db.select({
      count: sql<number>`count(*)::int`
    })
    .from(inventoryItemsTable)
    .execute();

    const totalItems = totalItemsResult[0]?.count || 0;

    // Get category summaries with condition breakdown
    const categoryResults = await db.select({
      category: inventoryItemsTable.category,
      condition: inventoryItemsTable.condition,
      count: sql<number>`count(*)::int`
    })
    .from(inventoryItemsTable)
    .groupBy(inventoryItemsTable.category, inventoryItemsTable.condition)
    .execute();

    // Process category summaries
    const categoryMap = new Map<string, CategorySummary>();
    
    categoryResults.forEach(row => {
      const category = row.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category: category as any,
          total_count: 0,
          good_count: 0,
          damaged_count: 0,
          needs_repair_count: 0
        });
      }
      
      const summary = categoryMap.get(category)!;
      summary.total_count += row.count;
      
      switch (row.condition) {
        case 'good':
          summary.good_count += row.count;
          break;
        case 'damaged':
          summary.damaged_count += row.count;
          break;
        case 'needs_repair':
          summary.needs_repair_count += row.count;
          break;
      }
    });

    const categorySummaries = Array.from(categoryMap.values());

    // Get overall condition summary
    const conditionResults = await db.select({
      condition: inventoryItemsTable.condition,
      count: sql<number>`count(*)::int`
    })
    .from(inventoryItemsTable)
    .groupBy(inventoryItemsTable.condition)
    .execute();

    const conditionSummary = {
      good: 0,
      damaged: 0,
      needs_repair: 0
    };

    conditionResults.forEach(row => {
      conditionSummary[row.condition] = row.count;
    });

    // Get location summaries with condition breakdown
    const locationResults = await db.select({
      location_id: inventoryItemsTable.location_id,
      room_name: locationsTable.room_name,
      condition: inventoryItemsTable.condition,
      count: sql<number>`count(*)::int`
    })
    .from(inventoryItemsTable)
    .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id))
    .groupBy(inventoryItemsTable.location_id, locationsTable.room_name, inventoryItemsTable.condition)
    .execute();

    // Process location summaries
    const locationMap = new Map<number, LocationSummary>();
    
    locationResults.forEach(row => {
      const locationId = row.location_id;
      if (!locationMap.has(locationId)) {
        locationMap.set(locationId, {
          location_id: locationId,
          room_name: row.room_name,
          total_items: 0,
          good_items: 0,
          damaged_items: 0,
          needs_repair_items: 0
        });
      }
      
      const summary = locationMap.get(locationId)!;
      summary.total_items += row.count;
      
      switch (row.condition) {
        case 'good':
          summary.good_items += row.count;
          break;
        case 'damaged':
          summary.damaged_items += row.count;
          break;
        case 'needs_repair':
          summary.needs_repair_items += row.count;
          break;
      }
    });

    const locationSummaries = Array.from(locationMap.values());

    // Get recent items (last 5 created items)
    const recentItemsResults = await db.select()
      .from(inventoryItemsTable)
      .orderBy(desc(inventoryItemsTable.created_at))
      .limit(5)
      .execute();

    const recentItems = recentItemsResults.map(item => ({
      ...item,
      created_at: item.created_at!,
      updated_at: item.updated_at!,
      purchase_date: item.purchase_date!
    }));

    return {
      total_items: totalItems,
      category_summaries: categorySummaries,
      condition_summary: conditionSummary,
      location_summaries: locationSummaries,
      recent_items: recentItems
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
};
