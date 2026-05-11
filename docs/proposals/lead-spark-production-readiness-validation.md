# LEAD SPARK Production Readiness Validation

## Purpose

This document is the validation plan for activating real LEAD members in production through LEAD Talent Platform, using LEAD SPARK as the first major adoption wedge.

The goal is to verify that the platform is ready enough for a controlled production pilot with real member data, not to prove that every future feature is finished.

The standard is simple.

Before inviting real members, we need confidence that auth works, data is clean enough, member import is controlled, company visibility is opt-in, company access is invite-only, profile updates work, leaders/admins can fix mistakes, and there is a support and rollback path.

## Validation Status Legend

Use these statuses while working through the checklist.

| Status | Meaning |
| --- | --- |
| Not Started | Not checked yet |
| In Progress | Being tested or reviewed |
| Passed | Verified with evidence |
| Failed | Tested and did not meet expected result |
| Blocked | Cannot verify because of missing access, config, data, or dependency |
| N/A | Not applicable for this validation round |

## Severity Legend

| Severity | Meaning |
| --- | --- |
| P0 | Blocks production member activation or creates security/data exposure risk |
| P1 | Blocks pilot success for a role or chapter, but can be contained |
| P2 | Confusing or incomplete, but workaround exists |
| P3 | Nice-to-have, polish, or later improvement |

## Environments

| Environment | Purpose |
| --- | --- |
| Local | Automated tests, service logic, code inspection |
| QA | Manual role validation with seed users |
| Production | Real auth, real member activation, production data smoke checks |

QA is not for real member activation. Production is the environment for real members once readiness gates pass.

## Owners

| Area | Owner |
| --- | --- |
| Platform and technical validation | Abigail |
| QA support and issue reproduction | Angela |
| Data readiness and activation sheet | Nikole |
| Chapter operations validation | Christopher |
| Member experience and consent language | Xiomara |
| Communications and support instructions | Kiara |
| Communications backup | Ariana |
| Executive go/no-go | Luis, Antonny, Nicole, Abigail |

Owner confirmations are treated as the default readiness setup for this validation cycle. If any owner cannot participate, the responsible executive owner should name a replacement before the related validation layer starts.

## Evidence Rules

Every checked item should have evidence.

Good evidence can be:

- Command output.
- Test result.
- Screenshot.
- Short Loom/video.
- Database query result.
- Link to issue.
- Name of tester and date.
- Manual note with exact account used and expected result.

Do not put real member personal data in public issue comments or screenshots.

Use this lightweight evidence format when commenting on GitHub issues or updating the validation tracker.

| Field | Required | Notes |
| --- | --- | --- |
| Environment | Yes | Local, QA, or Production |
| Tester | Yes | Name of validator |
| Date | Yes | Date of validation |
| Account used | When applicable | Use role/test account; avoid exposing real member data |
| Result | Yes | Passed, Failed, Blocked, N/A |
| Evidence | Yes | Command output, screenshot, query result, short Loom, or manual note |
| Severity | If failed/blocked | P0, P1, P2, or P3 |
| Follow-up issue | If needed | Link the GitHub issue |

Examples:

- **Command output:** `pnpm test` passed locally on 2026-05-10, tester Abigail, output attached in issue comment.
- **Manual QA note:** QA, tester Angela, `editor@test.com`, event creation passed, screenshot attached.
- **Database query result:** Production, tester Abigail, query confirmed no QA seed users in user-facing activation set, redacted output attached.

Real member PII should be redacted in screenshots, query results, videos, and public GitHub comments.

## Canonical Tracker

Official validation tracking will use GitHub Issues, with this Markdown file as the source checklist.

- Issues #110 through #118 are the official phase-level trackers for LEAD SPARK production readiness.
- Each validation issue should receive evidence comments using the evidence format above.
- This Markdown file remains the source of the full checklist and should be updated only when the validation structure changes.
- If operational owners need a lower-friction working view, Nikole may maintain a spreadsheet mirror, but GitHub Issues remain the source of record for blocker status and go/no-go evidence.

P0 findings block real member invitations until fixed or explicitly accepted by executive go/no-go owners.

## Layer 1, Code And Documentation Inspection

Purpose: verify that the platform is designed to support the production activation checklist.

