# Plan: LEAD-017 LEAD Identity Issuance and Primary Display Rules

## Summary

Implement explicit LEAD identity issuance and primary identity selection for admins. The current table and migrations started as one identity per user, but LEAD-017 requires multiple active identities with one primary display identity. This plan begins with a narrow schema correction, then adds a service layer for issuing, revoking, listing, and selecting primary identities.

## User Story

As an admin,
I want to issue and manage official LEAD identities,
So that chapter members, editors, staff, founders, and alumni have correct ID/status display.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #18 |
| Type | Feature |
| Complexity | Medium |
| Systems Affected | Supabase migration/types, identity service, admin actions, admin editor promotion, display helpers/tests |
| Dependencies | LEAD-007, LEAD-015 |
| Blocks | LEAD-021 |

## Codebase Findings

Current identity schema:

- `lead_identity` exists with `identity_type`, `chapter_id`, `is_primary`, `issued_by_id`, `issued_at`, `revoked_at`, and `status`.
- `identity_type` already supports `founder`, `staff`, `chapter_editor`, `chapter_member`, and `alumni`.
- `lib/database.generated.ts` reflects the identity table and enum.
- Base migration `20260502062202_add_lead_identity.sql` has `user_id uuid NOT NULL UNIQUE`, which blocks multiple identities per user.
- LEAD-010 migration currently uses `ON CONFLICT (user_id)`, preserving the one-identity-per-user behavior.
- RLS currently permits admins to manage all identities and users to select their own identities.

Current app/service state:

- There is no `LeadIdentityService`.
- Admin editor promotion lives in `AdminService.assignEditor()` and currently updates `chapter_membership.position` plus `user.role`, but does not create or primary-mark a `chapter_editor` identity.
- Chapter approval creates `chapter_membership.member_id`, but does not issue a `chapter_member` identity.
- Seed data already inserts founder/staff/editor identities, so the domain concept exists.
- Display surfaces currently use `chapter_membership.member_id` and position directly; they do not resolve a primary identity.

## Design

### Schema

Add a forward-only migration for multiple identities:

- Drop the old unique constraint/index on `lead_identity.user_id`.
- Add an idempotent unique index for active duplicate prevention:
  - one active identity per `(user_id, identity_type, chapter_id)` where `status='active'`.
- Add a partial unique index for primary display:
  - one primary active identity per `user_id` where `status='active' AND is_primary=true`.
- Preserve existing rows and keep existing primary rows valid.
- Update LEAD-010 conflict assumptions only if necessary for future resets; do not rewrite old migrations except by adding a corrective migration.

### Service Layer

Create `lib/services/lead-identity.service.ts` with framework-agnostic methods:

- `issueIdentity(supabase, { userId, identityType, chapterId, issuedById, makePrimary })`
- `issueForApprovedMembership(supabase, { userId, chapterId, issuedById, makePrimary })`
- `issueChapterEditorIdentity(supabase, { userId, chapterId, issuedById, makePrimary })`
- `setPrimaryIdentity(supabase, { userId, identityId })`
- `revokeIdentity(supabase, { userId, identityId })`
- `getActiveIdentities(supabase, userId)`
- `getPrimaryIdentity(supabase, userId)`

Rules:

- `founder` and `staff` must not require `chapter_id`.
- `chapter_member`, `chapter_editor`, and `alumni` require `chapter_id`.
- `admin` is never an `identity_type`.
- Issuing an identity reactivates an existing revoked matching row when possible.
- Setting primary clears other active primary rows for the same user, then marks the requested active identity primary.
- Service methods return typed `{ success, ... }` results, matching local service patterns.

### Admin Integration

Update admin flows:

- In `AdminService.assignEditor()`, after approved membership validation and position/role update, issue or reactivate a `chapter_editor` identity and make it primary.
- Add explicit admin actions under `lib/actions/admin/identities.ts` for issue/revoke/set-primary/list.
- Keep admin role promotion manual/direct DB for broader roles if needed, but identity issuance itself must go through the service.
- Do not make editor/admin public identity display depend on `user.role`; identity display should resolve from `lead_identity`.

### Display Rules

Add a lightweight display helper, preferably in the identity service:

- `getPrimaryIdentity()` returns the active primary identity if present.
- If no active primary exists, fallback is deterministic: founder/staff first, then chapter_editor, chapter_member, alumni by latest `issued_at`.
- Surfaces that need official ID/status should consume this helper instead of inferring from `user.role`.

Do not implement ID card UI in LEAD-017; keep future ID card integration out of scope.

## Tasks

- [x] Add corrective migration for multi-identity support and primary uniqueness.
- [x] Regenerate `lib/database.generated.ts` after applying migration locally.
- [x] Create `LeadIdentityService` with issue, revoke, list, set primary, and display lookup methods.
- [x] Add service tests for chapter member issuance, editor issuance, founder/staff no-chapter issuance, primary switching, duplicate active prevention, and admin-not-identity rejection.
- [x] Update `AdminService.assignEditor()` to issue/primary-mark `chapter_editor` identity after promotion.
- [x] Add admin identity actions for explicit issue/revoke/set-primary/list.
- [x] Add or update display helper usage on member/admin surfaces that currently need official identity display.
- [x] Update seed data if needed so personas have representative active/primary identities.
- [x] Update this plan with validation results.

## Validation

```bash
pnpm supabase db reset
pnpm supabase gen types typescript --local > lib/database.generated.ts
pnpm vitest run lib/services/__tests__/lead-identity.service.test.ts lib/services/__tests__/admin.service.test.ts
pnpm test
pnpm lint
pnpm build
```

Expected current build caveat:

- `pnpm build` may still fail on existing legacy schema drift in `app/[locale]/admin/chapters/[id]/page.tsx:30` referencing `student_profile` on `MemberWithProfile`; record it unless LEAD-017 directly touches that page.

## Validation Results

- `pnpm supabase db reset` - passed after adding the corrective multi-identity migration.
- `pnpm exec supabase gen types typescript --local > lib/database.generated.ts` - passed; no generated type diff after the index-only migration.
- `pnpm vitest run lib/services/__tests__/lead-identity.service.test.ts lib/services/__tests__/admin.service.test.ts` - passed, 42 tests.
- `pnpm test` - passed, 14 files / 201 tests.
- `pnpm lint` - passed with existing warnings.
- `pnpm build` - compiled successfully, then failed on the known legacy schema drift in `app/[locale]/admin/chapters/[id]/page.tsx:30` referencing `student_profile` on `MemberWithProfile`.

## Risks

| Risk | Mitigation |
|------|------------|
| Old `UNIQUE(user_id)` blocks acceptance criteria | Start with a corrective migration and regenerate types. |
| Multiple primary identities for a user | Enforce partial unique index and service transaction/order: clear old primary, set new primary. |
| Public admin identity confusion | Reject `identity_type='admin'`; admin remains an authorization role only. |
| Chapterless founder/staff vs chapter-scoped identities | Validate `chapter_id` by identity type in service tests. |
| Identity issuance coupled too tightly to role updates | Keep explicit `LeadIdentityService`; admin role promotion may call it but identity logic lives separately. |
| Old migrations using `ON CONFLICT(user_id)` | Prefer additive corrective migration; update current seed and future migration paths, not historical intent unless reset fails. |

## GitHub Follow-Up

Suggested sub-issues only if implementation grows:

1. Correct `lead_identity` schema for multiple identities and primary uniqueness.
2. Add `LeadIdentityService` and admin identity actions.
3. Wire editor promotion and primary display helpers.
