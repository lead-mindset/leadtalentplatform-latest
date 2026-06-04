# Plan: CHAPTER-01 Operator Route Validation

GitHub issue: #298

## Problem

The QA register maps observations 63 and 65-77 to chapter operator landing, event forms, event tables, member management, check-in, breadcrumbs, and responsive action visibility. Recent QALS slices already implemented the risky launch fixes; this slice validates the active chapter operator routes and records which remaining requests are product decisions rather than code defects.

## Scope

In:

- Validate President, VP, legacy editor, and regular e-board chapter routes on desktop/mobile.
- Confirm chapter dashboard, members, events, event detail, applications, and check-in paths render without launch findings.
- Update the QA register for fixed/validated chapter observations.
- Mark missing event/check-in options as product decisions where they require new workflow scope.

Out:

- New event type/configuration product options.
- New manual attendance workflow.
- New general attendee-list tooling.
- Alumni/company/recruiter scope.

## Implementation Tasks

- [x] Run chapter launch QA on desktop and mobile.
- [x] Review generated findings report.
- [x] Update register states for observations 63 and 65-77.
- [x] Document product-decision items separately from implemented launch fixes.

## Validation

- `LAUNCH_QA_SCOPE=chapter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line`

## Risks

- Treating missing product options as bugs and inventing workflows without leadership. Mitigation: keep them as explicit product decisions.
- Hiding visual issues because the test is report-only. Mitigation: read report JSON and record findings count.
