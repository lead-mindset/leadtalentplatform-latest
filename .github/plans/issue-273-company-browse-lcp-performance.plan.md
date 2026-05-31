# Issue 273: Company Browse LCP Performance

## GitHub Issue
- #273: Improve company browse LCP performance before launch

## Goal
Bring `/en/company/browse` under the authenticated route LCP budget while preserving recruiter discovery, filtering, profile navigation, and save/unsave behavior.

## Current Findings
- The browse page already pushes the main visibility and filter rules through `CompanyService`.
- The page renders a full table/card list as a client component because each row owns save/unsave state.
- That makes every visible talent row participate in hydration even though the rows are mostly static content.
- The existing save action can be isolated to the save button while the list itself server-renders.

## Implementation Plan
- [x] Keep the company browse page and service behavior unchanged.
- [x] Convert `StudentsTable` into a server component so visible talent rows render as static HTML.
- [x] Reuse the existing client `SaveStudentButton` as the only interactive island for saving talent.
- [x] Add compact/responsive rendering support to `SaveStudentButton` for table and mobile-card contexts.
- [x] Use a `Set` for saved state lookup inside the server-rendered table.
- [x] Tighten authenticated performance login so validation measures the protected company routes, not the login fallback.
- [ ] Run type, lint, targeted service tests, and company performance validation.

## Validation
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm run lint -- --quiet`
- [x] `pnpm exec vitest run lib/services/__tests__/company.service.test.ts`
- [x] `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 PERF_QA_SCOPE=company pnpm exec playwright test tests/e2e/production-readiness-performance.spec.ts --project=desktop-chromium --reporter=list`

## Results
- Company dashboard: LCP 2272ms, CLS 0, no console errors, no failed responses.
- Company browse: LCP 2256ms, CLS 0, no console errors, no failed responses.
- Company saved: LCP 1140ms, CLS 0, no console errors, no failed responses.

## Rollback
Revert the table/button changes and this plan file if recruiter browse loses save state, profile links, filters, or responsive rendering.
