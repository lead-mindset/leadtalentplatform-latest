# Plan: LEAD-005 Person Profile Foundation

## Summary

Build a focused basic profile foundation for authenticated public participants. The implementation should create reusable `person_profile` data without requiring `chapter_membership`, while keeping universal contact fields in `public.user`. This is a foundation task, not a broad cleanup of every legacy student route.

## User Story

As a public participant,
I want reusable basic profile data,
So that I can register for multiple events without retyping my information or joining a chapter.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #6 |
| Type | Feature |
| Complexity | Medium |
| Systems Affected | Supabase RLS, service layer, server actions, onboarding/profile schema, tests |
| Dependencies | LEAD-002, LEAD-003 |
| Blocks | LEAD-010, LEAD-013, LEAD-014 |

## Problem

The codebase now has the correct account-model tables, but the primary onboarding path is still member/chapter oriented. `createBaseProfileSchema` requires `lead_chapter`, and `StudentService.submitOnboarding` always looks up or creates `chapter_membership`. LEAD-005 needs a reusable basic profile path that can stand alone for public event participants.

## Patterns To Follow

### Service Layer

Source: `lib/services/student.service.ts:57`

Use framework-agnostic service methods that accept `SupabaseClient<Database>`, update `public.user`, and upsert `person_profile` with `onConflict: 'user_id'`.

### Thin Server Actions

Source: `lib/actions/student/onboarding.ts:29`

Server actions should create the Supabase server client, authenticate the user, parse form data, run Zod validation, call a service, then revalidate/redirect or return a structured error.

Source: `lib/actions/company/profile.ts:17`

Prefer structured result unions for profile actions. LEAD-005 should use the normal authenticated server client so RLS is exercised, not a service-role client that hides policy bugs.

### Schema Validation

Source: `lib/memberschema.ts:7`

Keep validation centralized in schema factory functions that receive a translator. Split basic person profile validation from chapter/member-only validation so chapter membership is optional for public participants.

### RLS

Source: `supabase/migrations/20260503000000_define_rls_new_account_model.sql:58`

Use explicit `person_profile` policies for admin access and own-row access. Verify insert ownership is present after the LEAD-003 policy consolidation; add a forward migration if needed.

Source: `supabase/migrations/20260502061800_add_person_profile.sql:10`

`person_profile` was created as basic onboarding data, explicitly separate from chapter membership. LEAD-005 should preserve that split.

### Tests

Source: `lib/services/__tests__/student.service.test.ts:29`

