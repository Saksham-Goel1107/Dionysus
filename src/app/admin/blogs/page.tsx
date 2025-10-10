'use client';

import { AdminCommentsPanel } from '@/components/AdminCommentsPanel';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Edit,
  ExternalLink,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  isPublished: boolean;
  isSponsored: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorId: string;
  tags: { id: string; name: string }[];
  commentCount: number;
  likeCount: number;
  dislikeCount: number;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/blogs');

      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }

      const data = await response.json();
      setBlogs(data.blogs);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch blogs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleTogglePublish = async (blogId: string) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-publish' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle blog publication');
      }

      const data = await response.json();
      await fetchBlogs();

      toast({
        title: 'Success',
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle blog publication.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete blog');
      }

      await fetchBlogs();

      toast({
        title: 'Success',
        description: 'Blog deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Blog Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and manage your blog content
          </p>
        </div>
        <Link href="/admin/blogs/create">
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogs.length}</div>
            <p className="text-xs text-muted-foreground">All blog posts created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogs.filter((b) => b.isPublished).length}</div>
            <p className="text-xs text-muted-foreground">Live on your blog</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.reduce((sum, blog) => sum + blog.commentCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.reduce((sum, blog) => sum + blog.likeCount + blog.dislikeCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Likes & dislikes</p>
          </CardContent>
        </Card>
      </div>

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Blog Posts</CardTitle>
          <CardDescription>Manage your blog content and publication status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading blog posts...</div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium">No blog posts yet</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Create your first blog post to start sharing your thoughts and insights with your
                  audience.
                </p>
                <Link href="/admin/blogs/create">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Post
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-[30%]">Post</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[15%]">Tags</TableHead>
                    <TableHead className="w-[15%]">Engagement</TableHead>
                    <TableHead className="w-[15%]">Last Updated</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 font-medium leading-tight">{blog.title}</div>
                            {blog.isPublished && (
                              <Link
                                href={`/blogs/${blog.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View blog post"
                              >
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                          {blog.excerpt && (
                            <div className="line-clamp-2 text-sm text-muted-foreground">
                              {blog.excerpt}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={blog.isPublished ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {blog.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          {blog.isSponsored && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 bg-amber-50 text-xs text-amber-700 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-300"
                            >
                              Sponsored
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="px-2 py-0 text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {blog.tags.length > 2 && (
                            <Badge variant="outline" className="px-2 py-0 text-xs">
                              +{blog.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-3 w-3" />
                            <span>{blog.commentCount} comments</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{blog.likeCount} likes</span>
                            <span>{blog.dislikeCount} dislikes</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(blog.updatedAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/blogs/${blog.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Edit post"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleTogglePublish(blog.id)}
                            title={blog.isPublished ? 'Unpublish post' : 'Publish post'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Delete post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &ldquo;{blog.title}&rdquo;. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBlog(blog.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Post
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Management Section */}
      <div className="mt-8">
        <AdminCommentsPanel />
      </div>
    </div>
  );
}
