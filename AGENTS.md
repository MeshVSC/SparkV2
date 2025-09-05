# AGENTS.md

## Commands

### Setup
```bash
npm install
npm run db:push
```

### Development
- **Build**: `npm run build`
- **Lint**: `npm run lint` 
- **Tests**: No test framework configured
- **Dev server**: `npm run dev` (Next.js + custom server on port 3000)

### Database
- **Push schema**: `npm run db:push`
- **Generate client**: `npm run db:generate`
- **Migrate**: `npm run db:migrate`

## Tech Stack
- Next.js 15 + TypeScript, Tailwind CSS 4, shadcn/ui
- Database: Prisma + SQLite
- Auth: NextAuth.js
- State: Zustand, TanStack Query
- UI: Framer Motion, Radix UI, DND Kit, Recharts

## Architecture
- App Router structure (`src/app/`)
- Custom Express server (`server.ts`)
- Component library (`src/components/ui/`)
- Database models for Spark-based productivity app

## Code Style
- ESLint configured with relaxed TypeScript/React rules
- No comments unless complex
- Follow existing shadcn/ui patterns
