# Plan: Issue 112 Automated Local Readiness Validation

## Summary

Run the Layer 2 automated local validation for LEAD SPARK production readiness. This issue should execute the repo's automated checks, capture clear evidence, classify any failures by readiness severity, update the validation checklist, and create follow-up issues only for confirmed failures that affect profile, event registration, company visibility, chapter membership, or admin identity readiness.

This is a validation execution issue, not a feature implementation issue. Runtime code should not be changed unless a tiny test/reporting correction is required; fixes for real failures should usually become separate follow-up issues unless the user explicitly asks to repair them immediately.

## User Story

As Abigail and the activation team,
I want automated local tests, lint, and build checks run with recorded evidence,
so that we can catch service, validation, permission, and build regressions before manual QA or production smoke testing.

## Metadata

| Field | Value |
| --- | --- |
| Type | Validation / Testing |
| Complexity | Medium |
| GitHub Issue | #112 |
| GitHub URL | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/112 |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Validation Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Depends On | #111 |
| Systems Affected | Vitest, ESLint, Next build, Layer 2 readiness checklist, GitHub validation evidence |

## Current State

- #111 completed the Layer 1 inspection and moved to `piv-status:review`.
- #111 targeted Vitest passed: 5 files, 51 tests.
- `package.json` defines the relevant commands:
  - `pnpm test` -> `vitest run`
  - `pnpm lint` -> `eslint .`
  - `pnpm build` -> `next build`
- CI currently runs lint, build, then tests in `.github/workflows/ci.yml`.
- The `validate` workflow runs lint, `pnpm exec tsc --noEmit`, then tests in `.github/workflows/validate.yml`.
- Existing plans note that `pnpm test` and `pnpm build` should run sequentially, not concurrently, because prior runs timed out under resource contention.

## Scope

In scope:

- Run targeted readiness tests for the LEAD SPARK risk areas.
- Run full `pnpm test`.
- Run `pnpm lint`.
- Run `pnpm build` if test/lint state is clean enough; otherwise record the blocker rationale.
- Categorize failures by P0/P1/P2/P3 using the readiness severity legend.
- Update Layer 2 rows in `docs/proposals/lead-spark-production-readiness-validation.md`.
- Create `.github/reports/issue-112-automated-local-readiness-validation-report.md`.
- Update GitHub #112 with completion evidence and status.

Out of scope:

- Manual browser QA for seeded roles. That belongs to #113.
- Production auth, data cleanliness, import, and company portal smoke checks. Those belong to #114 through #118.
- Broad code repair. Create follow-up issues for confirmed failures unless the user explicitly requests fixes.

## Patterns To Follow

### Evidence Workflow

Source: `docs/proposals/lead-spark-production-readiness-validation.md`

- Capture Environment, Tester, Date, Result, Evidence, Severity, and Follow-up issue if needed.
- Do not include real member PII.
- P0 findings block real member invitations until fixed or explicitly accepted by go/no-go owners.

### Test Pattern

Source: `vitest.config.ts`

- Vitest includes `**/*.test.{ts,tsx}` and runs in `jsdom`.
- Use `pnpm test` for the full suite.
- Use targeted `pnpm vitest --run ...` for readiness-critical files.

### Existing Readiness Test Coverage

Source: `.github/reports/issue-111-code-documentation-readiness-inspection-report.md`

Targeted readiness files from #111:

- `lib/services/__tests__/person-profile.service.test.ts`
- `lib/actions/events/__tests__/register.helpers.test.ts`
- `lib/services/__tests__/chapter-membership.service.test.ts`
- `lib/services/__tests__/company.service.test.ts`
- `lib/services/__tests__/lead-identity.service.test.ts`

Additional useful readiness tests for #112:

- `lib/memberschema.test.ts`
- `lib/actions/student/__tests__/onboarding.helpers.test.ts`
- `lib/services/__tests__/event.service.test.ts`
- `lib/services/__tests__/event-application.service.test.ts`
- `lib/services/__tests__/recruiter.service.test.ts`
- `lib/services/__tests__/admin.service.test.ts`
- `tests/architecture.test.ts`

