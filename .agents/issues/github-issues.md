# GitHub Project Issues: LEAD Frontier

**Generated from:** `.agents/PRDs/PROJECT-SPECIFICATION-FINAL.md`  
**Methodology:** PIV Loop: Plan -> Implement -> Validate -> Review  
**Project:** LEAD Frontier - Agentic Engineering Board  
**Generated:** April 30, 2026

---

## Project Board Structure

### GitHub Project Fields

```json
{
  "project": "LEAD Frontier - Agentic Engineering Board",
  "fields": {
    "Phase": [
      "Strategic Planning",
      "Active PIV Loop",
      "System Evolution"
    ],
    "PIV Status": [
      "Plan Ready",
      "Implementing",
      "Validate",
      "Review"
    ],
    "Priority": [
      "High",
      "Medium",
      "Low"
    ],
    "Type": [
      "Feature",
      "Enhancement",
      "Technical",
      "Spike",
      "Bug",
      "Documentation"
    ],
    "Domain": [
      "Identity",
      "Database",
      "Auth",
      "Events",
      "Chapter",
      "Editor",
      "Admin",
      "Recruiter",
      "Newsletter",
      "Testing",
      "AI Layer",
      "Docs"
    ]
  },
  "views": [
    {
      "name": "Phase Roadmap",
      "groupBy": "Phase",
      "sortBy": ["Priority", "Issue ID"]
    },
    {
      "name": "Active PIV Loop",
      "filter": "Phase = Active PIV Loop",
      "groupBy": "PIV Status"
    },
    {
      "name": "Validation Queue",
      "filter": "PIV Status = Validate"
    },
    {
      "name": "System Evolution",
      "filter": "Phase = System Evolution"
    }
  ]
}
```

### Issue Index

| ID | Title | Type | Priority | Complexity | Phase | Labels | Dependencies |
|---|---|---|---|---|---|---|---|
| LEAD-001 | Approve Account, Identity, and Membership PRD | Documentation | High | Small | Strategic Planning | docs, product, piv-plan | None |
| LEAD-002 | Create Database Migration Plan for Foundation Schema | Technical | High | Medium | Strategic Planning | database, planning, rls | LEAD-001 |
| LEAD-003 | Define RLS and Access Matrix for New Account Model | Technical | High | Medium | Strategic Planning | security, database, auth | LEAD-001 |
| LEAD-004 | Create Multi-Role Test Strategy and Seed Personas | Spike | High | Medium | Strategic Planning | testing, auth, database | LEAD-001 |
| LEAD-005 | Add Person Profile Foundation | Feature | High | Medium | Active PIV Loop | database, backend, onboarding | LEAD-002, LEAD-003 |
| LEAD-006 | Add Chapter Membership Foundation | Feature | High | Medium | Active PIV Loop | database, backend, chapter | LEAD-002, LEAD-003 |
| LEAD-007 | Add LEAD Identity Foundation | Feature | High | Medium | Active PIV Loop | database, backend, admin | LEAD-002, LEAD-003 |
| LEAD-008 | Add Newsletter Subscription Foundation | Feature | Medium | Small | Active PIV Loop | database, newsletter | LEAD-002, LEAD-003 |
| LEAD-009 | Add Event Application Question and Answer Foundation | Feature | High | Medium | Active PIV Loop | database, events | LEAD-002, LEAD-003 |
| LEAD-010 | Migrate Existing Student Profile Data Into New Model | Technical | High | Medium | Active PIV Loop | database, migration, student | LEAD-005, LEAD-006, LEAD-007 |
| LEAD-011 | Regenerate Supabase Types and Update Type Entrypoints | Technical | High | Small | Active PIV Loop | database, typescript | LEAD-005, LEAD-006, LEAD-007, LEAD-008, LEAD-009, LEAD-010 |
| LEAD-012 | Decouple Auth Guards From Required Student Profile | Technical | High | Medium | Active PIV Loop | auth, backend, routing | LEAD-011 |
| LEAD-013 | Implement Basic Onboarding With Person Profile | Feature | High | Medium | Active PIV Loop | onboarding, frontend, backend | LEAD-012 |
| LEAD-014 | Update Event Registration to Use Person Profile | Feature | High | Medium | Active PIV Loop | events, frontend, backend | LEAD-013 |
| LEAD-015 | Implement Chapter Membership Application and Approval Services | Feature | High | Medium | Active PIV Loop | chapter, backend, services | LEAD-012 |
| LEAD-016 | Scope Editor Permissions by Approved Chapter Membership | Technical | High | Medium | Active PIV Loop | editor, auth, events | LEAD-015 |
| LEAD-017 | Implement LEAD Identity Issuance and Primary Display Rules | Feature | Medium | Medium | Active PIV Loop | admin, identity, backend | LEAD-007, LEAD-015 |
| LEAD-018 | Implement Application-Based Event Forms | Feature | High | Medium | Active PIV Loop | events, frontend, backend | LEAD-009, LEAD-014, LEAD-016 |
| LEAD-019 | Validate Multi-Chapter Event Collaboration | Technical | Medium | Medium | Active PIV Loop | events, editor, testing | LEAD-016 |
| LEAD-020 | Stabilize Event Check-In Flow on New Model | Feature | Medium | Medium | Active PIV Loop | events, editor, qr | LEAD-014, LEAD-016 |
| LEAD-021 | Stabilize Admin Role and Identity Management UX | Enhancement | Medium | Medium | Active PIV Loop | admin, frontend, backend | LEAD-017 |
| LEAD-022 | Preserve Invite-Only Recruiter Access After Account Refactor | Technical | Medium | Medium | Active PIV Loop | recruiter, auth, backend | LEAD-012 |
| LEAD-023 | Add PR Validation Template and PIV Evidence Checklist | Technical | High | Small | System Evolution | github, process, validation | LEAD-001 |
| LEAD-024 | Add Agent Rules for Canonical Account Model | Documentation | High | Small | System Evolution | ai-layer, docs | LEAD-001 |
| LEAD-025 | Add Architecture Tests for Service-Layer Boundaries | Technical | Medium | Medium | System Evolution | testing, architecture | LEAD-012 |
| LEAD-026 | Document Newsletter Campaign Architecture | Documentation | Medium | Small | Strategic Planning | newsletter, docs | LEAD-001 |
| LEAD-027 | Create Recruiter Portal Recovery Plan | Spike | Low | Small | Strategic Planning | recruiter, planning | LEAD-022 |
| LEAD-028 | Create Professional UI/UX Redesign Scope | Spike | Low | Small | Strategic Planning | frontend, design | LEAD-014, LEAD-015 |