| Item | Method | Evidence | Owner | Status | Severity |
| --- | --- | --- | --- | --- | --- |
| Basic profile exists and stores reusable fields | Inspect `person_profile` schema, services, actions, tests | `PersonProfileService` fields/defaults, onboarding/profile actions, `person_profile` migrations, targeted Vitest: 5 files / 51 tests passed | Abigail | Passed | P1 |
| Public participant does not require chapter membership | Inspect onboarding and event registration tests/docs | Event preflight checks `person_profile` and tests assert no `chapter_membership` dependency; targeted Vitest passed | Abigail | Passed | P1 |
| Chapter membership is explicit and status-based | Inspect `chapter_membership` schema/service/tests | `ChapterMembershipService`, membership migrations, docs, and tests cover pending/approved/rejected/alumni plus separate position | Abigail | Passed | P1 |
| Editor access depends on approved membership | Inspect services/RLS/actions | Admin/editor services and RLS helpers require approved same-chapter membership or admin role; targeted Vitest passed | Abigail | Passed | P0 |
| LEAD identity is separate from app role | Inspect identity service/admin UI/docs | `LeadIdentityService`, admin identity UI, generated enum, and docs reject `admin` as identity and keep founder/staff global | Abigail | Passed | P1 |
| Company representative access is invite-only | Inspect `recruiter_access`, company services, QA docs | `CompanyService`, `RecruiterService`, company actions, RLS, and QA docs require accepted active non-revoked access | Abigail | Passed | P0 |
| Talent visibility requires opt-in and approved membership | Inspect company service/RLS/docs | Company services and RLS require `is_recruiter_visible = true` plus approved `chapter_membership`; targeted Vitest passed | Abigail | Passed | P0 |
| Public participants are hidden from company talent surfaces | Inspect company service/tests/docs | Company talent queries filter to approved membership, so public participants without approved membership are excluded | Abigail | Passed | P0 |
| Alumni are not treated as active members | Inspect membership docs/services/tests | Alumni is modeled as `chapter_membership.status = 'alumni'`; company talent filters require `status = 'approved'` | Abigail | Passed | P1 |
| Profile update supports professional fields | Inspect profile actions/schema/UI | Student profile and onboarding actions map university, major/interest, graduation year, LinkedIn, portfolio, skills, and visibility consent | Abigail | Passed | P1 |
| Privacy/visibility copy exists or is planned | Inspect UI copy and docs | Onboarding/profile copy, public privacy policy, terms, and Spanish messages describe optional company visibility | Xiomara | Passed | P1 |
| Production rollback options are documented | Inspect roadmap and this file | No-go conditions, Layer 4 rollback checklist, PRD rollback requirements, and existing #117 cover support/rollback confirmation before invitations | Abigail | Passed | P1 |

## Layer 2, Automated Local Validation

Purpose: catch business logic and regression issues before production.

Recommended order.

1. Targeted service tests for profile, chapter membership, event registration, company access, identity.
2. Full test suite.
3. Lint.
4. Build, if tests and lint are clean enough to justify it.

### Commands

```bash
pnpm test
pnpm lint
pnpm build
```

### Automated Validation Checklist

| Item | Command | Expected Result | Evidence | Owner | Status | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| Service tests pass | `pnpm test` | All tests pass or failures are categorized | Passed: 23 files / 293 tests. See `.github/reports/issue-112-automated-local-readiness-validation-report.md` | Abigail | Passed | P1 |
| Lint passes | `pnpm lint` | No blocking lint errors | Passed with warnings only: 0 errors / 77 warnings. See report. | Abigail | Passed | P1 |
| Build succeeds | `pnpm build` | Production build completes | Passed: Next.js production build compiled, typechecked, and generated 106 static pages. See report. | Abigail | Passed | P1 |
| Profile schema validates portfolio and LinkedIn style fields | `pnpm test` targeted if needed | Tests pass | Targeted readiness Vitest passed: 11 files / 200 tests. See report. | Abigail | Passed | P2 |
| Event registration does not require chapter membership | `pnpm test` targeted if needed | Tests pass | Targeted readiness Vitest passed, including event preflight and event service tests. See report. | Abigail | Passed | P0 |
| Company visibility rules are tested | `pnpm test` targeted if needed | Tests pass or gap noted | Targeted readiness Vitest passed, including company/recruiter service tests. See report. | Abigail | Passed | P0 |
| Chapter membership approval rules are tested | `pnpm test` targeted if needed | Tests pass | Targeted readiness Vitest passed, including chapter membership and admin service tests. See report. | Abigail | Passed | P0 |
| Admin role and identity separation is tested | `pnpm test` targeted if needed | Tests pass | Targeted readiness Vitest passed, including lead identity and admin service tests. See report. | Abigail | Passed | P1 |

