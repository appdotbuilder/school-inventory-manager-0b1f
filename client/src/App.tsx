
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InventoryManagement } from '@/components/InventoryManagement';
import { LocationManagement } from '@/components/LocationManagement';
import { Dashboard } from '@/components/Dashboard';
import { ReportsPanel } from '@/components/ReportsPanel';
import { Package, MapPin, BarChart3, FileText, Shield } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">School Inventory Management</h1>
            <Badge variant="secondary" className="ml-auto">Administrator Panel</Badge>
          </div>
          <p className="text-gray-600">
            Manage school assets, track equipment conditions, and monitor inventory across all locations 📚
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
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

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Inventory Overview
                </CardTitle>
                <CardDescription>
                  Real-time insights into your school's asset inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Inventory Management
                </CardTitle>
                <CardDescription>
                  Add, edit, and track school assets including electronics, PCs, and furniture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Location Management
                </CardTitle>
                <CardDescription>
                  Manage rooms and locations where inventory items are stored
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Reports & Analytics
                </CardTitle>
                <CardDescription>
                  Generate monthly reports and analyze inventory trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
