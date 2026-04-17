# Agent Guidance

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: Supabase (generated types in `lib/database.generated.ts`)
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`
- **UI**: Radix UI primitives + custom shadcn-like components in `components/ui`
- **i18n**: `next-intl` with locale-based routing (`app/[locale]/*`)
- **Package manager**: pnpm

## Developer Commands
```bash
npm run dev      # Start dev server on localhost:3000
npm run build   # Production build
npm run lint    # ESLint
npm run start   # Start production server
```

**Note**: No test framework configured.

## Architecture
- **Route structure**: `app/[locale]/{chapter,admin,auth}/**` - locale is required (e.g., `/en/chapter/events`)
- **API routes**: `app/api/**` - no locale prefix
- **Server actions**: `lib/actions/**/*.ts` - organized by domain (admin, company, events, student, recruiter, chapter)
- **Components**: `components/ui/*` (shadcn-style), `components/events/*`, `components/global/*`
- **Database types**: Generated in `lib/database.generated.ts` - regenerate via Supabase CLI if schema changes

## Auth Flow
- Supabase Auth with Google OAuth
- Callback: `app/[locale]/auth/callback/route.ts` handles session exchange
- Protected routes check session in layouts

## Environment
- `.env.local` contains secrets (Supabase keys, Resend API key, SMTP creds)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` required at build time

## Codegen
- Run `pnpm exec supabase gen types typescript --local > lib/database.generated.ts` after schema changes

## Common Gotchas
- Tailwind CSS 4 uses `@import "tailwindcss"` in CSS, not `@tailwind` directives
- Route params are async - access via `{ params }: { params: Promise<{ ... }> }`
- Server components by default; add `"use client"` for interactivity
- `lib/supabase/*` provides client, server, and admin clients
- Images use Next.js `<Image />` with configured remotePatterns for Supabase Storage