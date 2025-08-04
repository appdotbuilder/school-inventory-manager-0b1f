
import { db } from '../db';
import { inventoryItemsTable, locationsTable } from '../db/schema';
import { type MonthlyReportInput, type MonthlyReport, type CategorySummary } from '../schema';
import { gte, lt, count, eq, and, SQL } from 'drizzle-orm';

export const getMonthlyReport = async (input: MonthlyReportInput): Promise<MonthlyReport> => {
  try {
    // Create date range for the specified month
    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 1);

    // Get total items count at end of month
    const totalItemsResult = await db.select({
      count: count()
    })
    .from(inventoryItemsTable)
    .where(lt(inventoryItemsTable.created_at, endDate))
    .execute();

    const totalItems = totalItemsResult[0]?.count || 0;

    // Get items added during the month
    const itemsAddedResult = await db.select({
      count: count()
    })
    .from(inventoryItemsTable)
    .where(
      and(
        gte(inventoryItemsTable.created_at, startDate),
        lt(inventoryItemsTable.created_at, endDate)
      )
    )
    .execute();

    const itemsAdded = itemsAddedResult[0]?.count || 0;

    // Get items updated during the month (excluding items created in the same month)
    const itemsUpdatedResult = await db.select({
      count: count()
    })
    .from(inventoryItemsTable)
    .where(
      and(
        gte(inventoryItemsTable.updated_at, startDate),
        lt(inventoryItemsTable.updated_at, endDate),
        lt(inventoryItemsTable.created_at, startDate) // Exclude newly created items
      )
    )
    .execute();

    const itemsUpdated = itemsUpdatedResult[0]?.count || 0;

    // Get category breakdown of all items at end of month
    const categoryBreakdownResult = await db.select({
      category: inventoryItemsTable.category,
      total_count: count()
    })
    .from(inventoryItemsTable)
    .where(lt(inventoryItemsTable.created_at, endDate))
    .groupBy(inventoryItemsTable.category)
    .execute();

    // Get condition counts for each category
    const categoryConditionCounts = await Promise.all(
      categoryBreakdownResult.map(async (categoryRow) => {
        const conditions = await db.select({
          condition: inventoryItemsTable.condition,
          count: count()
        })
        .from(inventoryItemsTable)
        .where(
          and(
            eq(inventoryItemsTable.category, categoryRow.category),
            lt(inventoryItemsTable.created_at, endDate)
          )
        )
        .groupBy(inventoryItemsTable.condition)
        .execute();

        const conditionMap = conditions.reduce((acc, condition) => {
          acc[condition.condition] = condition.count;
          return acc;
        }, {} as Record<string, number>);

        return {
          category: categoryRow.category,
          total_count: categoryRow.total_count,
          good_count: conditionMap['good'] || 0,
          damaged_count: conditionMap['damaged'] || 0,
          needs_repair_count: conditionMap['needs_repair'] || 0
        };
      })
    );

    // Get overall condition breakdown
    const conditionBreakdownResult = await db.select({
      condition: inventoryItemsTable.condition,
      count: count()
    })
    .from(inventoryItemsTable)
    .where(lt(inventoryItemsTable.created_at, endDate))
    .groupBy(inventoryItemsTable.condition)
    .execute();

    const conditionBreakdown = conditionBreakdownResult.reduce((acc, row) => {
      acc[row.condition] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      report_date: startDate,
      total_items: totalItems,
      items_added: itemsAdded,
      items_updated: itemsUpdated,
      category_breakdown: categoryConditionCounts as CategorySummary[],
      condition_breakdown: {
        good: conditionBreakdown['good'] || 0,
        damaged: conditionBreakdown['damaged'] || 0,
        needs_repair: conditionBreakdown['needs_repair'] || 0
      }
    };
  } catch (error) {
    console.error('Monthly report generation failed:', error);
    throw error;
  }
};
