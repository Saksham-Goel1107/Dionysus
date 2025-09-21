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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { Edit, MoreHorizontal, Reply, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CommentForm } from './CommentForm';
import { LikeButton } from './LikeButton';

interface CommentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    user: CommentUser;
    likeCount: number;
    dislikeCount: number;
    userLike?: { isLike: boolean } | null;
    replies?: Array<{
      id: string;
      content: string;
      createdAt: Date;
      editedAt: Date | null;
      user: CommentUser;
      likeCount: number;
      dislikeCount: number;
      userLike?: { isLike: boolean } | null;
      _count: { replies: number };
    }>;
    _count: { replies: number };
  };
  blogId: string;
  depth?: number;
  onReplySuccess?: () => void;
}

export function CommentItem({ comment, blogId, depth = 0, onReplySuccess }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const utils = api.useUtils();

  const deleteComment = api.comment.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully.',
      });
      void utils.comment.getByBlogId.invalidate({ blogId });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment.',
        variant: 'destructive',
      });
    },
  });

  const { data: additionalReplies, isLoading: loadingReplies } = api.comment.getReplies.useQuery(
    { commentId: comment.id },
    {
      enabled: showAllReplies && comment._count.replies > (comment.replies?.length || 0),
    },
  );

  const isOwner = user?.id === comment.user.id;
  const displayName =
    comment.user.firstName && comment.user.lastName
      ? `${comment.user.firstName} ${comment.user.lastName}`
      : comment.user.firstName || 'Anonymous User';

  const handleReplySuccess = () => {
    setIsReplying(false);
    onReplySuccess?.();
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteComment.mutate({ commentId: comment.id });
  };

  const allReplies =
    showAllReplies && additionalReplies ? additionalReplies.replies : comment.replies || [];

  const hasMoreReplies = comment._count.replies > (comment.replies?.length || 0);

  return (
    <div
      className={`group ${depth > 0 ? 'ml-8 border-l border-gray-200 pl-4 dark:border-gray-700' : ''}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.user.imageUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {displayName[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  {comment.editedAt && <span className="ml-1 text-xs text-gray-400">(edited)</span>}
                </span>
              </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be
                            undone and will also delete all replies to this comment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <CommentForm
                blogId={blogId}
                initialValue={comment.content}
                isEdit={true}
                commentId={comment.id}
                onSuccess={handleEditSuccess}
                onCancel={() => setIsEditing(false)}
                placeholder="Edit your comment..."
                autoFocus
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {comment.content}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-4">
              <LikeButton
                itemId={comment.id}
                itemType="comment"
                likeCount={comment.likeCount}
                dislikeCount={comment.dislikeCount}
                userLike={comment.userLike}
                size="sm"
              />
              {depth < 2 && ( // Limit nesting depth to 2 levels
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                blogId={blogId}
                parentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to ${displayName}...`}
                autoFocus
              />
            </div>
          )}

          {/* Replies */}
          {allReplies.length > 0 && (
            <div className="mt-3 space-y-3">
              {allReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  blogId={blogId}
                  depth={depth + 1}
                  onReplySuccess={onReplySuccess}
                />
              ))}
            </div>
          )}

          {hasMoreReplies && !showAllReplies && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => setShowAllReplies(true)}
              disabled={loadingReplies}
            >
              {loadingReplies
                ? 'Loading...'
                : `Show ${comment._count.replies - (comment.replies?.length || 0)} more replies`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
