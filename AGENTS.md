# Agent Development Guide

## Commands

### Initial Setup
```bash
npm install
npm run db:generate  # Generate Prisma client
```

### Development
- **Dev server**: `npm run dev` (Next.js + custom server on port 3000)
- **Build**: `npm run build`
- **Production**: `npm start`
- **Lint**: `npm run lint`
- **Tests**: No test framework configured

### Database (Prisma)
- **Push schema**: `npm run db:push`
- **Generate client**: `npm run db:generate`
- **Migrate**: `npm run db:migrate`
- **Reset**: `npm run db:reset`

## Tech Stack
- **Framework**: Next.js 15 (App Router), TypeScript 5
- **UI**: Tailwind CSS 4, shadcn/ui, Framer Motion
- **Database**: Prisma ORM + SQLite, NextAuth.js
- **State**: Zustand, TanStack Query, React Hook Form + Zod
- **Components**: Radix UI, DND Kit, Recharts

## Architecture
- App Router structure (`src/app/`)
- Custom Express server (`server.ts`)
- Component library (`src/components/ui/`)
- Database models for Spark-based productivity app

## Code Style
- TypeScript strict mode with relaxed ESLint rules
- shadcn/ui component patterns, CSS variables for theming
- Path aliases: `@/*` → `./src/*`
- ESLint errors ignored during builds for rapid prototyping
