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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertCircle, Check, Clock, Copy, Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import GlobalPlansManagement from './GlobalPlansManagement';

interface CouponData {
  id: string;
  code: string;
  discount: number;
  expiresAt: string;
  createdAt: string;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: string;
  isExpired: boolean;
  maxUses: number;
  currentUses: number;
}

export default function CouponsManagement() {
  const [discount, setDiscount] = useState(10);
  const [minutes, setMinutes] = useState(60); // Default: 1 hour
  const [maxUses, setMaxUses] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [couponHistory, setCouponHistory] = useState<CouponData[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load coupons from database on mount
  const fetchCoupons = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');

      const data = await response.json();
      setCouponHistory(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Generate a new coupon
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discount,
          expiresInMinutes: minutes,
          maxUses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate coupon');
      }

      const data = await response.json();
      setNewCouponCode(data.coupon.code);
      setIsDialogOpen(true);

      // Refresh the coupon list
      await fetchCoupons();

      toast({
        title: 'Coupon Generated',
        description: `${discount}% discount coupon created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate coupon code.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Expire coupon early
  const handleExpireCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'expire' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to expire coupon');
      }

      await fetchCoupons();

      toast({
        title: 'Coupon Expired',
        description: 'Coupon has been marked as expired.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to expire coupon.',
        variant: 'destructive',
      });
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete coupon');
      }

      await fetchCoupons();

      toast({
        title: 'Coupon Deleted',
        description: 'Coupon has been permanently deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coupon.',
        variant: 'destructive',
      });
    }
  };

  // Reinitialize coupon
  const handleReinitializeCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reinitialize' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reinitialize coupon');
      }

      await fetchCoupons();

      toast({
        title: 'Coupon Reinitialized',
        description: 'Coupon has been reset and is now active again.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reinitialize coupon.',
        variant: 'destructive',
      });
    }
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

  // Get coupon status
  const getCouponStatus = (coupon: CouponData) => {
    if (coupon.isExpired) return 'expired';
    if (new Date(coupon.expiresAt) < new Date()) return 'expired';
    if (coupon.currentUses >= coupon.maxUses) return 'used';
    return 'active';
  };

  // Filter coupons based on search and tab
  const filteredCoupons = couponHistory.filter((coupon) => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getCouponStatus(coupon);

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') {
      return matchesSearch && status === 'active';
    }
    if (activeTab === 'expired') {
      return matchesSearch && (status === 'expired' || status === 'used');
    }

    return matchesSearch;
  });

  // Export coupons to CSV
  const exportToCSV = () => {
    const headers = ['Code', 'Discount', 'Created At', 'Expiry Time', 'Status', 'Uses', 'Max Uses'];
    const csvContent = [
      headers.join(','),
      ...filteredCoupons.map((coupon) =>
        [
          coupon.code,
          `${coupon.discount}%`,
          format(new Date(coupon.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          format(new Date(coupon.expiresAt), 'yyyy-MM-dd HH:mm:ss'),
          getCouponStatus(coupon),
          coupon.currentUses,
          coupon.maxUses,
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage discount coupons</p>
        </div>
        <Button
          variant="outline"
          onClick={exportToCSV}
          className="flex items-center gap-2"
          disabled={couponHistory.length === 0}
        >
          <Download size={16} />
          Export Coupons
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coupon Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Coupon</CardTitle>
            <CardDescription>Create new discount coupons for users</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Percentage</label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{discount}%</span>
                    <span className="text-sm text-gray-500">Max: 90%</span>
                  </div>
                  <Slider
                    value={[discount]}
                    min={5}
                    max={90}
                    step={5}
                    onValueChange={(values) => setDiscount(values[0] ?? discount)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Duration</label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {minutes < 60
                        ? `${minutes} minutes`
                        : minutes === 60
                          ? '1 hour'
                          : minutes < 1440
                            ? `${minutes / 60} hours`
                            : `${minutes / 1440} days`}
                    </span>
                  </div>
                  <Slider
                    value={[minutes]}
                    min={60}
                    max={10080} // 7 days in minutes
                    step={60}
                    onValueChange={(values) => setMinutes(values[0] ?? minutes)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Uses</label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{maxUses} uses</span>
                    <span className="text-sm text-gray-500">Max: 100</span>
                  </div>
                  <Slider
                    value={[maxUses]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(values) => setMaxUses(values[0] ?? maxUses)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Coupon'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of coupon usage and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">{couponHistory.length}</div>
                <p className="text-sm text-gray-500">Total Coupons</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {couponHistory.filter((c) => getCouponStatus(c) === 'active').length}
                </div>
                <p className="text-sm text-gray-500">Active Coupons</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">
                  {couponHistory.filter((c) => getCouponStatus(c) === 'used').length}
                </div>
                <p className="text-sm text-gray-500">Used Coupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupon History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coupon History</CardTitle>
          <CardDescription>Manage existing coupons and view usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All ({couponHistory.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Active ({couponHistory.filter((c) => getCouponStatus(c) === 'active').length})
                </TabsTrigger>
                <TabsTrigger value="expired">
                  Expired ({couponHistory.filter((c) => getCouponStatus(c) !== 'active').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading coupons...</div>
            </div>
          ) : (
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="all" className="mt-0">
                <CouponTable
                  coupons={filteredCoupons}
                  onCopy={copyToClipboard}
                  onExpire={handleExpireCoupon}
                  onDelete={handleDeleteCoupon}
                  onReinitialize={handleReinitializeCoupon}
                  copiedCode={copiedCode}
                  getCouponStatus={getCouponStatus}
                />
              </TabsContent>
              <TabsContent value="active" className="mt-0">
                <CouponTable
                  coupons={filteredCoupons}
                  onCopy={copyToClipboard}
                  onExpire={handleExpireCoupon}
                  onDelete={handleDeleteCoupon}
                  onReinitialize={handleReinitializeCoupon}
                  copiedCode={copiedCode}
                  getCouponStatus={getCouponStatus}
                />
              </TabsContent>
              <TabsContent value="expired" className="mt-0">
                <CouponTable
                  coupons={filteredCoupons}
                  onCopy={copyToClipboard}
                  onExpire={handleExpireCoupon}
                  onDelete={handleDeleteCoupon}
                  onReinitialize={handleReinitializeCoupon}
                  copiedCode={copiedCode}
                  getCouponStatus={getCouponStatus}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coupon Generated Successfully!</DialogTitle>
            <DialogDescription>
              Your new coupon code has been generated. Share this code with users.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            <code className="flex-1 font-mono text-lg font-semibold">{newCouponCode}</code>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newCouponCode)}>
              {copiedCode === newCouponCode ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Plans Management (embedded) */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold">Global Plans</h2>
        <GlobalPlansManagement />
      </div>
    </div>
  );
}

// Coupon Table Component
interface CouponTableProps {
  coupons: CouponData[];
  onCopy: (code: string) => void;
  onExpire: (id: string) => void;
  onDelete: (id: string) => void;
  onReinitialize: (id: string) => void;
  copiedCode: string | null;
  getCouponStatus: (coupon: CouponData) => string;
}

function CouponTable({
  coupons,
  onCopy,
  onExpire,
  onDelete,
  onReinitialize,
  copiedCode,
  getCouponStatus,
}: CouponTableProps) {
  if (coupons.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No coupons found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uses</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <TableRow key={coupon.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-semibold">{coupon.code}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onCopy(coupon.code)}
                    >
                      {copiedCode === coupon.code ? <Check size={12} /> : <Copy size={12} />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{coupon.discount}%</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      status === 'active'
                        ? 'default'
                        : status === 'used'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {coupon.currentUses} / {coupon.maxUses}
                </TableCell>
                <TableCell>{format(new Date(coupon.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(coupon.expiresAt), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {status === 'active' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Clock size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Expire Coupon</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to expire this coupon? This action will make it
                              unusable immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onExpire(coupon.id)}>
                              Expire Coupon
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {(status === 'expired' || status === 'used') &&
                      new Date(coupon.expiresAt) > new Date() && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                              <RefreshCw size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reinitialize Coupon</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reinitialize this coupon? This will reset
                                its usage and make it active again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onReinitialize(coupon.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Reinitialize Coupon
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this coupon? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(coupon.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Coupon
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
  );
}