Service tests should mock Supabase table chains directly and assert table names, select/upsert payloads, and error paths. Add tests that prove basic profile upsert does not touch `chapter_membership`.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/person-profile.service.ts` | Create | Dedicated basic profile service for reusable public participant profile data |
| `lib/services/__tests__/person-profile.service.test.ts` | Create | Unit tests for create/update/reuse behavior without chapter membership |
| `lib/memberschema.ts` | Update | Add basic person-profile schema that does not require `lead_chapter` |
| `lib/actions/person-profile.ts` | Create | Thin authenticated action for reading/upserting basic profile data |
| `lib/actions/student/onboarding.ts` | Update | Keep member onboarding chapter-specific; delegate reusable profile logic where appropriate |
| `components/onboarding.tsx` | Update | Avoid treating `lead_chapter` as part of universal basic profile if reused for public flows |
| `app/[locale]/student/profile/page.tsx` | Update minimally if needed | Stop direct legacy `student_profile` reads in the touched profile path |
| `supabase/migrations/*_person_profile_insert_policy.sql` | Create if needed | Ensure authenticated users can insert their own `person_profile` row under final RLS |
| `docs/handbook/TESTING.md` | Update | Reference LEAD-005 basic profile validation/manual flow |

## Dependency Order

1. Confirm current Docker Supabase policies allow authenticated own-row `person_profile` insert.
2. Add/adjust RLS migration only if insert is not guaranteed by final policy state.
3. Add `PersonProfileService` with basic read/upsert methods.
4. Add tests for service behavior and no chapter-membership dependency.
5. Add thin server action and schema split.
6. Wire the public/basic profile flow to reuse fields.
7. Update docs and run full validation.

## Tasks

## Progress

- [x] Task 1: Verify And Patch RLS For Profile Creation
- [x] Task 2: Create Basic Person Profile Service
- [x] Task 3: Add Service Tests
- [x] Task 4: Split Basic Profile Validation From Member Validation
- [x] Task 5: Add Thin Person Profile Actions
- [x] Task 6: Keep Member Onboarding Chapter-Specific
- [x] Task 7: Fix The Touched Profile Read Path
- [x] Task 8: Document The Manual Flow

### Task 1: Verify And Patch RLS For Profile Creation

- **Files**: `supabase/migrations/20260503000000_define_rls_new_account_model.sql`, new forward migration if needed
- **Action**: Inspect effective local policies after `pnpm supabase db reset`
- **Implement**: Ensure authenticated users can insert `person_profile` only when `user_id = auth.uid()`, and admins retain all access
- **Mirror**: `supabase/migrations/20260503000000_define_rls_new_account_model.sql:64`
- **Validate**: `pnpm supabase db reset`

### Task 2: Create Basic Person Profile Service

- **File**: `lib/services/person-profile.service.ts`
- **Action**: Create
- **Implement**: Add `getBasicProfile(supabase, userId)` and `upsertBasicProfile(supabase, params)`; update `public.user` for `name` and `phone`; upsert `person_profile` fields only; do not read/write `chapter_membership`
- **Mirror**: `lib/services/student.service.ts:57`
- **Validate**: `pnpm test lib/services/__tests__/person-profile.service.test.ts`

### Task 3: Add Service Tests

- **File**: `lib/services/__tests__/person-profile.service.test.ts`
- **Action**: Create
- **Implement**: Cover create/update, returning profile reuse, user update failure, profile upsert failure, and explicit assertion that `chapter_membership` is not called
- **Mirror**: `lib/services/__tests__/student.service.test.ts:29`
- **Validate**: `pnpm test lib/services/__tests__/person-profile.service.test.ts`

### Task 4: Split Basic Profile Validation From Member Validation

- **File**: `lib/memberschema.ts`
- **Action**: Update
- **Implement**: Add a schema for basic person profile without `lead_chapter`; keep chapter/member schema as an extension that requires `lead_chapter`, resume, and terms where appropriate
- **Mirror**: `lib/memberschema.ts:7`
- **Validate**: `pnpm test`

### Task 5: Add Thin Person Profile Actions

- **File**: `lib/actions/person-profile.ts`
- **Action**: Create
- **Implement**: Add authenticated actions to get and upsert basic profile data; parse FormData; call `PersonProfileService`; return structured errors
- **Mirror**: `lib/actions/student/onboarding.ts:29`
- **Validate**: `pnpm test`

### Task 6: Keep Member Onboarding Chapter-Specific

- **Files**: `lib/actions/student/onboarding.ts`, `components/onboarding.tsx`
- **Action**: Update
- **Implement**: Keep chapter membership creation in the member onboarding path only. If this component is reused by public registration, route it through the basic profile schema/action first, then offer chapter membership separately.
- **Mirror**: `components/onboarding.tsx:40`
- **Validate**: `pnpm test`

### Task 7: Fix The Touched Profile Read Path

- **File**: `app/[locale]/student/profile/page.tsx`
- **Action**: Update if the basic profile flow touches this route
- **Implement**: Replace direct `student_profile` reads with service/action-backed `person_profile` reads. Keep wider legacy student route cleanup out of scope.
- **Mirror**: `lib/actions/student/profile.ts:23`
- **Validate**: `pnpm test`

### Task 8: Document The Manual Flow

- **File**: `docs/handbook/TESTING.md`
- **Action**: Update
- **Implement**: Add LEAD-005 notes for public participant basic profile creation, returning-user reuse, and no required chapter membership
- **Mirror**: `docs/handbook/TESTING.md`
- **Validate**: `pnpm test`

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Basic profile accidentally creates `chapter_membership` | Add service test asserting `chapter_membership` is never called |
| RLS allows update but not insert | Verify effective policies after reset and add a forward migration if needed |
| LEAD-005 grows into legacy route migration | Scope implementation to service/action/schema and the minimum public profile flow |
| Contact/profile fields duplicate across tables | Keep `name`, `email`, `phone` in `public.user`; keep education/profile fields in `person_profile` |
| Event registration reuse is blocked by event code drift | Provide service-level `getBasicProfile`; defer event registration integration to blocked downstream LEAD issues unless a minimal reuse hook is needed |

## Acceptance Criteria Mapping

- [x] Authenticated basic onboarding creates or updates `person_profile`
- [x] Returning user can load and reuse profile fields
- [x] User without chapter membership can complete `person_profile`
- [x] RLS only allows own profile management unless admin

## Validation

```bash
pnpm supabase db reset
pnpm test
pnpm lint
```

## Out Of Scope

- Full migration of every legacy student UI route
- Chapter approval workflows beyond proving they remain separate
- Recruiter talent browsing changes beyond preserving `is_recruiter_visible`
