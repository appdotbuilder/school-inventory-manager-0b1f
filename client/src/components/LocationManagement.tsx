
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, MapPin, Building } from 'lucide-react';
import type { Location, CreateLocationInput } from '../../../server/src/schema';

export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState<CreateLocationInput>({
    room_name: '',
    description: null
  });

  const loadLocations = useCallback(async () => {
    try {
      const result = await trpc.getLocations.query();
      setLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const resetForm = () => {
    setFormData({
      room_name: '',
      description: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createLocation.mutate(formData);
      setLocations((prev: Location[]) => [...prev, response]);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create location:', error);
      alert('Failed to create location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    setIsLoading(true);
    try {
      await trpc.updateLocation.mutate({
        id: editingLocation.id,
        ...formData
      });
      await loadLocations();
      setEditingLocation(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteLocation.mutate(id);
      setLocations((prev: Location[]) => prev.filter((location: Location) => location.id !== id));
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Failed to delete location. It may be in use by inventory items.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      room_name: location.room_name,
      description: location.description
    });
  };

  const LocationForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="room_name">Room Name *</Label>
        <Input
          id="room_name"
          value={formData.room_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateLocationInput) => ({ ...prev, room_name: e.target.value }))
          }
          placeholder="e.g., Computer Lab 1, Library, Principal's Office"
          required
        />
      </div>

      <div>
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
          placeholder="Additional details about this location"
          rows={3}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Locations</h2>
          <p className="text-gray-600">Manage rooms and areas where inventory items are stored</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Create a new location where inventory items can be stored
              </DialogDescription>
            </DialogHeader>
            <LocationForm onSubmit={handleCreate} title="Create Location" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No locations configured yet. Add your first location to get started! 🏫
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location: Location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{location.room_name}</CardTitle>
                  </div>
                </div>
                {location.description && (
                  <CardDescription className="mt-2">
                    {location.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Created: </span>
                  {location.created_at.toLocaleDateString()}
                </div>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Dialog open={editingLocation?.id === location.id} onOpenChange={(open) => {
                    if (!open) {
                      setEditingLocation(null);
                      resetForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(location)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Location</DialogTitle>
                        <DialogDescription>
                          Update the details for {location.room_name}
                        </DialogDescription>
                      </DialogHeader>
                      <LocationForm onSubmit={handleUpdate} title="Update Location" />
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3 mr-1 text-red-500" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Location</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{location.room_name}"? 
                          This action cannot be undone and will fail if there are inventory items in this location.
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
