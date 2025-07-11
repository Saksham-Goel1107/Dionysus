'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Tag, 
  Copy, 
  Check, 
  Search, 
  Download, 
  AlertCircle, 
  Trash,
  Edit,
  Users,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Coupon, CouponConditions, createCoupon, getAllCoupons, updateCoupon, deleteCoupon } from '@/app/(protected)/billing/appwriteCoupons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUser } from '@clerk/nextjs';

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  code: z.string().min(3, { message: "Code must be at least 3 characters" }),
  description: z.string().min(3, { message: "Description must be at least 3 characters" }),
  discount: z.number().min(1).max(100),
  expiresAt: z.date(),
  isActive: z.boolean().default(true),
  maxUses: z.number().int().min(0),
  isOneTimeUse: z.boolean().default(false),
  minimumOrderValue: z.number().min(0).default(0),
  conditions: z.object({
    requires2FA: z.boolean().default(false),
    regions: z.array(z.string()).optional(),
    minAccountAgeInDays: z.number().int().min(0).optional(),
    isNew: z.boolean().optional(),
    seasonalType: z.enum(['summer', 'winter', 'spring', 'fall', 'festival']).optional(),
    festivalName: z.string().optional(),
    minPreviousPurchases: z.number().int().min(0).optional(),
    showToAll: z.boolean().default(false),
  }),
});

type CouponFormValues = z.infer<typeof formSchema>;



