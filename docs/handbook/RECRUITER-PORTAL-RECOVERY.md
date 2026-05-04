# Company Representative Portal Recovery Plan

## Status

Planning artifact for LEAD-027. This document maps the current recruiter/company portal surface and defines recovery work. It does not implement runtime changes.

## Naming

Use "company representative" or "company portal" in user-facing product language. Keep internal code and schema names such as `recruiter_access`, `RecruiterService`, and `user.role='recruiter'` until a future technical rename is explicitly justified.

## Canonical V1 Decisions

- `/company/*` is the canonical protected portal for company representatives.
- `/recruiter/access?token=...` remains the invite acceptance entrypoint only.
- `/recruiter/browse`, `/recruiter/saved`, and `/recruiter/[studentId]` are deprecation or redirect candidates.
- `/company/onboard?inviteToken=...` should become compatibility/help state for legacy links, not a long-term independent invite mutation flow.
- Company login with missing, inactive, revoked, or expired access should land in a company access/help state, never student onboarding.
- Company representative authorization remains `public.user.role='recruiter'` plus active accepted `recruiter_access`.
- Company representative authorization must not require `person_profile`, `student_profile`, or `chapter_membership`.
- Talent visibility requires `person_profile.is_recruiter_visible = true` and approved `chapter_membership`.
- Public participants without approved chapter membership never appear in company portal talent surfaces.
- Alumni are hidden by default until a separate alumni visibility rule exists.
- `saved_student` remains the internal table name. User-facing copy should prefer "saved talent" or "saved profiles."
- Saved rows may persist for history, but browse, saved, profile, and resume download access must re-check current visibility every time.

## Current Flow Map

| Flow | Current Entry Point | Service/Action Owner | Current State | Recovery Decision |
|------|---------------------|----------------------|---------------|-------------------|
| Admin creates invite | `lib/actions/admin/invite-recruiter.ts` | `AdminService.createRecruiterInvite()` | Generates `/recruiter/access?token=...` and sends email | Keep as canonical new invite path |
| Signed-in invite acceptance | `/recruiter/access?token=...` | `lib/actions/recruiter/access.ts`, `RecruiterService.acceptInvite()` | Validates token, checks signed-in email, accepts access, redirects to `/company/dashboard` | Keep as only invite mutation path |
| Legacy invite onboarding | `/company/onboard?inviteToken=...` | `lib/actions/company/handle-invite.ts`, `CompanyService.acceptInvite()` | Validates token and can create auth/public user through service-role flow | Convert to compatibility/help state |
| Company login | `/company/login` | Supabase OTP client flow | Sends magic link to `/company/dashboard` | Keep, but no access must land in company help state |
| Company dashboard | `/company/dashboard` | `requireRecruiter()`, `CompanyService` via company actions | Protected by active accepted access | Keep canonical |
| Company browse | `/company/browse` | `requireRecruiter()`, `CompanyService` | Protected company talent surface | Keep canonical |
| Company saved | `/company/saved` | `requireRecruiter()`, `CompanyService.getSavedStudents()` | Protected saved profiles surface | Keep canonical; copy should say saved talent/profiles |
| Company profile/settings | `/company/profile`, `/company/settings` | `requireRecruiter()`, `CompanyService` | Protected company representative account/company management | Keep canonical |
| Company student profile | `/company/students/[id]` | `requireRecruiter()`, `CompanyService` | Protected profile detail surface | Keep canonical for V1 |
| Recruiter browse | `/recruiter/browse` | `requireRecruiter()`, `RecruiterService.getTalentPool()` | Overlaps with `/company/browse` | Deprecate or redirect to company route |
| Recruiter saved | `/recruiter/saved` | `requireRecruiter()`, `RecruiterService.getSavedStudents()` | Overlaps with `/company/saved` | Deprecate or redirect to company route |
| Recruiter student profile | `/recruiter/[studentId]` | `RecruiterService.getStudentProfileForRecruiter()` | Overlaps with `/company/students/[id]` and includes resume download UI | Deprecate or redirect to company route after authorization parity |
| Save/unsave | Company and recruiter actions | `CompanyService.toggleSaveStudent()` | `saved_student` persists saved profile records | Keep table; centralize access checks |
| Resume download | `/recruiter/[studentId]/download-resume-button.tsx` | `RecruiterService.createResumeDownloadUrl()` | Download path lives under recruiter profile route | Move toward canonical company profile route and shared service authorization |

