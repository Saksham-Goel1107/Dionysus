import { sendBanEmail, sendUnbanEmail, sendWarningEmail } from '@/lib/email';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
export const userRouter = createTRPCRouter({
  getN8nStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId! },
      select: { isN8nDone: true },
    });

    return {
      isN8nDone: user?.isN8nDone ?? false,
    };
  }),

  // Admin procedures
  // Ban/unban user
  toggleBan: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        banned: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const adminUser = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { emailAddress: true },
      });

      if (adminUser?.emailAddress !== process.env.ADMIN_EMAIL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      // Update the user's banned status in Clerk metadata
      try {
        const clerk = await clerkClient();

        // Get user info from Clerk
        const clerkUser = await clerk.users.getUser(input.userId);
        const userName =
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || 'User';

        await clerk.users.updateUserMetadata(input.userId, {
          publicMetadata: {
            isBlocked: input.banned,
            bannedAt: input.banned ? new Date().toISOString() : null,
            bannedReason: input.reason || null,
          },
        });

        // Send ban email if user is being banned
        if (input.banned && clerkUser.primaryEmailAddress?.emailAddress) {
          try {
            await sendBanEmail({
              to: clerkUser.primaryEmailAddress.emailAddress,
              userName,
              reason: input.reason || 'Violation of community guidelines',
              banDuration: undefined, // Can be extended later for temporary bans
            });
          } catch (emailError) {
            console.error('Failed to send ban email:', emailError);
            // Don't fail the ban operation if email fails
          }
        }

        // Send unban email if user is being unbanned
        if (!input.banned && clerkUser.primaryEmailAddress?.emailAddress) {
          try {
            await sendUnbanEmail({
              to: clerkUser.primaryEmailAddress.emailAddress,
              userName,
            });
          } catch (emailError) {
            console.error('Failed to send unban email:', emailError);
            // Don't fail the unban operation if email fails
          }
        }

        return { success: true };
      } catch (error) {
        console.error('Failed to update user metadata:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user ban status. Please try again.',
        });
      }
    }),

  // Send warning email to user
  sendWarning: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        subject: z.string(),
        message: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const adminUser = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { emailAddress: true },
      });

      if (adminUser?.emailAddress !== process.env.ADMIN_EMAIL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { emailAddress: true, firstName: true, lastName: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Send the warning email using nodemailer
      const userName =
        targetUser.firstName && targetUser.lastName
          ? `${targetUser.firstName} ${targetUser.lastName}`
          : targetUser.firstName || 'User';

      try {
        await sendWarningEmail({
          to: targetUser.emailAddress,
          userName,
          subject: input.subject,
          message: input.message,
          reason: input.reason,
        });

        return {
          success: true,
          emailSent: true,
          recipient: targetUser.emailAddress,
        };
      } catch (error) {
        console.error('Failed to send warning email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send warning email. Please try again.',
        });
      }
    }),

  // Check if user is banned
  isBanned: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
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

      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(input.userId);
        return {
          isBanned: clerkUser.publicMetadata?.isBlocked === true,
          bannedAt: clerkUser.publicMetadata?.bannedAt,
          bannedReason: clerkUser.publicMetadata?.bannedReason,
        };
      } catch (error) {
        console.error('Failed to check user ban status:', error);
        return {
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
        };
      }
    }),
});
