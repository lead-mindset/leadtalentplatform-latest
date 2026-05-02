# Product Requirements Document: LEAD Frontier Talent Platform

**Version:** 2.0  
**Date:** April 30, 2026  
**Status:** Final PRD for GitHub project planning  
**Product:** LEAD Frontier  
**Primary Goal:** Establish a durable account, identity, membership, event, and communication foundation before scaling student, editor, and recruiter workflows.

---

## 1. Executive Summary

LEAD Frontier is a SaaS platform for LEAD Americas that connects public event participants, chapter members, chapter editors, administrators, and invite-only recruiters. The platform supports event discovery and registration, chapter membership approval, editor-managed events and check-ins, official LEAD identity cards, recruiter talent discovery, and future newsletter/campaign communication.

The current implementation has substantial partial progress, but the original data model assumed that meaningful platform users always have a `student_profile` tied to a chapter. That assumption no longer matches the product. Public event attendees may not belong to a chapter yet, admins/founders/staff may need official LEAD IDs without chapter membership, and recruiters should never require student profiles. The next milestone is therefore a foundation reset: decouple authenticated identity from student/chapter membership while preserving the existing service-layer architecture.

The MVP goal is to make student, editor, and event workflows reliable on top of a professional, long-term schema. Recruiter/company functionality and newsletters remain important, but they should be planned carefully after the account and event foundation is stable.

**Core value proposition:** LEAD Frontier gives LEAD a trustworthy operating system for events, membership, professional identity, and talent visibility, while keeping public participation low-friction and chapter membership meaningful.

---

## 2. Mission

Build a professional, scalable platform that helps LEAD Americas turn motivated students and community participants into visible, verified, opportunity-ready leaders.

### Core Principles

1. **Identity is not membership.** Every authenticated account has a `user` row, but only approved chapter participants have chapter membership.
2. **Public participation should be low-friction.** People can complete basic onboarding and register for events without pretending to belong to a chapter.
3. **Membership should remain meaningful.** Chapter approval, positions, member IDs, and recruiter visibility must be explicit workflows.
4. **Permissions must stay simple.** App access is controlled by `user.role`; organizational status is controlled by identity and membership records.
5. **Bugs become system improvements.** Repeated failures should update tests, docs, agent instructions, or review checklists.

---

## 3. Target Users

| Persona | Description | Technical Comfort | Needs / Pain Points |
|---|---|---|---|
| Public participant | Interested student or community member who wants to attend public LEAD events | Low to medium | Fast registration, no forced chapter selection, event reminders |
| Chapter applicant/member | Student who wants to join or belongs to a LEAD chapter | Medium | Membership approval, profile, event history, member ID |
| Chapter editor | Approved chapter e-board member who manages events and members | Medium | Create/edit events, approve members, review applications, check in attendees |
| Admin | Platform operator, founder, or central staff member | High | Manage users, roles, chapters, companies, identities, system health |
| Founder/staff | Official LEAD organization member; may or may not need platform admin access | Medium | Official LEAD identity and ID card without forced chapter membership |
| Alumni | Former approved member whose history/status remains valuable | Medium | Maintain identity/history without active member privileges |
| Recruiter | Invite-only company representative | Medium | Access approved recruiter-visible talent and saved candidates |

---

## 4. MVP Scope

### In Scope

#### Core Functionality

- [ ] Replace the old "student profile required for user" assumption with a layered account model.
- [ ] Create `person_profile` for basic onboarding and public event registration.
- [ ] Create `chapter_membership` for chapter approval, chapter affiliation, and chapter positions.
- [ ] Create `lead_identity` for official LEAD IDs and display identity independent from chapter membership.
- [ ] Update event registration to use `user` plus `person_profile`.
- [ ] Support open events and application-based events.
- [ ] Add event application question and answer tables.
- [ ] Enforce editor permissions through approved chapter membership.
- [ ] Ensure admins log in through the main login page and route to `/admin`.
- [ ] Keep recruiter/company access invite-only and separate from student/member profiles.
- [ ] Document newsletter architecture as strategic planning scope.

#### Technical

- [ ] Supabase migrations for new foundation tables.
- [ ] Generated database types updated after migrations.
- [ ] Service-layer updates in `lib/services/`.
- [ ] Thin server actions that validate input and call services.
- [ ] Tests for business logic and routing/membership decisions.
- [ ] RLS policy review for new tables.

