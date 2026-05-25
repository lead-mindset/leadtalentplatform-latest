# Plan: Issue #211 - Make Admin Date Rendering Hydration-Safe

GitHub Issue: #211
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Bug / Frontend
Complexity: Small

## Summary

Admin client tables currently render dates with bare `toLocaleDateString()` / `toLocaleString()`, so the server-rendered HTML can differ from the browser during hydration depending on locale and time zone. Add a shared LEAD display date helper with explicit `es-PE` and `America/Lima`, then apply it to the admin client tables that rendered the QA warnings.

## Implementation Status

- [x] Task 1: Add deterministic date formatting helper.
- [x] Task 2: Replace admin client table date rendering.
- [x] Task 3: Add helper tests.
- [x] Task 4: Validate focused and repo-wide checks.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Client table | `app/[locale]/admin/companies/companies-management-client.tsx` | Keep raw sortable fields intact and format only display cells. |
| Client table | `app/[locale]/admin/events/events-management-client.tsx` | Status/sorting logic still uses raw timestamps; display uses helper. |
| Utility tests | `lib/auth-redirects.test.ts` | Pure helper behavior covered with deterministic expectations. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/utils/date-format.ts` | Create | Shared deterministic LEAD date/date-time display helpers. |
| `lib/utils/__tests__/date-format.test.ts` | Create | Cover valid, null, invalid, date-only, and date-time formatting. |
| `app/[locale]/admin/companies/companies-management-client.tsx` | Update | Use helper for created date display. |
| `app/[locale]/admin/events/events-management-client.tsx` | Update | Use helper for start date-time display. |
| `app/[locale]/admin/users/users-management-client.tsx` | Update | Use helper for join date display. |
| `app/[locale]/admin/companies/[id]/manage-company-client.tsx` | Update | Use helper for invite accepted/expiry dates. |
| `app/[locale]/admin/*` date displays | Update | Sweep remaining admin rendered dates through the shared helper. |

## Tasks

### Task 1: Add Helper

- Create `formatLeadDate` and `formatLeadDateTime`.
- Use explicit locale `es-PE` and time zone `America/Lima`.
- Return a caller-provided fallback for null, empty, or invalid values.

### Task 2: Update Admin Client Displays

- Replace bare client-rendered `new Date(...).toLocaleDateString()`.
- Replace bare client-rendered `new Date(...).toLocaleString()`.
- Keep sorting/filtering behavior based on the raw date fields.

### Task 3: Add Tests

- Verify invalid values use fallback.
- Verify UTC inputs format in Lima consistently.
- Verify date-time includes the expected localized hour/minute.

### Task 4: Validate

```bash
pnpm exec vitest run lib/utils/__tests__/date-format.test.ts
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Acceptance Criteria Mapping

- `/es/admin/companies` and `/es/admin/events` no longer use environment-dependent date formatting in hydrated client tables.
- Admin users and company invite client surfaces use the same deterministic display behavior.
- Raw date values remain available for sorting, filtering, and expiry logic.
- The shared helper has focused Vitest coverage.