---

## LEAD-001 Approve Account, Identity, and Membership PRD

**Type:** Documentation  
**Priority:** High  
**Complexity:** Small  
**Phase:** Strategic Planning  
**Labels:** docs, product, piv-plan  

### Description

As the engineering team, I want the finalized PRD approved as the source of truth, so that future planning and implementation do not reintroduce the old `student_profile`-required account model.

### Acceptance Criteria

- [ ] Given the final PRD, when stakeholders review it, then account model decisions are approved or explicitly revised.
- [ ] Given the PRD vocabulary, when issues are created, then they consistently use `user`, `person_profile`, `chapter_membership`, `lead_identity`, and `recruiter_access`.
- [ ] Given unresolved product questions, when review is complete, then each question is resolved or converted into a Spike issue.
- [ ] Given the approved PRD, when implementation begins, then no issue may bypass the `/plan` artifact step.

### Technical Notes

- Source PRD: `.agents/PRDs/PROJECT-SPECIFICATION-FINAL.md`.
- This issue is the parent planning gate for foundation work.
- No code changes expected.

### PIV Requirements

- [ ] `plan.md` exists before edits.
- [ ] Implementation runs in a fresh session if any docs are changed.
- [ ] Validation evidence is included in PR.

### Dependencies

- Blocked by: None
- Blocks: LEAD-002, LEAD-003, LEAD-004, LEAD-023, LEAD-024, LEAD-026

---

## LEAD-002 Create Database Migration Plan for Foundation Schema

**Type:** Technical  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Strategic Planning  
**Labels:** database, planning, rls  

### Description

As an engineer, I want a database migration plan for the foundation schema, so that bold database changes can be made safely while the platform is in maintenance mode.

### Acceptance Criteria

- [ ] Given the existing Supabase schema, when the plan is complete, then it lists all new tables, changed relationships, indexes, and migration order.
- [ ] Given existing `student_profile` data, when migration planning is complete, then each field has a target destination or removal reason.
- [ ] Given migration risk, when the plan is reviewed, then rollback and verification steps are documented.
- [ ] Given generated types, when the plan is complete, then type regeneration commands and expected files are identified.

### Technical Notes

- Existing schema references: `lib/database.types.ts`, `supabase/migrations/*`.
- Planned tables: `person_profile`, `chapter_membership`, `lead_identity`, `newsletter_subscription`, `event_application_question`, `event_application_answer`.
- Keep migration scripts small and reviewable.

### Dependencies

- Blocked by: LEAD-001
- Blocks: LEAD-005, LEAD-006, LEAD-007, LEAD-008, LEAD-009

---

## LEAD-003 Define RLS and Access Matrix for New Account Model

