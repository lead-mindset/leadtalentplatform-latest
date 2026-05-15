# Issue #108 - Show Portfolio in Authorized Professional Review Surfaces Report

## Recommendation

Completed.

Portfolio URLs are available only through existing authorized professional review paths and are hidden when absent.

## Scope

This issue covers company candidate review and chapter event application review surfaces.

It does not create public profile pages, portfolio previews, or new visibility rules.

## What Is Implemented

- Company-visible talent mapping includes `person_profile.portfolio_url`.
- Company discovery still requires explicit recruiter visibility opt-in and approved chapter membership.
- Company candidate detail shows a Portfolio external link when present.
- Company quick view shows a Portfolio external link when present.
- Recruiter/company detail service returns `portfolio_url`.
- Event application review data includes `portfolio_url`.
- Event application review cards show a Portafolio external link near LinkedIn when present.
- Missing portfolio values do not render empty portfolio buttons/rows.
- External portfolio links use `target="_blank"` and `rel="noopener noreferrer"`.

## Acceptance Criteria Matrix

| Acceptance Criteria | Status | Evidence |
| --- | --- | --- |
| Eligible company-visible member portfolio appears on company profile | Passed | Company detail page renders optional Portfolio link from `person_profile.portfolio_url`. |
| Missing portfolio does not render empty row | Passed | Company quick view, company detail, and application review render portfolio only when truthy. |
| Event applicant portfolio appears for authorized chapter review | Passed | Event registration mapping and `ApplicationReviewCard` pass/render `portfolioUrl`. |
| Portfolio does not make non-approved participants discoverable | Passed | Company service still filters by `is_recruiter_visible = true` plus approved membership; tests cover ineligible exclusion. |
| Service tests cover authorized mappings | Passed | Company, recruiter, and event service tests passed. |

## Validation

```bash
pnpm test -- lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts
pnpm exec eslint lib/types.ts lib/services/company.service.ts lib/services/recruiter.service.ts lib/services/event.service.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts "app/[locale]/company/(protected)/students/[id]/page.tsx" "app/[locale]/company/(protected)/_components/student-quick-view.tsx" "app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx" components/events/application-review-card.tsx
pnpm lint
pnpm build
```

Results:

- Focused tests passed: 3 files, 102 tests.
- Focused eslint passed.
- Full lint passed with existing warnings only.
- Production build passed.

## Notes

- Portfolio display follows the same professional-data boundary as LinkedIn/resume-style review context.
- No public route was added.
- No eligibility or company visibility rule was changed.

