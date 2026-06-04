# Plan: DESIGN-01 Active Route Visual And I18n Validation

GitHub issue: #300

## Problem

The QA register maps global visual, Spanish/i18n, accessibility, typography, metadata, footer, navigation, and component consistency observations to active launch routes. Prior slices applied Spanish-first copy, auth metadata, dashboard/profile/event polish, and launch route QA. This slice records active-route visual/accessibility evidence and separates future product/content governance from launch defects.

## Scope

In:

- Use existing launch QA evidence for public, auth, student, chapter, admin, and company/recruiter route boundaries.
- Run production readiness accessibility QA on desktop/mobile.
- Update register states for observations owned by DESIGN-01 and remaining STUDENT-01 design residues.
- Document governance/content items that are not launch code defects.

Out:

- Full future design-system rebuild.
- English-language launch parity beyond current controlled Spanish-first release.
- New content governance decisions for public reach/stat copy.

## Implementation Tasks

- [x] Validate active routes through launch QA scopes: public-student, chapter, admin-recruiter.
- [x] Run production readiness accessibility QA on desktop/mobile.
- [x] Update register states for active-route visual/i18n/accessibility observations.
- [x] Keep public content governance as a leadership decision where needed.

## Validation

- `LAUNCH_QA_SCOPE=public-student pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line`
- `LAUNCH_QA_SCOPE=chapter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line`
- `LAUNCH_QA_SCOPE=admin-recruiter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line`
- `pnpm run qa:accessibility`

## Risks

- Mistaking launch readiness for a complete design-system program. Mitigation: close active-route defects and leave broader future design-system evolution out of this launch QA issue.
- Treating public stats/value-prop governance as a code problem. Mitigation: document as leadership/content decision.
