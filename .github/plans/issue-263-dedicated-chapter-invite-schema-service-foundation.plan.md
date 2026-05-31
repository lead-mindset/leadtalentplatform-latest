# Plan: Dedicated Chapter Invite Schema Service Foundation

GitHub Issue: #263
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Add the dedicated `chapter_invite` persistence model and core service contract that future chapter e-board, recipient acceptance, and admin protected leadership invite flows can share.

## Codebase Context

- Existing launch preapproval lives in `supabase/migrations/20260522160000_add_chapter_preapproval.sql` and `lib/services/chapter-preapproval.service.ts`.
- Existing chapter e-board invite wrapper lives in `lib/services/chapter-eboard-invite.service.ts` and currently writes `chapter_preapproval`.
- Canonical role and permission activation lives in `chapter_role_assignment`, `chapter_permission_grant`, and `ChapterPermissionService.grantRoleTemplatePermissions`.
- Generated database types live in `lib/database.generated.ts` and are imported by service-layer code.

## Tasks

- [ ] Add `chapter_invite` migration with token hash, lifecycle status, role metadata, created/accepted/revoked fields, protected-role pending uniqueness, and service-role/admin RLS.
- [ ] Extend `chapter_role_assignment` and `chapter_permission_grant` source constraints so accepted invites can create linked role assignments and grants.
- [ ] Update generated database types for `chapter_invite` and role-assignment invite linkage.
- [ ] Add `lib/services/chapter-invite.service.ts` with token creation/hash helpers, create/list/validate/revoke/reinvite/accept contracts, and conflict handling.
- [ ] Add focused service tests for token hashing, pending duplicate protection, protected-role conflict checks, token state validation, wrong-email acceptance rejection, and accepted-token idempotency.
- [ ] Validate with targeted tests, TypeScript, and lint or document any broader pre-existing warnings.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```

## Risks

- Generated database types can drift if local Supabase is unavailable; if needed, update the relevant generated sections manually and validate with TypeScript.
- Existing role assignment source constraints must remain backward-compatible with `preapproval` and `migration`.
- Acceptance-side membership and permission mutation should be tested in service isolation before route/UI work.
