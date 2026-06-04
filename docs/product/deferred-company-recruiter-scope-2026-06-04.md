# Deferred Company And Recruiter Scope

Date: 2026-06-04

Related issue: #301

## Decision

Company/recruiter functionality is deferred from the current Spanish-first launch. The active launch route boundary remains: public participant, member, chapter leadership, admin, and staff. Company/recruiter routes may remain technically guarded or validated for safe route behavior, but they are not considered launched product experiences.

## Terminology

Future user-facing language should use:

- `Representante de empresa` for the person using the workflow.
- `Portal de empresas` for the authenticated workspace.
- `Acceso invitado` for scoped access.

Use `recruiter` only as internal technical terminology when needed by existing tables, service names, or migration history.

## Required Product Decisions Before Implementation

Before creating implementation issues, leadership should approve:

- Invite model: who can invite a company representative, whether invites expire, and how access is revoked.
- Profile visibility: which student/member profiles can appear, what consent is required, and whether visibility is opt-in only.
- Discovery scope: approved filters, search fields, ranking, and whether chapter, skills, interests, event participation, or resume fields can be used.
- Saved talent: whether representatives can save profiles, add notes, or share shortlists internally.
- Notes privacy: whether notes are private to one representative, shared across the company account, or disallowed.
- Resume/download access: whether resume viewing/download is allowed, under what consent, and whether each access is logged.
- Access history: what user-facing and admin-facing audit trail is required for profile reads, resume views, downloads, notes, and revocations.

## Alumni Visibility

Alumni visibility in company discovery is explicitly deferred. Default future behavior should be no Alumni-specific company discovery until both the Alumni product scope and company/recruiter scope are approved together.

## Current Launch Rule

For this launch, do not create company/recruiter UI polish issues, profile-discovery issues, or resume-access issues as active launch blockers. Keep only route-boundary and security validation in launch QA.

## Follow-Up Rule

Create follow-up implementation issues only after the product scope above is approved. Each follow-up issue should be a vertical slice with service-layer authorization, consent behavior, UI states, tests, and audit logging where relevant.
