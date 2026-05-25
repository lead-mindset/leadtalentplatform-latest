# Issue 206: Document Activation Runbook, Training Flow, And Founder Summary

## Goal

Create concise operational documentation for launching LEAD Talent Platform with chapter leaders after the chapter-scoped permissions work. The docs must explain how Christopher's chapter lists become safe preapprovals, how Abigail trains chapter leaders, how support cases are corrected, and how founders should understand the platform direction.

## User Story

As Abigail, I want a grounded activation runbook and training flow so that chapter leaders can start using the platform without role hacks, leaked real emails, or unclear escalation paths.

## Codebase Patterns To Follow

| Category | Source | Pattern |
| --- | --- | --- |
| Account model | `docs/PRODUCT-SPECIFICATION.md` | Keep `public.user.role`, `chapter_membership`, `lead_identity`, and `recruiter_access` separate. |
| Permission model | `docs/adr/004-chapter-scoped-roles-permissions.md` | Chapter access comes from approved membership plus active permission grants. |
| Preapproval schema | `supabase/migrations/20260522160000_add_chapter_preapproval.sql` | Real email lists are operational data; migrations only create schema. |
| Role taxonomy | `lib/chapter-role-options.ts` | Use normalized role levels and functional areas with human display titles. |
| Permission templates | `lib/services/chapter-permission.service.ts` | President/VP, chief of staff, and regular e-board have distinct launch permissions. |
| Testing evidence | `docs/handbook/TESTING.md` | Seed personas and Playwright matrix document validation expectations. |

## Scope

- Add a runbook for chapter activation using direct database preapproval inserts with placeholder-only examples.
- Add a chapter leader training agenda and checklist.
- Add support and rollback paths for common launch mistakes.
- Add a founder-facing summary connecting this model to LEAD Spark, Impact Metrics, LEAD Pulse, LEAD Funding, and chapter recognition.
- Add a validation/report note for issue closure.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/runbooks/chapter-activation-runbook.md` | Create | Operational runbook, training flow, support cases, pilot evidence, founder summary. |
| `docs/handbook/TESTING.md` | Update | Link the activation runbook from manual chapter permission validation. |
| `.github/reports/issue-206-document-activation-runbook-training-flow-and-founder-summary-report.md` | Create | Capture implementation and validation evidence. |

## Tasks

1. Create `docs/runbooks/chapter-activation-runbook.md`.
2. Include safe preapproval input format, SQL templates with placeholders only, and duplicate/ambiguous email checks.
3. Document chapter leader training flow for signup, preapproval activation, dashboard access, member visibility, applicant approval, event creation, and e-board assignment.
4. Document correction/rollback cases for wrong chapter, wrong role, missing member, duplicate email, and extra access.
5. Add founder summary and pilot readiness checklist.
6. Link the runbook from `docs/handbook/TESTING.md`.
7. Run documentation validation.

## Risks

| Risk | Mitigation |
| --- | --- |
| Real emails accidentally committed | Use placeholder-only SQL and state that real lists stay outside the repo. |
| Operators misuse global roles | Repeat that chapter leaders should stay `user.role='member'` unless they are true admins/recruiters. |
| Ambiguous duplicate email across chapters | Add preflight duplicate checks before insert. |
| Docs drift from implementation | Use exact table names, role levels, functional areas, and permission categories from code/migrations. |

## Validation

- `git diff --check`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test`

## Completion Status

- Status: Complete
- Created the chapter activation runbook with safe placeholder-only preapproval loading SQL.
- Documented the chapter leader training flow, support/rollback cases, pilot readiness checklist, and founder summary.
- Linked the runbook from the testing handbook.
- Validated with diff check, typecheck, lint, and full test suite.