#### Integration

- [ ] Supabase Auth remains the account source.
- [ ] Resend/email architecture remains planned for event and membership notifications.
- [ ] Google OAuth remains the primary login method for main users.
- [ ] Company login remains invite/magic-link oriented.

#### Deployment

- [ ] Platform remains in maintenance mode during database foundation changes.
- [ ] Migration plan must include current data movement and rollback notes.
- [ ] PRs require validation evidence before merge.

### Out of Scope

#### Deferred Product Features

- [ ] Full newsletter campaign UI and delivery engine.
- [ ] Advanced demographic campaign builder.
- [ ] Full recruiter portal redesign.
- [ ] Resume text extraction and semantic search.
- [ ] Funding request workflow.
- [ ] Leadership color/profile assessment.
- [ ] Complex event form branching logic.
- [ ] Event application file uploads.
- [ ] Offline check-in support.
- [ ] Multi-chapter editor account management beyond event collaboration.

---

## 5. User Stories

1. **As a public participant, I want to create an account and complete basic onboarding, so that I can register for LEAD events without joining a chapter first.**  
   Example: A student from a university without a LEAD chapter signs in, enters university/interest information once, and registers for a public workshop.

2. **As a chapter applicant, I want to apply to join a specific LEAD chapter, so that editors can review and approve my membership.**  
   Example: A public participant later chooses LEAD Boston, submits the membership request, and becomes `pending`.

3. **As a chapter editor, I want to approve or reject chapter membership requests, so that my chapter roster stays accurate.**  
   Example: The LEAD Lima president reviews completed applicants and approves verified students.

4. **As a chapter editor, I want to create and manage events for my chapter and collaborative events involving my chapter, so that chapter programming is easy to operate.**  
   Example: LEAD Boston co-hosts an event with LEAD UP; editors from both chapters can edit the shared event.

5. **As an event organizer, I want custom application questions for application-based events, so that I can evaluate applicants using event-specific criteria.**  
   Example: A selective networking event asks for a short essay and prior experience level.

6. **As an admin, I want to manage users, roles, identities, chapters, and companies without needing a student profile, so that central operations are not blocked by student-specific data.**

7. **As a staff member or founder, I want an official LEAD ID even if I do not belong to a chapter, so that my organization role is recognized correctly.**

8. **As a recruiter, I want invite-only access that is separate from student onboarding, so that company access remains controlled and professional.**

---

## 6. Core Architecture & Patterns

### Architecture Approach

LEAD Frontier uses Next.js App Router with Supabase as the data/auth platform. The project follows a service-layer pattern:

- Business logic lives in `lib/services/`.
- Server actions and API routes remain thin.
- UI components consume prepared data and do not duplicate business rules.
- Database-generated types are canonical through `lib/database.generated.ts`.

### Domain Model

```text
user
  Authenticated account identity and app role.

person_profile
  Reusable basic profile for event registration and outreach.

chapter_membership
  Chapter relationship, approval status, and chapter position.

lead_identity
  Official LEAD ID/status/display identity; optional chapter relation.

event
  Event metadata, host chapter, access model, location, capacity.

event_chapter
  Collaborating chapters for shared event ownership.

event_registration
  User relationship to one event: registered, pending, approved, rejected, checked in.

event_application_question
  Editor-defined questions for application-based events.

event_application_answer
  User answers tied to one event registration.

newsletter_subscription
  Consent and subscription preferences for global or chapter communications.

recruiter_access
  Invite-only company access control.
```

### Key Patterns

- **Role vs identity separation:** `user.role` controls app access; `lead_identity` controls official display/status.
- **Membership vs subscription separation:** `chapter_membership` means application/approval; `newsletter_subscription` means communication consent.
- **Event application extensibility:** event-specific questions use question/answer rows, not new columns.
- **Vertical slices:** database, service, action, UI, and tests should ship together.
- **PIV loop:** every issue moves Plan -> Implement -> Validate -> Review.

---

## 7. Tools / Features

### Account and Onboarding

Basic onboarding creates or updates `person_profile`. It should be required before event registration but should not require chapter membership.

Minimum basic onboarding fields:

- Name
- Email from auth
- Phone, optional initially
- University or organization
- Major, field, or interest area
- Graduation year, optional for non-students
- Global newsletter preference
- Optional chapter newsletter interests

