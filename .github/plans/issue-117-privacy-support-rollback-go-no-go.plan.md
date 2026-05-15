# Plan: Issue #117 - Privacy Copy, Support Path, Rollback Path, and Go/No-Go Summary

## Summary

Create the operational launch-safety package needed before inviting real LEAD members into LEAD Talent Platform. This is a process/documentation issue with light product-copy alignment: draft member-facing company visibility language, define support intake categories, document rollback ownership and options, and create a go/no-go summary template leadership can use to approve, pause, or request fixes.

This issue is intentionally unblocked by the chapter e-board import review. It prepares the trust, support, and decision layer that must exist before any pilot invitations go out.

## User Story

As LEAD executive and operations leadership,  
I want clear privacy/visibility copy, support instructions, rollback options, and a go/no-go summary,  
so that we can invite real members only when the platform is technically and organizationally ready.

## Metadata

| Field | Value |
| --- | --- |
| Type | PROCESS / DOCS / LIGHT COPY |
| Complexity | MEDIUM |
| GitHub Issue | #117 |
| GitHub URL | `https://github.com/lead-mindset/leadtalentplatform-latest/issues/117` |
| Parent Roadmap | #130 |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Readiness Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Main Output | `docs/handbook/PILOT-ACTIVATION-SUPPORT-AND-ROLLBACK.md` |
| Decision Output | `.github/reports/issue-117-pilot-activation-go-no-go-summary.md` |

## Current Codebase Context

- Public privacy policy copy lives in `lib/legal/privacy.ts`.
- Terms copy lives in `lib/legal/terms.ts` and explicitly says not to edit without legal review.
- Public help page lives in `app/[locale]/(public)/help/page.tsx`.
- Member profile visibility copy currently comes from `messages/es.json` and `messages/en.json`.
- Student profile visibility control is rendered in `app/[locale]/student/profile/components/profile-update-form.tsx`.
- Production readiness context and owners are already documented in `docs/proposals/lead-spark-production-readiness-validation.md`.
- Event operations readiness is now documented in `docs/handbook/EVENT-OPERATIONS-CHECKLIST.md` and `.github/reports/issue-132-multi-event-operations-readiness-validation-report.md`.

## Patterns to Follow

