# Fix Report: Production Readiness Blockers And Serious Risks

Plan: `.github/plans/fix-production-readiness-blockers-and-serious-risks.plan.md`

Branch: `codex/chapter-scoped-roles-permissions`

Status: `complete`

## Summary

Fixed the proven launch blockers and serious local risks from the production-readiness QA pass. The platform now passes the local seeded launch matrix for Storage, accessibility, performance, chapter permissions, unit/service tests, lint, and production build.

## Product Fixes

| Area | Fix |
| --- | --- |
| Storage | Added private `resumes` bucket setup and chapter-permission based `event-covers` policies. |
| Resume security | Replaced raw resume URLs in student UI data with short-lived signed URLs. |
| Resume limits | Aligned student resume UI with the 10 MB PDF Storage limit. |
| Accessibility | Fixed unnamed controls, invalid ARIA, unlabeled event cover input, contrast tokens, and disabled button readability. |
| Public event performance | Added `published_event_listing`, trimmed list data, added cached public event reads, and invalidated the cache on event mutations. |
| Chapter dashboard performance | Collapsed repeated roster permission/member fetches into one overview data path. |
| Admin chapter performance | Bulk-loaded chapter activity/editor data instead of repeated per-chapter queries. |

## Validation

| Gate | Result |
| --- | --- |
| `pnpm run qa:storage` | pass |
| Accessibility desktop Chromium | pass |
| Accessibility mobile Chromium | pass |
| Performance desktop Chromium | pass |
| Performance mobile Chromium | pass |
| `tests/e2e/chapter-permissions.spec.ts` | pass |
| `pnpm test` | pass, 343 tests |
| `pnpm run lint` | pass, 0 errors |
| `pnpm run build` | pass |

## Remaining External Gates

- Provider-backed email delivery still needs a controlled `QA_EMAIL_TO` inbox before mass invitations.
- Chapter leader training dry run still needs to be scheduled with Abigail, Christopher/delegate, and one pilot president or VP.
- Preview/staging performance rerun is still recommended before broad public launch, even though local budgets now pass.