**Type:** Technical  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Strategic Planning  
**Labels:** security, database, auth  

### Description

As an engineer, I want an RLS and access matrix for the new account model, so that users, editors, admins, and recruiters can only access the data they should.

### Acceptance Criteria

- [ ] Given each new table, when the matrix is complete, then select/insert/update/delete rules are documented by role.
- [ ] Given editor permissions, when rules are defined, then editors are scoped to their approved chapter membership.
- [ ] Given recruiter access, when rules are defined, then recruiters cannot access person/member data unless explicitly allowed through recruiter-visible talent flows.
- [ ] Given admin access, when rules are defined, then admins can manage operational data without requiring `student_profile`.

### Technical Notes

- Include RLS policy names and intent, not just prose.
- Map `user.role` separately from `lead_identity`.
- Use this as the security acceptance reference for migration issues.

### Dependencies

- Blocked by: LEAD-001
- Blocks: LEAD-005, LEAD-006, LEAD-007, LEAD-008, LEAD-009

---

## LEAD-004 Create Multi-Role Test Strategy and Seed Personas

**Type:** Spike  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Strategic Planning  
**Labels:** testing, auth, database  

### Description

As an engineer, I want a test strategy and seed persona matrix, so that the team can validate multi-user workflows without relying on many personal Google accounts.

### Acceptance Criteria

- [ ] Given the account model, when the strategy is complete, then it defines personas for public participant, member, editor, admin, staff/founder, recruiter, and alumni.
- [ ] Given event registration risk, when the strategy is complete, then it defines how to test multiple users registering for the same event.
- [ ] Given auth constraints, when the strategy is complete, then it identifies whether local Supabase seed users, email/password test users, or service-role fixtures should be used.
- [ ] Given PIV validation, when stories are implemented, then each can reference this test strategy.

### Technical Notes

- Consider local seed data in `supabase/seed.sql`.
- Include service tests and manual test flows.
- Do not require production Google accounts for routine validation.

### Dependencies

- Blocked by: LEAD-001
- Blocks: LEAD-012, LEAD-014, LEAD-015, LEAD-018, LEAD-020

---

## LEAD-005 Add Person Profile Foundation

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** database, backend, onboarding  

### Description

As a public participant, I want reusable basic profile data, so that I can register for multiple events without retyping my information or joining a chapter.

### Acceptance Criteria

- [ ] Given an authenticated user, when basic onboarding is completed, then a `person_profile` row is created or updated.
- [ ] Given a returning user, when they register for another event, then profile fields can be reused.
- [ ] Given a user without chapter membership, when they complete `person_profile`, then no `chapter_membership` is required.
- [ ] Given RLS policies, when a user accesses `person_profile`, then they can only manage their own profile unless admin.

### Technical Notes

- Suggested fields: `user_id`, `university`, `major_or_interest`, `graduation_year`, `linkedin_url`, `portfolio_url`, `skills`, `gender`, timestamps.
- Keep universal contact data in `user`: `name`, `email`, `phone`.
- Add service methods in `lib/services/`.

### Dependencies

- Blocked by: LEAD-002, LEAD-003
- Blocks: LEAD-010, LEAD-013, LEAD-014

---

## LEAD-006 Add Chapter Membership Foundation

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** database, backend, chapter  

### Description

As a chapter applicant, I want chapter membership to be tracked separately from my basic profile, so that applying to a chapter is explicit and reviewable.

### Acceptance Criteria

- [ ] Given a user applying to a chapter, when the application is created, then a `chapter_membership` row is created with `status = pending`.
- [ ] Given an approved member, when editors view their roster, then the membership includes chapter and position.
- [ ] Given V1 constraints, when a user is approved, then only one active approved chapter membership is allowed.
- [ ] Given editor requirements, when a user becomes an editor, then they must have approved chapter membership.

### Technical Notes

- Status values: `pending`, `approved`, `rejected`, `alumni`.
- Position values can start as text or enum: `member`, `president`, `vice_president`, `secretary`, `treasurer`, `events_lead`, `marketing_lead`.
- Move membership responsibilities out of `student_profile`.

### Dependencies

- Blocked by: LEAD-002, LEAD-003
- Blocks: LEAD-010, LEAD-015, LEAD-016

---

## LEAD-007 Add LEAD Identity Foundation

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** database, backend, admin  

### Description

As a staff member or founder, I want official LEAD identity to be independent from chapter membership, so that LEAD IDs can be issued to chapter members and non-chapter organization leaders.

### Acceptance Criteria

- [ ] Given an approved chapter member, when membership is approved, then a LEAD identity can be issued.
- [ ] Given a founder or staff user, when an admin issues identity, then no chapter membership is required.
- [ ] Given multiple identities, when one is primary, then display surfaces use the primary identity.
- [ ] Given admin corrections, when primary identity changes, then the old identity remains historically available.

