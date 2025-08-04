
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Package, AlertTriangle, CheckCircle, Wrench, Computer, Sofa, Zap } from 'lucide-react';
import type { DashboardData } from '../../../server/src/schema';

interface DashboardProps {
  data: DashboardData;
  onRefresh: () => void;
}

export function Dashboard({ data, onRefresh }: DashboardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electronic':
        return <Zap className="h-4 w-4" />;
      case 'pc':
        return <Computer className="h-4 w-4" />;
      case 'furniture':
        return <Sofa className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'damaged':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'needs_repair':
        return <Wrench className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const totalConditionItems = data.condition_summary.good + data.condition_summary.damaged + data.condition_summary.needs_repair;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Inventory Dashboard</h2>
          <p className="text-gray-600">Overview of your school assets</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_items}</div>
            <p className="text-blue-100 text-sm">Assets tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Good Condition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.condition_summary.good}</div>
            <p className="text-green-100 text-sm">Ready to use</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Damaged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.condition_summary.damaged}</div>
            <p className="text-yellow-100 text-sm">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Needs Repair
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.condition_summary.needs_repair}</div>
            <p className="text-red-100 text-sm">Requires fixing</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Items by Category
            </CardTitle>
            <CardDescription>
              Distribution of assets across categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.category_summaries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items in inventory yet</p>
            ) : (
              data.category_summaries.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.category)}
                      <span className="font-medium capitalize">{category.category}</span>
                    </div>
                    <Badge variant="secondary">{category.total_count} items</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Good: {category.good_count}</span>
                      <span className="text-yellow-600">Damaged: {category.damaged_count}</span>
                      <span className="text-red-600">Needs Repair: {category.needs_repair_count}</span>
                    </div>
                    <Progress 
                      value={category.total_count > 0 ? (category.good_count / category.total_count) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Location Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏠 Items by Location
            </CardTitle>
            <CardDescription>
              Asset distribution across school locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.location_summaries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No locations configured yet</p>
            ) : (
              data.location_summaries.map((location) => (
                <div key={location.location_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{location.room_name}</span>
                    </div>
                    <Badge variant="outline">{location.total_items} items</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {getConditionIcon('good')}
                      <span>{location.good_items}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getConditionIcon('damaged')}
                      <span>{location.damaged_items}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getConditionIcon('needs_repair')}
                      <span>{location.needs_repair_items}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Condition Overview */}
      {totalConditionItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔧 Overall Asset Condition</CardTitle>
            <CardDescription>
              Visual breakdown of asset conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex rounded-lg overflow-hidden h-8">
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(data.condition_summary.good / totalConditionItems) * 100}%` }}
                >
                  {data.condition_summary.good > 0 && `${data.condition_summary.good}`}
                </div>
                <div 
                  className="bg-yellow-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(data.condition_summary.damaged / totalConditionItems) * 100}%` }}
                >
                  {data.condition_summary.damaged > 0 && `${data.condition_summary.damaged}`}
                </div>
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(data.condition_summary.needs_repair / totalConditionItems) * 100}%` }}
                >
                  {data.condition_summary.needs_repair > 0 && `${data.condition_summary.needs_repair}`}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Good ({Math.round((data.condition_summary.good / totalConditionItems) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Damaged ({Math.round((data.condition_summary.damaged / totalConditionItems) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Needs Repair ({Math.round((data.condition_summary.needs_repair / totalConditionItems) * 100)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🕒 Recently Added Items
          </CardTitle>
          <CardDescription>
            Latest additions to the inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recent_items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent items</p>
          ) : (
            <div className="space-y-3">
              {data.recent_items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(item.category)}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.serial_number} • Added {item.created_at.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getConditionIcon(item.condition)}
                      <span className="text-sm capitalize">{item.condition.replace('_', ' ')}</span>
                    </div>
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
