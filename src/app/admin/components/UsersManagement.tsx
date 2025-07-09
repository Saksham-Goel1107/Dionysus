'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Search, Filter, MoreHorizontal, Download, UserCheck, Shield } from 'lucide-react';
import Image from 'next/image';
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

interface User {
  id: string;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  emailAddress: string;
  imageUrl: string | null;
  credits: number;
  isPro: boolean;
  totalProjects: number;
  totalPurchasedCredits: number;
}

interface UsersManagementProps {
  users: User[];
}

export default function UsersManagement({ users }: UsersManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pro' | 'regular'>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: 'asc' | 'desc';
  }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [dialog, setDialog] = useState<{
    type: 'ban' | 'lock' | 'delete' | null;
    user: User | null;
  }>({ type: null, user: null });
  const [loadingAction, setLoadingAction] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'pro' && user.isPro) ||
      (selectedFilter === 'regular' && !user.isPro);

    return matchesSearch && matchesFilter;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === 'createdAt') {
      return sortConfig.direction === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    const aValue = a[sortConfig.key] ?? '';
    const bValue = b[sortConfig.key] ?? '';
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Handle sort
  const handleSort = (key: keyof User) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Export users data to CSV
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Credits',
      'Pro Status',
      'Projects',
      'Joined Date',
      'Purchased Credits',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map((user) =>
        [
          user.id,
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          user.emailAddress,
          user.credits,
          user.isPro ? 'Pro' : 'Regular',
          user.totalProjects,
          format(new Date(user.createdAt), 'yyyy-MM-dd'),
          user.totalPurchasedCredits,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUserAction = async (type: 'ban' | 'lock' | 'delete', user: User) => {
    setLoadingAction(true);
    await new Promise((res) => setTimeout(res, 1000));
    setLoadingAction(false);
    setDialog({ type: null, user: null });
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)}d user: ${user.emailAddress}`);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and view all users on the platform
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} className="flex gap-2 items-center">
          <Download size={16} />
          Export to CSV
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Filter size={16} />
                    Filter:{' '}
                    {selectedFilter === 'all'
                      ? 'All Users'
                      : selectedFilter === 'pro'
                        ? 'Pro Users'
                        : 'Regular Users'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                    All Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter('pro')}>
                    Pro Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter('regular')}>
                    Regular Users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <button
                      onClick={() => handleSort('emailAddress')}
                      className="flex items-center gap-1"
                    >
                      Name/Email
                      {sortConfig.key === 'emailAddress' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">
                    <button
                      onClick={() => handleSort('credits')}
                      className="flex items-center gap-1"
                    >
                      Credits
                      {sortConfig.key === 'credits' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Projects</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1"
                    >
                      Joined
                      {sortConfig.key === 'createdAt' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {user.imageUrl ? (
                              <Image
                                width={40}
                                height={40}
                                src={user.imageUrl}
                                alt={user.firstName || 'User'}
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.firstName?.[0] ||
                                  (user.emailAddress?.[0]?.toUpperCase() ?? '')}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`
                                : 'Unnamed User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.emailAddress}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.isPro ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800">
                            Pro
                          </Badge>
                        ) : (
                          <Badge variant="outline">Regular</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{user.credits}</TableCell>
                      <TableCell className="text-center">{user.totalProjects}</TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="flex gap-2 items-center cursor-pointer">
                              <UserCheck size={16} />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex gap-2 items-center cursor-pointer text-yellow-600"
                              onClick={() => setDialog({ type: 'ban', user })}
                            >
                              <Shield size={16} />
                              Ban User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex gap-2 items-center cursor-pointer text-blue-600"
                              onClick={() => setDialog({ type: 'lock', user })}
                            >
                              <Shield size={16} />
                              Lock User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex gap-2 items-center cursor-pointer text-red-600"
                              onClick={() => setDialog({ type: 'delete', user })}
                            >
                              <Shield size={16} />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      No users found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Confirmation Dialogs */}
      <AlertDialog
        open={!!dialog.type}
        onOpenChange={(open) => !open && setDialog({ type: null, user: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog.type === 'ban' && 'Ban User'}
              {dialog.type === 'lock' && 'Lock User'}
              {dialog.type === 'delete' && 'Delete User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'ban' &&
                `Are you sure you want to ban ${dialog.user?.emailAddress}? This will prevent them from accessing the platform.`}
              {dialog.type === 'lock' &&
                `Are you sure you want to lock ${dialog.user?.emailAddress}? This will temporarily disable their account.`}
              {dialog.type === 'delete' &&
                `Are you sure you want to permanently delete ${dialog.user?.emailAddress}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loadingAction}
              onClick={() => dialog.user && handleUserAction(dialog.type as any, dialog.user)}
            >
              {loadingAction ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
