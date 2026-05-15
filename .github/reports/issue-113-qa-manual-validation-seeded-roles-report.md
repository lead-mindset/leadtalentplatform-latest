# Issue #113 Report: QA Manual Validation With Seeded Roles

## Summary

Layer 3 manual QA validation was completed against the hosted QA environment using the documented seed accounts.

| Field | Value |
| --- | --- |
| GitHub issue | #113 |
| Environment | QA |
| QA URL | `https://leadqa.vercel.app/es` |
| Tester | Abigail / Codex-assisted QA |
| Date | 2026-05-10 |
| Evidence folder | `tmp/qa-113/` |
| Canonical route evidence | `tmp/qa-113/route-results.json` |
| Result | Passed with view-only notes |
| P0/P1 follow-up issues created | None |

The first automated sweep used typing that was too fast for a few hosted-login attempts and produced false blocked states. A slower login-only recheck passed for all seven accounts, then the full route/screenshot sweep was rerun successfully.

## Seed Accounts Validated

| Persona | Account | Primary result |
| --- | --- | --- |
| Public Participant | `participant@test.com` | Passed |
| Member | `member@test.com` | Passed |
| Chapter Editor | `editor@test.com` | Passed |
| Admin | `admin@test.com` | Passed |
| Staff / Founder | `staff@test.com` | Passed |
| Company Representative | `recruiter@test.com` | Passed with P2 product observation |
| Alumni | `alumni@test.com` | Passed |

## Role Results

### Public Participant

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/participant-login.png` |
| Participant dashboard/profile | Passed | `tmp/qa-113/participant-student.png` |
| Public events | Passed | `tmp/qa-113/participant-events.png` |
| Open event registration surface | Passed, view-only | `tmp/qa-113/participant-es-events-92000000-0000-4000-8000-000000000016.png` |
| Application event surface | Passed, view-only | `tmp/qa-113/participant-es-events-92000000-0000-4000-8000-000000000017.png` |
| Chapter membership not required | Passed | Participant sees event actions while chapter membership remains absent/pending-only |

### Member

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/member-login.png` |
| Member dashboard | Passed | `tmp/qa-113/member-student.png` |
| Approved membership and Member ID | Passed | `tmp/qa-113/member-student.png` |
| Events and personal registrations | Passed | `tmp/qa-113/member-events.png`, `tmp/qa-113/member-student-events.png` |
| Profile and company visibility controls | Passed, view-only | `tmp/qa-113/member-student-profile.png` |
| Admin/editor separation | Passed | `tmp/qa-113/member-admin.png`, `tmp/qa-113/member-chapter.png` |

### Chapter Editor

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/editor-login.png` |
| Chapter dashboard | Passed | `tmp/qa-113/editor-chapter.png` |
| Events management surface | Passed, view-only | `tmp/qa-113/editor-chapter-events.png` |
| Application/review entry points | Passed, view-only | `tmp/qa-113/editor-chapter-events.png` |
| Roster management | Passed | `tmp/qa-113/editor-chapter-members.png` |
| Check-in console | Passed, no attendee token available | `tmp/qa-113/editor-chapter-checkin.png` |
| Admin boundary | Passed | `tmp/qa-113/editor-admin.png` |

### Admin

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/admin-login.png` |
| Admin overview | Passed | `tmp/qa-113/admin-admin.png` |
| Users/profiles/roles | Passed, view-only | `tmp/qa-113/admin-admin-users.png` |
| Chapters/memberships | Passed | `tmp/qa-113/admin-admin-chapters.png` |
| Events | Passed | `tmp/qa-113/admin-admin-events.png` |
| Companies | Passed | `tmp/qa-113/admin-admin-companies.png` |
| Common correction paths | Passed, view-only | Management entry points visible from admin overview |

### Staff / Founder

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/staff-login.png` |
| Admin access without chapter membership | Passed | `tmp/qa-113/staff-admin.png` |
| App role and identity separation | Passed | Staff lands in admin through app role, not chapter membership |
| No forced member/chapter onboarding | Passed | Default landing is admin; direct chapter route redirects away from chapter tooling |

### Company Representative

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/recruiter-login.png` |
| Company dashboard | Passed | `tmp/qa-113/recruiter-company-dashboard.png` |
| Authorized talent browse | Passed | `tmp/qa-113/recruiter-company-browse.png` |
| Public participant hidden | Passed | Browse shows Test Member only; Test Participant absent |
| Saved talent surface | Passed | `tmp/qa-113/recruiter-company-saved.png` |
| Visible profile detail | Passed | `tmp/qa-113/recruiter-company-student-detail.png` |
| Admin boundary | Passed | `tmp/qa-113/recruiter-admin.png` |
| Company/member model separation | Passed with P2 observation | Company portal does not require chapter membership, but direct `/student` also loads a participant-style profile for the recruiter |

### Alumni

| Area | Result | Evidence |
| --- | --- | --- |
| Login | Passed | `tmp/qa-113/alumni-login.png` |
| Alumni state | Passed | `tmp/qa-113/alumni-student.png` |
| Not active approved member by mistake | Passed | Alumni dashboard keeps historical state and no approved Member ID |
| Company visibility default | Passed | Alumni does not appear in recruiter browse; `tmp/qa-113/recruiter-company-browse.png` |

## Observations

| Severity | Observation | Recommendation |
| --- | --- | --- |
| P2 | `recruiter@test.com` can directly open `/student` and gets a participant-style profile experience. This does not expose admin or company data incorrectly, but it blurs product separation. | Decide before LEAD SPARK whether company representatives should be blocked from student routes or whether this is acceptable as a shared account/profile base. |
| P2 | `staff@test.com` can manually open `/student` and sees a participant-style profile/chapter application surface. The default landing remains admin. | Decide whether staff/founder accounts should have a staff-specific profile surface instead of the student participant surface. |
| P2 | Several action checks were validated as view-only to avoid mutating shared hosted QA state. | For the final launch rehearsal, run one controlled mutation pass with disposable seed data: event registration, application submit, profile save, save talent, and admin/editor updates. |

## Blockers And Follow-Ups

No confirmed P0/P1 blockers were found in this Layer 3 pass, so no new GitHub follow-up issues were created.

## Files Updated

- `docs/proposals/lead-spark-production-readiness-validation.md`
- `.github/reports/issue-113-qa-manual-validation-seeded-roles-report.md`
- `.github/plans/issue-113-qa-manual-validation-seeded-roles.plan.md`

