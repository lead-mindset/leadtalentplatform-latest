# Issue 203: Update Chapter Event Permission Enforcement

## Goal

Move chapter event operations from the legacy `requireChapterEditor` / editor-position model onto explicit chapter permission grants, while preserving the current event lifecycle semantics.

## Scope

- Event create/edit/publish require `chapter.events.manage`.
- Registration/application views require `chapter.events.view_registrations`.
- Check-in reads and writes require `chapter.events.check_in`.
- Event deletion requires `chapter.events.archive` and writes a chapter audit log entry.
- Host and collaborator event access remains scoped to the acting user's approved chapter membership.
- Database RLS helpers and policies must support member-role e-board users with permission grants, not only legacy editor positions.

## Out Of Scope

- Full event-scoped permissions per individual event.
- New event archive/cancel lifecycle states or columns.
- Student self-cancel registration behavior.

## Implementation Tasks

- [x] Add a generic event permission helper in `lib/auth.ts` and keep `canUserManageEvent` as a manage-specific wrapper.
- [x] Update event server-action guards in `lib/actions/events/*` to request the correct permission key per operation.
- [x] Update chapter event pages to use the correct action guard for edit, applications, and check-in views.
- [x] Update create-event authorization to require `chapter.events.manage` for non-admin chapter users.
- [x] Add an audit-aware delete path requiring `chapter.events.archive`.
- [x] Add a Supabase migration to update event/event_registration/event_chapter RLS helpers and audit insert policy for event deletion.
- [x] Regenerate Supabase database types.
- [x] Add focused tests for permission-specific event authorization and delete audit behavior.
- [x] Run validation: Supabase reset, type generation, focused tests, typecheck, lint, full tests.

## Validation Notes

- Focused tests should prove `view_registrations`, `check_in`, and `archive` are independent of `manage`.
- SQL smoke checks should prove permission-granted member-role e-board users can insert/update/delete only through the intended policy paths.
