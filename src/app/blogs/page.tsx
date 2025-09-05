'use client';

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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, Clock, Search, SortAsc, Tag, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string;
  tags: { id: string; name: string }[];
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
  const { toast } = useToast();

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

  const readingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  return (
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
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search and Filters */}
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

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading articles...</div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No articles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedTag
                ? 'Try adjusting your search or filters'
                : 'Check back soon for new content!'}
            </p>
          </div>
        ) : (
          <>
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
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          {readingTime(blog.excerpt || '')} min read
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

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
  );
}