### Technical Notes

- Suggested identity types: `founder`, `staff`, `chapter_editor`, `chapter_member`, `alumni`.
- `admin` remains an app role, not an identity type.
- Include `chapter_id` nullable, `is_primary`, `issued_by_id`, `issued_at`, `revoked_at`, `status`.

### Dependencies

- Blocked by: LEAD-002, LEAD-003
- Blocks: LEAD-010, LEAD-017, LEAD-021

---

## LEAD-008 Add Newsletter Subscription Foundation

**Type:** Feature  
**Priority:** Medium  
**Complexity:** Small  
**Phase:** Active PIV Loop  
**Labels:** database, newsletter  

### Description

As a participant, I want global and chapter newsletter preferences, so that I can receive LEAD updates relevant to my interests.

### Acceptance Criteria

- [ ] Given a user completing onboarding, when global newsletter opt-in is selected, then a global subscription is created.
- [ ] Given a user selecting chapter interests, when onboarding is saved, then chapter subscriptions are created.
- [ ] Given event registration, when the host-chapter newsletter checkbox remains checked, then host/collaborator chapter subscriptions are created or reactivated.
- [ ] Given unsubscribe behavior, when a subscription is inactive, then future campaign planning can respect it.

### Technical Notes

- Suggested table: `newsletter_subscription`.
- Fields: `user_id`, `scope`, `chapter_id`, `status`, `source`, `subscribed_at`, `unsubscribed_at`, timestamps.
- Campaign UI is out of scope; this is foundation only.

### Dependencies

- Blocked by: LEAD-002, LEAD-003
- Blocks: LEAD-013, LEAD-014, LEAD-026

---

## LEAD-009 Add Event Application Question and Answer Foundation

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** database, events  

### Description

As an event organizer, I want custom application questions, so that application-based events can collect event-specific evaluation information.

### Acceptance Criteria

- [ ] Given an application-based event, when an editor defines questions, then questions are stored in event order.
- [ ] Given a participant applying, when answers are submitted, then answers are tied to the event registration.
- [ ] Given question types, when V1 is implemented, then short text, long text, single select, checkbox, and URL are supported.
- [ ] Given deferred scope, when implementation is complete, then file upload and branching logic are not included.

### Technical Notes

- Suggested tables: `event_application_question`, `event_application_answer`.
- Answers should reference `event_registration.id`, not only `user_id`.
- Keep question validation in services.

### Dependencies

- Blocked by: LEAD-002, LEAD-003
- Blocks: LEAD-018

---

## LEAD-010 Migrate Existing Student Profile Data Into New Model

**Type:** Technical  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** database, migration, student  

### Description

As an engineer, I want existing `student_profile` data migrated into the new layered model, so that current progress is preserved while the schema becomes sustainable.

### Acceptance Criteria

- [ ] Given existing `student_profile.major`, `graduation_year`, `linkedin_url`, `skills`, and `gender`, when migration runs, then reusable fields move or copy into `person_profile`.
- [ ] Given existing `student_profile.chapter_id`, `approval_status`, `approved_by_id`, and `member_id`, when migration runs, then membership/identity data is preserved in the new tables.
- [ ] Given ambiguous fields, when migration is complete, then decisions are documented in the migration plan.
- [ ] Given migrated data, when validation queries run, then row counts and key relationships match expectations.

### Technical Notes

- Keep migration reversible during maintenance mode where practical.
- Avoid deleting old fields until consumers are updated or a follow-up cleanup issue is complete.
- Update seed data after migration.

### Dependencies

- Blocked by: LEAD-005, LEAD-006, LEAD-007
- Blocks: LEAD-011

---

## LEAD-011 Regenerate Supabase Types and Update Type Entrypoints

**Type:** Technical  
**Priority:** High  
**Complexity:** Small  
**Phase:** Active PIV Loop  
**Labels:** database, typescript  

### Description

As an engineer, I want generated Supabase types updated after schema changes, so that services and actions use the canonical database contract.

### Acceptance Criteria

- [ ] Given migrations are applied, when types are regenerated, then `lib/database.types.ts` reflects new tables and fields.
- [ ] Given the service layer imports types, when type generation is complete, then `lib/database.generated.ts` remains the canonical entrypoint.
- [ ] Given renamed or moved fields, when type checking runs, then broken consumers are identified for follow-up implementation issues.
- [ ] Given generated files, when PR is reviewed, then changes are limited to schema-driven type updates.

### Technical Notes

- Follow `docs/adr/002-database-type-generation.md`.
- Keep generated types separate from manual service refactors where possible.

