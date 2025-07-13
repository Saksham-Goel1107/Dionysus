'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Users, CreditCard, Folder, TrendingUp, BadgeCheck, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AdminDashboardProps {
  totalUsers: number;
  proUsers: number;
  totalProjects: number;
  totalCredits: number;
  estimatedRevenue: number;
  recentTransactions: any[];
  userGrowthData: any[];
  topUsersByCredits: any[];
}

export default function AdminDashboard({
  totalUsers,
  proUsers,
  totalProjects,
  totalCredits,
  estimatedRevenue,
  recentTransactions,
  userGrowthData,
  topUsersByCredits,
}: AdminDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, []);

  // Format user growth data for the chart
  const formattedUserGrowthData =
    userGrowthData?.map((data: any) => ({
      month: format(new Date(data.month), 'MMM'),
      users: Number(data.count),
    })) || [];

  // Calculate pro user percentage
  const proUserPercentage = totalUsers > 0 ? (proUsers / totalUsers) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdated || 'Loading...'}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{totalUsers}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pro Users</p>
                <h3 className="text-2xl font-bold mt-1">
                  {proUsers}{' '}
                  <span className="text-sm text-gray-500">({proUserPercentage.toFixed(1)}%)</span>
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <BadgeCheck size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Projects
                </p>
                <h3 className="text-2xl font-bold mt-1">{totalProjects}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Folder size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Revenue (est.)
                </p>
                <h3 className="text-2xl font-bold mt-1">₹{estimatedRevenue.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                <CreditCard size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user registrations</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedUserGrowthData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Credits and User distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Metrics</CardTitle>
            <CardDescription>Pro users vs. regular users</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Pro Users</span>
                <span className="text-sm font-medium">{proUserPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={proUserPercentage} className="h-2" />
            </div>

            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Pro Users', value: proUsers },
                    { name: 'Regular Users', value: totalUsers - proUsers },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#888"
                    opacity={0.2}
                  />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions and top users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest credit purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.user.firstName || 'User'}{' '}
                          {transaction.user.lastName || transaction.user.id.slice(0, 6)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(transaction.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">+{transaction.credits} credits</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{(transaction.credits * (75 / 50)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No recent transactions
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top users by credits */}
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Credits</CardTitle>
            <CardDescription>Users with the highest credit balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topUsersByCredits.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.firstName || 'User'} {user.lastName || ''}
                        {user.isPro && (
                          <Badge
                            variant="outline"
                            className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                          >
                            PRO
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.emailAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-bold">{user.credits} credits</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
