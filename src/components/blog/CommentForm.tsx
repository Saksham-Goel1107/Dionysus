import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import { useUser } from '@clerk/nextjs';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  blogId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
  isEdit?: boolean;
  commentId?: string;
}

export function CommentForm({
  blogId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
  initialValue = '',
  isEdit = false,
  commentId,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const { toast } = useToast();
  const { user, isSignedIn } = useUser();
  const utils = api.useUtils();
  const router = useRouter();

  const createComment = api.comment.create.useMutation({
    onSuccess: () => {
      setContent('');
      toast({
        title: 'Comment posted!',
        description: 'Your comment has been posted successfully.',
      });
      void utils.comment.getByBlogId.invalidate({ blogId });
      if (parentId) {
        void utils.comment.getReplies.invalidate({ commentId: parentId });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateComment = api.comment.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Comment updated!',
        description: 'Your comment has been updated successfully.',
      });
      void utils.comment.getByBlogId.invalidate({ blogId });
      if (parentId) {
        void utils.comment.getReplies.invalidate({ commentId: parentId });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to post comments.',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Comment cannot be empty',
        description: 'Please write something before posting.',
        variant: 'destructive',
      });
      return;
    }

    // Client-side security check
    if (content.includes('<') || content.includes('>') || content.includes('&')) {
      toast({
        title: 'Invalid content',
        description: 'HTML tags and special characters are not allowed.',
        variant: 'destructive',
      });
      return;
    }

    if (content.length > 2000) {
      toast({
        title: 'Comment too long',
        description: 'Comments must be under 2000 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (isEdit && commentId) {
      updateComment.mutate({
        commentId,
        content: content.trim(),
      });
    } else {
      createComment.mutate({
        blogId,
        parentId,
        content: content.trim(),
      });
    }
  };
  const isLoading = createComment.isPending || updateComment.isPending;

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please{' '}
          <button
            onClick={() => router.push('/sign-in')}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            sign in
          </button>{' '}
          to post comments.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user?.imageUrl} alt={user?.firstName || 'User'} />
          <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600"
            autoFocus={autoFocus}
            disabled={isLoading}
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}/2000 characters
            </span>
            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-1 h-3 w-3" />
                    {isEdit ? 'Update' : 'Post'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
