# Issue #88 Plan: Stabilize Participant Protected Route Access

GitHub Issue: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/88
Source PRD: `.github/PRDs/participant-onboarding-chapter-activation.prd.md`
Type: Bug / Technical
Complexity: Medium

## Problem

Password auth can succeed for seeded personas, but protected student routes have shown inconsistent behavior where `/en/student` or `/en/student/profile` can bounce back to login. Before onboarding activation work begins, the app needs a reliable participant auth gate so a seeded participant can sign in and stay authenticated on protected student routes.

## Codebase Findings

- `components/auth/login.tsx` signs in with the browser Supabase client and pushes to `/`.
- `lib/supabase/client.ts` uses `createBrowserClient` with persisted session cookies.
- `proxy.ts` applies `next-intl` routing and only calls `updateSession()` for paths containing `/student`, `/company`, or `/admin`.
- `lib/supabase/proxy.ts` refreshes Supabase auth cookies and redirects unauthenticated protected requests to `/{locale}/auth/login`.
- `lib/supabase/server.ts` creates the server Supabase client from `next/headers` cookies.
- `lib/auth.ts` `requireUser()` calls `supabase.auth.getUser()`, then reads `public.user`; failures redirect to `/auth/login`.
- `app/[locale]/student/layout.tsx` is the first protected student gate and calls `requireUser()`.
- `app/[locale]/student/page.tsx` currently redirects to `/student/profile`; the activation dashboard work will replace this later, but #88 should keep scope to auth/session stability.

## Design

This issue should be diagnostic-first:

1. Reproduce the protected-route flow with a seeded persona and capture whether failure happens at browser auth, proxy refresh, server `getUser()`, or `public.user` lookup.
2. Add focused unit coverage around the route/session helpers where practical.
3. Patch only the narrow auth/session handoff problem.
4. Verify with local Supabase plus validation commands.

## Tasks

- [x] Confirm local environment and seed assumptions
  - Verify `.env.local` points to the running Docker Supabase API.
  - Verify `participant@test.com` exists in `auth.users` and `public.user`.
  - Verify `participant@test.com` can sign in with `password123` through the Supabase Auth API.

- [x] Reproduce protected route behavior
  - Use browser-level login or an equivalent Playwright fallback.
  - Navigate to `/en/student` and `/en/student/profile`.
  - Record whether the request stays authenticated or redirects to `/en/auth/login`.

- [x] Isolate the failing layer
  - If browser auth fails, inspect `components/auth/login.tsx` and `lib/supabase/client.ts`.
  - If proxy refresh fails, inspect `proxy.ts` and `lib/supabase/proxy.ts`.
  - If server auth fails, inspect `lib/supabase/server.ts` and `lib/auth.ts`.
  - If only database lookup fails, inspect `public.user` seed/RLS behavior.

- [x] Add focused regression coverage
  - Add or extend tests for `requireUser()` behavior with valid auth user plus matching `public.user`.
  - Add or extend tests for unauthenticated redirect behavior where feasible.
  - Add route/proxy helper tests only if the helper can be tested without brittle framework mocking.

- [x] Implement the narrow fix
  - Keep server actions and route components thin.
  - Do not redesign onboarding or `/student` in this issue.
  - Preserve locale-aware redirects.
  - Avoid broad auth rewrites unless the reproduction proves they are needed.

- [x] Validate
  - `pnpm vitest run lib/auth.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`
  - Browser/manual smoke: sign in as `participant@test.com`, then access `/en/student` and `/en/student/profile`.

- [x] Update GitHub
  - Comment on #88 with root cause, changed files, and validation results.
  - Move to review/validate status if the repository workflow expects it.

## Risks

- Docker Supabase may be stopped or on a different local port. If so, capture the environment blocker before changing app code.
- Next.js proxy + next-intl redirects can mask whether the auth failure is coming from middleware or server components.
- `requireUser()` currently hides the distinction between missing auth and missing `public.user`; implementation may need diagnostic logging or internal helper extraction to make failures testable.

## Out of Scope

- Adding chapter intent onboarding.
- Replacing `/student` with the participant activation dashboard.
- Seeding demo events.
- Adding a new `participant` role.
