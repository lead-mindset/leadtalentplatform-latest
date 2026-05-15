# Plan: Issue 115 Production Data Cleanliness And Canonical Chapters

## Summary

Run a read-only production data audit before pilot import. This issue should verify that production does not contain obvious QA/test contamination in activation-facing tables, export or review the canonical chapter list, map production chapter IDs/names to the Activation Master Sheet, flag duplicate or ambiguous chapter records, and categorize data risks before any real member import. The output is evidence, a Layer 4 checklist update, a report, and follow-up issues for confirmed P0/P1 blockers.

This is a validation/data-audit issue. It should not mutate production data by default.

## User Story

As Abigail and the activation team,
I want production data cleanliness and chapter mapping validated,
so that pilot member import does not attach real members to wrong chapters or mix real activation with QA/test records.

## Metadata

| Field | Value |
| --- | --- |
| Type | Production Data Validation |
| Complexity | Medium |
| GitHub Issue | #115 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/115` |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Validation Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Depends On | #114 for production auth context; can run independently with production DB read access |
| Systems Affected | Production Supabase, chapter records, user/profile/membership data, Activation Master Sheet mapping |

## Current State

- #113 completed QA seeded-role validation.
- #114 completed production auth surface smoke with blockers:
  - #119 P0 Google OAuth `redirect_uri_mismatch`.
  - #120 P1 controlled production auth smoke accounts needed.
- Layer 4 rows owned by #115 were updated by this issue:
  - Production DB has no obvious QA/test contamination.
  - Canonical chapter list is correct.
- The local/QA seed file contains deterministic test personas and canonical local chapter fixtures. Production should not contain those personas unless clearly isolated.

## Implementation Result

Completed on 2026-05-10 with blockers.

- Production DB read-only audit ran successfully using `.env.production` service role key without printing secrets.
- Evidence was saved under `tmp/production-data-115/`.
- Production has 15 chapter records and 0 normalized duplicate chapter groups.
- Production has 1 active `@test.com` app user with no profile/membership found; follow-up #123 created.
- Production schema is missing `person_profile.is_recruiter_visible`; follow-up #121 created as P0.
- Activation Master Sheet mapping could not be completed because the sheet/export was unavailable in this session; follow-up #122 created.
- Report created at `.github/reports/issue-115-production-data-cleanliness-canonical-chapters-report.md`.
- Recommendation: no-go for pilot import until #121, #122, and #123 are resolved or explicitly accepted.

## Production Data Safety Rules

- Read-only queries only.
- Do not import, update, delete, reseed, or manually clean production data in this issue.
- Do not include real member personal data in GitHub comments or public reports.
- Store detailed outputs locally under `tmp/production-data-115/` if needed.
- Public report evidence should use counts, redacted rows, chapter IDs/names, and risk summaries.
- If production credentials are unavailable, mark the relevant checks `Blocked` and create a follow-up issue.

## Patterns To Follow

### Canonical Chapter Shape

Source: `lib/database.generated.ts`

```ts
chapter: {
  Row: {
    city: string | null
    id: string
    name: string
    region: string | null
    university: string
  }
}
```

Production chapter mapping should key on `chapter.id`, `chapter.name`, `chapter.university`, `city`, and `region`.

### Admin Chapter Query Pattern

Source: `lib/services/admin.service.ts`

```ts
const { data, error } = await supabase
  .from('chapter')
  .select('id, name, university, city, region, created_at, updated_at, instagram_url, latitude, longitude, location_point')
  .order('name', { ascending: true })
```

Use this shape for chapter export/review.

### QA/Test Seed Patterns To Detect

Source: `supabase/seed.sql` and `docs/handbook/TESTING.md`

Known test emails:

```text
participant@test.com
member@test.com
editor@test.com
admin@test.com
staff@test.com
recruiter@test.com
alumni@test.com
```

Known test UUID pattern:

```text
11111111-1111-1111-1111-111111111111
22222222-2222-2222-2222-222222222222
33333333-3333-3333-3333-333333333333
44444444-4444-4444-4444-444444444444
55555555-5555-5555-5555-555555555555
66666666-6666-6666-6666-666666666666
77777777-7777-7777-7777-777777777777
```

Known QA smoke email patterns:

