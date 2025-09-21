import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { useUser } from '@clerk/nextjs';
import { Heart, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LikeButtonProps {
  itemId: string;
  itemType: 'blog' | 'comment';
  likeCount: number;
  dislikeCount: number;
  userLike?: { isLike: boolean } | null;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function LikeButton({
  itemId,
  itemType,
  likeCount,
  dislikeCount,
  userLike,
  className,
  size = 'default',
}: LikeButtonProps) {
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [optimisticLikes, setOptimisticLikes] = useState({
    likeCount,
    dislikeCount,
    userLike,
  });
  const [showSignInModal, setShowSignInModal] = useState(false);

  const utils = api.useUtils();

  const toggleBlogLike = api.blog.toggleLike.useMutation({
    onMutate: async ({ isLike }) => {
      // Cancel outgoing refetches
      await utils.blog.getLikes.cancel({ blogId: itemId });

      // Snapshot previous value
      const previousData = utils.blog.getLikes.getData({ blogId: itemId });

      // Optimistically update
      let newLikeCount = optimisticLikes.likeCount;
      let newDislikeCount = optimisticLikes.dislikeCount;
      let newUserLike = optimisticLikes.userLike;

      if (optimisticLikes.userLike) {
        if (optimisticLikes.userLike.isLike === isLike) {
          // Remove existing like/dislike
          newUserLike = null;
          if (isLike) {
            newLikeCount--;
          } else {
            newDislikeCount--;
          }
        } else {
          // Switch from like to dislike or vice versa
          newUserLike = { isLike };
          if (isLike) {
            newLikeCount++;
            newDislikeCount--;
          } else {
            newDislikeCount++;
            newLikeCount--;
          }
        }
      } else {
        // Add new like/dislike
        newUserLike = { isLike };
        if (isLike) {
          newLikeCount++;
        } else {
          newDislikeCount++;
        }
      }

      setOptimisticLikes({
        likeCount: newLikeCount,
        dislikeCount: newDislikeCount,
        userLike: newUserLike,
      });

      return { previousData };
    },
    onError: (err, newLike, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        setOptimisticLikes({
          likeCount: context.previousData.likeCount,
          dislikeCount: context.previousData.dislikeCount,
          userLike: context.previousData.userLike,
        });
      }
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Sync with server
      void utils.blog.getLikes.invalidate({ blogId: itemId });
    },
  });

  const toggleCommentLike = api.comment.toggleLike.useMutation({
    onMutate: async ({ isLike }) => {
      // Optimistic update for comments
      let newLikeCount = optimisticLikes.likeCount;
      let newDislikeCount = optimisticLikes.dislikeCount;
      let newUserLike = optimisticLikes.userLike;

      if (optimisticLikes.userLike) {
        if (optimisticLikes.userLike.isLike === isLike) {
          newUserLike = null;
          if (isLike) {
            newLikeCount--;
          } else {
            newDislikeCount--;
          }
        } else {
          newUserLike = { isLike };
          if (isLike) {
            newLikeCount++;
            newDislikeCount--;
          } else {
            newDislikeCount++;
            newLikeCount--;
          }
        }
      } else {
        newUserLike = { isLike };
        if (isLike) {
          newLikeCount++;
        } else {
          newDislikeCount++;
        }
      }

      setOptimisticLikes({
        likeCount: newLikeCount,
        dislikeCount: newDislikeCount,
        userLike: newUserLike,
      });
    },
    onError: () => {
      // Revert optimistic update
      setOptimisticLikes({ likeCount, dislikeCount, userLike });
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Invalidate queries to sync with server
      void utils.comment.getByBlogId.invalidate();
      void utils.comment.getReplies.invalidate();
    },
  });

  const handleLike = (isLike: boolean) => {
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }

    if (itemType === 'blog') {
      toggleBlogLike.mutate({ blogId: itemId, isLike });
    } else {
      toggleCommentLike.mutate({ commentId: itemId, isLike });
    }
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize =
    size === 'sm' ? 'h-7 px-2 text-xs' : size === 'lg' ? 'h-10 px-4' : 'h-8 px-3 text-sm';

  return (
    <>
      <div className={cn('flex items-center gap-1', className)}>
        {itemType === 'blog' ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                buttonSize,
                'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20',
                optimisticLikes.userLike?.isLike && 'bg-red-50 text-red-600 dark:bg-red-950/20',
              )}
              onClick={() => handleLike(true)}
              disabled={toggleBlogLike.isPending}
            >
              <Heart className={cn(iconSize, optimisticLikes.userLike?.isLike && 'fill-current')} />
              <span className="ml-1">{optimisticLikes.likeCount}</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                buttonSize,
                'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20',
                optimisticLikes.userLike?.isLike === true &&
                  'bg-green-50 text-green-600 dark:bg-green-950/20',
              )}
              onClick={() => handleLike(true)}
              disabled={toggleCommentLike.isPending}
            >
              <ThumbsUp
                className={cn(
                  iconSize,
                  optimisticLikes.userLike?.isLike === true && 'fill-current',
                )}
              />
              <span className="ml-1">{optimisticLikes.likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                buttonSize,
                'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20',
                optimisticLikes.userLike?.isLike === false &&
                  'bg-red-50 text-red-600 dark:bg-red-950/20',
              )}
              onClick={() => handleLike(false)}
              disabled={toggleCommentLike.isPending}
            >
              <ThumbsDown
                className={cn(
                  iconSize,
                  optimisticLikes.userLike?.isLike === false && 'fill-current',
                )}
              />
              <span className="ml-1">{optimisticLikes.dislikeCount}</span>
            </Button>
          </>
        )}
      </div>

      <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              Please sign in to like this content. You&apos;ll be able to like, comment and interact
              with other users.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSignInModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => router.push('/sign-in')}>Sign in</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
