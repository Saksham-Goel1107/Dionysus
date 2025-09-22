'use client';

import { Footer } from '@/app/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SafeImage from '@/components/ui/SafeImage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Calendar,
  Heart,
  LayoutGrid,
  LayoutList,
  MessageCircle,
  Search,
  SortAsc,
  Tag,
  ThumbsDown,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Navbar } from '../components/navbar';
import BlogSubscriptionBell from './components/BlogSubscriptionBell';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string;
  tags: { id: string; name: string }[];
  _count: {
    likes: number;
    dislikes: number;
    comments: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();
  const router = useRouter();

  const fetchBlogs = useCallback(
    async (page = 1, search = '', tag = '', sort = 'newest') => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '9');
        if (search) params.append('search', search);
        if (tag) params.append('tag', tag);
        if (sort) params.append('sort', sort);

        const response = await fetch(`/api/blogs?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }

        const data = await response.json();
        setBlogs(data.blogs);
        setPagination(data.pagination);

        // Extract unique tags
        const tags = Array.from(
          new Set(data.blogs.flatMap((blog: BlogPost) => blog.tags.map((tag) => tag.name))),
        ) as string[];
        setAllTags(tags);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch blogs.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlogs(1, searchTerm, selectedTag || '', sortBy);
  };

  const handleTagClick = (tag: string) => {
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    fetchBlogs(1, searchTerm, newTag || '', sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    fetchBlogs(1, searchTerm, selectedTag || '', newSort);
  };

  const handlePageChange = (newPage: number) => {
    fetchBlogs(newPage, searchTerm, selectedTag || '', sortBy);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-white shadow-sm dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-6xl">
                Our Blog
              </h1>
              <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300">
                Discover insights, tutorials, and updates from our team. Stay up to date with the
                latest trends and best practices.
              </p>
              <div className="mt-8 flex justify-center">
                <BlogSubscriptionBell />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Search and Filters - hide when there's no content to avoid confusing empty search */}
          {(isLoading || blogs.length > 0) && (
            <div className="mb-12">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-4">
                      <div className="relative flex-1">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
                          size={20}
                        />
                        <Input
                          placeholder="Search articles..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button type="submit">Search</Button>
                    </form>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <SortAsc size={16} className="text-gray-400" />
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="title_asc">Title A-Z</SelectItem>
                          <SelectItem value="title_desc">Title Z-A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* View toggle: grid / table */}
                    <div className="ml-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('grid')}
                        aria-pressed={viewMode === 'grid'}
                        title="Grid view"
                      >
                        <LayoutGrid size={16} />
                        <span className="sr-only">Grid view</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('table')}
                        aria-pressed={viewMode === 'table'}
                        title="Table view"
                      >
                        <LayoutList size={16} />
                        <span className="sr-only">Table view</span>
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div>
                      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Tag size={16} />
                        Filter by topic:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedTag === tag ? 'default' : 'outline'}
                            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {(selectedTag || searchTerm) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTag(null);
                              setSearchTerm('');
                              fetchBlogs(1, '', '', sortBy);
                            }}
                            className="flex items-center gap-1 text-xs"
                          >
                            <X size={14} />
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blog Posts Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading articles...</div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Card className="w-full max-w-xl">
                <CardContent className="p-8 text-center">
                  <h3 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
                    No articles found
                  </h3>
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    {searchTerm || selectedTag
                      ? 'No results matched your search or filters.'
                      : 'There are no published articles yet. Check back soon or create the first post!'}
                  </p>
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchBlogs(1, searchTerm, selectedTag || '', sortBy)}
                    >
                      Refresh
                    </Button>
                    {(selectedTag || searchTerm) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedTag(null);
                          setSearchTerm('');
                          fetchBlogs(1, '', '', sortBy);
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                    <Link href="/">
                      <Button variant="secondary">Back to Home</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {blogs.map((blog) => (
                    <Link key={blog.id} href={`/blogs/${blog.slug}`} className="block">
                      <Card className="group h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="relative aspect-video overflow-hidden rounded-t-lg">
                          {blog.coverImage ? (
                            <SafeImage
                              src={blog.coverImage}
                              alt={blog.title}
                              width={500}
                              height={300}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                              <span className="text-2xl font-bold text-white">
                                {blog.title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                        </div>
                        <CardHeader className="pb-3">
                          <div className="mb-3 flex flex-wrap gap-1">
                            {blog.tags.map((tag) => (
                              <Badge key={tag.id} variant="secondary" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                          <CardTitle className="line-clamp-2 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {blog.title}
                          </CardTitle>
                          {blog.excerpt && (
                            <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                              {blog.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              {format(new Date(blog.publishedAt), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Heart size={14} className="text-red-500" />
                                <span>{blog._count.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsDown size={14} className="text-gray-500" />
                                <span>{blog._count.dislikes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle size={14} className="text-blue-500" />
                                <span>{blog._count.comments}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mb-12">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b">
                          <TableHead className="text-sm text-muted-foreground">Post</TableHead>
                          <TableHead className="text-sm text-muted-foreground">Tags</TableHead>
                          <TableHead className="text-sm text-muted-foreground">
                            Engagement
                          </TableHead>
                          <TableHead className="text-right text-sm text-muted-foreground">
                            Date
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blogs.map((blog) => (
                          <TableRow
                            key={blog.id}
                            className="cursor-pointer transition-colors hover:bg-muted/10"
                            role="link"
                            tabIndex={0}
                            onClick={() => router.push(`/blogs/${blog.slug}`)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                router.push(`/blogs/${blog.slug}`);
                              }
                            }}
                          >
                            <TableCell className="py-4 align-top">
                              <div className="flex items-start gap-4">
                                {blog.coverImage ? (
                                  <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-gray-800">
                                    <SafeImage
                                      src={blog.coverImage}
                                      alt={blog.title}
                                      width={160}
                                      height={80}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-20 w-28 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    <span className="font-bold">
                                      {blog.title.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <Link
                                    href={`/blogs/${blog.slug}`}
                                    className="block text-lg font-semibold leading-tight text-gray-900 hover:underline dark:text-gray-100"
                                  >
                                    {blog.title}
                                  </Link>
                                  {blog.excerpt && (
                                    <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                      {blog.excerpt}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 align-top">
                              <div className="flex flex-wrap gap-2">
                                {blog.tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="px-2 py-1 text-xs font-medium"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>

                            <TableCell className="py-4 align-top">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <Heart size={14} className="text-red-500" />
                                  <span>{blog._count.likes}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <ThumbsDown size={14} className="text-gray-500" />
                                  <span>{blog._count.dislikes}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <MessageCircle size={14} className="text-blue-500" />
                                  <span>{blog._count.comments}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 text-right align-top text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(blog.publishedAt), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