```text
%@test.com
qa-%@leadmindset.org
qa-hook-smoke-%@leadmindset.org
```

Known local test company:

```text
Test Company
```

These are not automatically bad if intentionally isolated, but they must not appear in real activation-facing sets without explanation.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/proposals/lead-spark-production-readiness-validation.md` | Update | Fill #115 Layer 4 rows with evidence-backed statuses. |
| `.github/reports/issue-115-production-data-cleanliness-canonical-chapters-report.md` | Create | Record production data cleanliness, chapter export/mapping, risks, and follow-ups. |
| `.github/plans/issue-115-production-data-cleanliness-canonical-chapters.plan.md` | Update | Mark tasks complete during implementation. |
| `tmp/production-data-115/` | Create during implementation | Store local query outputs, exports, and redacted evidence. |

Runtime source files are out of scope unless the user explicitly asks to build tooling for this audit.

## Query Pack

Use read-only SQL through Supabase SQL editor, `psql`, or a controlled script with production read credentials. Redact outputs before posting publicly.

### Query 1: Known Seed/Test Users

```sql
select
  id,
  email,
  role,
  created_at,
  deactivated_at
from public."user"
where lower(email) in (
  'participant@test.com',
  'member@test.com',
  'editor@test.com',
  'admin@test.com',
  'staff@test.com',
  'recruiter@test.com',
  'alumni@test.com'
)
or id::text in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
)
or lower(email) like 'qa-%@leadmindset.org'
or lower(email) like 'qa-hook-smoke-%@leadmindset.org'
or lower(email) like '%@test.com'
order by created_at desc;
```

### Query 2: Test Records In Activation-Facing Membership/Profile Sets

```sql
select
  u.id,
  u.email,
  u.role,
  pp.id as person_profile_id,
  pp.is_recruiter_visible,
  cm.chapter_id,
  cm.status,
  cm.position,
  cm.member_id
from public."user" u
left join public.person_profile pp on pp.user_id = u.id
left join public.chapter_membership cm on cm.user_id = u.id
where lower(u.email) in (
  'participant@test.com',
  'member@test.com',
  'editor@test.com',
  'admin@test.com',
  'staff@test.com',
  'recruiter@test.com',
  'alumni@test.com'
)
or lower(u.email) like 'qa-%@leadmindset.org'
or lower(u.email) like 'qa-hook-smoke-%@leadmindset.org'
or lower(u.email) like '%@test.com'
order by u.email;
```

### Query 3: Company/Test Contamination

```sql
select id, name, created_at, created_by_id
from public.company
where lower(name) like '%test%'
   or lower(name) like '%qa%'
order by created_at desc;
```

### Query 4: Canonical Chapter Export

```sql
select
  id,
  name,
  university,
  city,
  region,
  instagram_url,
  created_at,
  updated_at
from public.chapter
order by name asc, university asc;
```

### Query 5: Duplicate Or Ambiguous Chapters

```sql
with normalized as (
  select
    id,
    name,
    university,
    city,
    region,
    lower(regexp_replace(trim(name), '\s+', ' ', 'g')) as normalized_name,
    lower(regexp_replace(trim(university), '\s+', ' ', 'g')) as normalized_university
  from public.chapter
)
select
  normalized_name,
  normalized_university,
  count(*) as records,
  json_agg(json_build_object(
    'id', id,
    'name', name,
    'university', university,
    'city', city,
    'region', region
  ) order by name) as chapters
from normalized
group by normalized_name, normalized_university
having count(*) > 1
order by records desc, normalized_name;
```

### Query 6: Chapter Usage Summary

```sql
select
  c.id,
  c.name,
  c.university,
  c.city,
  c.region,
  count(distinct cm.user_id) filter (where cm.status = 'approved') as approved_members,
  count(distinct cm.user_id) filter (where cm.status = 'pending') as pending_members,
  count(distinct cm.user_id) filter (where cm.status = 'alumni') as alumni_members,
  count(distinct e.id) as events
