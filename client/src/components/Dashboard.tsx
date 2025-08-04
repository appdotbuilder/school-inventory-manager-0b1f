
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, MapPin, AlertTriangle, CheckCircle, XCircle, Wrench } from 'lucide-react';
import type { DashboardData, InventoryItem } from '../../../server/src/schema';

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getDashboardData.query();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'damaged':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_repair':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'electronic':
        return 'bg-blue-100 text-blue-800';
      case 'pc':
        return 'bg-purple-100 text-purple-800';
      case 'furniture':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const totalConditionItems = dashboardData.condition_summary.good + 
    dashboardData.condition_summary.damaged + 
    dashboardData.condition_summary.needs_repair;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_items}</div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Condition</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.condition_summary.good}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalConditionItems > 0 
                ? `${Math.round((dashboardData.condition_summary.good / totalConditionItems) * 100)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.condition_summary.damaged + dashboardData.condition_summary.needs_repair}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.location_summaries.length}</div>
            <p className="text-xs text-muted-foreground">
              Active rooms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
            <CardDescription>Distribution of items by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.category_summaries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No categories available yet 📦
              </p>
            ) : (
              dashboardData.category_summaries.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(category.category)}>
                      {category.category.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{category.total_count}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {category.good_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {category.damaged_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Wrench className="h-3 w-3 text-orange-500" />
                      {category.needs_repair_count}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Location Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location Summary</CardTitle>
            <CardDescription>Items distribution across locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.location_summaries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No locations configured yet 🏫
              </p>
            ) : (
              dashboardData.location_summaries.map((location) => (
                <div key={location.location_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{location.room_name}</span>
                    </div>
                    <span className="text-sm font-medium">{location.total_items}</span>
                  </div>
                  {location.total_items > 0 && (
                    <div className="space-y-1">
                      <Progress 
                        value={(location.good_items / location.total_items) * 100} 
                        className="h-2"
                      />
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <span>Good: {location.good_items}</span>
                        <span>Damaged: {location.damaged_items}</span>
                        <span>Repair: {location.needs_repair_items}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Items</CardTitle>
          <CardDescription>Recently added inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recent_items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No recent items to display 📋
            </p>
          ) : (
            <div className="space-y-3">
              {dashboardData.recent_items.map((item: InventoryItem) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    {getConditionIcon(item.condition)}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.brand && `${item.brand} `}
                        {item.model && `${item.model} • `}
                        Serial: {item.serial_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.created_at.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
