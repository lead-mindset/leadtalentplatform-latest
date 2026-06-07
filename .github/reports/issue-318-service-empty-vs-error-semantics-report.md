# Issue #318 Validation Report - Service Empty Vs Error Semantics

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/318

Plan: `.github/plans/issue-318-service-empty-vs-error-semantics.plan.md`

## Summary

Student and company data-load services now expose explicit unavailable states where UI surfaces need to distinguish real empty results from backend failures.

Authorization-style methods still fail closed, but user-facing dashboards no longer need to interpret a backend error as "no membership", "no talent", or "no saved talent".

## Files Changed

- `lib/services/student-dashboard.service.ts`
- `lib/services/__tests__/student-dashboard.service.test.ts`
- `lib/actions/student/dashboard.ts`
- `app/[locale]/student/page.tsx`
- `lib/services/company.service.ts`
- `lib/services/__tests__/company.service.test.ts`
- `lib/actions/company/get-data.ts`
- `app/[locale]/company/(protected)/dashboard/page.tsx`
- `app/[locale]/company/(protected)/saved/page.tsx`

## Behavior

Student dashboard:

- `getActivationDashboard` keeps the existing dashboard shape but now includes `loadState` and `loadError`.
- Profile and membership query errors set `loadState: "unavailable"` and are logged.
- Chapter application options now have a result-returning method.
- The student dashboard shows friendly warning alerts when profile, membership, or chapter option data is unavailable.

Company portal:

- Added result-returning methods for visible students, single student lookup, saved students, stats, search, and saved status.
- Existing compatibility methods still return their previous shapes.
- Company dashboard and saved-talent page use result methods and show warning alerts when data is temporarily unavailable.

## Screenshots

Normal-state 390px regression screenshots:

- `outputs/issue-318-service-empty-vs-error/member-student-390.png`
- `outputs/issue-318-service-empty-vs-error/recruiter-company-dashboard-390.png`
- `outputs/issue-318-service-empty-vs-error/recruiter-company-saved-390.png`

Metrics:

```json
{
  "student": { "innerWidth": 390, "scrollWidth": 390, "heading": "Bienvenido, Test Member" },
  "companyDashboard": { "innerWidth": 390, "scrollWidth": 390, "heading": "Resumen de representante" },
  "companySaved": { "innerWidth": 390, "scrollWidth": 390, "heading": "Talento guardado" }
}
```

Unavailable UI branches are covered by service result tests rather than forced live Supabase failures in the running app.

## Validation

- `pnpm exec vitest run lib/services/__tests__/student-dashboard.service.test.ts lib/services/__tests__/company.service.test.ts` - passed, 2 files and 37 tests.
- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing repo warnings.
- `pnpm test` - passed, 59 files and 533 tests.

## Notes

- Chapter permission authorization behavior was not changed in this slice.
- Existing company compatibility methods remain available for callers that still expect arrays/booleans.
