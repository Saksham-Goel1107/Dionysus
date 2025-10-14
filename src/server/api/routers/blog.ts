import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const blogRouter = createTRPCRouter({
  // Get blog likes/dislikes count (public)
  getLikes: publicProcedure
    .input(z.object({ blogId: z.string().cuid('Invalid blog ID') }))
    .query(async ({ ctx, input }) => {
      try {
        const likes = await ctx.db.blogLike.findMany({
          where: { blogId: input.blogId },
          select: {
            id: true,
            userId: true,
            isLike: true,
          },
        });

        return {
          likeCount: likes.filter((like) => like.isLike).length,
          dislikeCount: likes.filter((like) => !like.isLike).length,
          userLike: ctx.userId ? likes.find((like) => like.userId === ctx.userId) : null,
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch blog likes',
        });
      }
    }),

  // Toggle like/dislike on a blog post (protected)
  toggleLike: protectedProcedure
    .input(
      z.object({
        blogId: z.string().cuid('Invalid blog ID'),
        isLike: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: Check if user has liked/disliked too many blogs recently
      const recentLikes = await ctx.db.blogLike.count({
        where: {
          userId: ctx.userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000), // Last minute
          },
        },
      });

      if (recentLikes >= 10) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many likes/dislikes recently. Please wait before trying again.',
        });
      }

      // Verify blog exists and is published
      const blog = await ctx.db.blog.findUnique({
        where: {
          id: input.blogId,
          isPublished: true,
        },
      });

      if (!blog) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found or not published',
        });
      }

      try {
        // Check if user already liked/disliked this blog
        const existingLike = await ctx.db.blogLike.findUnique({
          where: {
            userId_blogId: {
              userId: ctx.userId,
              blogId: input.blogId,
            },
          },
        });

        if (existingLike) {
          if (existingLike.isLike === input.isLike) {
            // Remove like/dislike if clicking the same button
            await ctx.db.blogLike.delete({
              where: { id: existingLike.id },
            });
            return { success: true, action: 'removed' };
          } else {
            // Switch between like and dislike
            await ctx.db.blogLike.update({
              where: { id: existingLike.id },
              data: { isLike: input.isLike },
            });
            return { success: true, action: 'updated' };
          }
        } else {
          // Create new like/dislike
          await ctx.db.blogLike.create({
            data: {
              userId: ctx.userId,
              blogId: input.blogId,
              isLike: input.isLike,
            },
          });
          return { success: true, action: 'created' };
        }
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update blog like',
        });
      }
    }),

  // Get blog with likes and comments count (public)
  getById: publicProcedure.input(z.object({ blogId: z.string() })).query(async ({ ctx, input }) => {
    const blog = await ctx.db.blog.findUnique({
      where: { id: input.blogId },
      include: {
        tags: true,
        likes: {
          select: {
            id: true,
            userId: true,
            isLike: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                parentId: null, // Only count top-level comments
              },
            },
          },
        },
      },
    });

    if (!blog) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Blog post not found',
      });
    }

    return {
      ...blog,
      likeCount: blog.likes.filter((like) => like.isLike).length,
      dislikeCount: blog.likes.filter((like) => !like.isLike).length,
      userLike: ctx.userId ? blog.likes.find((like) => like.userId === ctx.userId) : null,
      commentCount: blog._count.comments,
    };
  }),

  // Get blog by slug (public)
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const blog = await ctx.db.blog.findUnique({
      where: {
        slug: input.slug,
        isPublished: true,
      },
      include: {
        tags: true,
        likes: {
          select: {
            id: true,
            userId: true,
            isLike: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                parentId: null, // Only count top-level comments
              },
            },
          },
        },
      },
    });

    if (!blog) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Blog post not found',
      });
    }

    return {
      ...blog,
      likeCount: blog.likes.filter((like) => like.isLike).length,
      dislikeCount: blog.likes.filter((like) => !like.isLike).length,
      userLike: ctx.userId ? blog.likes.find((like) => like.userId === ctx.userId) : null,
      commentCount: blog._count.comments,
      isCommentsEnabled: blog.isCommentsEnabled,
    };
  }),
});