### Dependencies

- Blocked by: LEAD-005, LEAD-006, LEAD-007, LEAD-008, LEAD-009, LEAD-010
- Blocks: LEAD-012

---

## LEAD-012 Decouple Auth Guards From Required Student Profile

**Type:** Technical  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** auth, backend, routing  

### Description

As an admin or recruiter, I want authentication and routing to work without `student_profile`, so that non-student users can access the correct dashboards.

### Acceptance Criteria

- [ ] Given an admin logs in through main auth, when the session is valid, then they route to `/admin` without requiring `student_profile`.
- [ ] Given a recruiter logs in through company flow, when access is active, then they route to the company dashboard without requiring student onboarding.
- [ ] Given a member/editor without completed basic profile, when they access member-only flows, then they route to onboarding.
- [ ] Given guest users, when they browse public pages and public event detail, then access remains allowed.

### Technical Notes

- Likely impacted: `lib/auth.ts`, locale layouts, auth callback/confirm routes, dashboard redirects.
- Use `person_profile` for basic onboarding checks.
- Keep recruiter checks based on `recruiter_access`.

### Dependencies

- Blocked by: LEAD-004, LEAD-011
- Blocks: LEAD-013, LEAD-014, LEAD-015, LEAD-022, LEAD-025

---

## LEAD-013 Implement Basic Onboarding With Person Profile

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** onboarding, frontend, backend  

### Description

As a public participant, I want basic onboarding saved once, so that I can register for events and subscribe to updates without joining a chapter.

### Acceptance Criteria

- [ ] Given a new main-login user, when onboarding starts, then they see basic profile fields without required chapter selection.
- [ ] Given onboarding is submitted, when validation passes, then `user` and `person_profile` are updated through service-layer logic.
- [ ] Given newsletter choices, when onboarding is submitted, then global and selected chapter subscriptions are saved.
- [ ] Given a returning user, when onboarding is already complete, then they are not forced through onboarding again.

### Technical Notes

- Likely impacted: `app/[locale]/onboarding/*`, `lib/actions/student/onboarding.ts`, new profile service.
- Keep `student_profile` out of basic onboarding requirements.
- Use Zod validation at action boundary.

### Dependencies

- Blocked by: LEAD-005, LEAD-008, LEAD-012
- Blocks: LEAD-014

---

## LEAD-014 Update Event Registration to Use Person Profile

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** events, frontend, backend  

### Description

As an authenticated participant, I want to register for public events using my basic profile, so that I do not need chapter membership to attend LEAD events.

### Acceptance Criteria

- [ ] Given a guest user, when they view public events, then they can browse but must log in to register.
- [ ] Given an authenticated user without basic profile, when they attempt registration, then they are routed to onboarding.
- [ ] Given an authenticated user with `person_profile`, when they register for an open event, then `event_registration` is created.
- [ ] Given the newsletter checkbox is checked by default, when registration succeeds, then host/collaborator chapter subscriptions are created.

### Technical Notes

- Likely impacted: `lib/actions/events/register.ts`, `lib/services/event.service.ts`, event detail components.
- Chapter approval is not required for event registration.
- Preserve capacity/waitlist behavior if currently implemented.

### Dependencies

- Blocked by: LEAD-013
- Blocks: LEAD-018, LEAD-020, LEAD-028

---

## LEAD-015 Implement Chapter Membership Application and Approval Services

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** chapter, backend, services  

### Description

As a chapter applicant, I want to apply to join a chapter, and as an editor I want to approve or reject applications, so that chapter membership is explicit and managed.

### Acceptance Criteria

- [ ] Given a user with basic onboarding, when they apply to a chapter, then a pending `chapter_membership` is created.
- [ ] Given an editor for that chapter, when they approve an applicant, then membership status becomes `approved`.
- [ ] Given an editor for another chapter, when they try to approve the applicant, then access is denied.
- [ ] Given V1 constraints, when approval would create multiple active approved memberships, then the service prevents it.

### Technical Notes

- Likely impacted: `lib/services/chapter.service.ts`, `lib/actions/chapter/*`, chapter members UI.
- Do not let editors promote users to editor role; admin only.
- Chapter membership is different from newsletter subscription.

### Dependencies

- Blocked by: LEAD-006, LEAD-012
- Blocks: LEAD-016, LEAD-017, LEAD-028

---

## LEAD-016 Scope Editor Permissions by Approved Chapter Membership

**Type:** Technical  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** editor, auth, events  

### Description

As a chapter editor, I want my management permissions scoped to my approved chapter, so that I can manage my chapter and collaborative events without global access.

### Acceptance Criteria

