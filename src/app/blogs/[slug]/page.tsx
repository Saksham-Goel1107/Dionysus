'use client';

import { Navbar } from '@/app/components/navbar';
import { CommentsList, LikeButton } from '@/components/blog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SafeImage from '@/components/ui/SafeImage';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MessageCircle, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showCommentsButton, setShowCommentsButton] = useState(false);
  const { toast } = useToast();
  const user = useUser();

  // Handle scroll to show/hide comments button
  useEffect(() => {
    const handleScroll = () => {
      const commentsSection = document.getElementById('comments');
      if (!commentsSection) return;

      const rect = commentsSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Show button when scrolled past header and hide when near comments
      const scrollY = window.scrollY;
      const headerHeight = 400; // Approximate header height
      const commentsTop = rect.top + scrollY;

      setShowCommentsButton(scrollY > headerHeight && scrollY < commentsTop - windowHeight);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch blog data using tRPC
  const {
    data: blog,
    isLoading,
    error,
  } = api.blog.getBySlug.useQuery(
    { slug },
    {
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // Handle anchor scrolling when page loads
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [blog]); // Depend on blog to ensure comments are loaded

  const readingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || 'Check out this blog post',
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied!',
          description: 'Blog post URL copied to clipboard.',
        });
      }
    } else if (blog) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Blog post URL copied to clipboard.',
      });
    }
  };

  const handleSummarize = async () => {
    if (!blog || isSummarizing) return;

    try {
      setIsSummarizing(true);
      setSummary('');
      setShowSummary(true);

      const response = await fetch('/api/blog-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: blog.content,
          title: blog.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      let accumulatedSummary = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsSummarizing(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulatedSummary += parsed.text;
                setSummary(accumulatedSummary);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate summary.',
        variant: 'destructive',
      });
      setShowSummary(false);
    } finally {
      setIsSummarizing(false);
    }
  };

  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <div className="text-gray-500 dark:text-gray-400">Loading blog post...</div>
          </div>
        </div>
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            {error?.message === 'Blog post not found'
              ? 'Blog Post Not Found'
              : 'Error Loading Blog Post'}
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            {error?.message === 'Blog post not found'
              ? "The blog post you're looking for doesn't exist or has been removed."
              : 'There was an error loading the blog post. Please try again.'}
          </p>
          <Link href="/blogs">
            <Button>
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white/80 shadow-sm backdrop-blur-sm dark:bg-gray-800/80">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/blogs">
              <Button variant="ghost" className="mb-6 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <ArrowLeft size={16} className="mr-2" />
                Back to Blogs
              </Button>
            </Link>

            {/* Cover Image */}
            {blog.coverImage && (
              <div className="relative mb-8 aspect-video overflow-hidden rounded-xl shadow-lg">
                <SafeImage
                  src={blog.coverImage}
                  alt={blog.title}
                  className="h-full w-full object-cover"
                  width={1000}
                  height={1000}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            {/* Title and Meta */}
            <div className="mb-8">
              <div className="mb-4 flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>

              <h1 className="mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300 md:text-4xl lg:text-5xl">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="mb-6 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {blog.publishedAt
                      ? format(new Date(blog.publishedAt), 'MMMM d, yyyy')
                      : 'Unpublished'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {readingTime(blog.content)} min read
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <>
                    {user.isSignedIn && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className="flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <Sparkles size={16} className={isSummarizing ? 'animate-spin' : ''} />
                        {isSummarizing ? 'Summarizing...' : 'AI Summary'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Share2 size={16} />
                      Share
                    </Button>
                  </>
                </div>
              </div>

              {/* AI Summary */}
              {showSummary && user.isSignedIn && (
                <div className="mt-6 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-800 dark:text-purple-200">
                    <Sparkles size={16} />
                    AI Summary
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    {summary ||
                      (isSummarizing ? 'Generating summary...' : 'Summary will appear here')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-8 text-3xl font-bold text-gray-900 dark:text-white">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-4 mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="mb-4 border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                        {children}
                      </pre>
                    ),
                    img: ({ src, alt }) => (
                      <SafeImage
                        width={1000}
                        height={1000}
                        src={typeof src === 'string' ? src : '/placeholder.png'}
                        alt={typeof alt === 'string' ? alt : 'Blog image'}
                        className="mb-4 h-auto w-full rounded-lg"
                      />
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {blog.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Blog Actions - Like/Dislike */}
          <div className="mt-8 flex justify-center">
            <Card className="shadow-md">
              <CardContent className="flex items-center justify-center p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    What did you think of this post?
                  </span>
                  <LikeButton
                    itemId={blog.id}
                    itemType="blog"
                    likeCount={blog.likeCount}
                    dislikeCount={blog.dislikeCount}
                    userLike={blog.userLike}
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <div id="comments" className="mt-12">
            <Card className="shadow-xl">
              <CardContent className="p-8 md:p-12">
                <CommentsList blogId={blog.id} initialCommentCount={blog.commentCount} />
              </CardContent>
            </Card>
          </div>

          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link href="/blogs">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to All Posts
              </Button>
            </Link>
          </div>
        </div>

        {/* Sticky Comments Button */}
        {showCommentsButton && (
          <Button
            onClick={scrollToComments}
            className="fixed right-6 top-1/2 z-50 -translate-y-1/2 transform rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl"
            size="sm"
          >
            <MessageCircle size={20} />
            <span className="ml-2 hidden sm:inline">View Comments</span>
          </Button>
        )}
      </div>
    </>
  );
}