### Chapter Membership

Chapter membership is created only when the user formally applies to or is added to a chapter.

```ts
type ChapterMembershipStatus = "pending" | "approved" | "rejected" | "alumni";
```

V1 rules:

- One active approved chapter membership per member/editor.
- Editors must be approved chapter members.
- Only admins can promote/demote editors.
- Editors can approve/reject/remove members in their own chapter.

Chapter positions live on `chapter_membership.position`, not `user.role`.

Examples:

- `president`
- `vice_president`
- `secretary`
- `treasurer`
- `events_lead`
- `marketing_lead`
- `member`

### LEAD Identity

LEAD IDs are independent from chapter membership. Chapter approval can issue an identity automatically, but admins can also issue official identities for founders, staff, alumni, or other organization roles.

Recommended identity types:

```ts
type LeadIdentityType =
  | "founder"
  | "staff"
  | "chapter_editor"
  | "chapter_member"
  | "alumni";
```

Rules:

- Founders should have `user.role = "admin"`.
- Admin is an app role, not a public identity type.
- A user may have multiple LEAD identities.
- One active identity can be marked primary for ID cards and display.
- Admins can override primary identity.

### Event Registration

Open events:

- Guest users can view public event pages.
- Authenticated users with completed basic onboarding can register.
- Chapter approval is not required.

Application events:

- Authenticated users with completed basic onboarding can apply.
- Event-specific questions are answered during application.
- Registration status starts as `pending`.
- Editors approve/reject applications for events their chapter owns or collaborates on.

### Newsletter Planning

Newsletter functionality is strategic planning scope, but schema decisions should support it.

Subscription rules:

- Global newsletter subscription is supported.
- Chapter newsletter subscription is supported.
- Users may subscribe to multiple chapters.
- Event registration shows a host-chapter newsletter checkbox checked by default.
- If the user leaves it checked, chapter subscriptions are created or reactivated.
- Users must be able to unsubscribe later.

Campaign rules for future implementation:

- Admins can send global, chapter, and demographic campaigns.
- Editors can send campaigns only for their own chapter.
- Demographic campaigns use filters from `person_profile`, `chapter_membership`, and event attendance.

### Recruiter Access

Recruiters are invite-only:

- Admin creates company and recruiter invite.
- Recruiter accepts invite through company flow.
- Recruiter gets `user.role = "recruiter"`.
- Recruiter access is controlled by `recruiter_access.is_active`, invite acceptance, and revocation fields.
- Recruiters do not need `person_profile`, `student_profile`, or `chapter_membership`.

---

## 8. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| UI Runtime | React 19 |
| Database/Auth/Storage | Supabase |
| Styling | Tailwind CSS 4 with `@tailwindcss/postcss` |
| UI Components | Radix UI primitives and custom Shadcn-like components |
| i18n | `next-intl` with locale routing |
| Package Manager | pnpm |
| Tests | Vitest |
| Email | Resend / current email infrastructure |
| Maps | Google Places / Maps integration |
| Hosting | Vercel |

### Existing Project Conventions

- Generated DB types: `lib/database.generated.ts`
- Services: `lib/services/`
- Actions: `lib/actions/[domain]/`
- Supabase clients: `lib/supabase/*`
- Locale routes: `app/[locale]/*`
- UI components: `components/ui`

---

## 9. Security & Configuration

### Authentication

- Main users use normal app login with Google OAuth and/or email/password.
- Admins/founders/staff log in through the main login page.
- Recruiters use the company invite/login flow.
- Supabase Auth remains the source of authenticated identity.

### Authorization

```ts
type Role = "member" | "editor" | "admin" | "recruiter";
```

Role responsibilities:

- `member`: basic account/event participant/chapter applicant/member.
- `editor`: approved chapter e-board member with chapter tools.
- `admin`: global platform operator.
- `recruiter`: invite-only company user.

### RLS and Access Rules

- Users can read/update their own basic profile.
- Editors can manage only their own chapter members.
- Editors can edit events created by their chapter or where their chapter is a collaborator.
- Admins can manage all operational data.
- Recruiters can access only approved recruiter-visible talent and only when `recruiter_access.is_active = true`.

### Configuration

Expected environment configuration includes:

- Supabase URL/key variables
- Supabase service role key for server-side admin operations
- Resend or SMTP email credentials
- Google OAuth credentials
- Google Maps/Places API key
- Frontend URL

