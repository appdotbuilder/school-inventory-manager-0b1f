
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MapPin, Edit, Trash2, Building } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Location, CreateLocationInput, UpdateLocationInput } from '../../../server/src/schema';

interface LocationManagerProps {
  locations: Location[];
  onRefresh: () => void;
}

export function LocationManager({ locations, onRefresh }: LocationManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateLocationInput>({
    room_name: '',
    description: null
  });

  const resetForm = () => {
    setFormData({
      room_name: '',
      description: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_name) return;

    setIsLoading(true);
    try {
      await trpc.createLocation.mutate(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    setIsLoading(true);
    try {
      const updateData: UpdateLocationInput = {
        id: editingLocation.id,
        ...formData
      };
      await trpc.updateLocation.mutate(updateData);
      setEditingLocation(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteLocation.mutate(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      room_name: location.room_name,
      description: location.description
    });
  };

  const LocationForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="room_name">Room Name *</Label>
        <Input
          id="room_name"
          value={formData.room_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateLocationInput) => ({ ...prev, room_name: e.target.value }))
          }
          placeholder="e.g., Computer Lab A, Principal's Office, Library"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateLocationInput) => ({ 
              ...prev, 
              description: e.target.value || null 
            }))
          }
          placeholder="Additional details about this location..."
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
          <h2 className="text-2xl font-bold text-gray-900">🏠 Location Management</h2>
          <p className="text-gray-600">Manage rooms and locations within your school</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🏗️ Add New Location</DialogTitle>
              <DialogDescription>
                Add a new room or location to your school inventory system
              </DialogDescription>
            </DialogHeader>
            <LocationForm onSubmit={handleCreate} submitText="Add Location" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Locations Yet</h3>
                <p className="text-gray-500 text-center mb-4">
                  Start by adding your first school location or room
                </p>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add First Location
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        ) : (
          locations.map((location: Location) => (
            <Card key={location.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{location.room_name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    ID: {location.id}
                  </Badge>
                </div>
                {location.description && (
                  <CardDescription className="mt-2">
                    {location.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    📅 Created: {location.created_at.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>✏️ Edit Location</DialogTitle>
                          <DialogDescription>
                            Update the details of this location
                          </DialogDescription>
                        </DialogHeader>
                        <LocationForm onSubmit={handleEdit} submitText="Update Location" />
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
                          <AlertDialogTitle>🗑️ Delete Location</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{location.room_name}"? 
                            This action cannot be undone and may affect inventory items assigned to this location.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(location.id)}
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
          ))
        )}
      </div>

      {/* Summary Card */}
      {locations.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              📊 Location Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{locations.length}</div>
                <div className="text-sm text-blue-700">Total Locations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {locations.filter((l: Location) => l.description).length}
                </div>
                <div className="text-sm text-green-700">With Descriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {locations.filter((l: Location) => 
                    new Date().getTime() - l.created_at.getTime() < 7 * 24 * 60 * 60 * 1000
                  ).length}
                </div>
                <div className="text-sm text-purple-700">Added This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
