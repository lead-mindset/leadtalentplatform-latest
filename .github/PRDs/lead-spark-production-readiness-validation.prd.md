# PRD: LEAD SPARK Production Readiness Validation

## 1. Executive Summary

LEAD Talent Platform is preparing for its first controlled production activation with real organization members, using **LEAD SPARK** as the adoption wedge. LEAD SPARK is expected to be a flagship event with invited companies, and the platform should support member profile activation, chapter membership validation, event operations, company-facing talent visibility, and production-safe rollout controls.

The immediate product need is not a broad launch. The MVP goal is to create a reliable validation program that proves the platform is ready for a limited production pilot with real member data before inviting larger groups.

This PRD defines the readiness requirements, validation layers, user roles, success criteria, and implementation phases needed to avoid a messy launch. The outcome should be a clear go/no-go decision for pilot member import and pilot member invitations.

**Value proposition:** LEAD Talent Platform can become the operating layer for member activation and LEAD SPARK readiness, but only if auth, data quality, permissions, privacy, support, and rollback are validated before real members are invited.

## 2. Mission

Create a production readiness validation system that lets LEAD activate real members quickly, safely, and with confidence.

### Core Principles

1. **Production is for real members.** QA is for internal validation, not real activation.
2. **Move fast without broad blast risk.** Validate with a controlled pilot before scaling.
3. **Company visibility must be explicit.** Members should not appear to companies by default.
4. **Membership and profile data must be trustworthy.** Chapter leaders and admins need a way to verify and correct mistakes.
5. **Evidence beats assumptions.** Every readiness claim should have test output, screenshot, database query, or manual validation notes.
6. **No-go conditions must be respected.** If auth, permissions, visibility, or support paths fail, real invitations pause.

## 3. Target Users

| Persona | Needs | Readiness Concern |
| --- | --- | --- |
| Public Participant | Complete basic profile, view/register/apply for events | Must not need chapter membership for public event participation |
| Member | Claim/update profile, view membership, prepare for LEAD SPARK | Must understand profile completion and company visibility consent |
| Chapter Editor | Validate roster, manage events, review applications, run check-in | Must only access their chapter scope |
| Admin | Manage users, roles, chapters, memberships, identities, events | Must be able to correct activation mistakes |
| Staff / Founder | Have official identity and admin access when appropriate | Must not be forced into chapter/member flows |
| Company Representative | Access invite-only company portal and approved visible talent | Must only see opted-in approved members |
| Alumni | Preserve historical state without active-member confusion | Must not be treated as active or company-visible by default |
| Executive Leadership | Review readiness evidence and decide go/no-go | Needs clear validation status and risk summary |

## 4. MVP Scope

### In Scope

- [ ] Code and documentation inspection for readiness assumptions.
- [ ] Automated local validation through tests, lint, and build.
- [ ] QA manual validation by role using seed users.
- [ ] Production smoke validation for auth, data cleanliness, import dry run, visibility, support, and rollback.
- [ ] Member import mapping from Activation Master Sheet to platform tables.
- [ ] Go/no-go gates for pilot import and pilot member invitations.
- [ ] No-go conditions for unsafe production activation.
- [ ] Evidence capture template for validation results.

### Out Of Scope

- [ ] Full LEAD SPARK event implementation.
- [ ] Full company-facing launch.
- [ ] Broad all-member activation.
- [ ] Full LEAD Pulse integration.
- [ ] Full Impact Metrics dashboard.
- [ ] New self-serve company signup.
- [ ] Resume parsing or semantic talent search.
- [ ] Full production data migration from every chapter.

## 5. User Stories

1. **As Abigail, I want a readiness checklist tied to evidence, so that I can confidently recommend whether production pilot activation should proceed.**

2. **As an executive leader, I want a clear go/no-go framework, so that I can approve member activation without guessing about risk.**

3. **As a chapter leader, I want to validate my roster before members are invited, so that members enter the platform with the correct chapter and role context.**

4. **As a member, I want to claim and update my LEAD profile, so that I can prepare for LEAD SPARK and choose whether companies can see my profile.**

