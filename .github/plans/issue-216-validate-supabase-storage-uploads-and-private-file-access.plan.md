# Plan: Issue #216 - Validate Supabase Storage Uploads And Private File Access

GitHub Issue: #216
Source PRD: `.github/PRDs/production-readiness-validation.prd.md`
Type: Technical / Storage QA
Complexity: Medium

## Summary

Add a storage validation smoke harness for launch-critical upload and access-control behavior. The harness should exercise local Supabase Storage with seeded personas, record bucket configuration, test event cover upload/public rendering, test resume bucket readiness, and report any authorization gaps without changing product behavior.

## Implementation Status

- [x] Task 1: Add storage upload/access smoke script.
- [x] Task 2: Add package script and runbook instructions.
- [x] Task 3: Run local storage validation.
- [x] Task 4: Record findings in the readiness report.
- [x] Task 5: Write implementation report and update GitHub.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Event cover upload | `lib/services/event.service.ts` | Event covers upload to `event-covers` under a user-id folder and return a public URL. |
| Resume upload | `lib/services/student.service.ts` | Resumes upload to `resumes` under a user-id folder and upsert metadata in `resume`. |
| Recruiter resume access | `lib/services/company.service.ts` | Recruiter access checks visibility before creating signed resume URLs. |
| Existing E2E setup | `tests/e2e/chapter-leader-member-management.spec.ts` | Local env loading and deterministic seed users. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `scripts/production-readiness/storage-upload-smoke.mjs` | Create | Validate local Storage bucket and policy behavior with seeded personas. |
| `package.json` | Update | Add `qa:storage` script. |
| `docs/runbooks/production-readiness-validation.md` | Update | Document storage command and expected artifact. |
| `.github/reports/production-readiness-validation-report.md` | Update | Record local storage verdict and findings. |
| `.github/plans/issue-216-validate-supabase-storage-uploads-and-private-file-access.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Add Storage Smoke Script

- Load local environment.
- Refuse remote Supabase unless explicitly allowed.
- Sign in seeded member, president, editor, and recruiter personas.
- Inspect required buckets.
- Try event cover upload as chapter president and legacy editor.
- Check public event cover URL behavior.
- Check resume bucket readiness and unauthorized access behavior where possible.
- Write sanitized JSON to `outputs/production-readiness/storage-upload-results.json`.

### Task 2: Document Command

```bash
pnpm run qa:storage
```

### Task 3: Run Local Validation

```bash
pnpm run qa:storage
```

### Task 4: Record Findings

- Mark launch blockers if the required bucket is missing or a required persona cannot upload.
- Mark not-testable where a prior blocker prevents deeper checks.

### Task 5: Validate

```bash
pnpm run qa:storage
pnpm run lint
```

## Acceptance Criteria Mapping

- [x] Required buckets are inspected.
- [x] Chapter operator event cover upload is validated.
- [x] Public event cover URL behavior is validated.
- [x] Resume bucket readiness is validated.
- [x] Unauthorized/private resume checks are recorded as pass, fail, or not-testable with reason.
- [x] No signed URLs, file contents, or personal file names are committed.
