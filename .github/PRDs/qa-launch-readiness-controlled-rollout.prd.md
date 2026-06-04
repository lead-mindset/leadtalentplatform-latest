# PRD: QA Launch Readiness Controlled Rollout

## 1. Executive Summary

The QA validation review surfaced 112 observations across public, auth, onboarding, participant/member, chapter, admin/staff, company/recruiter, and alumni workflows. The most important conclusion is not that the platform needs cosmetic polish. The platform needs a controlled launch stabilization pass before presidents or vice presidents receive broad operational access.

This PRD defines the first controlled rollout scope for LEAD Talent Platform after the QA review. It focuses on the roles and routes that matter for the next launch decision:

- Public Participant
- Member
- Chapter Editor / President / Vice President
- Admin
- Staff

Recruiter/company and Alumni are intentionally deferred for this launch slice. They remain important, but QA showed that they need separate product decisions and should not distract from stabilizing account, event, chapter, admin, and Spanish-first product quality.

MVP goal: make the Spanish-first launch-critical platform safe, coherent, and operationally usable for a controlled pilot with central operators and a small number of chapter leaders.

## 2. Mission

Prepare LEAD Talent Platform for a controlled chapter-operations pilot without encoding unclear business assumptions.

Core principles:

- Valid sessions should never be destroyed because of authorization failure.
- Chapter affiliation is membership data, not an editable profile preference.
- Event eligibility must be enforced in services/API and reflected in UI.
- Admin/staff operations must work before chapter leaders are activated.
- Chapter leadership assignment must use scoped permissions, not broad global role shortcuts.
- Staff/Admin and chapter leadership boundaries follow `docs/handbook/PILOT_ROLE_PERMISSION_MATRIX.md`.
- This version is Spanish-first. English polish comes later.
- Recruiter/company and Alumni stay deferred until the core launch workflow is stable.
- UI consistency comes from tightening the existing design system into a launch UI contract, not replacing it.

## 3. Target Users

### Public Participant

Wants to create a profile and register for public events without being forced into chapter membership.

### Member

Wants accurate member identity, event registration, ticket/QR status, profile editing, and chapter status without accidentally corrupting chapter affiliation.

### Chapter Editor / President / Vice President

Wants to land in the chapter-management workspace, manage events, review operational data, and use visible table actions without hunting through a student dashboard.

### Admin

Wants reliable user, chapter, role, and event management before granting chapter leaders access.

### Staff

Needs a LEAD staff identity and operational support access, but should not automatically receive unrestricted system authority unless explicitly granted.

Staff identity is a `lead_identity` decision. Admin access is a `public.user.role` or future explicit permission decision. The launch should not infer one from the other.

### Deferred Users

Recruiters/company representatives and Alumni are out of first controlled launch scope except for safe route handling and non-destructive guardrails.

## 4. MVP Scope

### In Scope

- [ ] Safe authorization behavior for restricted routes.
- [ ] Chapter leader landing behavior for chapter operators.
- [ ] Read-only chapter affiliation in member/alumni profile editing.
- [ ] Admin user table recovery and clear error/empty states.
- [ ] Real chapter leadership assignment flow using chapter-scoped role assignment and permission grants.
- [ ] Event eligibility enforcement in service/API and UI.
- [ ] Registration cancellation and ticket lifecycle fixes for member event workflows.
- [ ] Stronger password policy and Spanish-first auth validation messages.
- [ ] Organization/contact form must capture a required email and optional phone/WhatsApp.
- [ ] Spanish-first cleanup for active launch routes.
- [ ] Short launch UI contract for buttons, headers, forms, tables, modals, states, and mobile overflow.
- [ ] Visual/browser QA loop for launch-critical active routes.

### Out of Scope

- [ ] Full recruiter/company portal stabilization.
- [ ] Full Alumni product definition and dashboard redesign.
- [ ] English locale polish.
- [ ] Full formal design system rebuild.
- [ ] Large visual redesign of non-launch routes.
- [ ] Multi-chapter membership support.
- [ ] New analytics or campaign systems.

## 5. User Stories

