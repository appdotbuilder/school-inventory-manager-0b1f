
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Package, MapPin, BarChart3, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { Dashboard } from '@/components/Dashboard';
import { InventoryManager } from '@/components/InventoryManager';
import { LocationManager } from '@/components/LocationManager';
import { ReportsManager } from '@/components/ReportsManager';
// Using type-only imports for better TypeScript compliance
import type { InventoryItem, Location, DashboardData } from '../../server/src/schema';

function App() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsResult, locationsResult, dashboardResult] = await Promise.all([
        trpc.getInventoryItems.query(),
        trpc.getLocations.query(),
        trpc.getDashboardData.query()
      ]);
      
      setInventoryItems(itemsResult);
      setLocations(locationsResult);
      setDashboardData(dashboardResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <School className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏫 School Inventory Management System
              </h1>
              <p className="text-gray-600">
                Track and manage school assets efficiently
              </p>
            </div>
          </div>
          
          {isLoading && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
              <p className="text-blue-800">📊 Loading inventory data...</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {dashboardData ? (
              <Dashboard 
                data={dashboardData}
                onRefresh={refreshData}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>
                    Overview of your school inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Loading dashboard data...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryManager
              items={inventoryItems}
              locations={locations}
              onRefresh={refreshData}
            />
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <LocationManager
              locations={locations}
              onRefresh={refreshData}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsManager />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>🔒 Administrator Access Only • School Inventory System v1.0</p>
        </div>
      </div>
    </div>
  );
}

export default App;
