# Issue #115 Report: Production Data Cleanliness And Canonical Chapters

## Summary

Production data cleanliness and canonical chapter audit was run read-only on 2026-05-10.

| Field | Value |
| --- | --- |
| GitHub issue | #115 |
| Environment | Production Supabase |
| Tester | Abigail / Codex-assisted validation |
| Date | 2026-05-10 |
| Access method | Local read-only audit script using `.env.production` service role key; no secrets printed |
| Evidence folder | `tmp/production-data-115/` |
| Canonical evidence JSON | `tmp/production-data-115/production-data-audit.json` |
| Chapter export | `tmp/production-data-115/production-chapters.csv` |
| Result | Completed with blockers |
| Go/no-go impact | No-go for pilot import until schema drift, test-user hygiene, and sheet mapping are resolved |

## Key Findings

| Area | Result | Evidence | Severity | Follow-up |
| --- | --- | --- | --- | --- |
| Production DB query access | Passed | Read-only audit completed | P1 | None |
| Known seed personas | Passed | 0 standard seed persona emails/UUIDs found | P0 | None |
| QA/test user contamination | Failed | 1 active `@test.com` user found, redacted locally; no profile/membership found | P1 | #123 |
| Activation-facing test records | Passed with P1 hygiene note | The `@test.com` user has no `person_profile` and no `chapter_membership` in audit output | P1 | #123 |
| Test company contamination | Passed | 0 companies matching `test`/`qa` patterns | P1 | None |
| Production schema alignment | Failed | `person_profile.is_recruiter_visible` missing in production | P0 | #121 |
| Canonical chapter export | Passed | 15 production chapters exported | P0 | None |
| Duplicate chapter records | Passed | 0 normalized duplicate groups | P0 | None |
| Activation Master Sheet mapping | Blocked | Sheet labels/export unavailable in this session | P1 | #122 |

## Production Counts

| Metric | Count |
| --- | ---: |
| Users | 51 |
| Test-pattern users | 1 |
| Companies | 1 |
| Test-pattern companies | 0 |
| Chapters | 15 |
| Duplicate chapter groups | 0 |
| Chapter memberships | 47 |
| Events | 24 |
| Schema warnings | 1 |

## Chapter Export Summary

The production chapter table contains 15 records:

| ID | Name | University | City | Region |
| --- | --- | --- | --- | --- |
| `leadpucp` | LEAD PUCP | Pontificia Universidad Católica del Perú | Lima | Lima |
| `leadtecsup` | LEAD TECSUP | Instituto Tecnológico Superior Tecsup | Lima | Lima |
| `leaducsur` | LEAD UCSUR | Universidad Científica del Sur | Lima | Lima |
| `leaduni` | LEAD UNI | Universidad Nacional de Ingeniería | Lima | Lima |
| `leadunmsm` | LEAD UNMSM | Universidad Nacional Mayor de San Marcos | Lima | Lima |
| `leadunsa` | LEAD UNSA | Universidad Nacional de San Agustin de Arequipa | Arequipa | Arequipa |
| `leadpacifico` | LEAD UP | Universidad del Pacífico | Lima | Lima |
| `leadupc` | LEAD UPC | Universidad Peruana de Ciencias Aplicadas | Lima | Lima |
| `leadupn` | LEAD UPN | Universidad Privada del Norte | Lima | Lima |
| `leadupntrujillo` | LEAD UPN TRUJILLO | Universidad Privada del Norte | Trujillo | La Libertad |
| `leadusil` | LEAD USIL | Universidad San Ignacio de Loyola | Lima | Lima |
| `leadutec` | LEAD UTEC | Universidad de Ingeniería y Tecnología | Lima | Lima |
| `leadutp` | LEAD UTP | Universidad Tecnológica del Perú | Lima | Lima |
| `leadvillareal` | LEAD VILLAREAL | Universidad Nacional Federico Villareal | Lima | Lima |
| `other` | Other | Other |  |  |

No normalized duplicate chapter groups were found. The `other` record should remain a fallback only and should not be used for real member import unless explicitly approved.

## Chapter Usage Summary

| ID | Approved | Pending | Alumni | Events |
| --- | ---: | ---: | ---: | ---: |
| `leadpucp` | 0 | 4 | 0 | 5 |
| `leadtecsup` | 0 | 0 | 0 | 0 |
| `leaducsur` | 0 | 0 | 0 | 0 |
| `leaduni` | 0 | 1 | 0 | 2 |
| `leadunmsm` | 1 | 6 | 0 | 2 |
| `leadunsa` | 0 | 0 | 0 | 0 |
| `leadpacifico` | 0 | 0 | 0 | 0 |
| `leadupc` | 0 | 12 | 0 | 5 |
| `leadupn` | 0 | 1 | 0 | 3 |
| `leadupntrujillo` | 0 | 1 | 0 | 3 |
| `leadusil` | 1 | 1 | 0 | 1 |
| `leadutec` | 0 | 1 | 0 | 0 |
| `leadutp` | 0 | 10 | 0 | 1 |
| `leadvillareal` | 0 | 0 | 0 | 2 |
| `other` | 0 | 8 | 0 | 0 |

Before pilot import, the two existing approved memberships should be reviewed by an admin or chapter owner so the import baseline is understood.

## Blockers

### #121: Production schema missing `person_profile.is_recruiter_visible`

This is the highest-risk finding from #115. Company visibility defaults and opt-in behavior cannot be validated safely until production schema matches the current code/data model.

### #122: Activation Master Sheet chapter labels unavailable

Production chapters were exported and no duplicates were found, but #115 could not complete the required chapter-to-sheet mapping without the sheet chapter labels.

### #123: Active production `@test.com` user

One active `@test.com` user exists in production. The audit did not find a `person_profile` or `chapter_membership` for it, so it does not appear activation-facing, but it should be removed, deactivated, or explicitly documented before pilot invitations.

## Follow-Up Issues

| Issue | Severity | Purpose |
| --- | --- | --- |
| #121 | P0 | Reconcile production schema missing `person_profile.is_recruiter_visible` |
| #122 | P1 | Provide Activation Master Sheet chapter labels for mapping |
| #123 | P1 | Review or isolate active production `@test.com` user |

## Recommendation

Do not run pilot import yet.

Production chapter records look structurally clean enough to use as a base, but the pilot import should wait until:

1. #121 production schema drift is fixed.
2. #122 sheet-to-production chapter mapping is completed.
3. #123 test-user hygiene is resolved or explicitly accepted.
4. Existing approved memberships are reviewed so import does not overwrite or confuse production baseline state.

## Files Updated

- `docs/proposals/lead-spark-production-readiness-validation.md`
- `.github/reports/issue-115-production-data-cleanliness-canonical-chapters-report.md`
- `.github/plans/issue-115-production-data-cleanliness-canonical-chapters.plan.md`