1. As a public participant, I want a Spanish-first public/auth/onboarding flow, so that I can understand how to create my profile and register for LEAD events.
2. As a logged-in participant, I want restricted admin/chapter/company routes to redirect safely when I lack access, so that I do not lose my valid session.
3. As a chapter member, I want my chapter affiliation to be displayed as official membership data, so that I cannot accidentally corrupt my chapter status from profile editing.
4. As a member, I want event registration, cancellation, history, dates, and QR/ticket state to behave predictably, so that I can manage attendance without support.
5. As an alumni-status user, I should not be able to register for active-member-only events, so that member-only programming and check-in access remain protected.
6. As a chapter leader, I want to land directly in the chapter dashboard, so that I can start managing chapter operations without searching through member pages.
7. As a chapter leader, I want event-management tables to keep key actions visible, so that I can edit, preview, publish, and manage events without horizontal-scroll traps.
8. As an admin, I want the user management table to load real users with useful filters and error states, so that I can manage roles and accounts before launch.
9. As an admin, I want to assign chapter leaders through a real scoped-permission workflow, so that leadership access maps to chapter responsibility and permission grants.
10. As staff, I want my staff identity to be clear without implying unrestricted admin control, so that operational support access remains intentional.
11. As a platform operator, I want all active launch routes to use Spanish copy, so that the first rollout feels coherent and local to the audience.
12. As a platform operator, I want a short launch UI contract, so that future fixes reuse the existing design system consistently.
13. As a QA reviewer, I want screenshots, route checks, and seeded-persona validation, so that launch readiness is proven visually and behaviorally.

## 6. Core Architecture

The stabilization must preserve the existing service-layer architecture:

- Business rules live in `lib/services/`.
- Server actions validate input, check auth, and call services.
- UI reflects service decisions but does not own authorization or eligibility truth.
- Supabase generated types remain canonical.
- The layered account model remains the source of truth:
  - `public.user` owns auth-linked account and global app role.
  - `person_profile` owns reusable profile fields.
  - `chapter_membership` owns chapter affiliation and lifecycle.
  - `chapter_role_assignment` owns official chapter responsibility.
  - `chapter_permission_grant` owns product capability.
  - `lead_identity` owns official LEAD identity display.
  - `recruiter_access` remains invite-only and separate.

Pilot role and permission matrix source: `docs/handbook/PILOT_ROLE_PERMISSION_MATRIX.md`.

## 7. Tools and Features

### Safe Authorization and Landing

- Anonymous users still redirect to login.
- Authenticated users with the wrong role or permission do not get signed out.
- Wrong-role users redirect to an unauthorized page or their correct workspace with a clear Spanish message.
- Chapter operators should land on `/es/chapter` by default.

### Membership Integrity

- Profile editing can update personal and contact fields.
- Chapter affiliation is read-only when it comes from `chapter_membership`.
- Chapter transfer is an admin/support workflow, not a profile edit.

### Event Eligibility and Registration

- Service/API checks block ineligible registration attempts.
- UI disables blocked registration actions with Spanish explanations.
- Active-member-only events should not create valid QR check-in access for alumni.
- Cancel registration must update registration state and refresh the member event view.

### Admin and Chapter Leadership Operations

- Admin users table must load users, filters, and clear error/empty states.
- Staff should have a restricted or explicitly granted operational boundary.
- Assign Editors becomes a real chapter-leadership assignment flow.
- Assignments should use `chapter_role_assignment` and `chapter_permission_grant`, not global role shortcuts.
- President and Vice President are chapter leadership authorities for their own chapter during the pilot.
- Chapter Editor is an operator role and does not automatically receive protected leadership authority.
- Regular e-board users receive only the explicit chapter permission grants needed for their scope.

### Spanish-First Launch Routes

Active Spanish routes must avoid English labels, visible English metadata, placeholder text, and mixed-language validation where the application can control it.

Launch route scope:

- Public landing
- Auth/register/login/recover password
- Onboarding
- Participant/member dashboard
- Events
- Chapter dashboard
- Admin/staff console

### Launch UI Contract

The existing global CSS, Tailwind tokens, and `components/ui` primitives remain the base. The missing layer is a short contract that defines how launch pages use them.

The contract should cover:

- Button intent and allowed variants.
- Page header anatomy.
- Form labels, required indicators, validation, loading, success, and error states.
- Table action visibility and mobile behavior.
- Modal and destructive-confirmation behavior.
- Empty/loading/error/success state language.
- No mobile overflow or incoherent overlap.

Launch contract source: `docs/handbook/LAUNCH_UI_STANDARD.md`.

## 8. Technology Stack

