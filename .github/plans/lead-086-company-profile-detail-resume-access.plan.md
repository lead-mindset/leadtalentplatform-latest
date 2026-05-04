# LEAD-086: Company Profile Detail and Resume Access Redesign

## Summary

Redesign company representative profile detail so profile trust, chapter context, skills, links, resume availability, and save state are clear without turning the portal into a CRM. Preserve existing direct-access protection by continuing to load profiles through `CompanyService.getStudentById`, and preserve resume authorization/signed URL behavior through `CompanyService.createResumeDownloadUrl`.

## Issue

- GitHub: #86
- Parent: #29 LEAD-028
- Type: Enhancement
- Complexity: Medium

## Acceptance Criteria

- [x] Profile summary, chapter membership context, skills, links, and resume availability are clear.
- [x] Resume download/open behavior preserves existing signed URL authorization and logging.
- [x] Save/unsave state is visible and consistent with browse/saved lists.
- [x] Invisible or unauthorized profiles continue to resolve through existing access-denied/not-found behavior.
- [x] User-facing copy does not leak internal recruiter terminology.

## Patterns Observed

- `app/[locale]/company/(protected)/students/[id]/page.tsx` already gates access with `requireRecruiter`, `getStudentById`, and `notFound()`.
- `CompanyService.getStudentById` already enforces `person_profile.is_recruiter_visible = true` plus approved chapter membership.
- `CompanyService.createResumeDownloadUrl` already verifies profile visibility before generating a five-minute signed URL and writing `resume_download_log`.
- `SaveStudentButton` already owns detail save state and optimistic feedback.

## Tasks

1. [x] Add a company-facing resume metadata read that only reports availability after profile visibility passes.
2. [x] Add a company-facing resume access button that calls the existing signed URL path.
3. [x] Redesign profile detail layout with a summary header, trust/access context, chapter context, skills, links, and contact information.
4. [x] Replace visible "student/recruiter" copy with profile/company representative language.
5. [x] Validate with lint and build; update GitHub issue with evidence.

## Validation

- `pnpm lint` - passed with existing warnings.
- `pnpm build` - passed.

## Risks

- Internal tables/actions still use legacy recruiter/student names. Mitigation: leave internal contracts stable; fix only user-facing copy unless changing internals is required.
- Resume metadata can accidentally disclose invisible profiles. Mitigation: metadata method calls `getStudentById` first and returns unavailable when access is denied.