## Duplicate Or Confusing Flows

| Area | Problem | Recovery Direction |
|------|---------|--------------------|
| Portal naming | Users see both company and recruiter route families | Use company representative language in UI and `/company/*` as protected portal |
| Invite acceptance | `/recruiter/access` and `/company/onboard` can both validate or mutate invite state | Keep `/recruiter/access` as mutation path; make `/company/onboard` compatibility/help |
| Talent browse | `/company/browse` and `/recruiter/browse` can drift in filters and UI | Keep `/company/browse`; redirect/deprecate recruiter browse |
| Saved profiles | `/company/saved` and `/recruiter/saved` can drift | Keep `/company/saved`; redirect/deprecate recruiter saved |
| Student profile | `/company/students/[id]` and `/recruiter/[studentId]` can diverge in visibility and resume behavior | Keep `/company/students/[id]`; centralize authorization before removing duplicate |
| Resume access | Resume download exists on recruiter profile surface | Route through company profile long-term and enforce the same service authorization |
| Missing access after login | Magic link auth can succeed even when portal access is missing/revoked | Land in company access/help state, not student onboarding |

## Access Rules For Future Implementation

Company representative portal access:

1. User is authenticated.
2. `public.user.role = 'recruiter'`.
3. There is an active accepted `recruiter_access` row for that user.
4. Access is not revoked, inactive, or expired.

Talent visibility:

1. Viewer passes company representative portal access.
2. Candidate has `person_profile.is_recruiter_visible = true`.
3. Candidate has approved `chapter_membership`.
4. Candidate is not alumni-only unless a future alumni visibility rule exists.

Saved profile and resume access:

1. `saved_student` may remain after visibility changes.
2. Saved lists should hide unavailable profiles or show a deliberate unavailable state.
3. Profile and resume download must re-check current company representative access and current talent visibility.
4. Resume download should log through `resume_download_log` only after authorization succeeds.

## Follow-Up Issues

LEAD-027 should create these independently shippable follow-ups:

1. `Task: Consolidate company representative portal routes`
   - GitHub: #69
   - Make `/company/*` canonical.
   - Redirect or remove `/recruiter/browse`, `/recruiter/saved`, and `/recruiter/[studentId]`.

2. `Task: Convert legacy company invite onboarding into compatibility help state`
   - GitHub: #70
   - Keep `/company/onboard?inviteToken=...` useful for old links.
   - Remove long-term independent invite mutation behavior.
   - Route users toward `/recruiter/access?token=...` or an equivalent signed-in canonical flow.

3. `Task: Centralize company talent access authorization`
   - GitHub: #71
   - Ensure browse, saved, profile, save/unsave, and resume download all re-check active `recruiter_access`, `is_recruiter_visible`, and approved `chapter_membership`.
   - Preserve `saved_student` rows while hiding unavailable profiles.

4. `Task: Add company representative manual QA checklist`
   - GitHub: #72
   - Cover invite accept, company login without access, dashboard, browse, save, profile, resume download, revoked/expired invite, and hidden/unapproved talent.
   - Checklist: `docs/handbook/COMPANY-PORTAL-QA.md`.

5. `Task: Rename user-facing recruiter language to company representative`
   - GitHub: #73
   - Update visible UI copy from "Recruiter" to "Company Representative" or "Company Portal" where appropriate.
   - Keep internal schema/code names unchanged.

## Non-Goals

- Runtime route changes in LEAD-027.
- Database migrations.
- Self-serve company representative signup.
- Talent search expansion.
- Alumni talent visibility.
- Internal schema/code rename away from `recruiter_access`.
- Full professional UI/UX redesign.

## Validation Notes

Manual validation for future recovery implementation should use `recruiter@test.com` and confirm:

- Accepted active access reaches `/company/dashboard`.
- No `person_profile` or `chapter_membership` is required for the company representative account.
- A public participant without approved chapter membership does not appear in company talent surfaces.
- Revoked, expired, inactive, or missing access reaches company access/help state.
- Saved profiles and resume downloads respect current visibility, not only historical saved state.