5. **As a company representative, I want access only to approved opted-in talent, so that the talent pool feels curated and trustworthy.**

6. **As an admin, I want to verify and correct users, roles, chapters, memberships, and identities, so that activation mistakes do not block the pilot.**

7. **As a staff/founder user, I want my platform access and LEAD identity to be represented correctly, so that I am not forced into member/chapter workflows.**

8. **As the activation team, I want support and rollback paths documented, so that if something goes wrong we can pause, fix, and communicate clearly.**

## 6. Core Architecture & Patterns

The validation program uses the platform's existing layered account model.

```text
user
  Authenticated account and app role.

person_profile
  Reusable profile and professional fields, including company visibility consent.

chapter_membership
  Chapter relationship, approval status, member ID, and chapter position.

lead_identity
  Official LEAD identity independent from app role.

event
  Event metadata for public, chapter, and LEAD SPARK workflows.

event_registration
  Event registration, application, approval, and check-in state.

recruiter_access
  Invite-only company representative access.
```

### Validation Layers

1. **Layer 1, Code and Docs Inspection**
   Verify that platform design supports the readiness assumptions.

2. **Layer 2, Automated Local Validation**
   Run service tests, lint, and build.

3. **Layer 3, QA Manual Role Validation**
   Use QA seed users to validate role-specific flows.

4. **Layer 4, Production Smoke Validation**
   Verify production-only behavior before real member invitations.

### Existing Patterns To Preserve

- Business logic belongs in `lib/services/`.
- Server actions stay thin.
- Inputs should be validated with Zod.
- RLS and service authorization must protect role boundaries.
- Company visibility requires both approved membership and explicit visibility opt-in.
- Production member activation should not depend on QA seed data.

## 7. Tools And Features

### Readiness Checklist

The checklist must cover:

- Production auth.
- Google OAuth.
- Email/password or magic link, if supported.
- Password reset.
- Production data cleanliness.
- Member import mapping.
- Canonical chapter list.
- Approved membership import safety.
- Editor assignment safety.
- Company visibility opt-in.
- Invite-only company portal.
- Profile update flow.
- Privacy copy.
- Admin/chapter leader verification.
- Support path.
- Rollback path.

### Role-Based QA Matrix

The validation program must include scripts for:

- Public Participant.
- Member.
- Chapter Editor.
- Admin.
- Staff / Founder.
- Company Representative.
- Alumni.

### Member Import Validation

The Activation Master Sheet should map to:

| Spreadsheet Field | Platform Target |
| --- | --- |
| `full_name` | `user.name`, display profile |
| `email` | Auth/user email |
| `chapter` | `chapter.id` lookup |
| `membership_status` | `chapter_membership.status` |
| `chapter_position` | `chapter_membership.position` |
| `is_chapter_editor` | `user.role = 'editor'` only when intended |
| `member_id` | `chapter_membership.member_id` |
| `university` | `person_profile.university` |
| `major_or_interest` | `person_profile.major_or_interest` |
| `graduation_year` | `person_profile.graduation_year` |
| `linkedin_url` | `person_profile.linkedin_url` |
| `portfolio_url` | `person_profile.portfolio_url` |
| `skills` | `person_profile.skills` |
| `company_visibility_opt_in` | `person_profile.is_recruiter_visible`, default false |

### Evidence Capture

Each validation item should capture:

- Environment.
- Tester.
- Date.
- Account used.
- Result.
- Evidence link or note.
- Severity if failed.
- Owner.
- Follow-up issue if needed.

## 8. Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Database/Auth | Supabase |
| Hosting | Vercel |
| Styling | Tailwind CSS |
| UI | Radix UI and local UI components |
| i18n | `next-intl` |
| Testing | Vitest |
| Package Manager | pnpm |
| Validation | Zod |
| CI/CD | GitHub Actions / Vercel workflows |

## 9. Security And Configuration

### Security Requirements

