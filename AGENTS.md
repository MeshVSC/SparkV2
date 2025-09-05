# AGENTS.md

## Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run dev          # Start dev server with nodemon on port 3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
```

## Tech Stack
- **Next.js 15** with App Router and TypeScript 5
- **Tailwind CSS 4** + shadcn/ui components
- **Prisma** ORM with database integration
- **NextAuth.js** for authentication
- **Zustand** for state management
- **TanStack Query** for data fetching

## Code Style
- TypeScript with relaxed ESLint rules (no-unused-vars, prefer-const off)
- Path aliases: `@/*` → `src/*`
- Components in `src/components/` with UI components in `ui/` subfolder
- Custom hooks in `src/hooks/`
- Utilities in `src/lib/`