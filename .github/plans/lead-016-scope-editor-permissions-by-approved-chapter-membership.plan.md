# Plan: LEAD-016 Scope Editor Permissions By Approved Chapter Membership

## Summary

Scope editor management permissions to the editor's single approved chapter membership, while preserving admin bypass. Chapter tools should resolve the editor's approved chapter once, event mutations should allow owner or collaborator chapter access, and member/collaborator mutations should deny cross-chapter access.

## User Story

As a chapter editor,
I want my management permissions scoped to my approved chapter,
So that I can manage my chapter and collaborative events without global access.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #17 |
| Type | Feature |
| Complexity | Medium |
| Systems Affected | Auth helpers, event access actions, event collaborator actions, chapter layouts, service/action tests |
| Dependencies | LEAD-015 |
| Blocks | LEAD-018, LEAD-019, LEAD-020 |

## Codebase Findings

`lib/auth.ts` already has the raw pieces:

- `requireChapterMember()` resolves an approved `chapter_membership`, but currently allows `admin`, `editor`, and `member` roles into chapter resources.
- `canUserAccessChapter()` allows admins, same approved chapter membership, and collaborator access when `eventId` is supplied.
- There is no dedicated `requireChapterEditor()` / `getApprovedEditorChapter()` helper, so editor-only actions duplicate or weaken chapter checks.

Event access is partly correct:

- `lib/actions/events/access.ts` uses `assertCanManageEvent()` and permits owner/collaborator access through `canUserAccessChapter()`.
- `bulk-approve.ts`, check-in pages, and application review pages already use `assertCanManageEvent()`.

Event mutation gaps:

- `lib/actions/events/update-event.ts` manually reimplements owner/collaborator access through `requireChapterMember()`.
- `lib/actions/events/delete-event.ts` only allows same owner chapter for editors, not collaborator chapters.
- `lib/actions/events/create-event.ts` uses `requireChapterMember()` for editors, which should become editor-scoped, not member-scoped.
- `lib/actions/events/event-chapter.ts` uses `createAdminClient()` and mutates collaborators after checking only authentication.
- `lib/actions/events/add-event-collaborators.ts` adds collaborators after checking only auth.

Chapter member management is mostly improved by LEAD-015:

- `lib/actions/chapter/check-students.ts` passes the editor's chapter as target context.
- `ChapterMembershipService` now enforces same-chapter manager checks for approval/rejection.
- LEAD-016 should keep those checks and add auth-level helper coverage so future actions do not regress.

## Design

### Auth Helpers

Add focused helpers in `lib/auth.ts`:

- `getApprovedChapterMembership(supabase, userId)` returns the user's single approved membership with `chapter_id`, `position`, and `member_id`, or `null`.
- `requireChapterEditor()` returns `{ supabase, user, chapter_id, membership }` only for admins or editors with approved membership.
- `canUserManageEvent(supabase, user, eventId)` centralizes event owner/collaborator checks and returns `{ allowed, event, chapter_id? }`.

Keep behavior explicit:

- Admin bypasses chapter scope.
- Editor must have `role='editor'` and approved `chapter_membership`.
- Chapter member access can keep using `requireChapterMember()` for member dashboards, but management actions must use `requireChapterEditor()` or `assertCanManageEvent()`.

### Event Actions

Refactor event actions to use the central helper:

- `create-event.ts`: admin can use provided `chapter_id`; editor always creates under their approved chapter.
- `update-event.ts`: replace manual access with `assertCanManageEvent()`; editors may edit owner/collaborator events but cannot change `chapter_id`.
- `delete-event.ts`: use `assertCanManageEvent()` so collaborator access follows the same rule as update/check-in/application review.
- `event-chapter.ts` and `add-event-collaborators.ts`: require event manager access before mutating collaborators; do not use an admin client until after access is established, and only if RLS requires it.

### Chapter Tools

Keep `app/[locale]/chapter/layout.tsx` using approved membership context, but make editor-only navigation/sidebar counts depend on editor scope where needed.

Do not turn LEAD-016 into a full role-navigation rewrite. Members can still view member-appropriate chapter pages if existing UX depends on it; management actions must be editor/admin scoped.

## Tasks

- [x] Add `getApprovedChapterMembership()` and `requireChapterEditor()` to `lib/auth.ts`.
- [x] Add or update testable event access helper behavior for admin bypass, same-chapter editor, collaborator editor, non-editor denial, and other-chapter editor denial.
- [x] Refactor `assertCanManageEvent()` to use the shared event management access path.
- [x] Update create/update/delete event actions to use the shared scoped helpers.
- [x] Lock down collaborator actions in `event-chapter.ts` and `add-event-collaborators.ts` so authenticated non-managers cannot add/remove/list collaborators for arbitrary events.
- [x] Verify chapter member approval/rejection remains protected by LEAD-015 service checks.
- [x] Add tests for cross-chapter denial and collaborator-allowed event editing.
- [x] Update this plan with validation results.

## Validation

```bash
pnpm vitest run lib/services/__tests__/event.service.test.ts lib/services/__tests__/chapter-membership.service.test.ts
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/auth.test.ts lib/services/__tests__/event.service.test.ts lib/services/__tests__/chapter-membership.service.test.ts` passes: 3 files, 75 tests.
- `pnpm test` passes: 13 files, 193 tests.
- `pnpm lint` passes with existing warnings.
- `pnpm build` compiles successfully, then fails during TypeScript on existing legacy schema drift in `app/[locale]/admin/chapters/[id]/page.tsx:30` (`student_profile` no longer exists on `MemberWithProfile`).

Expected current build caveat:

- `pnpm build` may still fail on existing legacy schema drift in `app/[locale]/admin/chapters/[id]/page.tsx:30` referencing `student_profile` on `MemberWithProfile`; record it unless LEAD-016 directly touches that page.

## Risks

| Risk | Mitigation |
|------|------------|
| Accidentally allowing members to manage chapter tools | Use `requireChapterEditor()` for mutations and keep `requireChapterMember()` for read/member surfaces only. |
| Collaborator actions bypassing access checks with admin client | Resolve user + event access before admin client mutation, or move access checks into service methods. |
| Divergent event access rules across actions | Make `assertCanManageEvent()` the shared boundary for update, delete, check-in, applications, and collaborator mutation. |
| Admin lockout | Preserve admin bypass before chapter membership lookup. |
| RLS recursion | Use direct membership/event queries from actions/services; do not introduce policies/functions in this issue unless tests prove a DB-side gap. |

## GitHub Follow-Up

Suggested sub-issues only if the implementation grows:

1. Add shared editor chapter auth helpers.
2. Scope event collaborator mutations by event manager access.
3. Add editor cross-chapter denial tests.
