'use client';

import { format } from 'date-fns';
import { CalendarIcon, Eye, EyeOff, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState(20);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

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
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Plans Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage global discount plans that users can apply once
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
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
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{globalPlans.length}</div>
            <p className="text-sm text-gray-500">Total Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {globalPlans.filter((p) => getPlanStatus(p) === 'active').length}
            </div>
            <p className="text-sm text-gray-500">Active Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {globalPlans.reduce((sum, p) => sum + p._count.usages, 0)}
            </div>
            <p className="text-sm text-gray-500">Total Uses</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Global Plans</CardTitle>
          <CardDescription>Manage your global discount plans</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading plans...</div>
            </div>
          ) : globalPlans.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <p className="text-sm text-gray-500">No global plans found</p>
                <p className="text-xs text-gray-400">Create your first plan to get started</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalPlans.map((plan) => {
                    const status = getPlanStatus(plan);
                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            {plan.description && (
                              <div className="text-sm text-gray-500">{plan.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{plan.discount}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === 'active'
                                ? 'default'
                                : status === 'expired'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            {plan._count.usages}
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.expiresAt
                            ? format(new Date(plan.expiresAt), 'MMM d, yyyy')
                            : 'No expiry'}
                        </TableCell>
                        <TableCell>{format(new Date(plan.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleTogglePlan(plan.id)}
                            >
                              {plan.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <RotateCcw size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Plan Usage</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will allow all users to use this plan again. Are you sure?
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
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Global Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this plan? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="bg-red-600 hover:bg-red-700"
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
