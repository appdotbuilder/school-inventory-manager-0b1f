
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Search, Edit, Trash2, Computer, Zap, Sofa, Package, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { InventoryItem, Location, CreateInventoryItemInput, UpdateInventoryItemInput } from '../../../server/src/schema';

interface InventoryManagerProps {
  items: InventoryItem[];
  locations: Location[];
  onRefresh: () => void;
}

export function InventoryManager({ items, locations, onRefresh }: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateInventoryItemInput>({
    name: '',
    category: 'electronic',
    serial_number: '',
    condition: 'good',
    location_id: 0,
    location_details: null,
    brand: null,
    model: null,
    specifications: null,
    purchase_date: new Date(),
    notes: null
  });

  // Filter items based on search and filters
  const filteredItems = items.filter((item: InventoryItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    const matchesLocation = locationFilter === 'all' || item.location_id.toString() === locationFilter;

    return matchesSearch && matchesCategory && matchesCondition && matchesLocation;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'electronic',
      serial_number: '',
      condition: 'good',
      location_id: locations.length > 0 ? locations[0].id : 0,
      location_details: null,
      brand: null,
      model: null,
      specifications: null,
      purchase_date: new Date(),
      notes: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serial_number || formData.location_id === 0) return;

    setIsLoading(true);
    try {
      await trpc.createInventoryItem.mutate(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsLoading(true);
    try {
      const updateData: UpdateInventoryItemInput = {
        id: editingItem.id,
        ...formData
      };
      await trpc.updateInventoryItem.mutate(updateData);
      setEditingItem(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteInventoryItem.mutate(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      serial_number: item.serial_number,
      condition: item.condition,
      location_id: item.location_id,
      location_details: item.location_details,
      brand: item.brand,
      model: item.model,
      specifications: item.specifications,
      purchase_date: item.purchase_date,
      notes: item.notes
    });
  };

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

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'good':
        return 'default';
      case 'damaged':
        return 'secondary';
      case 'needs_repair':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLocationName = (locationId: number) => {
    const location = locations.find((l: Location) => l.id === locationId);
    return location ? location.room_name : 'Unknown Location';
  };

  const InventoryForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Dell Laptop, Office Chair"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial_number">Serial Number *</Label>
          <Input
            id="serial_number"
            value={formData.serial_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, serial_number: e.target.value }))
            }
            placeholder="e.g., ABC123456"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value: 'electronic' | 'pc' | 'furniture') =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronic">📱 Electronic</SelectItem>
              <SelectItem value="pc">💻 PC</SelectItem>
              <SelectItem value="furniture">🪑 Furniture</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">Condition *</Label>
          <Select
            value={formData.condition}
            onValueChange={(value: 'good' | 'damaged' | 'needs_repair') =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, condition: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">✅ Good</SelectItem>
              <SelectItem value="damaged">⚠️ Damaged</SelectItem>
              <SelectItem value="needs_repair">🔧 Needs Repair</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_id">Location *</Label>
          <Select
            value={formData.location_id > 0 ? formData.location_id.toString() : ''}
            onValueChange={(value: string) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, location_id: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location: Location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  🏠 {location.room_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_details">Location Details</Label>
        <Input
          id="location_details"
          value={formData.location_details || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ 
              ...prev, 
              location_details: e.target.value || null 
            }))
          }
          placeholder="e.g., Shelf A, Desk 3, Corner"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ 
                ...prev, 
                brand: e.target.value || null 
              }))
            }
            placeholder="e.g., Dell, HP, IKEA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ 
                ...prev, 
                model: e.target.value || null 
              }))
            }
            placeholder="e.g., Latitude 5520, Markus"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchase_date">Purchase Date *</Label>
        <Input
          id="purchase_date"
          type="date"
          value={formData.purchase_date.toISOString().split('T')[0]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ 
              ...prev, 
              purchase_date: new Date(e.target.value) 
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specifications">Specifications</Label>
        <Textarea
          id="specifications"
          value={formData.specifications || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ 
              ...prev, 
              specifications: e.target.value || null 
            }))
          }
          placeholder="e.g., Intel i5, 8GB RAM, 256GB SSD"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          placeholder="Additional notes or observations"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitText}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📦 Inventory Management</h2>
          <p className="text-gray-600">Manage your school assets</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>➕ Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new asset to your school inventory
              </DialogDescription>
            </DialogHeader>
            <InventoryForm onSubmit={handleCreate} submitText="Add Item" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronic">📱 Electronic</SelectItem>
                <SelectItem value="pc">💻 PC</SelectItem>
                <SelectItem value="furniture">🪑 Furniture</SelectItem>
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="good">✅ Good</SelectItem>
                <SelectItem value="damaged">⚠️ Damaged</SelectItem>
                <SelectItem value="needs_repair">🔧 Needs Repair</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    🏠 {location.room_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            📋 Inventory Items
            <Badge variant="secondary">{filteredItems.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No items found</p>
              <p className="text-gray-400">
                {items.length === 0 ? 'Add your first inventory item!' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item: InventoryItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            SN: {item.serial_number}
                            {item.brand && ` • ${item.brand}`}
                            {item.model && ` ${item.model}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <Badge variant="outline" className="capitalize">
                            {item.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getConditionIcon(item.condition)}
                          <Badge 
                            variant={getConditionBadgeVariant(item.condition)} 
                            className="capitalize"
                          >
                            {item.condition.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getLocationName(item.location_id)}</div>
                          {item.location_details && (
                            <div className="text-sm text-gray-500">{item.location_details}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.purchase_date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>✏️ Edit Inventory Item</DialogTitle>
                                <DialogDescription>
                                  Update the details of this inventory item
                                </DialogDescription>
                              </DialogHeader>
                              <InventoryForm onSubmit={handleEdit} submitText="Update Item" />
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>🗑️ Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
