'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, CreditCard, Download, Search, TrendingUp, Wallet } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface FinancesDashboardProps {
  transactions: any[];
  totalRevenue: number;
  totalCredits: number;
  monthlyRevenue: any[];
}

export default function FinancesDashboard({
  transactions,
  totalRevenue,
  totalCredits,
  monthlyRevenue,
}: FinancesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Format monthly revenue data for chart
  const formattedMonthlyRevenue =
    monthlyRevenue?.map((data: any) => {
      // Calculate revenue from credits (75 INR per 50 credits)
      const revenue = Number(data.total_credits) * (75 / 50);
      return {
        month: format(new Date(data.month), 'MMM yyyy'),
        revenue: parseFloat(revenue.toFixed(2)),
        credits: Number(data.total_credits),
      };
    }) || [];

  // Calculate monthly stats
  const currentMonthData = monthlyRevenue?.[monthlyRevenue.length - 1];
  const currentMonthRevenue = currentMonthData
    ? Number(currentMonthData.total_credits) * (75 / 50)
    : 0;

  // Previous month for comparison
  const previousMonthData =
    monthlyRevenue?.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2] : null;
  const previousMonthRevenue = previousMonthData
    ? Number(previousMonthData.total_credits) * (75 / 50)
    : 0;

  // Calculate growth percentage
  const revenueGrowth =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

  // Filter transactions based on search
  const filteredTransactions = transactions.filter((tx) => {
    const userFullName = `${tx.user.firstName || ''} ${tx.user.lastName || ''}`
      .trim()
      .toLowerCase();
    const email = tx.user.emailAddress.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return !searchTerm || userFullName.includes(searchLower) || email.includes(searchLower);
  });

  // Export transactions to CSV
  const exportTransactions = () => {
    const headers = ['Date', 'Transaction ID', 'User', 'Email', 'Credits', 'Amount (INR)'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map((tx) =>
        [
          format(new Date(tx.createdAt), 'yyyy-MM-dd'),
          tx.id,
          `${tx.user.firstName || ''} ${tx.user.lastName || ''}`.trim() || 'Unnamed User',
          tx.user.emailAddress,
          tx.credits,
          (tx.credits * (75 / 50)).toFixed(2),
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track revenue, credits sold, and transaction history
          </p>
        </div>
        <Button variant="outline" onClick={exportTransactions} className="flex items-center gap-2">
          <Download size={16} />
          Export Transactions
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Revenue
                </p>
                <h3 className="mt-1 text-3xl font-bold">
                  ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lifetime earnings</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CreditCard size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Credits Sold
                </p>
                <h3 className="mt-1 text-3xl font-bold">{totalCredits.toLocaleString()}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Across all transactions
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Wallet size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current Month Revenue
                </p>
                <h3 className="mt-1 text-3xl font-bold">
                  ₹{currentMonthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p
                  className={`mt-1 flex items-center gap-1 text-sm ${revenueGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  <span>{revenueGrowth >= 0 ? '↑' : '↓'}</span>
                  {Math.abs(revenueGrowth).toFixed(1)}% from last month
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <TrendingUp size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue over the last year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedMonthlyRevenue}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value}`} domain={[0, 'auto']} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Complete record of all credit purchases</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search by user or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-right">Amount (INR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tx.user.firstName || tx.user.lastName
                              ? `${tx.user.firstName || ''} ${tx.user.lastName || ''}`
                              : 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {tx.user.emailAddress}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{tx.credits}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(tx.credits * (75 / 50)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                      No transactions found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
