import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { Loader2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

interface CommentsListProps {
  blogId: string;
  initialCommentCount?: number;
}

export function CommentsList({ blogId, initialCommentCount = 0 }: CommentsListProps) {
  const [limit] = useState(10);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    api.comment.getByBlogId.useInfiniteQuery(
      { blogId, limit },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];
  const totalComments = comments.length;

  const handleNewComment = () => {
    void refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Comments</h3>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {totalComments || initialCommentCount}
        </span>
      </div>

      {/* Comment Form */}
      <CommentForm
        blogId={blogId}
        onSuccess={handleNewComment}
        placeholder="What are your thoughts on this post?"
      />

      {/* Comments */}
      {comments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <MessageCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">No comments yet</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Be the first to share your thoughts on this post!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              blogId={blogId}
              onReplySuccess={handleNewComment}
            />
          ))}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-[120px]"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more comments'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
