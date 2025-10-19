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
        groupId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.chatSession.create({
        data: {
          userId: ctx.userId,
          title: input.title,
          groupId: input.groupId,
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
        orderBy: [
          { isFavorite: 'desc' }, // Favorites first
          { lastMessageAt: 'desc' }, // Then by most recent
        ],
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

  // ==================== CHAT GROUPS ====================

  // Create a new chat group
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.chatGroup.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
        },
      });

      return group;
    }),

  // Get all groups for a user
  getGroups: protectedProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db.chatGroup.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: [
        { isFavorite: 'desc' }, // Favorites first
        { createdAt: 'desc' }, // Then by newest
      ],
      include: {
        sessions: {
          orderBy: [{ isFavorite: 'desc' }, { lastMessageAt: 'desc' }],
          include: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    return groups;
  }),

  // Update group
  updateGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        isExpanded: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.chatGroup.findFirst({
        where: {
          id: input.groupId,
          userId: ctx.userId,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        });
      }

      const updatedGroup = await ctx.db.chatGroup.update({
        where: { id: input.groupId },
        data: {
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
          isExpanded: input.isExpanded,
          sortOrder: input.sortOrder,
        },
      });

      return updatedGroup;
    }),

  // Delete group (sessions will be moved to ungrouped)
  deleteGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.chatGroup.findFirst({
        where: {
          id: input.groupId,
          userId: ctx.userId,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        });
      }

      await ctx.db.chatGroup.delete({
        where: { id: input.groupId },
      });

      return { success: true };
    }),

  // Move session to group
  moveSessionToGroup: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        groupId: z.string().nullable(),
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
          message: 'Session not found',
        });
      }

      // Verify group exists if groupId is provided
      if (input.groupId) {
        const group = await ctx.db.chatGroup.findFirst({
          where: {
            id: input.groupId,
            userId: ctx.userId,
          },
        });

        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Group not found',
          });
        }
      }

      const updatedSession = await ctx.db.chatSession.update({
        where: { id: input.sessionId },
        data: {
          groupId: input.groupId,
        },
      });

      return updatedSession;
    }),

  // Toggle favorite status for a session
  toggleSessionFavorite: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
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
          message: 'Session not found',
        });
      }

      const updatedSession = await ctx.db.chatSession.update({
        where: { id: input.sessionId },
        data: {
          isFavorite: !session.isFavorite,
        },
      });

      return updatedSession;
    }),

  // Toggle favorite status for a group
  toggleGroupFavorite: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.chatGroup.findFirst({
        where: {
          id: input.groupId,
          userId: ctx.userId,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        });
      }

      const updatedGroup = await ctx.db.chatGroup.update({
        where: { id: input.groupId },
        data: {
          isFavorite: !group.isFavorite,
        },
      });

      return updatedGroup;
    }),

  // Generate embedding for a message (called after message is added)
  generateMessageEmbedding: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      // Check if Gemini API key is available
      if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, skipping embedding generation');
        return { success: true, skipped: true };
      }

      // Generate embedding using Gemini
      try {
        // Import the generateEmbedding function dynamically to avoid circular imports
        const { generateEmbedding } = await import('@/lib/gemini');

        const embedding = await generateEmbedding(message.content);

        if (!embedding || embedding.length === 0) {
          throw new Error('No embedding returned from Gemini');
        }

        // Update message with embedding
        await ctx.db.$executeRaw`
          UPDATE "ChatMessage"
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${input.messageId}
        `;

        return { success: true };
      } catch (error) {
        console.error('Error generating embedding:', error);
        // Don't throw error, just log it and return success to avoid breaking the chat flow
        return { success: true, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }),

  // Search messages using vector similarity
  searchMessages: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        groupId: z.string().optional(),
        limit: z.number().min(1).max(50).optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('Gemini API key not configured for embeddings');
        }

        // Generate embedding for query using Gemini
        const { generateEmbedding } = await import('@/lib/gemini');
        const queryEmbedding = await generateEmbedding(input.query);

        if (!queryEmbedding || queryEmbedding.length === 0) {
          throw new Error('No embedding returned from Gemini');
        }

        // Search using vector similarity
        const groupFilter = input.groupId ? `AND s."groupId" = '${input.groupId}'` : '';

        const results = await ctx.db.$queryRaw<
          Array<{
            id: string;
            content: string;
            role: string;
            sessionId: string;
            sessionTitle: string;
            createdAt: Date;
            similarity: number;
          }>
        >`
          SELECT
            m.id,
            m.content,
            m.role,
            m."sessionId",
            s.title as "sessionTitle",
            m."createdAt",
            1 - (m.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
          FROM "ChatMessage" m
          JOIN "ChatSession" s ON m."sessionId" = s.id
          WHERE s."userId" = ${ctx.userId}
            AND m.embedding IS NOT NULL
            ${groupFilter}
          ORDER BY similarity DESC
          LIMIT ${input.limit}
        `;

        return results;
      } catch (error) {
        console.error('Error searching messages:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search messages',
        });
      }
    }),

  // Get relevant context for current chat (using embeddings)
  getRelevantContext: protectedProcedure
    .input(
      z.object({
        currentMessage: z.string(),
        sessionId: z.string(),
        limit: z.number().min(1).max(20).optional().default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get current session to check if it's in a group
        const session = await ctx.db.chatSession.findFirst({
          where: {
            id: input.sessionId,
            userId: ctx.userId,
          },
          select: {
            id: true,
            groupId: true,
          },
        });

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }

        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('Gemini API key not configured for embeddings');
        }

        // Generate embedding for current message using Gemini
        const { generateEmbedding } = await import('@/lib/gemini');
        const embedding = await generateEmbedding(input.currentMessage);

        if (!embedding || embedding.length === 0) {
          throw new Error('No embedding returned from Gemini');
        }

        // If in a group, search within group. Otherwise, search all user's messages
        const groupFilter = session.groupId ? `AND s."groupId" = '${session.groupId}'` : '';

        const results = await ctx.db.$queryRaw<
          Array<{
            id: string;
            content: string;
            role: string;
            sessionId: string;
            sessionTitle: string;
            createdAt: Date;
            similarity: number;
          }>
        >`
          SELECT
            m.id,
            m.content,
            m.role,
            m."sessionId",
            s.title as "sessionTitle",
            m."createdAt",
            1 - (m.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
          FROM "ChatMessage" m
          JOIN "ChatSession" s ON m."sessionId" = s.id
          WHERE s."userId" = ${ctx.userId}
            AND m."sessionId" != ${input.sessionId}
            AND m.embedding IS NOT NULL
            ${groupFilter}
          ORDER BY similarity DESC
          LIMIT ${input.limit}
        `;

        return {
          context: results,
          scope: session.groupId ? 'group' : 'all',
          groupId: session.groupId,
        };
      } catch (error) {
        console.error('Error getting relevant context:', error);
        // Return empty context instead of failing
        return {
          context: [],
          scope: 'all',
          groupId: null,
        };
      }
    }),
});