from public.chapter c
left join public.chapter_membership cm on cm.chapter_id = c.id
left join public.event e on e.chapter_id = c.id
group by c.id, c.name, c.university, c.city, c.region
order by c.name asc;
```

## Tasks

### Task 1: Establish Production Data Audit Baseline

- **Status**: Complete.
- **System**: Production Supabase, GitHub issue #115, validation doc.
- **Action**: Inspect/record.
- **Implement**:
  - Confirm whether production DB read access is available.
  - Create `tmp/production-data-115/` for local query outputs if access exists.
  - Capture date, tester, production project identifier if safe, and baseline `git status --short`.
  - Confirm #114 blockers and note that #115 can proceed read-only even while OAuth remains blocked.
- **Validate**: Baseline appears in report.

### Task 2: Check Known QA/Test User Contamination

- **Status**: Complete with P1 finding; follow-up #123 created.
- **Action**: Run Query 1 and Query 2.
- **Implement**:
  - Look for seed emails, seed UUIDs, `@test.com`, and QA smoke email patterns.
  - Categorize any matches:
    - P0: visible to companies, approved member, editor/admin/recruiter active, or activation-facing with no isolation.
    - P1: present in production but deactivated/isolated or clearly internal.
    - P2/P3: harmless historical/internal residue with no activation exposure.
  - Redact email/local outputs in public comments if needed.
- **Validate**: Counts and redacted details recorded.

### Task 3: Check Company/Test Contamination

- **Status**: Complete. No test-pattern company records found.
- **Action**: Run Query 3.
- **Implement**:
  - Flag any `Test Company`, QA company, or company records that could appear to partner users.
  - Cross-reference with `recruiter_access` only if needed and without exposing invite tokens.
- **Validate**: Company test contamination summarized.

### Task 4: Export Production Chapter List

- **Status**: Complete. Export saved at `tmp/production-data-115/production-chapters.csv`.
- **Action**: Run Query 4.
- **Implement**:
  - Save full local export under `tmp/production-data-115/production-chapters.csv` or `.json`.
  - Include public-safe summary in the report:
    - total chapter count
    - IDs/names/universities/cities/regions
    - any missing city/region/university concerns
  - Do not alter chapter records in this issue.
- **Validate**: Chapter export exists or blocked reason is recorded.

### Task 5: Detect Duplicate Or Ambiguous Chapter Records

- **Status**: Complete. No normalized duplicate groups found.
- **Action**: Run Query 5 and inspect Query 4 manually.
- **Implement**:
  - Flag exact normalized duplicates.
  - Flag likely ambiguous records such as same university with different IDs, `Other`, misspellings, accent variants, or chapter naming mismatches.
  - Categorize mapping risk by severity:
    - P0: duplicate/ambiguous chapter would make pilot import unsafe.
    - P1: mismatch requires owner decision before import.
    - P2: cleanup/polish not blocking pilot.
- **Validate**: Duplicate/ambiguity table in report.

### Task 6: Map Chapters To Activation Master Sheet

- **Status**: Blocked. Activation Master Sheet chapter labels/export unavailable; follow-up #122 created.
- **Input**: Activation Master Sheet chapter column or exported list, if available.
- **Action**: Compare.
- **Implement**:
  - Create a mapping table with:
    - Activation sheet chapter label.
    - Production `chapter.id`.
    - Production `chapter.name`.
    - Production `chapter.university`.
    - Status: `mapped`, `missing in production`, `ambiguous`, or `not in pilot`.
  - If the spreadsheet is unavailable in this session, mark this task `Blocked` and create/record a follow-up if it blocks pilot import.
- **Validate**: Mapping table exists or blocked reason is explicit.

### Task 7: Review Chapter Usage Summary

- **Status**: Complete. Usage summary saved at `tmp/production-data-115/production-chapter-usage.csv`.
- **Action**: Run Query 6.
- **Implement**:
  - Identify chapters that already have production memberships/events.
  - Flag unexpected approved members/editors before pilot import.
  - Use counts only in public report unless rows are known internal/test data.
- **Validate**: Usage summary and risks recorded.

### Task 8: Update Layer 4 Checklist

- **Status**: Complete.
- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: Update.
- **Implement**:
  - Update only #115-owned rows:
    - Production DB has no obvious QA/test contamination.
    - Canonical chapter list is correct.
  - Add evidence pointer, owner, status, and severity.
  - If Activation Master Sheet is unavailable, set canonical row `Blocked` or `Partial` with exact rationale.
- **Validate**: #115 rows are no longer `Not Started` unless blocked with reason.

### Task 9: Create Follow-Up Issues For P0/P1 Data Risks

- **Status**: Complete. Created #121, #122, and #123.
- **System**: GitHub.
- **Action**: Create only for confirmed P0/P1 blockers.
- **Implement**:
  - Create focused issues with environment, query summary, expected, actual, severity, and redacted evidence.
  - Use labels such as `LEAD`, `database`, `chapter`, `validation`, `supabase`.
  - Link issues in the report and validation doc.
- **Validate**: Follow-up issue URLs confirmed with `gh issue view`.

### Task 10: Create Production Data Audit Report

- **Status**: Complete.
- **File**: `.github/reports/issue-115-production-data-cleanliness-canonical-chapters-report.md`
- **Action**: Create.
- **Implement**:
  - Include metadata, production access method, date, tester, and redaction policy.
  - Include query pack results.
  - Include test contamination summary.
  - Include canonical chapter export summary.
  - Include Activation Master Sheet mapping status.
  - Include risk table and pilot import recommendation.
- **Validate**: Report covers every #115 acceptance criterion.

### Task 11: Update Local Plan

- **Status**: Complete.
- **File**: `.github/plans/issue-115-production-data-cleanliness-canonical-chapters.plan.md`
- **Action**: Update during implementation.
- **Implement**:
  - Mark tasks complete/blocked as validation progresses.
  - Mark acceptance criteria complete when evidence exists.
  - Leave GitHub status criteria unchecked until after issue comment/label update.
- **Validate**: Plan reflects actual state.

### Task 12: Update GitHub Issue #115

- **Status**: Complete.
- **System**: GitHub.
- **Action**: Comment and label.
- **Implement**:
  - Add completion comment with report path, data risk summary, chapter mapping status, and follow-up issue links.
  - Change label from `piv-status:plan-ready` to `piv-status:review` when complete.
  - Keep issue open for review unless user asks to close.
- **Validate**:

```bash
gh issue view 115 --json labels,state,url
```

## Validation Commands

This issue is primarily production SQL/read-only validation. Local commands:

```bash
git status --short
```

If using a script for query execution, keep credentials in environment variables only and do not commit outputs with real personal data.

## Acceptance Criteria

- [x] Production test/QA users are absent or clearly isolated from user-facing activation surfaces, or blockers are logged.
- [x] Canonical chapter list is exported or reviewed.
- [x] Chapter names/IDs are mapped to the Activation Master Sheet, or sheet access gap is explicitly blocked with follow-up.
- [x] Duplicate or ambiguous chapter records are flagged.
- [x] Data risks are categorized before pilot import.
- [x] Evidence is captured through query results, admin screenshots, or notes.
- [x] Layer 4 #115-owned rows are updated.
- [x] Production data audit report is created.
- [x] Confirmed P0/P1 blockers have follow-up GitHub issues.
- [x] GitHub issue #115 receives completion comment.
- [x] GitHub issue #115 has `piv-status:review`.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Production credentials are unavailable | Mark blocked, create follow-up, do not guess. |
| Real member PII leaks into GitHub | Report counts and redacted details only; keep detailed exports local/private. |
| Query accidentally mutates data | Use select-only SQL; do not run delete/update/insert. |
| Test users exist but are intentionally internal | Categorize as isolated if deactivated or excluded from activation/company-facing surfaces. |
| Chapter names differ between sheet and production | Create explicit mapping table and flag ambiguous labels before import. |
| `Other` chapter appears in production | Treat as expected only for public participant/onboarding fallback; do not map real members to `other` unless intentionally approved. |
| #114 OAuth blocker prevents admin UI access | Use DB read-only queries; admin screenshots are optional evidence, not required. |

## Done Criteria

- [x] Production data cleanliness is assessed or explicitly blocked.
- [x] Canonical chapters are exported/reviewed or explicitly blocked.
- [x] Activation Master Sheet mapping is completed or blocked with exact missing input.
- [x] P0/P1 data risks are linked to follow-up issues or recorded as none.
- [x] Local plan is updated.
- [x] GitHub issue #115 is updated and labeled for review.
