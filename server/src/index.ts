
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createLocationInputSchema, 
  updateLocationInputSchema,
  createInventoryItemInputSchema,
  updateInventoryItemInputSchema,
  monthlyReportInputSchema
} from './schema';

// Import handlers
import { createLocation } from './handlers/create_location';
import { getLocations } from './handlers/get_locations';
import { updateLocation } from './handlers/update_location';
import { deleteLocation } from './handlers/delete_location';
import { createInventoryItem } from './handlers/create_inventory_item';
import { getInventoryItems } from './handlers/get_inventory_items';
import { getInventoryItem } from './handlers/get_inventory_item';
import { updateInventoryItem } from './handlers/update_inventory_item';
import { deleteInventoryItem } from './handlers/delete_inventory_item';
import { getDashboardData } from './handlers/get_dashboard_data';
import { getMonthlyReport } from './handlers/get_monthly_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Location management routes
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),
  
  getLocations: publicProcedure
    .query(() => getLocations()),
  
  updateLocation: publicProcedure
    .input(updateLocationInputSchema)
    .mutation(({ input }) => updateLocation(input)),
  
  deleteLocation: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteLocation(input)),

  // Inventory item management routes
  createInventoryItem: publicProcedure
    .input(createInventoryItemInputSchema)
    .mutation(({ input }) => createInventoryItem(input)),
  
  getInventoryItems: publicProcedure
    .query(() => getInventoryItems()),
  
  getInventoryItem: publicProcedure
    .input(z.number())
    .query(({ input }) => getInventoryItem(input)),
  
  updateInventoryItem: publicProcedure
    .input(updateInventoryItemInputSchema)
    .mutation(({ input }) => updateInventoryItem(input)),
  
  deleteInventoryItem: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteInventoryItem(input)),

  // Dashboard and reporting routes
  getDashboardData: publicProcedure
    .query(() => getDashboardData()),
  
  getMonthlyReport: publicProcedure
    .input(monthlyReportInputSchema)
    .query(({ input }) => getMonthlyReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
