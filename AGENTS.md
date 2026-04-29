# Agent Guidance


## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: Supabase (generated types in `lib/database.generated.ts`)
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`
- **UI**: Radix UI primitives + custom shadcn-like components in `components/ui`
- **i18n**: `next-intl` with locale-based routing (`app/[locale]/*`)
- **Package manager**: pnpm
- **Testing**: Vitest (Mandatory for Service Layer)

## Technical Architecture (The Service Layer)
We follow a strict **Service Layer Pattern** (see `docs/adr/001-service-layer-pattern.md`).
- **Logic:** ALL business and database logic must live in `lib/services/`.
- **Controllers:** Server Actions (`lib/actions/`) and API Routes are "thin." They handle Auth, Zod validation, and call services.
- **Organization:** Group by domain, not by type.

## Developer Workflow & Workflow
- **Branch-First:** Never edit code directly on `main`. Work in `feat/`, `fix/`, or `refactor/` branches.
- **Commits:** Use Conventional Commits.
- **Migrations:** Never use the Supabase Dashboard for schema changes. Use Supabase CLI migrations.

## Definition of Done (DoD)
Before claiming a task is complete, ensure:
1.  **Type Safety:** No `any`. Strict TypeScript everywhere.
2.  **Testing:** 100% unit test coverage for new logic in `lib/services/`.
3.  **Linting:** `npm run lint` passes.
4.  **Documentation:** New services are documented; ADRs created for major changes.

### Vertical Slices (Tracer Bullets)
- **NEVER work horizontally** (all DB first, then all API, then all UI)
- **ALWAYS work in vertical slices** — implement ONE complete feature end-to-end
- Each slice must touch: database → service → server action → UI component
- Move to next slice only when current slice is functional and testable


**Threshold**: ~100k tokens is the "dumb zone" — reset before hitting it.

## Common Gotchas
- Tailwind CSS 4 uses `@import "tailwindcss"` in CSS, not `@tailwind` directives.
- Route params are async - access via `{ params }: { params: Promise<{ ... }> }`.
- Server components by default; add `"use client"` for interactivity.
- `lib/supabase/*` provides client, server, and admin clients.
- Images use Next.js `<Image />` with configured remotePatterns for Supabase Storage.