### Security Scope

In scope:

- Role-based access control
- RLS review for new tables
- Invite-only recruiter access
- Validation with Zod/service boundaries
- Audit-friendly admin flows where practical

Out of scope for MVP:

- SOC 2 readiness
- Advanced fraud detection
- Virus scanning pipeline for resumes
- Fine-grained recruiter access tiers

---

## 10. API Specification

The platform primarily uses server actions, with API routes for webhook and integration surfaces.

### Representative Server Actions

```ts
createOrUpdatePersonProfile(input)
applyToChapter(input)
approveChapterMembership(input)
rejectChapterMembership(input)
createLeadIdentity(input)
registerForEvent(input)
submitEventApplication(input)
approveEventApplication(input)
rejectEventApplication(input)
createRecruiterInvite(input)
acceptRecruiterInvite(input)
```

### Representative API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/hooks/send-email` | POST | Supabase auth email hook |
| `/api/events/checkin` | POST | Event QR check-in |
| `/api/chapter/members` | GET | Chapter member data |
| `/api/webhooks/resend` | POST | Email delivery webhook |

### Example Payloads

Create/update basic profile:

```json
{
  "name": "Ana Martinez",
  "phone": "+1 555 0100",
  "university": "Boston University",
  "majorOrInterest": "Computer Science",
  "graduationYear": 2027,
  "globalNewsletterOptIn": true,
  "chapterNewsletterIds": ["chapter-boston"]
}
```

Create event application question:

```json
{
  "eventId": "event-123",
  "label": "Why do you want to attend?",
  "questionType": "long_text",
  "isRequired": true,
  "sortOrder": 1
}
```

Submit event application:

```json
{
  "eventId": "event-123",
  "answers": [
    {
      "questionId": "question-1",
      "answerText": "I want to build my professional network and learn from recruiters."
    }
  ],
  "subscribeToHostChapters": true
}
```

---

## 11. Success Criteria

### MVP Success Definition

The MVP is successful when a public participant can complete basic onboarding and register/apply for events, a chapter editor can manage their chapter members and events, and an admin can manage identities and roles without any route depending incorrectly on `student_profile`.

### Functional Requirements

- [ ] Admin login works through the main login page and routes to `/admin`.
- [ ] Recruiter login remains invite-only and does not require student/profile onboarding.
- [ ] Public event registration works for authenticated users with `person_profile`.
- [ ] Chapter membership approval is separate from event registration.
- [ ] Editors must have approved chapter membership.
- [ ] Editors can manage events where their chapter is creator or collaborator.
- [ ] LEAD IDs can be issued to chapter members, editors, staff, founders, and alumni.
- [ ] Event applications support custom questions and answers.
- [ ] Newsletter architecture is documented and schema-compatible.

### Quality Indicators

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes.
- [ ] Service tests pass.
- [ ] Critical auth, event, and editor flows have test coverage.
- [ ] Manual validation evidence appears in PRs.
- [ ] RLS assumptions are documented.

### User Experience Goals

- Public participants should not be forced to choose a chapter.
- Returning users should not retype basic event registration information.
- Editors should see only relevant chapter workflows.
- Admins should have clear control over roles and identities.
- Recruiter/company flows should feel separate and invite-only.

---

## 12. Implementation Phases

### Phase 1: Strategic Planning and Schema Finalization

**Goal:** Convert the product decisions into a final PRD, implementation stories, and migration plan.

Deliverables:

- [ ] Final PRD approved.
- [ ] GitHub project board created.
- [ ] Issues generated from PRD.
- [ ] Database migration plan written.
- [ ] RLS policy plan written.
- [ ] Test strategy written for role/profile/membership states.

Validation:

- [ ] Stakeholder review complete.
- [ ] Engineering review complete.
- [ ] Open schema decisions resolved.

Estimated timeline: 1-2 days.

### Phase 2: Account, Identity, and Membership Foundation

**Goal:** Implement the durable database foundation before UI polish.

Deliverables:

- [ ] Add `person_profile`.
- [ ] Add `chapter_membership`.
- [ ] Add `lead_identity`.
- [ ] Add `newsletter_subscription`.
- [ ] Add event application question/answer tables.
- [ ] Migrate existing `student_profile` data into the new model.
- [ ] Regenerate database types.
- [ ] Update services and auth guards.