- Google OAuth must work in production before real member activation.
- Production test/QA users must be absent or clearly isolated.
- Company visibility must default to false.
- Public participants must not appear in company talent surfaces.
- Company representatives must require invite-based accepted active access.
- Chapter editors must not access other chapters' private data.
- Staff/founder identity must not accidentally grant admin access without app role.
- Admins must be able to correct activation mistakes.
- Rollback owner and rollback options must be documented.

### Environment Requirements

Production validation must verify:

- Production URL loads.
- Production auth provider configuration.
- Email delivery for reset or magic-link flow.
- Supabase production data cleanliness.
- Canonical production chapter records.
- Production company portal access rules.

### Privacy Requirements

Members must understand:

- Whether their profile is visible to companies.
- What company representatives may see.
- How to opt in or opt out.
- Who to contact if profile/chapter data is wrong.

## 10. API Specification

This PRD does not require new public API routes for MVP. It validates existing platform routes and server actions.

Representative existing surfaces:

| Surface | Purpose |
| --- | --- |
| `/onboarding` | Basic profile completion |
| `/events` and `/events/[id]` | Public event discovery and registration/application |
| `/student` and `/student/profile` | Member dashboard/profile |
| `/chapter` | Chapter editor dashboard |
| `/chapter/events` | Chapter event management |
| `/chapter/events/[id]/applications` | Application review |
| `/chapter/events/[id]/checkin` | Check-in |
| `/admin` | Admin dashboard |
| `/admin/users` | User/role/profile management |
| `/admin/chapters` | Chapter management |
| `/company/dashboard` | Company representative dashboard |
| `/company/browse` | Authorized talent browse |
| `/company/saved` | Saved talent |
| `/recruiter/access?token=...` | Company invite acceptance |

Potential future implementation may add import tooling or activation analytics, but those are not required for the validation PRD unless production import cannot be safely done with existing admin/manual tooling.

## 11. Success Criteria

### MVP Success Definition

The validation MVP succeeds when leadership can make an evidence-backed go/no-go decision for importing pilot chapter members into production and inviting pilot members to claim profiles.

### Required Pass Conditions

- [ ] Production auth works.
- [ ] Google OAuth works in production.
- [ ] Password reset or alternate production login path works.
- [ ] Production data is clean enough for pilot activation.
- [ ] Chapter list is canonical for pilot chapters.
- [ ] Member import mapping is documented.
- [ ] Pilot import dry run succeeds with internal rows.
- [ ] Approved members are imported with correct membership status.
- [ ] Chapter leaders receive editor access only when intended.
- [ ] Company visibility defaults to off.
- [ ] Opted-in approved members can appear to company representatives.
- [ ] Public participants and unapproved members remain hidden.
- [ ] Company representative access is invite-only.
- [ ] Admins can fix common mistakes.
- [ ] Support path exists.
- [ ] Rollback path exists.

### No-Go Conditions

Do not invite real members if:

- Google OAuth or primary production auth is broken.
- Imported members become company-visible by default.
- Company portal exposes public participants or unapproved members.
- Editors can access wrong chapter data.
- Admin cannot fix common data mistakes.
- There is no support path.
- There is no rollback owner.

## 12. Implementation Phases

### Phase 1, Readiness Setup

**Goal:** Prepare validation artifacts and assign owners.

Deliverables:

- [ ] Confirm validation owner list.
- [ ] Confirm QA and production URLs.
- [ ] Confirm seed user availability.
- [ ] Confirm Activation Master Sheet fields.
- [ ] Confirm evidence capture format.

Validation:

- [ ] Validation plan is reviewed by Abigail and operational owners.

### Phase 2, Code And Automated Validation

**Goal:** Verify code-level readiness and automated tests.

Deliverables:

