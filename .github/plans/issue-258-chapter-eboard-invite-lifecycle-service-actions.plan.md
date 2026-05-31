# Plan: Chapter E-board Invite Lifecycle Service and Actions

## Summary

Build the backend foundation for president/VP-managed regular e-board invites by wrapping `chapter_preapproval` in a service and thin server actions. The service will enforce chapter-scoped `chapter.roles.assign_eboard` permission, restrict invited role levels to regular e-board roles, use 30-day expiration, support cancel and re-invite, and expose pending invite rows for the chapter members page.

## User Story

As a chapter president or vice president
I want to invite regular e-board members by email
So that my chapter team can activate access without central admin bottlenecks

## Metadata

| Field | Value |
| --- | --- |
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Supabase service layer, chapter actions, chapter member data |
| GitHub Issue | #258 |

## Patterns to Follow

### Service Authorization

`lib/services/chapter-role-assignment.service.ts` checks global admin first, then `ChapterPermissionService.hasChapterPermission(..., 'chapter.roles.assign_eboard')`.

### Preapproval Activation

`lib/services/chapter-preapproval.service.ts` normalizes email, queries active preapprovals, updates `chapter_preapproval`, logs errors, and returns explicit success/error unions.

### Server Actions

`lib/actions/chapter/role-assignments.ts` validates with Zod, calls `requireUser`, resolves chapter membership, delegates to a service, and revalidates chapter/admin paths.

### Tests

`lib/services/__tests__/chapter-role-assignment.service.test.ts` uses small Supabase builder mocks and mocked `ChapterPermissionService` calls for service behavior.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/services/chapter-eboard-invite.service.ts` | CREATE | Invite lifecycle service around `chapter_preapproval` |
| `lib/services/__tests__/chapter-eboard-invite.service.test.ts` | CREATE | Service behavior coverage |
| `lib/actions/chapter/eboard-invites.ts` | CREATE | Thin chapter server actions |
| `lib/actions/chapter/get-data.ts` | UPDATE | Add authorized invite list loader |

## Tasks

### Task 1: Create service types and invite listing
- **File**: `lib/services/chapter-eboard-invite.service.ts`
- **Action**: CREATE
- **Implement**: role-level allowlist, email normalization, status derivation, and `listChapterEboardInvites`.
- **Validate**: `pnpm exec tsc --noEmit`

### Task 2: Add create, cancel, and re-invite service methods
- **File**: `lib/services/chapter-eboard-invite.service.ts`
- **Action**: UPDATE
- **Implement**: authorization, duplicate checks, 30-day expiration, cancellation, and expired re-invite.
- **Validate**: targeted service tests

### Task 3: Add service tests
- **File**: `lib/services/__tests__/chapter-eboard-invite.service.test.ts`
- **Action**: CREATE
- **Implement**: creation, authorization denial, protected role denial, duplicate denial, cancel, and re-invite tests.
- **Validate**: `pnpm exec vitest run lib/services/__tests__/chapter-eboard-invite.service.test.ts`

### Task 4: Add thin server actions and read loader
- **Files**: `lib/actions/chapter/eboard-invites.ts`, `lib/actions/chapter/get-data.ts`
- **Action**: CREATE/UPDATE
- **Implement**: Zod schemas, `requireUser`, approved chapter membership lookup, service calls, and path revalidation.
- **Validate**: `pnpm exec tsc --noEmit`

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-eboard-invite.service.test.ts
pnpm exec tsc --noEmit
```

## Acceptance Criteria

- [x] Service creates 30-day e-board preapprovals for authorized president/VP-capable users.
- [x] Protected president/VP role invitations are rejected.
- [x] Active duplicate invites are rejected.
- [x] Active unaccepted invites can be canceled.
- [x] Expired unaccepted invites can be re-invited.
- [x] Unauthorized users cannot manage invites.
