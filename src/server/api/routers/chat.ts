import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Zod schemas for validation
const fileAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  content: z.string().optional(),
  url: z.string().optional(),
});

const thinkingStepSchema = z.object({
  step: z.number(),
  thought: z.string(),
  duration: z.number(),
  model: z.string(),
  timestamp: z.date(),
});

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().optional().default('New Chat'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.chatSession.create({
        data: {
          userId: ctx.userId,
          title: input.title,
          lastMessageAt: new Date(),
        },
      });

      return session;
    }),

  // Get all chat sessions for a user
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.chatSession.findMany({
        where: {
          userId: ctx.userId,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (sessions.length > input.limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem!.id;
      }

      return {
        sessions,
        nextCursor,
      };
    }),

  // Get a specific session with messages
  getSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              feedback: {
                where: {
                  userId: ctx.userId,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      return session;
    }),

  // Add a message to a session
  addMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        attachments: z.array(fileAttachmentSchema).optional(),
        sources: z.array(z.string()).optional(),
        followUpQuestions: z.array(z.string()).optional(),
        features: z.array(z.string()).optional(),
        imageUrl: z.string().optional(),
        thinkingSteps: z.array(thinkingStepSchema).optional(),
        model: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.userId,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      // Create the message
      const message = await ctx.db.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          attachments: input.attachments as any,
          sources: input.sources as any,
          followUpQuestions: input.followUpQuestions as any,
          features: input.features as any,
          imageUrl: input.imageUrl,
          thinkingSteps: input.thinkingSteps as any,
          model: input.model,
        },
      });

      // Update session's lastMessageAt
      await ctx.db.chatSession.update({
        where: { id: input.sessionId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    }),

  // Update session title
  updateSessionTitle: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        title: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.userId,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      return await ctx.db.chatSession.update({
        where: { id: input.sessionId },
        data: { title: input.title },
      });
    }),

  // Delete a session
  deleteSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.userId,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      await ctx.db.chatSession.delete({
        where: { id: input.sessionId },
      });

      return { success: true };
    }),

  // Add or update message feedback
  addFeedback: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        isLike: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify message exists and belongs to user's session
      const message = await ctx.db.chatMessage.findFirst({
        where: {
          id: input.messageId,
          session: {
            userId: ctx.userId,
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      // Upsert feedback
      const feedback = await ctx.db.messageFeedback.upsert({
        where: {
          messageId_userId: {
            messageId: input.messageId,
            userId: ctx.userId,
          },
        },
        create: {
          messageId: input.messageId,
          userId: ctx.userId,
          isLike: input.isLike,
          reason: input.reason,
        },
        update: {
          isLike: input.isLike,
          reason: input.reason,
          updatedAt: new Date(),
        },
      });

      return feedback;
    }),

  // Get user memories
  getUserMemories: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memories = await ctx.db.userMemory.findMany({
        where: {
          userId: ctx.userId,
          ...(input.category && { category: input.category }),
        },
        orderBy: {
          lastUsedAt: 'desc',
        },
        take: input.limit,
      });

      return memories;
    }),

  // Add or update user memory
  upsertMemory: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        category: z.string().optional().default('general'),
        source: z.string().optional(),
        confidence: z.number().min(0).max(1).optional().default(1.0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memory = await ctx.db.userMemory.upsert({
        where: {
          userId_key: {
            userId: ctx.userId,
            key: input.key,
          },
        },
        create: {
          userId: ctx.userId,
          key: input.key,
          value: input.value,
          category: input.category,
          source: input.source,
          confidence: input.confidence,
          lastUsedAt: new Date(),
        },
        update: {
          value: input.value,
          category: input.category,
          source: input.source,
          confidence: input.confidence,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return memory;
    }),

  // Delete user memory
  deleteMemory: protectedProcedure
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memory = await ctx.db.userMemory.findFirst({
        where: {
          userId: ctx.userId,
          key: input.key,
        },
      });

      if (!memory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Memory not found',
        });
      }

      await ctx.db.userMemory.delete({
        where: {
          id: memory.id,
        },
      });

      return { success: true };
    }),

  // Generate chat title using AI (to be called after first message)
  generateTitle: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.chatSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.userId,
        },
        include: {
          messages: {
            take: 2,
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      if (session.messages.length === 0) {
        return session;
      }

      // Get first user message for title generation
      const firstUserMessage = session.messages.find((m) => m.role === 'user');
      if (!firstUserMessage) {
        return session;
      }

      // Generate a concise title from the first message
      // Use simple truncation and cleaning for now
      let title = firstUserMessage.content.trim();

      // Remove markdown, code blocks, and special characters
      title = title.replace(/```[\s\S]*?```/g, '');
      title = title.replace(/`[^`]*`/g, '');
      title = title.replace(/[#*_~\[\]()]/g, '');

      // Truncate to first sentence or 60 characters
      const firstSentence = title.match(/^[^.!?]+[.!?]/);
      if (firstSentence) {
        title = firstSentence[0];
      }

      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }

      // Update session title
      const updatedSession = await ctx.db.chatSession.update({
        where: { id: input.sessionId },
        data: { title },
      });

      return updatedSession;
    }),

  // Get message feedback stats (for analytics)
  getFeedbackStats: protectedProcedure.query(async ({ ctx }) => {
    const totalFeedback = await ctx.db.messageFeedback.count({
      where: {
        userId: ctx.userId,
      },
    });

    const likes = await ctx.db.messageFeedback.count({
      where: {
        userId: ctx.userId,
        isLike: true,
      },
    });

    const dislikes = totalFeedback - likes;

    return {
      total: totalFeedback,
      likes,
      dislikes,
      likePercentage: totalFeedback > 0 ? (likes / totalFeedback) * 100 : 0,
    };
  }),

  // Search chat sessions by title or content
  searchSessions: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).optional().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.chatSession.findMany({
        where: {
          userId: ctx.userId,
          OR: [
            {
              title: {
                contains: input.query,
                mode: 'insensitive',
              },
            },
            {
              messages: {
                some: {
                  content: {
                    contains: input.query,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        take: input.limit,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      return sessions;
    }),

  // Report a message
  reportMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        reason: z.enum([
          'inappropriate',
          'harmful',
          'inaccurate',
          'offensive',
          'spam',
          'misleading',
          'other',
        ]),
        description: z.string().min(10).max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify message exists and belongs to user's session
      const message = await ctx.db.chatMessage.findFirst({
        where: {
          id: input.messageId,
          session: {
            userId: ctx.userId,
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      // Check if user has already reported this message
      const existingReport = await ctx.db.messageReport.findFirst({
        where: {
          messageId: input.messageId,
          userId: ctx.userId,
        },
      });

      if (existingReport) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already reported this message',
        });
      }

      // Create the report
      const report = await ctx.db.messageReport.create({
        data: {
          messageId: input.messageId,
          userId: ctx.userId,
          reason: input.reason,
          description: input.description,
          status: 'pending',
        },
      });

      return report;
    }),

  // Get user's reports (for user to track their reports)
  getUserReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(20),
        status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.messageReport.findMany({
        where: {
          userId: ctx.userId,
          ...(input.status && { status: input.status }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        include: {
          message: {
            select: {
              content: true,
              role: true,
              createdAt: true,
              session: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      return reports;
    }),

  // Cancel/withdraw a report
  cancelReport: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.messageReport.findFirst({
        where: {
          id: input.reportId,
          userId: ctx.userId,
          status: 'pending', // Can only cancel pending reports
        },
      });

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found or cannot be cancelled',
        });
      }

      await ctx.db.messageReport.delete({
        where: { id: input.reportId },
      });

      return { success: true };
    }),
});
