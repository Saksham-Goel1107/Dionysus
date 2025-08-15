# Project Overview (for AI & Contributors)

- **Name**: Dionysus — AI-powered GitHub assistant (SaaS)
- **Core Stack**: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind + shadcn/ui + Radix, tRPC, Prisma, PostgreSQL, Clerk, Stripe, Sentry, Vercel
- **AI/Realtime**: Google Gemini, AssemblyAI, LiveKit, LangChain
- **Key Paths**:
  - `src/app/` — routes, layouts, server route handlers
  - `src/components/` — UI components
  - `src/lib/` — utilities and integrations
  - `src/server/` — client/server for React Query, helpers
  - `src/trpc/` — routers and tRPC setup
  - `prisma/` — Prisma schema and migrations
- **Build/Quality**: ESLint, Prettier, TypeScript strict, Husky hooks

## Commands

- Dev: `npm run dev`
- Typecheck + Lint: `npm run check`
- Build: `npm run build`
- Preview: `npm run preview`
- Prisma: `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`

## Principles

- Server-first: prefer RSC, keep secrets server-side, validate inputs with `zod`
- Typed end-to-end: tRPC + Prisma types; avoid `any`
- UI: accessible, composable, responsive; dark/light
- Security: CSP, Sentry, auth via Clerk middleware