export default function CouponManagement() {
  const { user } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      discount: 10,
      isActive: true,
      maxUses: 100,
      isOneTimeUse: false,
      minimumOrderValue: 0,
      conditions: {
        requires2FA: false,
        regions: [],
        minAccountAgeInDays: 0,
        isNew: undefined,
        seasonalType: undefined,
        festivalName: '',
        minPreviousPurchases: 0,
        showToAll: false,
      },
    },
  });

  const editForm = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      discount: 10,
      isActive: true,
      maxUses: 100,
      isOneTimeUse: false,
      minimumOrderValue: 0,
      conditions: {
        requires2FA: false,
        regions: [],
        minAccountAgeInDays: 0,
        isNew: undefined,
        seasonalType: undefined,
        festivalName: '',
        minPreviousPurchases: 0,
        showToAll: false,
      },
    },
  });

  // Helper to serialize conditions object to array
  function serializeConditions(conditions: CouponConditions): string[] {
    return [JSON.stringify(conditions)];
  }

  // Helper to deserialize conditions array to object
  function deserializeConditions(conditionsArr: string[] | undefined): CouponConditions {
    if (!conditionsArr || !conditionsArr.length) return {};
    try {
      return JSON.parse(conditionsArr[0] ?? '{}');
    } catch {
      return {};
    }
  }

  // Load coupons from Appwrite on mount
  const fetchCoupons = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedCoupons = await getAllCoupons();
      // Parse conditions from array to object
      setCoupons(
        fetchedCoupons.map((coupon) => ({
          ...coupon,
          conditions: deserializeConditions(coupon.conditions as unknown as string[]),
        }))
      );
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Create a new coupon
  const onSubmit = async (values: CouponFormValues) => {
    if(!user?.id){
      return
    }
    try {
      // Format the date to ISO string and keep conditions as object
      const formattedValues = {
        ...values,
        expiresAt: values.expiresAt.toISOString(),
        conditions: values.conditions,
      };

      await createCoupon(formattedValues, user.id);
      
      toast({
        title: 'Coupon Created',
        description: `${values.name} coupon created successfully.`,
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to create coupon.',
        variant: 'destructive',
      });
    }
  };

  // Edit a coupon
  const onEditSubmit = async (values: CouponFormValues) => {
    if (!selectedCoupon?.$id || !user?.id) return;
    try {
      // Format the date to ISO string and keep conditions as object
      const formattedValues = {
        ...values,
        expiresAt: values.expiresAt.toISOString(),
        conditions: values.conditions,
      };

      await updateCoupon(selectedCoupon.$id, formattedValues, user.id);
      
      toast({
        title: 'Coupon Updated',
        description: `${values.name} coupon updated successfully.`,
      });
      
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete?.$id || !user?.id) return;
    try {
      await deleteCoupon(couponToDelete.$id, user.id);
      toast({
        title: 'Coupon Deleted',
        description: 'Coupon deleted successfully.',
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  // Handle edit button click
  const handleEditClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    
    // Set form values
    editForm.reset({
      name: coupon.name,
      code: coupon.code,
      description: coupon.description,
      discount: coupon.discount,
      expiresAt: new Date(coupon.expiresAt),
      isActive: coupon.isActive,
      maxUses: coupon.maxUses,
      isOneTimeUse: coupon.isOneTimeUse || false,
      minimumOrderValue: coupon.minimumOrderValue || 0,
      conditions: {
        requires2FA: coupon.conditions.requires2FA || false,
        regions: coupon.conditions.regions || [],
        minAccountAgeInDays: coupon.conditions.minAccountAgeInDays || 0,
        isNew: coupon.conditions.isNew,
        seasonalType: coupon.conditions.seasonalType,
        festivalName: coupon.conditions.festivalName || '',
        minPreviousPurchases: coupon.conditions.minPreviousPurchases || 0,
        showToAll: coupon.conditions.showToAll || false,
      },
    });
    
    setIsEditDialogOpen(true);
  };

  // Copy coupon code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);

    toast({
      title: 'Copied!',
      description: 'Coupon code copied to clipboard.',
    });
  };

  // Filter coupons based on search and tab
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = 
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') {
      return matchesSearch && coupon.isActive && new Date(coupon.expiresAt) > new Date();
    }
    if (activeTab === 'expired') {
      return matchesSearch && (new Date(coupon.expiresAt) <= new Date() || !coupon.isActive);
    }

    return matchesSearch;
  });

  // Export coupons to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Code', 'Discount', 'Created At', 'Expires At', 'Status', 'Uses'];
    const csvContent = [
      headers.join(','),
      ...filteredCoupons.map((coupon) =>
        [
          coupon.name,
          coupon.code,
          `${coupon.discount}%`,
          format(new Date(coupon.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          format(new Date(coupon.expiresAt), 'yyyy-MM-dd HH:mm:ss'),
          coupon.isActive && new Date(coupon.expiresAt) > new Date() ? 'Active' : 'Expired',
          `${coupon.currentUses}/${coupon.maxUses || 'Unlimited'}`,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `coupons-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateRandomCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    form.setValue('code', randomCode);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage discount coupons with user conditions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex gap-2 items-center"
            disabled={coupons.length === 0}
          >
            <Download size={16} />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex gap-2 items-center">
            <Tag size={16} />
            Create Coupon
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>Manage all your discount coupons</CardDescription>
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Coupons</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Restrictions</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-500"></div>
                          <span className="mt-2">Loading coupons...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCoupons.length > 0 ? (
                    filteredCoupons.map((coupon) => {
                      const isExpired = new Date(coupon.expiresAt) < new Date();
                      const isActive = coupon.isActive && !isExpired;
                      const conditions = [];
                      
                      if (coupon.conditions.showToAll) {
                        conditions.push("All Users");
                      } else {
                        if (coupon.conditions.requires2FA) conditions.push("2FA");
                        if (coupon.conditions.minAccountAgeInDays) conditions.push(`${coupon.conditions.minAccountAgeInDays}+ days`);
                        if (coupon.conditions.isNew === true) conditions.push("New Users");
                        if (coupon.conditions.isNew === false) conditions.push("Existing Users");
                        if (coupon.conditions.seasonalType) conditions.push(coupon.conditions.seasonalType);
                        if (coupon.conditions.regions?.length) conditions.push(`${coupon.conditions.regions.length} regions`);
                        if (coupon.conditions.minPreviousPurchases) conditions.push(`${coupon.conditions.minPreviousPurchases}+ purchases`);
                      }

                      return (
                        <TableRow key={coupon.$id} className="hover:bg-muted transition">
                          <TableCell>
                            <div className="font-medium">{coupon.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">{coupon.description}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-gray-100 dark:bg-gray-400 px-1 py-0.5 rounded">{coupon.code}</code>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="text-gray-500 hover:text-gray-800 transition dark:hover:text-gray-400"
                              >
                                {copiedCode === coupon.code ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 font-medium">
                              {coupon.discount}% OFF
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {conditions.length > 0 ? (
                                conditions.map((condition, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {condition}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {/* Conditionally style based on if the requirements are met (simulated here) */}
                              {coupon.isOneTimeUse && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    // Simulate if condition is met for this user (in production, check actual user state)
                                    Math.random() > 0.5 
                                      ? "text-purple-700 bg-purple-50" 
                                      : "text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  {Math.random() > 0.5 ? "✓ " : ""}One-time Use
                                </Badge>
                              )}
                              {(coupon.minimumOrderValue ?? 0) > 0 && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    // Simulate if condition is met (in production, check cart total)
                                    Math.random() > 0.5 
                                      ? "text-blue-700 bg-blue-50" 
                                      : "text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  {Math.random() > 0.5 ? "✓ " : ""}Min ₹{coupon.minimumOrderValue ?? 0}
                                </Badge>
                              )}
                              {!coupon.isOneTimeUse && coupon.minimumOrderValue === 0 && (
                                <span className="text-xs text-gray-500">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(coupon.expiresAt), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(coupon.expiresAt), 'h:mm a')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {coupon.currentUses} / {coupon.maxUses || '∞'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                {isExpired ? 'Expired' : 'Inactive'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(coupon)}
                              >
                                <Edit size={16} />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => {
                                  setCouponToDelete(coupon);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash size={16} />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                          <span>No coupons found</span>
                          <span className="text-sm">Create your first coupon to get started</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a new coupon with specific targeting conditions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Sale" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your coupon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Coupon Code</FormLabel>
                        <FormControl>
                          <Input placeholder="SUMMER25" {...field} />
                        </FormControl>
                        <FormDescription>
                          Code users will enter
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-8">
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer discount for all users" {...field} />
                      </FormControl>
                      <FormDescription>
                        Brief description of the coupon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Uses (0 = unlimited)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={field.value}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isOneTimeUse"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>One-time Use</FormLabel>
                        <FormDescription>
                          Each user can only use this coupon once
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="minimumOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Value (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          step={1} 
                          value={field.value}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        0 = no minimum order value
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Users size={18} />
                  Targeting Conditions
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Set conditions for which users can see and use this coupon
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conditions.showToAll"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // If showing to all, reset other conditions
                              if (checked) {
                                form.setValue('conditions.requires2FA', false);
                                form.setValue('conditions.regions', []);
                                form.setValue('conditions.minAccountAgeInDays', 0);
                                form.setValue('conditions.isNew', undefined);
                                form.setValue('conditions.seasonalType', undefined);
                                form.setValue('conditions.festivalName', '');
                                form.setValue('conditions.minPreviousPurchases', 0);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Show to All Users</FormLabel>
                          <FormDescription>
                            Make this coupon visible to everyone
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {!form.watch('conditions.showToAll') && (
                    <>
                      <FormField
                        control={form.control}
                        name="conditions.requires2FA"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Requires 2FA</FormLabel>
                              <FormDescription>
                                Only show to users with 2FA enabled
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conditions.minAccountAgeInDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Account Age (days)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step={1} {...field} />
                            </FormControl>
                            <FormDescription>
                              0 = no minimum age requirement
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conditions.isNew"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                if (value === 'new') field.onChange(true);
                                else if (value === 'existing') field.onChange(false);
                                else field.onChange(undefined);
                              }}
                              defaultValue={
                                field.value === true ? 'new' : 
                                field.value === false ? 'existing' : 'any'
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any account</SelectItem>
                                <SelectItem value="new">New users (&lt; 30 days)</SelectItem>
                                <SelectItem value="existing">Existing users (≥ 30 days)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Target specific account types
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conditions.minPreviousPurchases"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Previous Purchases</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step={1} {...field} />
                            </FormControl>
                            <FormDescription>
                              0 = no purchase history required
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conditions.seasonalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seasonal Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="summer">Summer</SelectItem>
                                <SelectItem value="winter">Winter</SelectItem>
                                <SelectItem value="spring">Spring</SelectItem>
                                <SelectItem value="fall">Fall</SelectItem>
                                <SelectItem value="festival">Festival</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Season or occasion for this coupon
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('conditions.seasonalType') === 'festival' && (
                        <FormField
                          control={form.control}
                          name="conditions.festivalName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Festival Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Diwali, Christmas, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">Create Coupon</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update coupon details and targeting conditions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Same form fields as the create form */}
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Sale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SUMMER25" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Code cannot be changed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Other form fields identical to the create form */}
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer discount for all users" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Uses (0 = unlimited)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={field.value}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isOneTimeUse"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>One-time Use</FormLabel>
                        <FormDescription>
                          Coupon can only be used once per user
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="minimumOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Value (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={field.value}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this coupon
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Targeting conditions section identical to the create form */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Targeting Conditions</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Set conditions for which users can see and use this coupon
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="conditions.showToAll"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // If showing to all, reset other conditions
                              if (checked) {
                                editForm.setValue('conditions.requires2FA', false);
                                editForm.setValue('conditions.regions', []);
                                editForm.setValue('conditions.minAccountAgeInDays', 0);
                                editForm.setValue('conditions.isNew', undefined);
                                editForm.setValue('conditions.seasonalType', undefined);
                                editForm.setValue('conditions.festivalName', '');
                                editForm.setValue('conditions.minPreviousPurchases', 0);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Show to All Users</FormLabel>
                          <FormDescription>
                            Make this coupon visible to everyone
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Same condition fields as create form */}
                  {!editForm.watch('conditions.showToAll') && (
                    <>
                      <FormField
                        control={editForm.control}
                        name="conditions.requires2FA"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Requires 2FA</FormLabel>
                              <FormDescription>
                                Only show to users with 2FA enabled
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="conditions.minAccountAgeInDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Account Age (days)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step={1} {...field} />
                            </FormControl>
                            <FormDescription>
                              0 = no minimum age requirement
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="conditions.isNew"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                if (value === 'new') field.onChange(true);
                                else if (value === 'existing') field.onChange(false);
                                else field.onChange(undefined);
                              }}
                              defaultValue={
                                field.value === true ? 'new' : 
                                field.value === false ? 'existing' : 'any'
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any account</SelectItem>
                                <SelectItem value="new">New users (&lt; 30 days)</SelectItem>
                                <SelectItem value="existing">Existing users (≥ 30 days)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Target specific account types
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="conditions.minPreviousPurchases"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Previous Purchases</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step={1} {...field} />
                            </FormControl>
                            <FormDescription>
                              0 = no purchase history required
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="conditions.seasonalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seasonal Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="summer">Summer</SelectItem>
                                <SelectItem value="winter">Winter</SelectItem>
                                <SelectItem value="spring">Spring</SelectItem>
                                <SelectItem value="fall">Fall</SelectItem>
                                <SelectItem value="festival">Festival</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Season or occasion for this coupon
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {editForm.watch('conditions.seasonalType') === 'festival' && (
                        <FormField
                          control={editForm.control}
                          name="conditions.festivalName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Festival Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Diwali, Christmas, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit">Update Coupon</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon <span className="font-semibold">{couponToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
