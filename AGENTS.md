# Agent Guidance

## Purpose
This document defines how our team builds features end-to-end, enforces maintainable architecture, and ensures predictable quality. It’s meant to be practical and enforceable, not just aspirational.

## Tech Stack
- **Framework:** Next.js 15 (App Router, React 19)
- **Database:** Supabase (generated types in `lib/database.generated.ts`)
- **Styling:** Tailwind CSS 4 with `@tailwindcss/postcss`
- **UI:** Radix UI primitives + custom Shadcn-like components in `components/ui`
- **i18n:** `next-intl` with locale-based routing (`app/[locale]/*`)
- **Package manager:** pnpm
- **Testing:** Vitest (Mandatory for service layer; critical paths only)

## Technical Architecture (The Service Layer)
We follow the Service Layer Pattern (see `docs/adr/001-service-layer-pattern.md`) with enforcement through code reviews and examples.

- **Logic:** Business and database logic must live in `lib/services/`. UI-only state can remain in components/hooks.
- **Controllers:** Server Actions (`lib/actions/`) and API Routes are “thin.” Handle:
  - Authentication
  - Zod validation
  - Calling services
- **Organization:** Group by domain, not type. Define domain ownership explicitly.

**Canonical Example:**
```typescript
// lib/services/userService.ts
export const getUserById = async (id: string) => {
  const user = await db.user.findUnique({ where: { id } })
  if (!user) throw new Error('User not found')
  return user
}
```

## Data Flow Philosophy
**Vertical slices only:** Implement a complete feature end-to-end: DB → Service → Action → UI.

**Complete slice definition:**
- Handles happy path
- Handles loading, empty, and error states
- Includes tests for business logic
- Integrates with auth, caching, and observability

**Server vs Client:**
- Keep state on the server when possible
- Use client state for interactive UI only
- Avoid duplicating fetching logic

## Developer Workflow

### Branching
Never edit `main`. Always branch:
```bash
git checkout main && git pull origin main
git checkout -b feat/your-feature-name
```
Merge `main` periodically into your branch or rebase to stay current.

### Pull Requests
- **Draft PR:** 30–50% complete for feedback.
- **Standard PR:** 100% done, tests passing.
- Keep PRs <300 lines.
- Include:
  - What changed
  - Why it changed
  - How to test

### Commit Guidelines
- Use Conventional Commits
- Squash minor/fix commits on merge

## Definition of Done (DoD)
Before claiming a task is complete:
- **Type Safety:** No `any`
- **Testing:** Service logic must be tested; critical paths require strong coverage
- **Linting:** `npm run lint` passes
- **Documentation:** New services documented; ADRs for major changes
- **Observability:** Errors logged and monitored

## Common Pitfalls & Gotchas
- **Tailwind CSS 4:** Use `@import "tailwindcss"` in CSS
- Route params in Next.js App Router may be async; see docs
- Server components by default; `"use client"` for interactivity
- Use `lib/supabase/*` for client, server, and admin clients
- Next.js `<Image />` must respect `remotePatterns` for Supabase storage

*Rule: Only include items that prevent repeated mistakes; remove trivia.*

## Production Workflow Cheatlist
| Step | Notes |
| :--- | :--- |
| **Branching** | Always branch, keep small, merge/rebase main |
| **PR Lifecycle** | Draft for feedback, final for review, link issues (Closes #12) |
| **GitHub Tools** | Issues, Projects, Actions, Draft PRs—use purposefully |
| **Issue Sizing** | Tasks >2 days → split; atomic units; proper labels |
| **Team Success** | Squash & Merge; include descriptions; keep automated types updated |
| **Quick Commands** | `git checkout -b name`, `git push origin branch-name`, `git fetch --all`, `git stash`, `git stash pop` |

## Error Handling Standard
- Services throw errors for business logic failures
- API routes catch errors and return structured responses
- UI displays user-friendly messages for expected errors
- Logs must capture stack traces and contextual info
