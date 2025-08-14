'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { generateCouponCode } from '@/app/(protected)/billing/couponUtils';
import { format } from 'date-fns';
import { Copy, Check, Search, Download, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CouponData {
  code: string;
  discount: number;
  expiryTime: Date;
  createdAt: Date;
  status: 'active' | 'expired' | 'used';
}

export default function CouponsManagement() {
  const [discount, setDiscount] = useState(10);
  const [minutes, setMinutes] = useState(60); // Default: 1 hour
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [couponHistory, setCouponHistory] = useState<CouponData[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const { toast } = useToast();

  // Load coupon history from localStorage on mount
  useEffect(() => {
    try {
      const savedCoupons = localStorage.getItem('adminCouponHistory');
      if (savedCoupons) {
        const parsedCoupons = JSON.parse(savedCoupons);

        // Convert date strings back to Date objects
        const formattedCoupons = parsedCoupons.map((coupon: any) => ({
          ...coupon,
          expiryTime: new Date(coupon.expiryTime),
          createdAt: new Date(coupon.createdAt),
        }));

        setCouponHistory(formattedCoupons);
      }
    } catch (error) {
      console.error('Error loading coupon history:', error);
    }
  }, []);

  // Generate a new coupon
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const code = await generateCouponCode(discount, minutes);

      if (typeof code === 'string') {
        setNewCouponCode(code);

        // Calculate expiry time
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + minutes);

        // Create new coupon entry
        const newCoupon: CouponData = {
          code,
          discount,
          expiryTime,
          createdAt: new Date(),
          status: 'active',
        };

        // Add to history and save to localStorage
        const updatedHistory = [newCoupon, ...couponHistory];
        setCouponHistory(updatedHistory);
        localStorage.setItem('adminCouponHistory', JSON.stringify(updatedHistory));

        setIsDialogOpen(true);

        toast({
          title: 'Coupon Generated',
          description: `${discount}% discount coupon created successfully.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate coupon code.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate coupon code.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
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

  // Filter coupons based on search and tab
  const filteredCoupons = couponHistory.filter((coupon) => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') {
      return matchesSearch && coupon.expiryTime > new Date() && coupon.status !== 'used';
    }
    if (activeTab === 'expired') {
      return matchesSearch && (coupon.expiryTime <= new Date() || coupon.status === 'used');
    }

    return matchesSearch;
  });

  // Export coupons to CSV
  const exportToCSV = () => {
    const headers = ['Code', 'Discount', 'Created At', 'Expiry Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredCoupons.map((coupon) =>
        [
          coupon.code,
          `${coupon.discount}%`,
          format(coupon.createdAt, 'yyyy-MM-dd HH:mm:ss'),
          format(coupon.expiryTime, 'yyyy-MM-dd HH:mm:ss'),
          coupon.status,
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
                    min={5}
                    max={10080} // 7 days in minutes
                    step={5}
                    onValueChange={(values) => setMinutes(values[0] ?? discount)}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMinutes(15)}
                    className="text-xs"
                  >
                    15m
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMinutes(60)}
                    className="text-xs"
                  >
                    1h
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMinutes(24 * 60)}
                    className="text-xs"
                  >
                    1d
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMinutes(7 * 24 * 60)}
                    className="text-xs"
                  >
                    7d
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Coupon'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Coupon History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coupon History</CardTitle>
            <CardDescription>Manage your generated coupons</CardDescription>
            <div className="mt-2 flex items-center justify-between gap-4">
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
              <TabsContent value="all" className="m-0">
                <CouponTable
                  coupons={filteredCoupons}
                  copyToClipboard={copyToClipboard}
                  copiedCode={copiedCode}
                />
              </TabsContent>
              <TabsContent value="active" className="m-0">
                <CouponTable
                  coupons={filteredCoupons}
                  copyToClipboard={copyToClipboard}
                  copiedCode={copiedCode}
                />
              </TabsContent>
              <TabsContent value="expired" className="m-0">
                <CouponTable
                  coupons={filteredCoupons}
                  copyToClipboard={copyToClipboard}
                  copiedCode={copiedCode}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* New Coupon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Coupon Created</DialogTitle>
            <DialogDescription>
              Coupon code has been generated successfully. Copy the code to share with users.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 rounded-md bg-gray-100 p-4 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Discount</p>
                <p className="text-lg font-bold">{discount}% OFF</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid for</p>
                <p className="font-medium">
                  {minutes < 60
                    ? `${minutes} minutes`
                    : minutes === 60
                      ? '1 hour'
                      : minutes < 1440
                        ? `${minutes / 60} hours`
                        : `${minutes / 1440} days`}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Coupon Code
              </p>
              <div className="flex items-center justify-between rounded-md border bg-white p-2 dark:bg-gray-950">
                <code className="break-all font-mono text-sm text-blue-600 dark:text-blue-400">
                  {newCouponCode}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newCouponCode)}>
                  {copiedCode === newCouponCode ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for coupon table
function CouponTable({
  coupons,
  copyToClipboard,
  copiedCode,
}: {
  coupons: CouponData[];
  copyToClipboard: (code: string) => void;
  copiedCode: string | null;
}) {
  const now = new Date();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Discount</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="hidden md:table-cell">Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]">Copy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.length > 0 ? (
            coupons.map((coupon) => {
              const isExpired = coupon.expiryTime < now || coupon.status === 'used';

              return (
                <TableRow key={coupon.code}>
                  <TableCell className="font-medium">{coupon.discount}%</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {coupon.code.length > 16 ? `${coupon.code.substring(0, 16)}...` : coupon.code}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(coupon.createdAt, 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(coupon.expiryTime, 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      >
                        Expired
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(coupon.code)}
                    >
                      {copiedCode === coupon.code ? (
                        <Check size={16} className="text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <AlertCircle className="mb-2 h-8 w-8 opacity-50" />
                  <span>No coupons found</span>
                  <span className="text-sm">Generate your first coupon to get started</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
