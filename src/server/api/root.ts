import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';
import { blogRouter } from './routers/blog';
import { chatRouter } from './routers/chat';
import { commentRouter } from './routers/comment';
import { projectRouter } from './routers/project';
import { statsRouter } from './routers/stats';
import { userRouter } from './routers/user';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  user: userRouter,
  comment: commentRouter,
  blog: blogRouter,
  stats: statsRouter,
  chat: chatRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
