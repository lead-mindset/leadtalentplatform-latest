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

## Canonical Account Model
Use the layered account model from `docs/PRODUCT-SPECIFICATION.md` and `docs/handbook/TESTING.md`.

| Table | Owns | Rules |
| :--- | :--- | :--- |
| `public.user` | Auth-linked app user, global role, name, email, phone | Keep universal contact data here. Do not treat `user.role` as chapter position. |
| `person_profile` | Reusable basic profile fields, recruiter visibility | Required for onboarding/event registration; does not imply chapter membership. |
| `chapter_membership` | Chapter application, approval status, alumni state, member ID, chapter position | Chapter permissions come from approved membership unless admin bypass applies. |
| `lead_identity` | Official LEAD identity display and issuance | Use for member/editor/staff/founder/alumni identity; do not make admin a public identity type. |
| `recruiter_access` | Invite/scoped recruiter access | Recruiters are not chapter members by default and do not require chapter membership. |

`student_profile` is deprecated. Do not add new live app, service, action, or UI dependencies on it. Generated types, historical migrations, QA fixtures, and migration validation docs may reference it only as a legacy source.

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

## Visual Product Builder Workflow
For meaningful UI/UX work, use the Codex Desktop visual loop from `docs/handbook/UI_UX.md`:

`prompt -> build -> run -> screenshot -> visual review -> click/test -> revise -> recheck`

Apply this loop to new pages, major redesigns, forms, tables, navigation, onboarding, registration, check-in, admin, editor, and company workflows.

Review the rendered product for:
- Hierarchy and obvious next action
- Spacing rhythm and visual consistency
- Contrast and text readability
- Mobile fit without overflow or overlap
- Hover, focus, loading, empty, error, and success states
- Preservation of service/action/auth behavior

Use image generation only when real source assets are needed. Vision/browser review judges the actual UI; imagegen creates supporting assets. For ambiguous design directions, prototype lightweight variants and keep the one that best improves readability, task completion, and system consistency.

## Developer Workflow

### PIV Planning and Implementation
- `/plan` must inspect the current codebase and create `.github/plans/{kebab-case}.plan.md`.
- Fresh-session `/implement` must read the linked plan first, verify tasks exist, execute tasks in order, update the plan, run validation, and update GitHub.
- Foundation and stabilization issues must be handled before dependent feature PIVs.
- If repeated mistakes, stale schema assumptions, workflow gaps, or recurring validation failures appear, create or update a `phase:system-evolution` GitHub issue instead of hiding the rule inside feature work.

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
