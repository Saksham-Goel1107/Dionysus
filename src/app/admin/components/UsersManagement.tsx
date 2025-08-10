'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Search,
  Filter,
  MoreHorizontal,
  Download,
  UserCheck,
  Shield,
  Loader2,
  X,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

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
  // new field expected from DB
  isBlocked?: boolean;
}

interface ClerkUserDetails {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: { emailAddress: string; id: string; verification: any }[];
  imageUrl?: string;
  lastSignInAt?: string;
  createdAt?: string;
  updatedAt?: string;
  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
  unsafeMetadata?: Record<string, any>;
}

interface UsersManagementProps {
  users: User[];
}

export default function UsersManagement({ users }: UsersManagementProps) {
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pro' | 'regular'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [dialog, setDialog] = useState<{
    type: 'ban' | 'unban' | 'delete' | null;
    user: User | null;
  }>({
    type: null,
    user: null,
  });
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // For user details modal
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<ClerkUserDetails | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Fetch Clerk user details
  const fetchUserDetails = async (userId: string) => {
    if (!userId) return;

    setLoadingUserDetails(true);
    setUserDetails(null);

    try {
      const response = await fetch(`/api/admin/user-details?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setUserDetails(data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // When user ID changes, fetch details
  useEffect(() => {
    if (selectedUserId && userDetailsOpen) {
      fetchUserDetails(selectedUserId);
    }
  }, [selectedUserId, userDetailsOpen]);

  // Filter users based on search and filters
  const filteredUsers = localUsers.filter((user) => {
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

    const aValue = (a[sortConfig.key] ?? '') as any;
    const bValue = (b[sortConfig.key] ?? '') as any;
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
      'Blocked',
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
          user.isBlocked ? 'Blocked' : 'Active',
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

  // API call to block/unblock
  const apiToggleBlock = async (userId: string, isBlocked: boolean) => {
    const res = await fetch('/api/admin/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBlocked }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Request failed');
    }
    return res.json();
  };

  // Verify current block status before action
  const verifyAndGetUserStatus = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/user-status?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to get user status');
      const data = await res.json();
      return !!data.isBlocked;
    } catch (error) {
      console.error('Error verifying user status:', error);
      throw new Error('Failed to verify current user status');
    }
  };

  // Optimistic update / handle action
  const handleUserAction = async (type: 'ban' | 'unban' | 'delete', user: User) => {
    setActionError(null);
    setLoadingAction(true);

    try {
      if (type === 'ban' || type === 'unban') {
        // Verify current status before making changes
        const isCurrentlyBlocked = await verifyAndGetUserStatus(user.id);

        // Only proceed if the action makes sense (don't ban already banned users)
        if ((type === 'ban' && isCurrentlyBlocked) || (type === 'unban' && !isCurrentlyBlocked)) {
          setActionError(type === 'ban' ? 'User is already blocked' : 'User is already unblocked');
          setLoadingAction(false);
          return;
        }

        // Now apply the optimistic update
        setLocalUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBlocked: type === 'ban' } : u)),
        );

        // API call with the appropriate action
        await apiToggleBlock(user.id, type === 'ban');
      } else if (type === 'delete') {
        // delete path if desired (server must support it)
        await fetch(`/api/admin/delete-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }).then((r) => {
          if (!r.ok) throw new Error('Delete failed');
        });
        setLocalUsers((prev) => prev.filter((u) => u.id !== user.id));
      }
    } catch (e: any) {
      // rollback optimistic update on error
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !(type === 'ban') } : u)),
      );
      setActionError(e?.message || 'Action failed');
      console.error(e);
    } finally {
      setLoadingAction(false);
      setDialog({ type: null, user: null });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and view all users on the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
            <Download size={16} />
            Export to CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row">
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
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100">
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
                        {user.isBlocked ? (
                          <Badge className="border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-300">
                            Blocked
                          </Badge>
                        ) : user.isPro ? (
                          <Badge className="border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-300">
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
                            <DropdownMenuItem
                              className="flex cursor-pointer items-center gap-2"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setUserDetailsOpen(true);
                              }}
                            >
                              <UserCheck size={16} />
                              View Details
                            </DropdownMenuItem>

                            {!user.isBlocked ? (
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2 text-yellow-600"
                                onClick={() => setDialog({ type: 'ban', user })}
                              >
                                <Shield size={16} />
                                Ban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2 text-green-600"
                                onClick={() => setDialog({ type: 'unban', user })}
                              >
                                <Shield size={16} />
                                Unban User
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="flex cursor-pointer items-center gap-2 text-red-600"
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
                    <TableCell colSpan={6} className="py-6 text-center text-gray-500">
                      No users found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!dialog.type}
        onOpenChange={(open) => !open && setDialog({ type: null, user: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog.type === 'ban' && 'Ban User'}
              {dialog.type === 'unban' && 'Unban User'}
              {dialog.type === 'delete' && 'Delete User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'ban' &&
                `Are you sure you want to ban ${dialog.user?.emailAddress}? This will prevent them from accessing the platform.`}
              {dialog.type === 'unban' &&
                `Are you sure you want to unban ${dialog.user?.emailAddress}? This will restore their access.`}
              {dialog.type === 'delete' &&
                `Are you sure you want to permanently delete ${dialog.user?.emailAddress}? This action cannot be undone.`}
            </AlertDialogDescription>
            {actionError && <div className="mt-2 text-sm text-red-600">{actionError}</div>}
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

      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              User Details
              <span className="sr-only">Close</span>
            </DialogTitle>
            <DialogDescription>Detailed information about this user from Clerk</DialogDescription>
          </DialogHeader>

          {loadingUserDetails ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading user details...</p>
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 overflow-hidden rounded-full">
                  {userDetails.imageUrl ? (
                    <Image
                      src={userDetails.imageUrl}
                      alt={userDetails.firstName || 'User'}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-medium">
                      {userDetails.firstName?.[0] ||
                        userDetails.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {userDetails.firstName || userDetails.lastName
                      ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim()
                      : 'Unnamed User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userDetails.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">User ID:</dt>
                      <dd className="max-w-[240px] truncate">{userDetails.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Username:</dt>
                      <dd>{userDetails.username || 'Not set'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Created:</dt>
                      <dd>
                        {userDetails.createdAt
                          ? format(new Date(userDetails.createdAt), 'PPpp')
                          : 'Unknown'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Last Sign In:</dt>
                      <dd>
                        {userDetails.lastSignInAt
                          ? format(new Date(userDetails.lastSignInAt), 'PPpp')
                          : 'Never'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-muted-foreground">Last Updated:</dt>
                      <dd>
                        {userDetails.updatedAt
                          ? format(new Date(userDetails.updatedAt), 'PPpp')
                          : 'Unknown'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {userDetails.publicMetadata && Object.keys(userDetails.publicMetadata).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Public Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-auto text-xs">
                    <pre className="whitespace-pre-wrap rounded bg-muted p-2">
                      {JSON.stringify(userDetails.publicMetadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to load user details
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
