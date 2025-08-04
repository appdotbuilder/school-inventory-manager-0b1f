
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Search, Filter, Package, CheckCircle, XCircle, Wrench } from 'lucide-react';
import type { InventoryItem, CreateInventoryItemInput, Location } from '../../../server/src/schema';

export function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

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

  const loadItems = useCallback(async () => {
    try {
      const result = await trpc.getInventoryItems.query();
      setItems(result);
    } catch (error) {
      console.error('Failed to load inventory items:', error);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const result = await trpc.getLocations.query();
      setLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadLocations();
  }, [loadItems, loadLocations]);

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
      location_id: 0,
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
    if (formData.location_id === 0) {
      alert('Please select a location');
      return;
    }

    setIsLoading(true);
    try {
      const response = await trpc.createInventoryItem.mutate(formData);
      setItems((prev: InventoryItem[]) => [...prev, response]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create inventory item:', error);
      alert('Failed to create inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || formData.location_id === 0) return;

    setIsLoading(true);
    try {
      await trpc.updateInventoryItem.mutate({
        id: editingItem.id,
        ...formData
      });
      await loadItems();
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      alert('Failed to update inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteInventoryItem.mutate(id);
      setItems((prev: InventoryItem[]) => prev.filter((item: InventoryItem) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      alert('Failed to delete inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
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

  const getLocationName = (locationId: number) => {
    const location = locations.find((loc: Location) => loc.id === locationId);
    return location ? location.room_name : 'Unknown Location';
  };

  const InventoryForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
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
        <div>
          <Label htmlFor="serial">Serial Number *</Label>
          <Input
            id="serial"
            value={formData.serial_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, serial_number: e.target.value }))
            }
            placeholder="e.g., SN123456789"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
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
        <div>
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
              <SelectItem value="damaged">❌ Damaged</SelectItem>
              <SelectItem value="needs_repair">🔧 Needs Repair</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location *</Label>
          <Select
            value={formData.location_id === 0 ? '' : formData.location_id.toString()}
            onValueChange={(value: string) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, location_id: parseInt(value) || 0 }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location: Location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  🏫 {location.room_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
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
            placeholder="e.g., Shelf A, Desk 3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, brand: e.target.value || null }))
            }
            placeholder="e.g., Dell, HP, IKEA"
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInventoryItemInput) => ({ ...prev, model: e.target.value || null }))
            }
            placeholder="e.g., Latitude 5520, ProDesk 400"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="purchase_date">Purchase Date *</Label>
        <Input
          id="purchase_date"
          type="date"
          value={formData.purchase_date.toISOString().split('T')[0]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ ...prev, purchase_date: new Date(e.target.value) }))
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="specifications">Specifications</Label>
        <Textarea
          id="specifications"
          value={formData.specifications || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ ...prev, specifications: e.target.value || null }))
          }
          placeholder="e.g., Intel i5, 8GB RAM, 256GB SSD"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateInventoryItemInput) => ({ ...prev, notes: e.target.value || null }))
          }
          placeholder="Additional notes or comments"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : title}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Create a new inventory item with all relevant details
              </DialogDescription>
            </DialogHeader>
            <InventoryForm onSubmit={handleCreate} title="Create Item" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronic">Electronic</SelectItem>
            <SelectItem value="pc">PC</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
          </SelectContent>
        </Select>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="needs_repair">Needs Repair</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationFilter || 'all'} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location: Location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.room_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              {items.length === 0 
                ? "No inventory items yet. Add your first item to get started! 📦"
                : "No items match your current filters 🔍"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item: InventoryItem) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getConditionIcon(item.condition)}
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </div>
                <CardDescription>
                  Serial: {item.serial_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {(item.brand || item.model) && (
                    <p className="text-sm">
                      <span className="font-medium">Brand/Model: </span>
                      {[item.brand, item.model].filter(Boolean).join(' ')}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Location: </span>
                    {getLocationName(item.location_id)}
                    {item.location_details && ` - ${item.location_details}`}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Purchased: </span>
                    {item.purchase_date.toLocaleDateString()}
                  </p>
                  {item.specifications && (
                    <p className="text-sm">
                      <span className="font-medium">Specs: </span>
                      {item.specifications}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-sm">
                      <span className="font-medium">Notes: </span>
                      {item.notes}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Added: {item.created_at.toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingItem(null);
                        resetForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Inventory Item</DialogTitle>
                          <DialogDescription>
                            Update the details for {item.name}
                          </DialogDescription>
                        </DialogHeader>
                        <InventoryForm onSubmit={handleUpdate} title="Update Item" />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
