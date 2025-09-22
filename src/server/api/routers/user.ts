import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

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
});
