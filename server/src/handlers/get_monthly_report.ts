
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type MonthlyReportInput, type MonthlyReport, type CategorySummary } from '../schema';
import { sql, gte, lt, and, eq } from 'drizzle-orm';

export const getMonthlyReport = async (input: MonthlyReportInput): Promise<MonthlyReport> => {
  try {
    // Calculate date boundaries for the month
    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 1);

    // Get total items count as of end of month
    const totalItemsResult = await db.select({
      count: sql<string>`count(*)::text`
    })
    .from(inventoryItemsTable)
    .where(lt(inventoryItemsTable.created_at, endDate))
    .execute();

    const totalItems = parseInt(totalItemsResult[0].count);

    // Get items added during the month
    const itemsAddedResult = await db.select({
      count: sql<string>`count(*)::text`
    })
    .from(inventoryItemsTable)
    .where(
      and(
        gte(inventoryItemsTable.created_at, startDate),
        lt(inventoryItemsTable.created_at, endDate)
      )
    )
    .execute();

    const itemsAdded = parseInt(itemsAddedResult[0].count);

    // Get items updated during the month (but not created in the same month)
    const itemsUpdatedResult = await db.select({
      count: sql<string>`count(*)::text`
    })
    .from(inventoryItemsTable)
    .where(
      and(
        gte(inventoryItemsTable.updated_at, startDate),
        lt(inventoryItemsTable.updated_at, endDate),
        lt(inventoryItemsTable.created_at, startDate)
      )
    )
    .execute();

    const itemsUpdated = parseInt(itemsUpdatedResult[0].count);

    // Get category breakdown for items existing at end of month
    const categoryBreakdownResult = await db.select({
      category: inventoryItemsTable.category,
      condition: inventoryItemsTable.condition,
      count: sql<string>`count(*)::text`
    })
    .from(inventoryItemsTable)
    .where(lt(inventoryItemsTable.created_at, endDate))
    .groupBy(inventoryItemsTable.category, inventoryItemsTable.condition)
    .execute();

    // Aggregate category data
    const categoryMap = new Map<string, CategorySummary>();
    
    for (const row of categoryBreakdownResult) {
      const category = row.category;
      const condition = row.condition;
      const count = parseInt(row.count);

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
      summary.total_count += count;

      switch (condition) {
        case 'good':
          summary.good_count += count;
          break;
        case 'damaged':
          summary.damaged_count += count;
          break;
        case 'needs_repair':
          summary.needs_repair_count += count;
          break;
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values());

    // Calculate condition breakdown
    let goodCount = 0;
    let damagedCount = 0;
    let needsRepairCount = 0;

    for (const summary of categoryBreakdown) {
      goodCount += summary.good_count;
      damagedCount += summary.damaged_count;
      needsRepairCount += summary.needs_repair_count;
    }

    return {
      report_date: startDate,
      total_items: totalItems,
      items_added: itemsAdded,
      items_updated: itemsUpdated,
      category_breakdown: categoryBreakdown,
      condition_breakdown: {
        good: goodCount,
        damaged: damagedCount,
        needs_repair: needsRepairCount
      }
    };
  } catch (error) {
    console.error('Monthly report generation failed:', error);
    throw error;
  }
};