- Next.js 15 App Router
- React 19
- Supabase Auth and Postgres
- Service layer in `lib/services`
- Thin server actions in `lib/actions`
- Tailwind CSS 4
- Radix UI primitives and existing Shadcn-like `components/ui`
- `next-intl` locale routing
- Vitest for service/action behavior
- Playwright for launch-route seeded-persona and visual validation

## 9. Security and Configuration

- Authorization failures should not call sign-out.
- Role and permission checks should be centralized in services/helpers where possible.
- Password validation should be strengthened to minimum 8 characters with at least one letter, one number, and one symbol unless a stronger Supabase-level policy is already configured.
- Event eligibility must be enforced server-side before registration creation.
- Destructive actions, including access revocation or registration cancellation, require clear confirmation or safe state transition.

## 10. API and Action Specification

The exact function names may change, but the implementation should expose these behaviors:

- Resolve post-login workspace for chapter operators, admin, staff, member, and participant.
- Authorize restricted route access without mutating session state.
- Read and render chapter membership affiliation as read-only profile data.
- Evaluate event registration eligibility before create/reactivate.
- Cancel an event registration for the authenticated owner when allowed.
- List admin users with search, filters, pagination, and error handling.
- Assign chapter leadership responsibility and permission grants.
- Validate signup password requirements before creating accounts.
- Submit contact form with required return email and optional phone/WhatsApp.

## 11. Success Criteria

- A valid logged-in user who visits a restricted route without permission is redirected safely and remains logged in.
- Chapter operators land in the chapter workspace by default.
- Members and alumni cannot edit official chapter affiliation through profile forms.
- Admin can view real users instead of `No users found` when users exist.
- Admin can assign chapter leaders using scoped role/permission records.
- Alumni cannot register for active-member-only events or receive valid QR check-in for those events.
- Member registration cancellation changes state and refreshes UI.
- Active Spanish routes no longer show launch-visible English labels or placeholder copy.
- Tables on launch-critical routes expose primary actions without requiring hidden horizontal scroll.
- The launch UI contract exists and is used by the stabilization work.
- Seeded-persona QA validates participant, member, president/VP/editor, admin, staff, and deferred-role route boundaries.

## 12. Implementation Phases

### Phase 0: Alignment and Contracts

- Finalize controlled launch scope.
- Publish launch UI contract.
- Confirm Spanish-first active route scope.
- Keep Recruiter/company and Alumni deferred.

### Phase 1: Safety Blockers

- Safe restricted-route behavior.
- Chapter affiliation read-only.
- Event eligibility enforced in service/API.
- Stronger password validation.

### Phase 2: Operations Blockers

- Admin user table recovery.
- Chapter leadership assignment flow.
- Chapter operator landing behavior.
- Staff/admin boundary support.

### Phase 3: User Flow Stabilization

- Auth feedback and recovery states.
- Contact form return channel.
- Event registration cancellation, history, dates, and ticket/QR state.
- Chapter event-management table/action visibility.

### Phase 4: Spanish-First UI QA

- Spanish copy sweep for launch routes.
- Empty/error/loading/success state cleanup.
- Mobile/table overflow pass.
- Browser screenshot validation and readiness report.

## 13. Future Considerations

- Alumni product definition and dashboard redesign.
- Recruiter/company portal recovery.
- English locale polish and bilingual content governance.
- Full design-system documentation with examples.
- Chapter transfer request workflow.
- Alumni-specific events and re-engagement.
- Staff permission tiers beyond initial restricted/admin-granted access.

## 14. Risks and Mitigations

### Risk: The scope becomes another broad polish effort

Mitigation: keep the rollout limited to launch blockers and active Spanish routes.

### Risk: UI-only fixes leave backend access unsafe

Mitigation: service/API enforcement is required for eligibility and authorization.

### Risk: Staff/Admin ambiguity creates over-permissioned users

Mitigation: treat staff identity separately from app-level admin authority; grant explicit access.

### Risk: Alumni and Recruiter issues distract from launch

Mitigation: defer both and only preserve safe route handling.

### Risk: Design-system work grows too large

Mitigation: create a short launch UI contract using existing tokens/components instead of rebuilding the system.

## 15. Further Notes

Source materials:

- `docs/proposals/qa-validation-synthesis-2026-06-03.md`
- `docs/handbook/LAUNCH_UI_STANDARD.md`
- `docs/handbook/PILOT_ROLE_PERMISSION_MATRIX.md`
- `docs/PRODUCT-SPECIFICATION.md`
- `docs/handbook/TESTING.md`
- `docs/adr/001-service-layer-pattern.md`
