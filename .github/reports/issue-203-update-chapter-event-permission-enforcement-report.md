# Issue 203 Validation Report

## Summary

Implemented chapter event authorization with explicit permission keys:

- `chapter.events.manage` gates create, edit, publish, application decisions, and collaborator management.
- `chapter.events.view_registrations` gates registration/application roster access.
- `chapter.events.check_in` gates check-in counters, attendee lookup, token resolution, and check-in writes.
- `chapter.events.archive` gates event deletion and records `chapter.event.deleted` in `chapter_audit_log`.

The RLS layer now uses `can_access_event_with_permission(event_id, permission_key)` so member-role e-board users with grants can operate events for their owning or collaborating chapter without relying on legacy editor positions.

## Files Changed

- `lib/auth.ts`
- `lib/actions/events/access.ts`
- `lib/actions/events/checkin.ts`
- `lib/actions/events/create-event.ts`
- `lib/actions/events/delete-event.ts`
- `lib/actions/events/get-data.ts`
- `lib/actions/events/update-event.ts`
- `lib/services/event.service.ts`
- `lib/auth.test.ts`
- `lib/services/__tests__/event.service.test.ts`
- `app/[locale]/chapter/checkin/page.tsx`
- `app/[locale]/chapter/events/page.tsx`
- `app/[locale]/chapter/events/new/page.tsx`
- `app/[locale]/chapter/events/[id]/page.tsx`
- `app/[locale]/chapter/events/[id]/checkin/page.tsx`
- `app/[locale]/chapter/events/[id]/applications/page.tsx`
- `app/[locale]/chapter/events/_components/event-form.tsx`
- `app/[locale]/chapter/events/_components/events-table.tsx`
- `supabase/migrations/20260522164200_update_event_permission_rls.sql`
- `lib/database.generated.ts`

## Validation

- `pnpm exec vitest run lib/auth.test.ts lib/services/__tests__/event.service.test.ts --reporter=dot` passed: 85 tests.
- `pnpm run supabase:reset` passed.
- SQL smoke check confirmed `can_access_event_with_permission` and replacement event policies exist.
- `pnpm run types:generate` passed.
- `git diff --check` passed after removing generated EOF whitespace.
- `pnpm exec tsc --noEmit` passed.
- `pnpm lint` passed with 80 existing warnings and 0 errors.
- `pnpm test` passed: 20 files, 313 tests.
