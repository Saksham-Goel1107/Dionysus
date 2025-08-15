# Developer Workflows

## Local development

1. Install deps: `npm i`
2. Generate Prisma client: `npm run postinstall` (or `npm run db:generate`)
3. Start dev server: `npm run dev`

## Quality

- Lint + Typecheck: `npm run check`
- Format (write): `npm run format:write`

## Database (Prisma)

- Migrate (dev): `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Studio: `npm run db:studio`

## Build & deploy

- Build: `npm run build`
- Start: `npm start`
- Vercel deploy: `npm run deploy`
