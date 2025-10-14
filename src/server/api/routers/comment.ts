import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const commentRouter = createTRPCRouter({
  // Get comments for a blog post (public)
  getByBlogId: publicProcedure
    .input(
      z.object({
        blogId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.comment.findMany({
        where: {
          blogId: input.blogId,
          parentId: null, // Only top-level comments
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              isLike: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
              likes: {
                select: {
                  id: true,
                  userId: true,
                  isLike: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: 3, // Limit initial replies shown
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (comments.length > input.limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        comments: comments.map((comment) => ({
          ...comment,
          likeCount: comment.likes.filter((like) => like.isLike).length,
          dislikeCount: comment.likes.filter((like) => !like.isLike).length,
          userLike: ctx.userId ? comment.likes.find((like) => like.userId === ctx.userId) : null,
          replies: comment.replies.map((reply) => ({
            ...reply,
            likeCount: reply.likes.filter((like) => like.isLike).length,
            dislikeCount: reply.likes.filter((like) => !like.isLike).length,
            userLike: ctx.userId ? reply.likes.find((like) => like.userId === ctx.userId) : null,
          })),
        })),
        nextCursor,
      };
    }),

  // Get replies for a comment
  getReplies: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const replies = await ctx.db.comment.findMany({
        where: {
          parentId: input.commentId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              isLike: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (replies.length > input.limit) {
        const nextItem = replies.pop();
        nextCursor = nextItem!.id;
      }

      return {
        replies: replies.map((reply) => ({
          ...reply,
          likeCount: reply.likes.filter((like) => like.isLike).length,
          dislikeCount: reply.likes.filter((like) => !like.isLike).length,
          userLike: ctx.userId ? reply.likes.find((like) => like.userId === ctx.userId) : null,
        })),
        nextCursor,
      };
    }),

  // Create a comment (protected)
  create: protectedProcedure
    .input(
      z.object({
        content: z
          .string()
          .min(1, 'Comment cannot be empty')
          .max(2000, 'Comment cannot exceed 2000 characters')
          .regex(/^[^<>&]*$/, 'HTML tags and special characters are not allowed') // Basic XSS prevention
          .transform((content) => content.trim()),
        blogId: z.string().cuid('Invalid blog ID'),
        parentId: z.string().cuid('Invalid parent comment ID').optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: Check if user has posted too many comments recently
      const recentComments = await ctx.db.comment.count({
        where: {
          userId: ctx.userId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (recentComments >= 10) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many comments posted recently. Please wait before posting again.',
        });
      }

      // Verify blog exists and is published
      const blog = await ctx.db.blog.findUnique({
        where: {
          id: input.blogId,
          isPublished: true,
        },
        select: {
          id: true,
          isCommentsEnabled: true,
        },
      });

      if (!blog) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found or not published',
        });
      }

      // Check if comments are enabled for this blog post
      if (!blog.isCommentsEnabled) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Comments are disabled for this blog post',
        });
      }

      // If replying to a comment, verify parent exists and belongs to same blog
      if (input.parentId) {
        const parentComment = await ctx.db.comment.findUnique({
          where: { id: input.parentId },
          select: { blogId: true, parentId: true },
        });

        if (!parentComment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          });
        }

        if (parentComment.blogId !== input.blogId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Parent comment does not belong to this blog post',
          });
        }

        // Check nesting depth - limit to 2 levels (parent -> reply -> reply to reply)
        if (parentComment.parentId) {
          // This is already a reply to a reply, so we can't nest further
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Maximum reply depth reached. You can only reply to top-level comments or their direct replies.',
          });
        }
      }

      try {
        const comment = await ctx.db.comment.create({
          data: {
            content: input.content,
            userId: ctx.userId,
            blogId: input.blogId,
            parentId: input.parentId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
            likes: true,
            _count: {
              select: {
                replies: true,
              },
            },
          },
        });

        return {
          ...comment,
          likeCount: 0,
          dislikeCount: 0,
          userLike: undefined,
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create comment',
        });
      }
    }),

  // Update a comment (protected)
  update: protectedProcedure
    .input(
      z.object({
        commentId: z.string().cuid('Invalid comment ID'),
        content: z
          .string()
          .min(1, 'Comment cannot be empty')
          .max(2000, 'Comment cannot exceed 2000 characters')
          .regex(/^[^<>&]*$/, 'HTML tags and special characters are not allowed') // Basic XSS prevention
          .transform((content) => content.trim()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingComment = await ctx.db.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!existingComment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (existingComment.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own comments',
        });
      }

      const updatedComment = await ctx.db.comment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
          editedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              isLike: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      return {
        ...updatedComment,
        likeCount: updatedComment.likes.filter((like) => like.isLike).length,
        dislikeCount: updatedComment.likes.filter((like) => !like.isLike).length,
        userLike: ctx.userId
          ? updatedComment.likes.find((like) => like.userId === ctx.userId)
          : null,
      };
    }),

  // Delete a comment (protected)
  delete: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingComment = await ctx.db.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!existingComment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (existingComment.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        });
      }

      // Delete the comment and all its replies (cascade delete)
      await ctx.db.comment.delete({
        where: { id: input.commentId },
      });

      return { success: true };
    }),

  // Like/dislike a comment (protected)
  toggleLike: protectedProcedure
    .input(
      z.object({
        commentId: z.string().cuid('Invalid comment ID'),
        isLike: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: Check if user has liked/disliked too many comments recently
      const recentLikes = await ctx.db.commentLike.count({
        where: {
          userId: ctx.userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000), // Last minute
          },
        },
      });

      if (recentLikes >= 20) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many likes/dislikes recently. Please wait before trying again.',
        });
      }

      // Verify comment exists
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      // Check if user already liked/disliked this comment
      const existingLike = await ctx.db.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId: ctx.userId,
            commentId: input.commentId,
          },
        },
      });

      if (existingLike) {
        if (existingLike.isLike === input.isLike) {
          // Remove like/dislike if clicking the same button
          await ctx.db.commentLike.delete({
            where: { id: existingLike.id },
          });
          return { success: true, action: 'removed' };
        } else {
          // Switch between like and dislike
          await ctx.db.commentLike.update({
            where: { id: existingLike.id },
            data: { isLike: input.isLike },
          });
          return { success: true, action: 'updated' };
        }
      } else {
        // Create new like/dislike
        await ctx.db.commentLike.create({
          data: {
            userId: ctx.userId,
            commentId: input.commentId,
            isLike: input.isLike,
          },
        });
        return { success: true, action: 'created' };
      }
    }),
  // Admin procedures
  // Get all comments for admin management
  getAllForAdmin: protectedProcedure
    .input(
      z.object({
        blogId: z.string().optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { emailAddress: true },
      });

      if (user?.emailAddress !== process.env.ADMIN_EMAIL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const where: any = {};
      if (input.blogId) where.blogId = input.blogId;
      if (input.userId) where.userId = input.userId;
      if (input.search) {
        where.OR = [
          { content: { contains: input.search, mode: 'insensitive' } },
          {
            blog: {
              title: { contains: input.search, mode: 'insensitive' },
            },
          },
          {
            user: {
              OR: [
                { firstName: { contains: input.search, mode: 'insensitive' } },
                { lastName: { contains: input.search, mode: 'insensitive' } },
                { emailAddress: { contains: input.search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      const comments = await ctx.db.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              emailAddress: true,
              imageUrl: true,
            },
          },
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              isLike: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (comments.length > input.limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem!.id;
      }

      // Get user blocked status from Clerk for all unique users
      const uniqueUserIds = [...new Set(comments.map((comment) => comment.user.id))];
      const clerk = await clerkClient();
      const userBlockedStatus: Record<string, boolean> = {};

      try {
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const clerkUser = await clerk.users.getUser(userId);
              userBlockedStatus[userId] = clerkUser.publicMetadata?.isBlocked === true;
            } catch (error) {
              console.error(`Failed to get blocked status for user ${userId}:`, error);
              userBlockedStatus[userId] = false;
            }
          }),
        );
      } catch (error) {
        console.error('Failed to fetch user blocked statuses:', error);
        // Set all users as not blocked if we can't fetch the data
        uniqueUserIds.forEach((userId) => {
          userBlockedStatus[userId] = false;
        });
      }

      return {
        comments: comments.map((comment) => ({
          ...comment,
          likeCount: comment.likes.filter((like) => like.isLike).length,
          dislikeCount: comment.likes.filter((like) => !like.isLike).length,
          user: {
            ...comment.user,
            isBlocked: userBlockedStatus[comment.user.id] || false,
          },
        })),
        nextCursor,
      };
    }),

  // Admin delete comment
  adminDelete: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { emailAddress: true },
      });

      if (user?.emailAddress !== process.env.ADMIN_EMAIL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const existingComment = await ctx.db.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!existingComment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      // Delete the comment and all its replies (cascade delete)
      await ctx.db.comment.delete({
        where: { id: input.commentId },
      });

      return { success: true };
    }),

  // Admin edit comment
  adminEdit: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        content: z
          .string()
          .min(1, 'Comment cannot be empty')
          .max(2000, 'Comment cannot exceed 2000 characters')
          .transform((content) => content.trim()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { emailAddress: true },
      });

      if (user?.emailAddress !== process.env.ADMIN_EMAIL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const existingComment = await ctx.db.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!existingComment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      const updatedComment = await ctx.db.comment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
          editedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              emailAddress: true,
              imageUrl: true,
            },
          },
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              isLike: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      return {
        ...updatedComment,
        likeCount: updatedComment.likes.filter((like) => like.isLike).length,
        dislikeCount: updatedComment.likes.filter((like) => !like.isLike).length,
      };
    }),
});
