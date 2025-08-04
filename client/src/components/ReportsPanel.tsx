
import { useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar, TrendingUp, Package, CheckCircle, XCircle, Wrench } from 'lucide-react';
import type { MonthlyReport, CategorySummary } from '../../../server/src/schema';

export function ReportsPanel() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getMonthlyReport.query({
        year: selectedYear,
        month: selectedMonth
      });
      setReport(result);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

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

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'damaged':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_repair':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportReport = () => {
    if (!report) return;

    const monthName = months.find(m => m.value === selectedMonth)?.label;
    const reportData = {
      title: `Inventory Report - ${monthName} ${selectedYear}`,
      generated: new Date().toLocaleString(),
      report_date: report.report_date.toLocaleDateString(),
      summary: {
        total_items: report.total_items,
        items_added: report.items_added,
        items_updated: report.items_updated
      },
      condition_breakdown: report.condition_breakdown,
      category_breakdown: report.category_breakdown
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `inventory-report-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Generate Monthly Report
          </CardTitle>
          <CardDescription>
            Select a month and year to generate a detailed inventory report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value: string) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Month</Label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value: string) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
            {report && (
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Monthly Report - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardTitle>
              <CardDescription>
                Report generated for: {report.report_date.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{report.total_items}</div>
                  <p className="text-sm text-gray-600">Total Items</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.items_added}</div>
                  <p className="text-sm text-gray-600">Items Added</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{report.items_updated}</div>
                  <p className="text-sm text-gray-600">Items Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
                <CardDescription>Distribution by item category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.category_breakdown.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No category data available 📦
                  </p>
                ) : (
                  report.category_breakdown.map((category: CategorySummary) => (
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
                          Good: {category.good_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          Damaged: {category.damaged_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-orange-500" />
                          Repair: {category.needs_repair_count}
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Condition Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Condition Summary</CardTitle>
                <CardDescription>Overall condition status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                    <div className="flex items-center gap-2">
                      {getConditionIcon('good')}
                      <span className="font-medium">Good Condition</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {report.condition_breakdown.good}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                    <div className="flex items-center gap-2">
                      {getConditionIcon('damaged')}
                      <span className="font-medium">Damaged</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {report.condition_breakdown.damaged}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-md">
                    <div className="flex items-center gap-2">
                      {getConditionIcon('needs_repair')}
                      <span className="font-medium">Needs Repair</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {report.condition_breakdown.needs_repair}
                    </span>
                  </div>
                </div>

                {/* Condition Percentage */}
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Health Score</p>
                  {report.total_items > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(report.condition_breakdown.good / report.total_items) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round((report.condition_breakdown.good / report.total_items) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!report && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              Select a month and year, then click "Generate Report" to view detailed analytics 📊
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