- [ ] Given a user with `role = editor` and approved chapter membership, when they access chapter tools, then they are scoped to that chapter.
- [ ] Given an editor's chapter created an event, when they edit it, then access is allowed.
- [ ] Given an editor's chapter is a collaborator on an event, when they edit it, then access is allowed.
- [ ] Given an editor tries to manage another chapter's members, when the action runs, then access is denied.

### Technical Notes

- Likely impacted: `lib/auth.ts`, `lib/actions/events/access.ts`, `lib/actions/events/event-chapter.ts`, chapter layouts.
- Admins bypass chapter scoping.
- Keep V1 to one active editor chapter.

### Dependencies

- Blocked by: LEAD-015
- Blocks: LEAD-018, LEAD-019, LEAD-020

---

## LEAD-017 Implement LEAD Identity Issuance and Primary Display Rules

**Type:** Feature  
**Priority:** Medium  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** admin, identity, backend  

### Description

As an admin, I want to issue and manage official LEAD identities, so that chapter members, editors, staff, founders, and alumni can have correct ID/status display.

### Acceptance Criteria

- [ ] Given a chapter member is approved, when identity issuance is triggered, then a `chapter_member` identity can be created.
- [ ] Given an editor is promoted by admin, when identity is updated, then a `chapter_editor` identity can be created or marked primary.
- [ ] Given a founder or staff user, when admin issues identity, then no chapter is required.
- [ ] Given multiple active identities, when admin selects primary, then display surfaces use that primary identity.

### Technical Notes

- Admin role promotion may remain manual/direct DB in first pass if needed, but identity service should be explicit.
- Consider future ID card integration.
- Avoid treating `admin` as a public identity type.

### Dependencies

- Blocked by: LEAD-007, LEAD-015
- Blocks: LEAD-021

---

## LEAD-018 Implement Application-Based Event Forms

**Type:** Feature  
**Priority:** High  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** events, frontend, backend  

### Description

As an event organizer, I want application-based events to collect custom answers, so that editors can evaluate attendees before approval.

### Acceptance Criteria

- [ ] Given an editor creates or edits an application event, when they add V1 question types, then questions are saved in order.
- [ ] Given a participant applies to the event, when required questions are missing, then validation blocks submission.
- [ ] Given valid answers, when application is submitted, then `event_registration.status = pending` and answers are saved.
- [ ] Given an editor reviews applications, when they open an applicant, then answers are visible.

### Technical Notes

- Likely impacted: event form, apply modal, application review components, event services.
- V1 question types: short text, long text, single select, checkbox, URL.
- File uploads and branching are explicitly out of scope.

### Dependencies

- Blocked by: LEAD-009, LEAD-014, LEAD-016
- Blocks: None

---

## LEAD-019 Validate Multi-Chapter Event Collaboration

**Type:** Technical  
**Priority:** Medium  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** events, editor, testing  

### Description

As a chapter editor, I want collaborative event permissions to work correctly, so that all host chapters can manage shared events without overexposing unrelated chapter data.

### Acceptance Criteria

- [ ] Given an event created by Chapter A with Chapter B as collaborator, when an editor from Chapter B edits the event, then access is allowed.
- [ ] Given a non-collaborating editor, when they attempt to edit the event, then access is denied.
- [ ] Given event registration visibility, when students browse events, then collaborating chapter events are discoverable as intended.
- [ ] Given tests run, when collaboration cases are covered, then service-level permission tests pass.

### Technical Notes

- Existing table: `event_chapter`.
- Likely impacted: `canUserAccessChapter`, event service permission checks, UI event manager.
- This is a recovery/validation issue for partially implemented code.

### Dependencies

- Blocked by: LEAD-016
- Blocks: None

---

## LEAD-020 Stabilize Event Check-In Flow on New Model

**Type:** Feature  
**Priority:** Medium  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** events, editor, qr  

### Description

As a chapter editor, I want QR and manual check-in to work with the new account model, so that event attendance is tracked reliably.

### Acceptance Criteria

- [ ] Given an approved event registration, when a QR code is scanned, then `checked_in_at` and `checked_in_by_id` are saved.
- [ ] Given QR scanning is unavailable, when an editor searches manually, then eligible registrations can be checked in.
- [ ] Given an editor outside the host/collaborator chapters, when they attempt check-in, then access is denied.
- [ ] Given attendance reporting, when check-in completes, then attendance remains linked to `user` and event registration.

### Technical Notes

- Likely impacted: `lib/actions/events/checkin.ts`, check-in scanner components, `/api/events/checkin`.
- Do not require chapter membership for event attendee identity.
- Editors still require approved chapter membership.

### Dependencies

- Blocked by: LEAD-014, LEAD-016
- Blocks: None

---