- [ ] Complete code/docs inspection.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build` when appropriate.
- [ ] Record failures and severity.

Validation:

- [ ] P0/P1 failures are either fixed or explicitly accepted before production smoke.

### Phase 3, QA Role Validation

**Goal:** Validate role flows with QA seed users.

Deliverables:

- [ ] Public participant checklist completed.
- [ ] Member checklist completed.
- [ ] Chapter editor checklist completed.
- [ ] Admin checklist completed.
- [ ] Staff/founder checklist completed.
- [ ] Company representative checklist completed.
- [ ] Alumni checklist completed.

Validation:

- [ ] Role-based risks are summarized.
- [ ] P0 issues block production pilot.

### Phase 4, Production Smoke Validation

**Goal:** Validate production-only behavior before real member activation.

Deliverables:

- [ ] Production auth checks completed.
- [ ] Production data cleanliness check completed.
- [ ] Chapter canonical data confirmed for pilot chapters.
- [ ] Import dry run completed with internal rows.
- [ ] Company visibility default and opt-in behavior verified.
- [ ] Support and rollback paths confirmed.

Validation:

- [ ] Go/no-go recommendation produced for pilot import.

### Phase 5, Pilot Activation Decision

**Goal:** Decide whether to import pilot members and invite pilot chapter leaders/members.

Deliverables:

- [ ] Go/no-go summary.
- [ ] Accepted risks.
- [ ] Follow-up issues.
- [ ] Pilot chapter list.
- [ ] Communication plan ready.

Validation:

- [ ] Executive leadership approves, pauses, or requests fixes.

## 13. Future Considerations

- Build a dedicated member import tool with dry-run mode and report output.
- Build activation analytics by chapter.
- Build roster validation UI for chapter leaders.
- Build production support dashboard for activation issues.
- Add LEAD SPARK-specific event registration and talent visibility dashboard.
- Add Impact Metrics fields to events.
- Integrate LEAD Pulse after production member activation stabilizes.
- Add company representative analytics for profile views and saved profiles.

## 14. Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Real members are invited before production auth is stable | High | Production smoke validation is a no-go gate |
| Members become company-visible by default | High | Default visibility false, test import dry run, verify company browse |
| Wrong editor permissions are assigned | High | Chapter leader import requires explicit `is_chapter_editor`; admin spot-checks |
| Public participants appear in company portal | High | Company visibility requires approved membership and opt-in |
| Production data contains QA/test noise | Medium | Run production data cleanliness query before pilot |
| Spreadsheet data is messy | Medium | Pilot only selected chapters, validate rosters before import |
| Support load overwhelms Abigail | Medium | Assign support owner and use issue categories |
| Board expects full launch instead of pilot | Medium | Communicate controlled pilot scope and go/no-go gates |

## 15. Appendix

### Source Document

- `docs/proposals/lead-spark-production-readiness-validation.md`

### Related Documents

- `docs/proposals/lead-spark-member-activation-roadmap.md`
- `docs/proposals/lead-talent-platform-executive-update.md`
- `docs/PRODUCT-SPECIFICATION.md`
- `docs/handbook/TESTING.md`
- `docs/handbook/COMPANY-PORTAL-QA.md`
- `docs/handbook/RECRUITER-PORTAL-RECOVERY.md`
- `docs/adr/001-service-layer-pattern.md`
- `docs/adr/003-newsletter-campaign-architecture.md`

### Recommended GitHub Issue Categories

| Category | Examples |
| --- | --- |
| Auth | Production Google OAuth, password reset, email delivery |
| Data | Chapter canonical list, member import mapping, duplicates |
| Permissions | Editor scope, admin role, company access |
| Company Visibility | Opt-in copy, hidden users, visible talent checks |
| QA | Manual role checklists, evidence capture |
| Support | Support path, issue categories, rollback owner |
| Activation | Pilot invitations, profile claim flow, member comms |

### Suggested GitHub Project Fields

| Field | Type | Options |
| --- | --- | --- |
| Phase | Single select | Readiness Setup, Code Validation, QA Validation, Production Smoke, Pilot Decision |
| Priority | Single select | Critical, High, Medium, Low |
| Type | Single select | Feature, Validation, Bug, Technical, Documentation |
| Complexity | Single select | Small, Medium, Large |
| Environment | Single select | Local, QA, Production |
| Severity | Single select | P0, P1, P2, P3 |

