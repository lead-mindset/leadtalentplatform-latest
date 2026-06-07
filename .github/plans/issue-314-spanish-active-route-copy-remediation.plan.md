# Issue #314 - Spanish Active Route Copy Remediation

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/314

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The June 7 full-role QA audit found visible English copy and unaccented Spanish across active `/es` routes. This damages trust in the Spanish-first controlled launch and makes some surfaces feel like prototypes.

This focused plan addresses the active-route copy slice without changing service behavior, auth behavior, or mobile layout structure.

## Related Observations

- QA-006 / #314: Complete Spanish copy pass for active `/es` routes.
- QA-015 / #323: Localize admin mobile shell subtitle.
- QA-016 / #324: Clean unaccented Spanish in active launch surfaces.
- QA-018 / #326: Decide/localize growth reflection if active. This plan localizes the current visible page only.
- QA-019 / #327: Localize public FAQ on `/es/faq`.
- QA-020 / #328: Localize company resume access copy.

## Codebase Findings

- `app/[locale]/faq/page.tsx` is entirely English on the Spanish route.
- `app/[locale]/student/growth-reflection/page.tsx` mixes Spanish with English title and unaccented Spanish.
- `app/[locale]/admin/layout.tsx` uses `mobileSubtitle="Platform management"`.
- `app/[locale]/company/(protected)/settings/page.tsx` is mostly English.
- `app/[locale]/company/(protected)/students/[id]/page.tsx` is mostly English.
- `app/[locale]/company/(protected)/_components/resume-access-button.tsx` uses English button/toast copy.
- `app/[locale]/student/events/page.tsx`, `app/[locale]/admin/events/events-management-client.tsx`, and `app/[locale]/chapter/members/page.tsx` contain unaccented Spanish strings named in QA-016.

## Tasks

### Task 1 - Localize Public FAQ

- **Files**: `app/[locale]/faq/page.tsx`
- **Action**: Replace public FAQ metadata, headings, questions, answers, and CTAs with Spanish copy.
- **Validation**: Screenshot `/es/faq` mobile and run text search for the old English headings.
- **Status**: Completed. `/es/faq` metadata, headings, content, and CTAs are now Spanish.

### Task 2 - Localize Student Growth Reflection

- **Files**: `app/[locale]/student/growth-reflection/page.tsx`
- **Action**: Translate the page title and fix Spanish accents across labels, placeholders, and buttons.
- **Validation**: Screenshot `/es/student/growth-reflection` mobile with a seeded student account.
- **Status**: Completed. Growth reflection title, description, labels, placeholders, and buttons are localized/accented.

### Task 3 - Localize Admin And Company Shell/Pages

- **Files**:
  - `app/[locale]/admin/layout.tsx`
  - `app/[locale]/company/(protected)/settings/page.tsx`
  - `app/[locale]/company/(protected)/students/[id]/page.tsx`
  - `app/[locale]/company/(protected)/_components/resume-access-button.tsx`
- **Action**: Replace visible English copy with Spanish copy on active Spanish surfaces.
- **Validation**: Screenshot admin shell and company settings/detail where seeded credentials allow access.
- **Status**: Completed. Admin mobile shell, company settings, company student detail, and resume access copy are localized.

### Task 4 - Clean Unaccented Spanish In Named Active Surfaces

- **Files**:
  - `app/[locale]/student/events/page.tsx`
  - `app/[locale]/admin/events/events-management-client.tsx`
  - `app/[locale]/chapter/members/page.tsx`
- **Action**: Fix obvious unaccented Spanish named in the audit.
- **Validation**: Text search for `capitulo`, `codigos`, `postulacion`, `Agendalo`, and `pagina` in touched files.
- **Status**: Completed. Named accent issues in student events, admin events, chapter members, and e-board invitation copy are corrected.

### Task 5 - Validate And Record Evidence

- **Action**:
  - Run type/lint/test validation appropriate for copy-only changes.
  - Capture screenshots for representative routes.
  - Comment on #314 with plan and evidence.
- **Status**: Completed. Validation report created at `.github/reports/issue-314-spanish-active-route-copy-remediation-report.md`.

## Risks

- The company portal may later be deferred by product decision. These changes still reduce visible Spanish-route drift while the routes remain reachable.
- This plan does not move all copy into `next-intl`; it fixes visible launch copy first. A later source-of-truth pass can centralize messages.
- Some English words such as `LinkedIn`, `Portfolio`, or role names may remain because they are product/proper nouns or industry terms.

## Definition Of Done

- [x] Active Spanish pages named in the audit no longer show the old English page titles and primary labels.
- [x] Obvious unaccented Spanish named in QA-016 is corrected in touched files.
- [x] Screenshots are captured for `/es/faq`, `/es/student/growth-reflection`, `/es/admin/users`, and `/es/company/settings` when accessible locally.
- [x] Validation commands are run and summarized.
- [x] Issue #314 is updated with plan and evidence.
