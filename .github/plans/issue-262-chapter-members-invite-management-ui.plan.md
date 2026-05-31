# Plan: Chapter Members Invite Management UI

## Summary

Expose invite creation and pending invite management on `/chapter/members` for users with `chapter.roles.assign_eboard`. The UI should be compact, operational, and consistent with existing member roster cards and role assignment controls.

## User Story

As a chapter president or vice president
I want to invite, cancel, and re-invite regular e-board members from the members page
So that I can activate my chapter team from the same place I manage members

## Metadata

| Field | Value |
| --- | --- |
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Chapter members page, client components, chapter actions |
| GitHub Issue | #262 |

## Patterns to Follow

### Page Composition

`app/[locale]/chapter/members/page.tsx` gets chapter context with `requireChapterMember`, loads permissions and members, then passes data into client roster components.

### Client Actions

`role-assignment-actions.tsx` uses dialogs, `useTransition`, `toast`, `router.refresh()`, and existing role/functional-area option constants.

### Empty/Feedback States

`members-list.tsx` uses compact cards, alerts, and operational Spanish copy.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/chapter/members/page.tsx` | UPDATE | Load invites and render invite management |
| `app/[locale]/chapter/members/components/eboard-invite-management.tsx` | CREATE | Client invite UI |
| `lib/actions/chapter/get-data.ts` | UPDATE | Expose authorized pending invite data |

## Tasks

### Task 1: Add invite management component
- **File**: `app/[locale]/chapter/members/components/eboard-invite-management.tsx`
- **Action**: CREATE
- **Implement**: invite dialog, active/expired list, cancel and re-invite buttons, loading/empty/error feedback.
- **Validate**: `pnpm exec tsc --noEmit`

### Task 2: Wire page data and visibility
- **Files**: `app/[locale]/chapter/members/page.tsx`, `lib/actions/chapter/get-data.ts`
- **Action**: UPDATE
- **Implement**: only render controls when `permissions.canAssignEboard` or equivalent permission flag is present.
- **Validate**: `pnpm exec tsc --noEmit`

### Task 3: Polish responsive operational UI
- **File**: invite management component
- **Action**: UPDATE
- **Implement**: mobile-safe grid/list, clear status labels, no nested card clutter.
- **Validate**: browser/visual smoke if local app runs.

## Validation

```bash
pnpm exec tsc --noEmit
pnpm run lint
```

## Acceptance Criteria

- [x] Authorized leaders can create regular e-board invites.
- [x] Unauthorized users do not see invite controls.
- [x] Active and expired invites show status and actions.
- [x] Cancel and re-invite refresh the page state.
- [ ] UI fits mobile and desktop without overflow.
