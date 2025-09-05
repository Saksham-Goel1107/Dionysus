'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Edit, Eye, EyeOff, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface GlobalPlan {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  _count: {
    usages: number;
  };
}

export default function GlobalPlansManagement() {
  const [globalPlans, setGlobalPlans] = useState<GlobalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GlobalPlan | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState(20);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscount, setEditDiscount] = useState(20);
  const [editExpiresAt, setEditExpiresAt] = useState<Date | undefined>(undefined);

  const { toast } = useToast();

  const fetchGlobalPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/global-plans');

      if (!response.ok) {
        throw new Error('Failed to fetch global plans');
      }

      const data = await response.json();
      setGlobalPlans(data.globalPlans);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch global plans.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGlobalPlans();
  }, [fetchGlobalPlans]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Plan name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/admin/global-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          discount,
          expiresAt: expiresAt?.toISOString() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create global plan');
      }

      await fetchGlobalPlans();

      // Reset form
      setName('');
      setDescription('');
      setDiscount(20);
      setExpiresAt(undefined);
      setIsDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Global plan created successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create global plan.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim() || !editingPlan) {
      toast({
        title: 'Error',
        description: 'Plan name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch(`/api/admin/global-plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          name: editName.trim(),
          description: editDescription.trim() || null,
          discount: editDiscount,
          expiresAt: editExpiresAt?.toISOString() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update global plan');
      }

      await fetchGlobalPlans();

      // Reset form
      setEditingPlan(null);
      setEditName('');
      setEditDescription('');
      setEditDiscount(20);
      setEditExpiresAt(undefined);
      setIsEditDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Global plan updated successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update global plan.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditDialog = (plan: GlobalPlan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditDescription(plan.description || '');
    setEditDiscount(plan.discount);
    setEditExpiresAt(plan.expiresAt ? new Date(plan.expiresAt) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleTogglePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/admin/global-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle global plan');
      }

      const data = await response.json();
      await fetchGlobalPlans();

      toast({
        title: 'Success',
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle global plan.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/admin/global-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset global plan');
      }

      const data = await response.json();
      await fetchGlobalPlans();

      toast({
        title: 'Success',
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset global plan.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/admin/global-plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete global plan');
      }

      await fetchGlobalPlans();

      toast({
        title: 'Success',
        description: 'Global plan deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete global plan.',
        variant: 'destructive',
      });
    }
  };

  const getPlanStatus = (plan: GlobalPlan) => {
    if (!plan.isActive) return 'inactive';
    if (plan.expiresAt && new Date(plan.expiresAt) < new Date()) return 'expired';
    return 'active';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Global Plans Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage global discount plans for your users
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Global Plan</DialogTitle>
              <DialogDescription>
                Create a new global discount plan that users can apply once.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Deal, Black Friday"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for the plan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Discount Percentage: {discount}%</Label>
                <Slider
                  value={[discount]}
                  min={5}
                  max={90}
                  step={5}
                  onValueChange={(values) => setDiscount(values[0] ?? discount)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !expiresAt && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, 'PPP') : 'Select date (optional)'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={setExpiresAt}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {expiresAt && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpiresAt(undefined)}
                  >
                    Clear date
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Global Plan</DialogTitle>
              <DialogDescription>
                Update the details of your global discount plan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditPlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Plan Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Summer Deal, Black Friday"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Optional description for the plan"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Discount Percentage: {editDiscount}%</Label>
                <Slider
                  value={[editDiscount]}
                  min={5}
                  max={90}
                  step={5}
                  onValueChange={(values) => setEditDiscount(values[0] ?? editDiscount)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editExpiresAt && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editExpiresAt ? format(editExpiresAt, 'PPP') : 'Select date (optional)'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editExpiresAt}
                      onSelect={setEditExpiresAt}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {editExpiresAt && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditExpiresAt(undefined)}
                  >
                    Clear date
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Updating...' : 'Update Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalPlans.length}</div>
            <p className="text-xs text-muted-foreground">All discount plans created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {globalPlans.filter((p) => getPlanStatus(p) === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently available to users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {globalPlans.reduce((sum, p) => sum + p._count.usages, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Plans redeemed by users</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Plans</CardTitle>
          <CardDescription>Manage your discount plans and their availability</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading plans...</div>
            </div>
          ) : globalPlans.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium">No plans yet</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Create your first global discount plan to offer special deals to your users.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-[30%]">Plan Details</TableHead>
                    <TableHead className="w-[15%]">Discount</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[15%]">Usage</TableHead>
                    <TableHead className="w-[15%]">Expires</TableHead>
                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalPlans.map((plan) => {
                    const status = getPlanStatus(plan);
                    return (
                      <TableRow key={plan.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium leading-tight">{plan.name}</div>
                            {plan.description && (
                              <div className="line-clamp-2 text-sm text-muted-foreground">
                                {plan.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{plan.discount}%</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === 'active'
                                ? 'default'
                                : status === 'expired'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{plan._count.usages}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {plan.expiresAt
                              ? format(new Date(plan.expiresAt), 'MMM d, yyyy')
                              : 'No expiry'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEditDialog(plan)}
                              title="Edit plan"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleTogglePlan(plan.id)}
                              title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
                            >
                              {plan.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Reset plan usage"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Plan Usage</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will allow all users to use &ldquo;{plan.name}&rdquo;
                                    again. Are you sure?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetPlan(plan.id)}>
                                    Reset Usage
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Delete plan"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Global Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete &ldquo;{plan.name}&rdquo;. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Plan
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