| Category | File | Pattern |
| --- | --- | --- |
| Legal caution | `lib/legal/terms.ts` | Legal copy should not be edited directly without legal review. |
| Public support surface | `app/[locale]/(public)/help/page.tsx` | Localized copy object, cards for account/help/privacy. |
| Member visibility UI | `app/[locale]/student/profile/components/profile-update-form.tsx` | Visibility copy is message-driven through `t('professional.visibility')` and `t('professional.visibilityDesc')`. |
| i18n copy | `messages/es.json`, `messages/en.json` | Spanish and English message keys are kept in parallel. |
| Readiness reporting | `.github/reports/issue-132-multi-event-operations-readiness-validation-report.md` | Markdown report with recommendation, evidence, known gaps, and conclusion. |

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/handbook/PILOT-ACTIVATION-SUPPORT-AND-ROLLBACK.md` | CREATE | Single operating guide for member-facing visibility copy, support categories, owners, escalation, and rollback. |
| `.github/reports/issue-117-pilot-activation-go-no-go-summary.md` | CREATE | Executive summary template/status doc for approve/pause/fix decision. |
| `messages/es.json` | UPDATE | Improve non-legal member visibility copy to be clearer and Spanish-first. |
| `messages/en.json` | UPDATE | Keep English copy aligned for English UI. |
| `app/[locale]/(public)/help/page.tsx` | UPDATE | Make support path clearer for account, member activation, events, and company invite issues. |
| `.github/plans/issue-117-privacy-support-rollback-go-no-go.plan.md` | UPDATE | Track implementation status. |

## Out of Scope

- Do not edit legal policy text in `lib/legal/privacy.ts` or `lib/legal/terms.ts` unless Cristhy/legal explicitly approves final wording.
- Do not import members.
- Do not touch production data.
- Do not enable company visibility for anyone.
- Do not configure real production support inboxes or automations unless separately requested.

## Proposed Operating Decisions

These decisions should be documented as proposed defaults unless leadership changes them:

| Area | Proposed Default |
| --- | --- |
| Technical rollback owner | Abigail |
| Executive go/no-go owners | Luis, Antonny, Nicole, Abigail |
| Data/import owner | Nikole |
| Chapter validation/support owner | Christopher |
| Member consent language reviewer | Xiomara |
| Communications/support instructions owner | Kiara |
| QA support/reproduction owner | Angela |
| Support intake source | Activation email + help page + internal escalation thread |
| Visibility default | Company visibility remains off by default |
| Company access default | Invite-only only |

## Support Issue Categories

The support guide must define the following categories exactly:

1. Login/auth problem
2. Wrong email
3. Wrong chapter
4. Missing member
5. Duplicate person/member
6. Wrong role or chapter editor access
7. Profile edit problem
8. Company visibility or consent question
9. Event registration/application problem
10. Check-in problem

Each category should include:

- What the member reports.
- Who triages first.
- What evidence/support details are needed.
- Severity guidance.
- Whether it blocks invitations or can be fixed during pilot.

## Rollback Options

The rollback section must include:

- Pause invites.
- Hide or pause company portal access.
- Disable member/company visibility.
- Correct access rows.
- Correct membership/chapter rows.
- Re-send clarification or correction message.
- Stop a wave and continue with a smaller pilot group.

## Tasks

### Task 1: Create Support and Rollback Handbook

Status: Completed

- **File**: `docs/handbook/PILOT-ACTIVATION-SUPPORT-AND-ROLLBACK.md`
- **Action**: CREATE
- **Implement**:
  - Write Spanish-first operating guide.
  - Include short English labels where useful for system roles/issues.
  - Add member-facing visibility copy draft.
  - Add support categories and intake template.
  - Add owner matrix.
  - Add rollback options and trigger conditions.
  - Add escalation paths and P0/P1/P2/P3 severity definitions aligned with `docs/proposals/lead-spark-production-readiness-validation.md`.
- **Validate**:
  - All #117 issue categories are represented.
  - Document does not expose secrets or real member PII.
  - Legal language is marked as operational draft pending legal review where needed.

### Task 2: Create Executive Go/No-Go Summary

Status: Completed

- **File**: `.github/reports/issue-117-pilot-activation-go-no-go-summary.md`
- **Action**: CREATE
- **Implement**:
  - Include decision options: Approve pilot, pause, or request fixes.
  - Include sections for passed items, failed items, blockers, accepted risks, owner confirmations, and recommendation.
  - Pre-fill known current context:
    - #132 event operations readiness passed locally.
    - #131 human review remains pending before real import.
    - #134 actual local Docker member import depends on approved artifact.
    - Production auth/data issues are tracked separately in #119, #120, #121, #123.
  - State that the current recommendation is not full launch yet; it is preparation for controlled pilot once blockers clear.
- **Validate**:
  - Executive leadership can approve, pause, or request fixes from the summary.

### Task 3: Improve Member Visibility Copy

Status: Completed

- **Files**: `messages/es.json`, `messages/en.json`
- **Action**: UPDATE
- **Implement**:
  - Improve `studentProfile.professional.visibility` and `studentProfile.professional.visibilityDesc`.
  - Make it clear:
    - Profile visibility is optional.
    - Visibility is for approved/invited LEAD partner/company representatives.
    - Turning it on does not guarantee opportunities.
    - It can be changed later.
  - Keep the copy concise enough for the profile checkbox UI.
- **Validate**:
  - JSON remains valid.
  - Spanish and English keys stay aligned.

### Task 4: Clarify Public Help Page Support Path

Status: Completed

- **File**: `app/[locale]/(public)/help/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Clarify account/member activation support in Spanish and English.
  - Mention the kinds of issues users can report: login, wrong email/chapter, profile, event registration, check-in, company invite.
  - Keep page structure simple and consistent with existing cards.
  - Avoid promising real-time support or unsupported workflows.
- **Validate**:
  - Page compiles.
  - No new route or auth behavior is introduced.

### Task 5: Validate Documentation and Copy

Status: Completed

- **Action**: VALIDATE
- **Commands**:

```bash
pnpm exec eslint app/[locale]/(public)/help/page.tsx
node -e "JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('messages json ok')"
```

- **Optional Command**:

```bash
pnpm lint
```

- **Validate**:
  - No lint errors in touched UI file.
  - Message JSON parses.
  - Full lint may have existing warnings only.

### Task 6: Update GitHub Issue

Status: Completed

- **Action**: UPDATE
- **Implement**:
  - Comment on #117 with:
    - plan path,
    - handbook path,
    - go/no-go summary path,
    - copy/support/rollback summary,
    - validation results,
    - recommendation.
  - Close #117 only if all acceptance criteria are met.

## Acceptance Criteria Mapping

- [x] Member-facing company visibility copy is drafted and approved-ready.
- [x] Support contact/path is visible in activation instructions and public help copy.
- [x] Issue categories are defined for login, wrong email, wrong chapter, missing member, duplicate, wrong role, profile edit, visibility, event registration, and check-in.
- [x] Rollback owner is assigned or explicitly proposed for confirmation.
- [x] Rollback options are documented: pause invites, hide company portal, disable visibility, correct access rows, send clarification.
- [x] Go/no-go summary includes passed items, failed items, blockers, accepted risks, and recommendation.
- [x] Executive leadership can approve, pause, or request fixes from the summary.

## Validation

```bash
pnpm exec eslint app/[locale]/(public)/help/page.tsx
node -e "JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('messages json ok')"
pnpm lint
```

## Implementation Notes

- Keep this issue focused on launch safety. Do not expand it into import execution.
- Keep member copy plain and non-alarming.
- Avoid overpromising privacy/legal guarantees beyond current platform behavior.
- Treat legal policy edits as a separate review with Cristhy/legal.
- This issue can be completed before Christopher finishes #131.