Validation:

- [ ] Migration runs locally.
- [ ] Existing seed/test data updated.
- [ ] Service tests cover member, editor, admin, recruiter, and public participant states.
- [ ] Manual auth routing matrix validated.

Estimated timeline: 3-5 days.

### Phase 3: Event and Editor Recovery

**Goal:** Stabilize public event registration, application events, editor event management, collaboration, and check-in.

Deliverables:

- [ ] Event registration uses `person_profile`.
- [ ] Application events use question/answer tables.
- [ ] Editors can manage creator/collaborator chapter events.
- [ ] Check-in flow verified.
- [ ] Member approval flow uses `chapter_membership`.
- [ ] LEAD ID issuance uses `lead_identity`.

Validation:

- [ ] Unit/service tests pass.
- [ ] Multi-user test plan documented.
- [ ] Manual tests cover open event, application event, approval, rejection, and check-in.

Estimated timeline: 5-8 days.

### Phase 4: System Evolution and Professionalization

**Goal:** Strengthen team workflow, validation, documentation, and future roadmap.

Deliverables:

- [ ] PIV rules added to AI/team instructions.
- [ ] PR template/checklist includes validation evidence.
- [ ] Architecture documentation updated.
- [ ] Newsletter architecture added to specification.
- [ ] Recruiter/company recovery plan documented.
- [ ] UI/UX redesign scope documented.

Validation:

- [ ] PR review process used on real changes.
- [ ] Repeated bug patterns converted into system-evolution issues.
- [ ] Documentation matches implemented schema.

Estimated timeline: ongoing after Phase 2.

---

## 13. Future Considerations

- Full newsletter campaign builder with segmentation and delivery logs.
- Resume parsing and searchable candidate profiles.
- Recruiter access tiers such as view-only, download, and contact access.
- Funding request workflow for chapter editors.
- Leadership color/profile assessment.
- LEAD Spark event readiness.
- Advanced admin audit logs.
- Event attendance analytics for talent pipeline reporting.
- Alumni network and alumni-specific programming.
- Multi-chapter editor support if organizational operations require it.

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Schema migration breaks existing routes | High | Maintenance mode, migration plan, generated type updates, focused service tests |
| Account model remains unclear to future agents/team members | High | Update PRD, AGENTS/CLAUDE rules, ADR, and issue templates with canonical vocabulary |
| Editors accidentally get broader access than intended | High | Scope editor permissions by approved chapter membership and event collaboration |
| Event registration becomes too heavy | Medium | Require only basic `person_profile`; keep chapter membership optional |
| Newsletter consent becomes confusing | Medium | Store explicit subscription records and provide unsubscribe support |
| Recruiter/company instability distracts from MVP | Medium | Place recruiter recovery after student/editor/event milestone |

---

## 15. Appendix

### Related Documents

- `PROJECT-SPECIFICATION.md`
- `TECHNICAL-DETAILS.md`
- `AGENTS.md`
- `docs/adr/001-service-layer-pattern.md`
- `docs/adr/002-database-type-generation.md`
- `docs/handbook/TESTING.md`
- `docs/handbook/DEFINITION_OF_DONE.md`
- `docs/handbook/CONTRIBUTING.md`

### Recommended GitHub Project Phases

1. Strategic Planning
2. Active PIV Loop
   - Plan Ready
   - Implementing
   - Validate
   - Review
3. System Evolution

### Canonical Vocabulary

| Term | Meaning |
|---|---|
| `user` | Every authenticated account |
| `person_profile` | Reusable basic onboarding data |
| `chapter_membership` | Chapter application, approval, status, and position |
| `lead_identity` | Official LEAD ID/display/status record |
| `event_registration` | User relationship to one event |
| `event_application_question` | Custom event application field |
| `event_application_answer` | User answer for a custom event question |
| `newsletter_subscription` | Communication consent/preference |
| `recruiter_access` | Invite-only company access |

### Assumptions

- The platform is in maintenance mode and bold database changes are acceptable.
- One active approved chapter membership per user is sufficient for V1.
- Editors are approved chapter e-board members for exactly one chapter in V1.
- Founders should have admin app permissions.
- Admin is an app role, not a public LEAD identity type.
- Newsletter implementation is not immediate MVP scope, but the database should support future global and chapter subscriptions.