### Sequential Validation

Do not run long validation commands in parallel. Recommended order:

1. `git status --short`
2. targeted readiness Vitest command
3. `pnpm test`
4. `pnpm lint`
5. `pnpm build` if tests and lint are clean enough

If `pnpm test` or `pnpm lint` fails, still decide whether `pnpm build` is useful. If failures indicate broken app state or environment blockers, record why build was skipped.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/proposals/lead-spark-production-readiness-validation.md` | Update | Fill Layer 2 automated validation statuses/evidence. |
| `.github/reports/issue-112-automated-local-readiness-validation-report.md` | Create | Record command outputs, pass/fail summary, severity classification, and follow-ups. |
| `.github/plans/issue-112-automated-local-readiness-validation.plan.md` | Update | Mark tasks/done criteria complete during implementation. |

Do not edit runtime source files as part of the default #112 implementation.

## Tasks

### Task 1: Establish Baseline

Status: Completed.

- **File/System**: Git status, #111 report, validation doc.
- **Action**: Inspect.
- **Implement**:
  - Confirm current branch.
  - Capture `git status --short`.
  - Confirm #111 report exists and Layer 1 is complete.
  - Confirm Layer 2 checklist rows are the only validation doc rows being updated.
- **Validate**: Baseline evidence is included in the report.

### Task 2: Run Targeted Readiness Tests

Status: Completed.

- **Command**:

```bash
pnpm vitest --run lib/memberschema.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/event.service.test.ts lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/lead-identity.service.test.ts lib/services/__tests__/admin.service.test.ts
```

- **Action**: Run.
- **Implement**:
  - Record test file count and test count.
  - If failures occur, identify affected readiness area and severity.
  - If command is too slow or times out, rerun smaller groups and record the split.
- **Validate**: Targeted test evidence is included in the report.

### Task 3: Run Full Test Suite

Status: Completed.

- **Command**:

```bash
pnpm test
```

- **Action**: Run.
- **Implement**:
  - Record pass/fail, file count, test count, and duration if available.
  - If a failure occurs, classify it:
    - P0: security/data exposure, wrong company visibility, wrong chapter scope, or production activation blocker.
    - P1: blocks pilot success for a key role or chapter.
    - P2: localized regression with workaround.
    - P3: non-blocking polish/noise.
  - Do not fix failures in this issue unless explicitly directed.
- **Validate**: Full suite evidence is included in the report and validation doc.

### Task 4: Run Lint

Status: Completed.

- **Command**:

```bash
pnpm lint
```

- **Action**: Run.
- **Implement**:
  - Record pass/fail.
  - If warnings only, note as passed with warnings.
  - If errors occur, classify by severity and identify files.
- **Validate**: Lint evidence is included in the report and validation doc.

### Task 5: Run Build

Status: Completed.

- **Command**:

```bash
pnpm build
```

- **Action**: Run or record blocker rationale.
- **Implement**:
  - Run after tests and lint, sequentially.
  - If tests/lint fail but build may still provide useful type/production evidence, run build and classify independently.
  - If build is skipped, record exact blocker rationale.
  - If build fails due to transient external fetch/network, rerun once and record both attempts.
- **Validate**: Build evidence or skipped rationale is included in the report and validation doc.

### Task 6: Update Layer 2 Validation Checklist

Status: Completed.

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: Update.
- **Implement**:
  - Update only the Layer 2 automated validation table.
  - Replace `Not Started` with `Passed`, `Failed`, `Blocked`, or `N/A`.
  - Add concise evidence:
    - command name
    - result summary
    - report link/path
    - follow-up issue if needed
  - Preserve Layer 1 and later layers.
- **Validate**: Layer 2 rows reflect actual command results.

### Task 7: Create Failure Follow-Up Issues If Needed

Status: Completed. No confirmed P0/P1 failures were found, so no follow-up issues were created.

- **System**: GitHub.
- **Action**: Create only if failures are confirmed.
- **Implement**:
  - For each P0/P1 failure, create a focused issue with:
    - command
    - failure summary
    - affected readiness area
    - severity
    - reproduction evidence
  - Add appropriate labels such as `bug`, `testing`, `security`, `typescript`, `validation`, `company`, or `architecture`.
  - Link the issue from the report and checklist.
  - For P2/P3, record in the report without creating noise unless the user asks.
- **Validate**: `gh issue view` confirms follow-up labels/links if created.

### Task 8: Create Implementation Report

Status: Completed.

- **File**: `.github/reports/issue-112-automated-local-readiness-validation-report.md`
- **Action**: Create.
- **Implement**:
  - Include source metadata.
  - Include command summary table.
  - Include targeted readiness area table.
  - Include failure classification table, even if empty.
  - Include follow-up issue table, even if empty.
  - Include notes about skipped commands or retries.
- **Validate**: Report covers every #112 acceptance criterion.

### Task 9: Update Local Plan

Status: Completed.

- **File**: `.github/plans/issue-112-automated-local-readiness-validation.plan.md`
- **Action**: Update.
- **Implement**:
  - Mark tasks complete as implementation proceeds.
  - Mark acceptance criteria complete when evidence exists.
  - Leave GitHub status tasks unchecked until after the GitHub comment/label update.
- **Validate**: Plan reflects actual state.

### Task 10: Update GitHub Issue #112

Status: Completed.

- **System**: GitHub.
- **Action**: Comment and label.
- **Implement**:
  - Add completion comment with:
    - report path
    - command results
    - P0/P1 status
    - follow-up issues if created
  - Change label from `piv-status:plan-ready` to `piv-status:review`.
  - Keep issue open for review unless user asks to close.
- **Validate**:

```bash
gh issue view 112 --json labels,state,url
```

## Validation Commands

Run sequentially:

```bash
git status --short
pnpm vitest --run lib/memberschema.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/event.service.test.ts lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/lead-identity.service.test.ts lib/services/__tests__/admin.service.test.ts
pnpm test
pnpm lint
pnpm build
```

## Acceptance Criteria

- [x] `pnpm test` result is recorded.
- [x] `pnpm lint` result is recorded.
- [x] `pnpm build` result is recorded, or blocker rationale is recorded.
- [x] Targeted readiness tests are recorded.
- [x] Any failures are categorized by P0/P1/P2/P3.
- [x] Follow-up issues are created for confirmed P0/P1 profile, event registration, company visibility, chapter membership, or admin identity failures. No confirmed P0/P1 failures were found.
- [x] Layer 2 validation checklist is updated.
- [x] Implementation report is created.
- [x] GitHub issue #112 receives completion comment.
- [x] GitHub issue #112 has `piv-status:review`.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Long commands time out | Run sequentially; split targeted tests into smaller groups if needed; record timeout as evidence. |
| Build fails due to missing environment variables | Record exact missing env/config; classify as Blocked or Failed depending on whether production readiness is affected. |
| Lint produces warnings but no errors | Treat as passed with warnings and record warning count if visible. |
| Full test suite is noisy | Use targeted readiness tests plus full-suite failure classification; create focused P0/P1 issues only for real readiness failures. |
| Validation report exposes sensitive data | Do not include env values, tokens, member data, or raw secrets in reports/comments. |

## Done Criteria

- [x] Targeted readiness tests have been run or blocker recorded.
- [x] `pnpm test`, `pnpm lint`, and `pnpm build` have been run or blocker recorded.
- [x] Layer 2 validation table reflects actual command evidence.
- [x] Report exists and includes command summaries, severity classification, and follow-ups.
- [x] Confirmed P0/P1 failures have follow-up GitHub issues. No confirmed P0/P1 failures were found.
- [x] Local plan is updated.
- [x] GitHub issue #112 is updated and labeled for review.