## LEAD-021 Stabilize Admin Role and Identity Management UX

**Type:** Enhancement  
**Priority:** Medium  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** admin, frontend, backend  

### Description

As an admin, I want to manage roles and LEAD identities clearly, so that founders, staff, editors, chapter members, and alumni are represented correctly.

### Acceptance Criteria

- [ ] Given an admin views a user, when the user has no `student_profile`, then the admin page still renders.
- [ ] Given a user should become an editor, when admin promotes them, then approved chapter membership is required.
- [ ] Given a founder should be admin, when admin/founder setup is documented or implemented, then `user.role = admin` is enforced.
- [ ] Given a user has multiple identities, when admin changes primary identity, then display preference is saved.

### Technical Notes

- Likely impacted: admin users pages, admin services, role update actions.
- Promotion UX may be minimal for V1 if database-direct setup remains operationally documented.
- Keep role and identity concepts visibly separate.

### Dependencies

- Blocked by: LEAD-017
- Blocks: None

---

## LEAD-022 Preserve Invite-Only Recruiter Access After Account Refactor

**Type:** Technical  
**Priority:** Medium  
**Complexity:** Medium  
**Phase:** Active PIV Loop  
**Labels:** recruiter, auth, backend  

### Description

As a recruiter, I want company access to remain invite-only and separate from student onboarding, so that recruiter login does not break during the account refactor.

### Acceptance Criteria

- [ ] Given a valid recruiter invite, when the invite is accepted, then the user becomes or remains `role = recruiter`.
- [ ] Given an active accepted recruiter access record, when recruiter logs in, then they reach the company dashboard.
- [ ] Given recruiter has no `person_profile` or `chapter_membership`, when they use company pages, then no student onboarding redirect occurs.
- [ ] Given revoked or expired access, when recruiter attempts access, then they are routed to the appropriate company onboarding/help state.

### Technical Notes

- Likely impacted: `lib/auth.ts`, `lib/actions/company/handle-invite.ts`, `lib/actions/admin/invite-recruiter.ts`, company protected layout.
- This is stabilization, not full recruiter UX redesign.

### Dependencies

- Blocked by: LEAD-012
- Blocks: LEAD-027

---

## LEAD-023 Add PR Validation Template and PIV Evidence Checklist

**Type:** Technical  
**Priority:** High  
**Complexity:** Small  
**Phase:** System Evolution  
**Labels:** github, process, validation  

### Description

As the engineering team, I want PRs to require PIV validation evidence, so that code changes are reviewed with proof instead of vibes.

### Acceptance Criteria

- [ ] Given a PR is opened, when the template appears, then it asks for linked issue, plan artifact, validation commands, and manual test notes.
- [ ] Given a migration PR, when the template is filled, then it includes migration validation and rollback notes.
- [ ] Given a UI flow PR, when the template is filled, then it includes manual screenshots or test notes.
- [ ] Given repeated bug patterns, when a PR fixes one, then it links or creates a System Evolution issue.

### Technical Notes

- Add or update `.github/pull_request_template.md`.
- Keep template concise enough that people will actually use it.

### Dependencies

- Blocked by: LEAD-001
- Blocks: None

---

## LEAD-024 Add Agent Rules for Canonical Account Model

**Type:** Documentation  
**Priority:** High  
**Complexity:** Small  
**Phase:** System Evolution  
**Labels:** ai-layer, docs  

### Description

As the engineering team, I want AI agent instructions to include the canonical account model, so that future agents do not rebuild the old `student_profile` dependency.

### Acceptance Criteria

- [ ] Given agent instructions are updated, when future agents read them, then they see `user`, `person_profile`, `chapter_membership`, `lead_identity`, and `recruiter_access` definitions.
- [ ] Given PIV workflow, when agents implement issues, then `/plan` and fresh-session `/implement` rules are explicit.
- [ ] Given bugs or repeated confusion, when patterns emerge, then instructions say to create System Evolution issues.
- [ ] Given service-layer architecture, when agents change business logic, then services remain the required location.

### Technical Notes

- Likely impacted: `AGENTS.md`, `CLAUDE.md` if present or desired, `.claude/*`.
- Keep instructions enforceable and brief.

### Dependencies

- Blocked by: LEAD-001
- Blocks: None

---

## LEAD-025 Add Architecture Tests for Service-Layer Boundaries

**Type:** Technical  
**Priority:** Medium  
**Complexity:** Medium  
**Phase:** System Evolution  
**Labels:** testing, architecture  

### Description

As the engineering team, I want architecture tests to enforce service-layer boundaries, so that database and business logic do not drift into UI or server actions.

### Acceptance Criteria

