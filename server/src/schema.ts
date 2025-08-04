
import { z } from 'zod';

// Enums
export const categoryEnum = z.enum(['electronic', 'pc', 'furniture']);
export const conditionEnum = z.enum(['good', 'damaged', 'needs_repair']);

// Location schemas
export const locationSchema = z.object({
  id: z.number(),
  room_name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

export const createLocationInputSchema = z.object({
  room_name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

export const updateLocationInputSchema = z.object({
  id: z.number(),
  room_name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Inventory item schemas
export const inventoryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: categoryEnum,
  serial_number: z.string(),
  condition: conditionEnum,
  location_id: z.number(),
  location_details: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  specifications: z.string().nullable(),
  purchase_date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const createInventoryItemInputSchema = z.object({
  name: z.string().min(1),
  category: categoryEnum,
  serial_number: z.string().min(1),
  condition: conditionEnum,
  location_id: z.number(),
  location_details: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  specifications: z.string().nullable(),
  purchase_date: z.coerce.date(),
  notes: z.string().nullable()
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;

export const updateInventoryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  category: categoryEnum.optional(),
  serial_number: z.string().min(1).optional(),
  condition: conditionEnum.optional(),
  location_id: z.number().optional(),
  location_details: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  purchase_date: z.coerce.date().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemInputSchema>;

// Dashboard and reporting schemas
export const categorySummarySchema = z.object({
  category: categoryEnum,
  total_count: z.number(),
  good_count: z.number(),
  damaged_count: z.number(),
  needs_repair_count: z.number()
});

export type CategorySummary = z.infer<typeof categorySummarySchema>;

export const locationSummarySchema = z.object({
  location_id: z.number(),
  room_name: z.string(),
  total_items: z.number(),
  good_items: z.number(),
  damaged_items: z.number(),
  needs_repair_items: z.number()
});

export type LocationSummary = z.infer<typeof locationSummarySchema>;

export const dashboardDataSchema = z.object({
  total_items: z.number(),
  category_summaries: z.array(categorySummarySchema),
  condition_summary: z.object({
    good: z.number(),
    damaged: z.number(),
    needs_repair: z.number()
  }),
  location_summaries: z.array(locationSummarySchema),
  recent_items: z.array(inventoryItemSchema)
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;

export const monthlyReportInputSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12)
});

export type MonthlyReportInput = z.infer<typeof monthlyReportInputSchema>;

export const monthlyReportSchema = z.object({
  report_date: z.coerce.date(),
  total_items: z.number(),
  items_added: z.number(),
  items_updated: z.number(),
  category_breakdown: z.array(categorySummarySchema),
  condition_breakdown: z.object({
    good: z.number(),
    damaged: z.number(),
    needs_repair: z.number()
  })
});

export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
