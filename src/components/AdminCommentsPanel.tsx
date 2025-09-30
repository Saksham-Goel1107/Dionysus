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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

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
import { api } from '@/trpc/react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  ExternalLink,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BanUserModal } from './BanUserModal';
import { SendWarningModal } from './SendWarningModal';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddress: string;
    imageUrl: string | null;
    isBlocked: boolean;
  };
  blog: {
    id: string;
    title: string;
    slug: string;
  };
  likeCount: number;
  dislikeCount: number;
  _count: {
    replies: number;
  };
}

interface AdminCommentsPanelProps {
  blogId?: string;
  initialComments?: Comment[];
}

export function AdminCommentsPanel({
  blogId,
  initialComments: _initialComments = [],
}: AdminCommentsPanelProps) {
  const [selectedWarningUser, setSelectedWarningUser] = useState<{
    id: string;
    name: string;
    email: string;
    reason?: string;
  } | null>(null);
  const [selectedBanUser, setSelectedBanUser] = useState<{
    id: string;
    name: string;
    email: string;
    reason?: string;
    isCurrentlyBanned?: boolean;
  } | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const utils = api.useUtils();

  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.comment.getAllForAdmin.useInfiniteQuery(
      { blogId, limit: 20, search: debouncedSearchQuery },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const allComments = useMemo(
    () => data?.pages.flatMap((page) => page.comments) ?? [],
    [data?.pages],
  );

  // Separate banned and active users with proper filtering
  const { bannedComments, activeComments } = useMemo(() => {
    const banned = allComments.filter((comment) => comment.user.isBlocked === true);
    const active = allComments.filter((comment) => comment.user.isBlocked !== true);
    return { bannedComments: banned, activeComments: active };
  }, [allComments]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, []);

  const deleteComment = api.comment.adminDelete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Comment deleted',
        description: 'The comment has been deleted successfully.',
      });
      // Refresh comments without full page reload
      void utils.comment.getAllForAdmin.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment.',
        variant: 'destructive',
      });
    },
  });

  const confirmDeleteComment = () => {
    if (commentToDelete) {
      deleteComment.mutate({ commentId: commentToDelete });
      setCommentToDelete(null);
    }
  };

  const handleSendWarning = (comment: Comment, reason: string) => {
    const userName =
      comment.user.firstName && comment.user.lastName
        ? `${comment.user.firstName} ${comment.user.lastName}`
        : comment.user.firstName || 'User';

    setSelectedWarningUser({
      id: comment.user.id,
      name: userName,
      email: comment.user.emailAddress,
      reason,
    });
  };

  const handleBanUser = (comment: Comment) => {
    const userName =
      comment.user.firstName && comment.user.lastName
        ? `${comment.user.firstName} ${comment.user.lastName}`
        : comment.user.firstName || 'User';

    setSelectedBanUser({
      id: comment.user.id,
      name: userName,
      email: comment.user.emailAddress,
      reason: comment.user.isBlocked ? 'Previously banned' : 'Violation of community guidelines',
      isCurrentlyBanned: comment.user.isBlocked || false,
    });
  };

  if (isLoading && allComments.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading comments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comment Management
          </CardTitle>
          <CardDescription>
            Manage comments and user interactions across your blog posts
          </CardDescription>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search comments, users, or blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeComments.length === 0 && bannedComments.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium">No comments found</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {searchQuery
                    ? `No comments found matching "${searchQuery}"`
                    : blogId
                      ? 'This blog post has no comments yet.'
                      : 'No comments found across all blog posts.'}
                </p>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 py-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-sm">
                    All Comments ({allComments.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-sm">
                    Active Users ({activeComments.length})
                  </TabsTrigger>
                  <TabsTrigger value="blocked" className="text-sm text-red-600">
                    Blocked Users ({bannedComments.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="w-[25%]">User</TableHead>
                        <TableHead className="w-[30%]">Comment</TableHead>
                        <TableHead className="w-[20%]">Blog Post</TableHead>
                        <TableHead className="w-[15%]">Stats</TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allComments.map((comment) => {
                        const userName =
                          comment.user.firstName && comment.user.lastName
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user.firstName || 'Anonymous';
                        const isBlocked = comment.user.isBlocked === true;

                        return (
                          <TableRow
                            key={comment.id}
                            className={`hover:bg-muted/50 ${isBlocked ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className={`h-8 w-8 ${isBlocked ? 'opacity-60' : ''}`}>
                                  <AvatarImage
                                    src={comment.user.imageUrl || undefined}
                                    alt={userName}
                                  />
                                  <AvatarFallback
                                    className={
                                      isBlocked
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }
                                  >
                                    {userName[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`text-sm font-medium ${isBlocked ? 'text-red-700 dark:text-red-300' : ''}`}
                                    >
                                      {userName}
                                    </div>
                                    {isBlocked && (
                                      <Badge variant="destructive" className="text-xs">
                                        Blocked
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {comment.user.emailAddress}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div
                                  className={`line-clamp-2 text-sm ${isBlocked ? 'opacity-75' : ''}`}
                                >
                                  {comment.content}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  {comment.editedAt && (
                                    <span className="text-orange-600">(edited)</span>
                                  )}
                                  {comment._count.replies > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {comment._count.replies} replies
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/blogs/${comment.blog.slug}`}
                                  className={`flex-1 text-sm hover:underline ${isBlocked ? 'opacity-75' : ''}`}
                                  target="_blank"
                                >
                                  {comment.blog.title}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`flex items-center gap-3 text-sm ${isBlocked ? 'opacity-75' : ''}`}
                              >
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3 text-green-600" />
                                  <span>{comment.likeCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3 text-red-600" />
                                  <span>{comment.dislikeCount}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/blogs/${comment.blog.slug}#comment-${comment.id}`}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Comment
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSendWarning(comment, 'Inappropriate comment content')
                                    }
                                    className="text-orange-600"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Send Warning
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleBanUser(comment)}
                                    className={isBlocked ? 'text-green-600' : 'text-red-600'}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {isBlocked ? 'Unban User' : 'Ban User'}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive"
                                        onClick={() => setCommentToDelete(comment.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Comment
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this comment? This action
                                          cannot be undone and will also delete all replies to this
                                          comment.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={confirmDeleteComment}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="w-[25%]">User</TableHead>
                        <TableHead className="w-[30%]">Comment</TableHead>
                        <TableHead className="w-[20%]">Blog Post</TableHead>
                        <TableHead className="w-[15%]">Stats</TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeComments.map((comment) => {
                        const userName =
                          comment.user.firstName && comment.user.lastName
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user.firstName || 'Anonymous';

                        return (
                          <TableRow key={comment.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={comment.user.imageUrl || undefined}
                                    alt={userName}
                                  />
                                  <AvatarFallback className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    {userName[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">{userName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {comment.user.emailAddress}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="line-clamp-2 text-sm">{comment.content}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  {comment.editedAt && (
                                    <span className="text-orange-600">(edited)</span>
                                  )}
                                  {comment._count.replies > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {comment._count.replies} replies
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/blogs/${comment.blog.slug}`}
                                  className="flex-1 text-sm hover:underline"
                                  target="_blank"
                                >
                                  {comment.blog.title}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3 text-green-600" />
                                  <span>{comment.likeCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3 text-red-600" />
                                  <span>{comment.dislikeCount}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/blogs/${comment.blog.slug}#comment-${comment.id}`}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Comment
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSendWarning(comment, 'Inappropriate comment content')
                                    }
                                    className="text-orange-600"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Send Warning
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleBanUser(comment)}
                                    className="text-red-600"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban User
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive"
                                        onClick={() => setCommentToDelete(comment.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Comment
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this comment? This action
                                          cannot be undone and will also delete all replies to this
                                          comment.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={confirmDeleteComment}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="blocked" className="mt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="w-[25%]">User</TableHead>
                        <TableHead className="w-[30%]">Comment</TableHead>
                        <TableHead className="w-[20%]">Blog Post</TableHead>
                        <TableHead className="w-[15%]">Stats</TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bannedComments.map((comment) => {
                        const userName =
                          comment.user.firstName && comment.user.lastName
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user.firstName || 'Anonymous';

                        return (
                          <TableRow
                            key={comment.id}
                            className="bg-red-25/30 hover:bg-red-50/50 dark:bg-red-950/5 dark:hover:bg-red-950/10"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 opacity-60">
                                  <AvatarImage
                                    src={comment.user.imageUrl || undefined}
                                    alt={userName}
                                  />
                                  <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                    {userName[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-red-700 dark:text-red-300">
                                      {userName}
                                    </div>
                                    <Badge variant="destructive" className="text-xs">
                                      Blocked
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {comment.user.emailAddress}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="line-clamp-2 text-sm opacity-75">{comment.content}</p>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                  {comment.editedAt && ' (edited)'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 text-sm opacity-75">
                                  {comment.blog.title}
                                </div>
                                <Link
                                  href={`/blogs/${comment.blog.slug}#comment-${comment.id}`}
                                  target="_blank"
                                  className="ml-1"
                                >
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 opacity-75">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3 text-green-600" />
                                  <span>{comment.likeCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3 text-red-600" />
                                  <span>{comment.dislikeCount}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/blogs/${comment.blog.slug}#comment-${comment.id}`}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Comment
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleBanUser(comment)}
                                    className="text-green-600"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Unban User
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive"
                                        onClick={() => setCommentToDelete(comment.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Comment
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this comment? This action
                                          cannot be undone and will also delete all replies to this
                                          comment.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={confirmDeleteComment}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {hasNextPage && (
            <div className="flex justify-center p-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedWarningUser && (
        <SendWarningModal
          isOpen={!!selectedWarningUser}
          onClose={() => setSelectedWarningUser(null)}
          userId={selectedWarningUser.id}
          userName={selectedWarningUser.name}
          userEmail={selectedWarningUser.email}
          reason={selectedWarningUser.reason}
        />
      )}

      {selectedBanUser && (
        <BanUserModal
          isOpen={!!selectedBanUser}
          onClose={() => setSelectedBanUser(null)}
          userId={selectedBanUser.id}
          userName={selectedBanUser.name}
          userEmail={selectedBanUser.email}
          reason={selectedBanUser.reason}
          isCurrentlyBanned={selectedBanUser.isCurrentlyBanned}
        />
      )}
    </>
  );
}