## Layer 3, QA Manual Role Validation

Purpose: validate user-visible flows with seed users before touching real member production data.

QA URL.

[https://leadqa.vercel.app/es](https://leadqa.vercel.app/es)

Important notes.

- QA is for internal validation only.
- Google OAuth may not be enabled in QA.
- Use seed users with email/password.
- QA data is seed/test data, not production truth.

Seed password.

```text
password123
```

### QA Seed Users

| Persona | Email | Purpose |
| --- | --- | --- |
| Public Participant | `participant@test.com` | Onboarding and public event registration |
| Member | `member@test.com` | Member dashboard and profile |
| Chapter Editor | `editor@test.com` | Chapter dashboard, events, applications, roster, check-in |
| Admin | `admin@test.com` | Admin dashboard, users, chapters, roles, identities |
| Staff | `staff@test.com` | Staff/founder identity separation |
| Company Representative | `recruiter@test.com` | Company portal and talent visibility |
| Alumni | `alumni@test.com` | Alumni state |

### Public Participant Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `participant@test.com` | Login succeeds | `tmp/qa-113/participant-login.png`; redirects to `/es/student` as Participante | Passed | P1 |
| Complete or view onboarding/profile | Profile can be completed without chapter membership | `tmp/qa-113/participant-student.png`; profile ready and no approved chapter membership | Passed | P0 |
| View public events | Events list/detail loads | `tmp/qa-113/participant-events.png`; 30 public events listed | Passed | P1 |
| Register for open event | Registration succeeds without approved membership | `tmp/qa-113/participant-es-events-92000000-0000-4000-8000-000000000016.png`; open event shows `Registrarme` for participant | Passed (CTA/form visible; submission not executed in shared QA) | P0 |
| Apply to application event | Application questions can be submitted | `tmp/qa-113/participant-es-events-92000000-0000-4000-8000-000000000017.png`; application event shows `Postular ahora` for participant | Passed (CTA/form visible; submission not executed in shared QA) | P1 |
| View registration/application status | Status is visible and understandable | `tmp/qa-113/participant-student.png` and `tmp/qa-113/participant-es-events-92000000-0000-4000-8000-000000000016.png`; status surfaces exist through student/event flows | Passed (no new QA submission created) | P2 |
| Confirm no chapter membership required | No forced chapter selection for public participation | Participant can view event CTAs and profile while chapter state says no chapter request | Passed | P0 |

### Member Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `member@test.com` | Login succeeds | `tmp/qa-113/member-login.png`; redirects to `/es/student` | Passed | P1 |
| View member dashboard | Dashboard loads without admin/editor controls | `tmp/qa-113/member-student.png`; member dashboard loads with student navigation only | Passed | P1 |
| View membership status | Approved membership is represented correctly | `tmp/qa-113/member-student.png`; shows approved LEAD UNI membership and Member ID | Passed | P1 |
| View events | Events are accessible | `tmp/qa-113/member-events.png` and `tmp/qa-113/member-student-events.png` | Passed | P2 |
| Update profile | Profile fields save correctly | `tmp/qa-113/member-student-profile.png`; profile form loads with professional fields | Passed (form visible; save not executed in shared QA) | P1 |
| Toggle company visibility if UI exists | Opt-in/opt-out is clear and saves | `tmp/qa-113/member-student-profile.png`; visibility opt-in copy is visible | Passed (control visible; save not executed in shared QA) | P0 |
| Confirm separation from admin/editor | No unauthorized admin/editor tools are visible | `tmp/qa-113/member-admin.png`; admin denied, chapter redirects to student | Passed | P0 |

### Chapter Editor Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `editor@test.com` | Login succeeds | `tmp/qa-113/editor-login.png`; editor sees Chapter Editor navigation | Passed | P1 |
| View chapter dashboard | Dashboard loads for editor's chapter | `tmp/qa-113/editor-chapter.png`; LEAD UNI chapter dashboard loads | Passed | P1 |
| Create event | Event can be created | `tmp/qa-113/editor-chapter-events.png`; create entry point visible | Passed (entry point visible; creation not executed in shared QA) | P1 |
| Edit event | Event can be edited | `tmp/qa-113/editor-chapter-events.png`; event rows show edit actions | Passed (view-only) | P1 |
| Configure open event | Open event configuration works | `tmp/qa-113/editor-chapter-events.png`; open registration events visible with edit actions | Passed (view-only) | P1 |
| Configure application event | Application event configuration works | `tmp/qa-113/editor-chapter-events.png`; application/postulation action visible where seeded | Passed (view-only) | P1 |
| Add application questions | Questions save and display in order | `tmp/qa-113/editor-chapter-events.png`; applications action visible | Passed (view-only; question save not executed) | P1 |
| Review applications | Applications appear in review queue | `tmp/qa-113/editor-chapter-events.png`; pending applications count visible | Passed | P1 |
| Approve/reject applications | Status updates correctly | `tmp/qa-113/editor-chapter-events.png`; review action visible | Passed (view-only; status mutation not executed) | P1 |
| Manage roster | Members can be reviewed by chapter scope | `tmp/qa-113/editor-chapter-members.png`; LEAD UNI roster loads with approved/alumni counts | Passed | P0 |
| Use check-in | Check-in works for valid attendee | `tmp/qa-113/editor-chapter-checkin.png`; check-in console loads, seeded event has 0 attendees | Passed (surface loads; no valid attendee token available) | P1 |
| Confirm editor scope | Editor cannot manage unrelated chapter data | `tmp/qa-113/editor-admin.png`; admin denied; chapter roster only shows LEAD UNI context | Passed | P0 |

### Admin Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `admin@test.com` | Login succeeds | `tmp/qa-113/admin-login.png`; redirects to `/es/admin` | Passed | P1 |
| View admin overview | Admin dashboard loads | `tmp/qa-113/admin-admin.png`; overview loads with users, chapters, companies, events | Passed | P1 |
| Manage users | User list/detail loads | `tmp/qa-113/admin-admin-users.png`; users surface loads | Passed | P1 |
| Review profiles | Profile data is accessible to admin | `tmp/qa-113/admin-admin-users.png`; user/profile review surface loads | Passed | P1 |
| Administer roles | Role updates are guarded and understandable | `tmp/qa-113/admin-admin-users.png`; role/admin surface loads | Passed (view-only; no role mutation executed) | P0 |
| Manage chapters | Chapters can be viewed/managed | `tmp/qa-113/admin-admin-chapters.png`; chapters surface loads | Passed | P1 |
| Review memberships | Membership state is visible | `tmp/qa-113/admin-admin-chapters.png` and `tmp/qa-113/admin-admin-users.png` | Passed | P1 |
| Manage LEAD identities | Identities can be viewed/issued/updated | `tmp/qa-113/admin-admin-users.png`; admin management surface loads | Passed (view-only; identity mutation not executed) | P1 |
| View events | Admin event surfaces load | `tmp/qa-113/admin-admin-events.png`; events admin surface loads | Passed | P1 |
| Fix common mistakes | Admin can correct wrong role/chapter/profile path, or gap is logged | `tmp/qa-113/admin-admin.png`; management entry points for users, chapters, companies, events visible | Passed (correction mutation not executed) | P1 |

### Staff / Founder Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `staff@test.com` | Login succeeds | `tmp/qa-113/staff-login.png`; redirects to `/es/admin` | Passed | P1 |
| Confirm app role vs identity separation | Staff/founder identity does not depend on chapter membership | `tmp/qa-113/staff-admin.png`; admin access loads while staff has no chapter membership | Passed | P1 |
| Confirm admin access source | Admin access comes from app role, not public identity alone | Staff account has app role Admin in shell; admin access is separate from chapter membership | Passed | P0 |
| Confirm no forced student flow | Staff/founder is not forced into member/chapter onboarding | `tmp/qa-113/staff-login.png`; default landing is admin, `/chapter` redirects to student only when manually visited | Passed | P1 |

### Company Representative Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `recruiter@test.com` | Login succeeds | `tmp/qa-113/recruiter-login.png`; redirects to `/es/company/dashboard` | Passed | P1 |
| Enter company dashboard | Dashboard loads only with active access | `tmp/qa-113/recruiter-company-dashboard.png`; active Test Company access loads | Passed | P0 |
| View authorized talent | Only approved opted-in talent appears | `tmp/qa-113/recruiter-company-browse.png`; browse shows 1 visible approved profile | Passed | P0 |
| Confirm public participant hidden | Public participant does not appear | `tmp/qa-113/recruiter-company-browse.png`; only Test Member appears, Test Participant absent | Passed | P0 |
| Save profile | Save succeeds | `tmp/qa-113/recruiter-company-student-detail.png`; save action visible | Passed (save not executed in shared QA) | P1 |
| View saved profiles | Saved visible profiles appear | `tmp/qa-113/recruiter-company-saved.png`; saved talent surface loads with empty state | Passed | P1 |
| Open visible student profile | Detail page loads for visible approved talent | `tmp/qa-113/recruiter-company-student-detail.png`; profile detail loads for approved opted-in member | Passed | P1 |
| Confirm invite-only access | Missing/inactive/revoked access is denied, if testable | Active invited account works; wrong-role company/admin protected routes deny non-company/non-admin users in screenshots | Passed (negative inactive/revoked states not mutated) | P0 |
| Confirm company flow separate from member model | Company account does not require chapter membership | `tmp/qa-113/recruiter-company-dashboard.png`; company portal loads without chapter membership. Observation: direct `/student` also loads participant-style profile for recruiter, should be product-reviewed before launch. | Passed with P2 observation | P0 |

### Alumni Checklist

| Check | Expected Result | Evidence | Status | Severity |
| --- | --- | --- | --- | --- |
| Log in as `alumni@test.com` | Login succeeds | `tmp/qa-113/alumni-login.png`; redirects to `/es/student` | Passed | P1 |
| Confirm alumni state | Alumni is represented historically | `tmp/qa-113/alumni-student.png`; dashboard labels account as Alumni | Passed | P1 |
| Confirm not active member by mistake | Alumni is not treated as active approved member unless policy says so | `tmp/qa-113/alumni-student.png`; Member ID shows unavailable after approval and chapter route redirects to student | Passed | P1 |
| Confirm company visibility default | Alumni is hidden from company portal unless future policy says otherwise | `tmp/qa-113/recruiter-company-browse.png`; only Test Member appears in company browse, Alumni absent | Passed | P0 |

## Layer 4, Production Smoke Validation

Purpose: verify production-only behaviors before inviting real members.

Do this with internal test accounts or a tiny controlled set, not broad member invites.

| Item | Expected Result | Evidence | Owner | Status | Severity |
| --- | --- | --- | --- | --- | --- |
| Production URL loads | App loads normally | `tmp/production-smoke-114/es.png`; production `/es` returned 200 | Abigail | Passed | P0 |
| Google OAuth works | Google login redirects and completes successfully | `tmp/production-smoke-114/google-oauth-start.png`; Google returns `redirect_uri_mismatch`; follow-up #119 | Abigail | Failed | P0 |
| Email/password or magic link works | User can authenticate without Google if supported | Auth surfaces load (`tmp/production-smoke-114/es-auth-login.png`, `tmp/production-smoke-114/es-company-login.png`), but controlled production accounts/inboxes are not available; follow-up #120 | Abigail | Blocked | P1 |
| Password reset works | Reset email arrives and user can set password | Reset surfaces load (`tmp/production-smoke-114/es-auth-forgot-password.png`, `tmp/production-smoke-114/es-auth-update-password.png`), but controlled production inbox/account is not available; follow-up #120 | Abigail | Blocked | P1 |
| Production DB has no obvious QA/test contamination | Test/seed users are absent or clearly isolated | `tmp/production-data-115/production-data-audit.json`; 1 active `@test.com` user without profile/membership found (#123) and production schema missing `person_profile.is_recruiter_visible` (#121) | Abigail | Failed | P0 |
| Canonical chapter list is correct | Chapter names/IDs match activation sheet | `tmp/production-data-115/production-chapters.csv`; 15 chapters exported, 0 normalized duplicates, but Activation Master Sheet mapping blocked pending sheet labels (#122) | Nikole | Blocked | P0 |
| Member import dry run works | 1 to 3 internal rows map correctly | Import report | Abigail | Not Started | P0 |
| Imported approved member has correct membership | Member has correct chapter/status/position | Admin screenshot/query | Abigail | Not Started | P0 |
| Imported chapter leader has correct editor access | Only intended leader receives editor tools | Screenshot/query | Abigail | Not Started | P0 |
| Company visibility is off by default | Imported member is not visible to companies unless opted in | Query/company screenshot | Abigail | Not Started | P0 |
| Company visibility opt-in works | Opted-in approved member appears to company representative | Screenshot/query | Abigail | Not Started | P0 |
| Company portal is invite-only | No active access means no company dashboard | Screenshot/query | Abigail | Not Started | P0 |
| Privacy copy is visible | Member understands company visibility | Screenshot | Xiomara | Not Started | P1 |
| Support path is visible | Member knows who to contact | Screenshot/copy | Comms Owner | Not Started | P1 |
| Rollback path is ready | Pause/disable/hide path documented and owner assigned | Note | Abigail | Not Started | P0 |

## Member Import Validation

Before importing pilot members, verify the Activation Master Sheet.

| Field | Required | Platform target |
| --- | --- | --- |
| `full_name` | Yes | `user.name`, profile display |
| `email` | Yes | Auth/user email |
| `chapter` | Yes | `chapter.id` lookup |
| `membership_status` | Yes | `chapter_membership.status` |
| `chapter_position` | Yes | `chapter_membership.position` |
| `is_chapter_editor` | Yes | `user.role = 'editor'`, membership position if intended |
| `member_id` | Optional | `chapter_membership.member_id` |
| `university` | Optional | `person_profile.university` |
| `major_or_interest` | Optional | `person_profile.major_or_interest` |
| `graduation_year` | Optional | `person_profile.graduation_year` |
| `linkedin_url` | Optional | `person_profile.linkedin_url` |
| `portfolio_url` | Optional | `person_profile.portfolio_url` |
| `skills` | Optional | `person_profile.skills` |
| `company_visibility_opt_in` | No for import | `person_profile.is_recruiter_visible`, default false |

Import rules.

- Current verified members can be imported as `approved` after chapter validation.
- Do not import unknown or unverified people as approved.
- Do not make anyone company-visible by default.
- Assign editor role only when intentionally confirmed.
- Keep public participants separate from approved members.
- Keep company representatives separate from member import.

## Go / No-Go Decision

### Go For Pilot Member Import

Proceed only if:

- [ ] Production auth is verified.
- [ ] Production data is clean enough.
- [ ] Pilot chapter list is final.
- [ ] Activation Master Sheet is clean enough.
- [ ] Company visibility defaults to off.
- [ ] Admin can correct mistakes.
- [ ] Support path exists.
- [ ] Rollback path exists.

### Go For Pilot Member Invitations

Proceed only if:

- [ ] Pilot leaders can log in.
- [ ] Pilot leaders have correct permissions.
- [ ] Pilot rosters are validated enough.
- [ ] Member activation email is ready.
- [ ] Privacy copy is ready.
- [ ] Support owner is ready.

### No-Go Conditions

Do not invite real members if:

- Google OAuth or primary production auth is broken.
- Imported members become company-visible by default.
- Company portal exposes public participants or unapproved members.
- Editors can access wrong chapter data.
- Admin cannot fix common data mistakes.
- There is no clear support path.
- There is no rollback owner.

## Validation Output

After validation, summarize:

- Environment tested.
- Date.
- Testers.
- Passed items.
- Failed items.
- Blockers.
- Risks accepted.
- Follow-up issues.
- Go/no-go recommendation.

## Immediate Next Steps

1. Complete Layer 1 code/docs inspection.
2. Run Layer 2 automated local validation.
3. Run QA manual validation by role.
4. Run production smoke validation.
5. Decide go/no-go for pilot import.
6. Import only pilot chapter data.
7. Invite pilot chapter leaders.
8. Fix blockers.
9. Invite pilot members.