- [ ] Given service-layer rules, when tests run, then business logic imports are checked for expected boundaries.
- [ ] Given server actions, when tests inspect them, then they remain thin validation/auth/service callers where practical.
- [ ] Given new foundation domains, when architecture tests run, then new services are included.
- [ ] Given violations, when tests fail, then the failure message points to the relevant architecture rule.

### Technical Notes

- Existing file: `tests/architecture.test.ts`.
- Extend carefully; avoid brittle tests that block valid framework imports.

### Dependencies

- Blocked by: LEAD-012
- Blocks: None

---

## LEAD-026 Document Newsletter Campaign Architecture

**Type:** Documentation  
**Priority:** Medium  
**Complexity:** Small  
**Phase:** Strategic Planning  
**Labels:** newsletter, docs  

### Description

As an admin or editor, I want newsletter campaign architecture documented, so that future global, chapter, and demographic messaging can be implemented without mixing subscriptions and membership.

### Acceptance Criteria

- [ ] Given newsletter planning, when docs are complete, then they distinguish subscription consent from campaign audience segments.
- [ ] Given editor permissions, when docs are complete, then editors are limited to their own chapter campaigns.
- [ ] Given admin permissions, when docs are complete, then admins can create global, chapter, and demographic campaigns.
- [ ] Given future demographic filters, when docs are complete, then filters reference `person_profile`, `chapter_membership`, and event attendance.

### Technical Notes

- This does not implement campaign sending.
- Potential future tables: `newsletter_campaign`, `newsletter_send`.
- Should be linked from PRD or an ADR.

### Dependencies

- Blocked by: LEAD-001, LEAD-008
- Blocks: None

---

## LEAD-027 Create Recruiter Portal Recovery Plan

**Type:** Spike  
**Priority:** Low  
**Complexity:** Small  
**Phase:** Strategic Planning  
**Labels:** recruiter, planning  

### Description

As the engineering team, I want a recovery plan for recruiter/company flows, so that unstable invite and login behavior can be fixed after the student/editor/event milestone.

### Acceptance Criteria

- [ ] Given current recruiter code, when audit is complete, then invite, accept, login, dashboard, save, and resume download flows are mapped.
- [ ] Given known instability, when the plan is complete, then confusing or duplicate flows are listed.
- [ ] Given account refactor, when the plan is complete, then recruiter flows remain separate from `person_profile` and `chapter_membership`.
- [ ] Given future implementation, when stories are generated, then each recruiter recovery issue is small and independently shippable.

### Technical Notes

- Likely audit files: `lib/actions/company/*`, `lib/actions/recruiter/*`, `lib/services/company.service.ts`, `lib/services/recruiter.service.ts`, company routes.
- Do not implement in this spike.

### Dependencies

- Blocked by: LEAD-022
- Blocks: None

---

## LEAD-028 Create Professional UI/UX Redesign Scope

**Type:** Spike  
**Priority:** Low  
**Complexity:** Small  
**Phase:** Strategic Planning  
**Labels:** frontend, design  

### Description

As the product owner, I want a professional UI/UX redesign scope, so that inconsistent student, editor, and company sections can be upgraded without destabilizing core workflows.

### Acceptance Criteria

- [ ] Given the current app, when audit is complete, then student, chapter/editor, events, admin, and company UI inconsistencies are listed.
- [ ] Given MVP priorities, when scope is complete, then student/editor/event UX is prioritized before recruiter/company polish.
- [ ] Given implementation planning, when stories are created, then each redesign story preserves existing behavior and validation.
- [ ] Given responsive requirements, when scope is complete, then mobile and desktop verification expectations are included.

### Technical Notes

- This is a planning issue; no UI changes expected.
- Should reference existing design docs if still accurate.

### Dependencies

- Blocked by: LEAD-014, LEAD-015
- Blocks: None

---

## Dependency Validation

The issue graph is intentionally acyclic:

```text
LEAD-001
  -> LEAD-002, LEAD-003, LEAD-004
  -> LEAD-005..009
  -> LEAD-010
  -> LEAD-011
  -> LEAD-012
  -> LEAD-013..022
  -> LEAD-023..028 where applicable
```

No implementation issue should enter `Implementing` until its `plan.md` exists and upstream blockers are complete or intentionally waived by the team.

---

## GitHub MCP Status

GitHub MCP is not configured in this session. To enable automatic issue creation:

1. Configure a GitHub MCP server or API integration.
2. Provide repository information with `--repo OWNER/REPO`.
3. Provide a GitHub Projects v2 number with `--project PROJECT_NUMBER` if project placement is desired.
4. Re-run the issue creation command and approve creation before issues are posted.

Until then, this file is ready for manual copy/paste into GitHub Issues or for import through a future script.
