# Plan: Issue #209 - Split Public Chapter Pages From Protected Chapter Operations

GitHub Issue: #209
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Bug / Routing
Complexity: Medium

## Summary

The public chapter detail route currently lives under `app/[locale]/chapter/[id]`, so it inherits `app/[locale]/chapter/layout.tsx` and redirects anonymous visitors before public content can render. Move the public detail route into the existing `(public)` route group while preserving the URL `/[locale]/chapter/[id]`, and remove public member email data from the chapter profile payload.

## Implementation Status

- [x] Task 1: Move public chapter detail route into the public route group.
- [x] Task 2: Update relative imports after the move.
- [x] Task 3: Remove member email data from the public chapter payload.
- [x] Task 4: Validate route build/type/test coverage.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Public route group | `app/[locale]/(public)/page.tsx` | Public pages live outside protected workspace layouts. |
| Protected chapter routes | `app/[locale]/chapter/page.tsx` | Protected operations still self-guard with `requireChapterMember`. |
| Public data fetch | `lib/actions/events/get-data.ts` | Public queries should fetch only fields needed by the public UI. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/(public)/chapter/[id]/page.tsx` | Create/Move | Public chapter detail page at the same URL without protected layout inheritance. |
| `app/[locale]/(public)/chapter/[id]/_components/*` | Create/Move | Public chapter profile components. |
| `app/[locale]/chapter/[id]/*` | Delete/Move | Remove the public route from the protected chapter layout branch. |
| `tests/e2e/launch-qa-report.spec.ts` | Update if needed | Keep expected public chapter behavior aligned. |

## Tasks

### Task 1: Move Public Route

- Move `app/[locale]/chapter/[id]` to `app/[locale]/(public)/chapter/[id]`.
- Preserve route path `/es/chapter/leaduni`.
- Leave `app/[locale]/chapter/layout.tsx` protected for operations.

### Task 2: Fix Imports

- Update the moved page import from `../../(public)/_components/navbar` to the correct route-group relative path.
- Run TypeScript to catch any broken route imports.

### Task 3: Remove Public Contact Data

- Change the public chapter member query to select only display-safe fields.
- Do not send member email addresses, applicant data, rejected/inactive state, or operator actions to the public component tree.

### Task 4: Validate

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Acceptance Criteria Mapping

- Anonymous `/es/chapter/leaduni` can render outside the protected chapter layout.
- Anonymous `/es/chapter` remains protected by `app/[locale]/chapter/layout.tsx`.
- Protected chapter operations keep their existing guards.
- Public chapter payload no longer includes member contact email.
