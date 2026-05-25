# Plan: Issue #207 - Stabilize Password Login Redirect Resolution

GitHub Issue: #207
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Bug / Auth
Complexity: Medium

## Summary

Password login currently signs in through the browser client and then chooses a dashboard using only client-loaded `public.user.role` and `person_profile`. That path does not check chapter dashboard permission, so seeded chapter operators can land in `/student` or `/onboarding`. Add a thin server action that reads the authenticated Supabase session from cookies, loads redirect facts, delegates to `resolvePostAuthRedirectPath`, and returns a visible error if the redirect cannot be resolved.

## Implementation Status

- [x] Task 1: Add server redirect action.
- [x] Task 2: Wire password login to the server action.
- [x] Task 3: Tighten OAuth callback lookup failures.
- [x] Task 4: Add regression tests.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Server action | `lib/actions/student/onboarding.ts` | Server action creates a Supabase server client, validates auth, delegates to helper/service, and returns or redirects. |
| Redirect helper | `lib/auth-redirects.ts` | Pure role/profile routing delegates chapter access checks to `resolvePostAuthRedirectPath`. |
| OAuth callback | `app/[locale]/auth/callback/route.ts` | Server-side callback reads the session and resolves post-auth redirects after OAuth. |
| Tests | `lib/auth-redirects.test.ts` | Vitest mocks services and asserts exact redirect outcomes. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/actions/auth/resolve-post-login-redirect.ts` | Create | Server-trusted post-password-login redirect resolver. |
| `lib/actions/auth/__tests__/resolve-post-login-redirect.test.ts` | Create | Regression coverage for success, missing session, and lookup failure. |
| `components/auth/login.tsx` | Update | Replace client-only redirect facts with the server action result. |
| `app/[locale]/auth/callback/route.ts` | Update | Stop silently falling through if user/profile lookup fails after OAuth. |
| `lib/auth-redirects.test.ts` | Update | Cover editor-with-permission path and membership query errors if useful. |

## Tasks

### Task 1: Add Server Redirect Action

- Create `lib/actions/auth/resolve-post-login-redirect.ts`.
- Use `createClient()` from `lib/supabase/server`.
- Call `supabase.auth.getUser()`.
- Query `public.user.role` and `person_profile.user_id`.
- On query/session errors, return `{ success: false, error }`.
- On success, call `resolvePostAuthRedirectPath`.

### Task 2: Wire Password Login To The Server Action

- Update `components/auth/login.tsx`.
- After `signInWithPassword`, call the new server action.
- On success, push the returned path.
- On failure, show the error in the existing alert instead of falling back to a guessed dashboard.

### Task 3: Tighten OAuth Callback Lookup Failures

- Update `app/[locale]/auth/callback/route.ts`.
- If role/profile lookups fail after session exchange, redirect to localized `/auth/error`.
- Keep existing `next` behavior unchanged.

### Task 4: Add Regression Tests

- Add focused tests for the new server action with mocked `createClient` and `resolvePostAuthRedirectPath`.
- Ensure missing session and user/profile lookup failures return visible errors.
- Keep existing auth redirect helper tests passing.

## Validation

```bash
pnpm test -- --runInBand lib/auth-redirects.test.ts lib/actions/auth/__tests__/resolve-post-login-redirect.test.ts
pnpm test
pnpm run lint
pnpm run typecheck
```

## Acceptance Criteria Mapping

- Chapter operator password-login redirect uses `chapter.dashboard.access`.
- Admin/staff/recruiter/member redirects remain role-appropriate.
- Lookup failures produce a visible login error rather than a silent wrong workspace.
- OAuth callback behavior remains compatible and safer on lookup failure.
