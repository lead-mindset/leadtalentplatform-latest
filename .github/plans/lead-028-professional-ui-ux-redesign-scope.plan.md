# Plan: LEAD-028 Professional UI/UX Redesign Scope

## Summary

Define a professional redesign scope for LEAD without changing UI code in this issue. The redesign direction should make LEAD feel like a serious, mission-driven student community platform: warm and confidence-building for students and public event participants, restrained and efficient for editors/admins/company representatives. This scope turns the current app audit into a phased roadmap and defers follow-up implementation issues until after review.

## User Story

As the product owner,
I want a professional UI/UX redesign scope,
So that inconsistent student, editor, event, admin, and company sections can be upgraded without destabilizing core workflows.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #29 |
| Type | Spike / Planning |
| Complexity | Small |
| Phase | Strategic Planning |
| Systems Affected | Student/public, events, onboarding, chapter/editor, admin, company portal |
| Implementation Scope | Documentation only |
| Follow-Up Issues | Create after scope review |

## Decisions From Product Review

- #29 is a planning issue only; no UI implementation belongs here.
- Produce this scope document first, review it together, then create follow-up redesign issues.
- Use user-first, workflow-first, Google-inspired clarity.
- Preserve existing service/action/database behavior in every future redesign story.
- Prioritize student/editor/event UX before company portal polish.
- Keep admin/editor/company operational tools restrained and efficient.
- Keep student/public/event surfaces mission-driven: community, growth, leadership, opportunity, and belonging.
- Require light visual QA for major workflow redesigns; do not overburden small polish tasks with screenshot ceremony.

## North Star

LEAD should feel like a credible student leadership community platform, not just an event database.

The redesigned product should help users answer:

- What can I do next?
- What status am I in?
- What does LEAD help me become part of?
- What information is required from me?
- What happens after I take the primary action?

## Design Principles

### 1. Workflow First

Design around complete user journeys, not isolated components. A redesign story should map to a real workflow such as event discovery, event registration, application review, or company talent browsing.

### 2. Mission-Driven Warmth Where It Matters

Student/public/event surfaces should feel welcoming, credible, and community-oriented. They should emphasize belonging, leadership, opportunity, and forward motion without becoming decorative or marketing-heavy.

### 3. Operational Restraint For Tools

Editor, admin, and company surfaces should optimize for repeated work: scanning, filtering, comparing, reviewing, approving, rejecting, and recovering from mistakes.

### 4. Behavior Preservation

Redesign work must wrap the stabilized product, not rewrite its business spine. Existing services, actions, routes, auth guards, and validation should remain intact unless a follow-up issue explicitly scopes backend changes.

### 5. Responsive By Intent

Student/event flows are mobile-first. Editor/admin/company workflows are desktop-density-first, with acceptable mobile behavior for emergency or lightweight use.

### 6. Consistent Shell Before Page Polish

Define shared navigation, page anatomy, action placement, empty/loading/error states, form rhythm, table/list density, and status patterns before deep page redesigns.

## Current Surface Audit

### Student And Public

**Representative routes**

- `app/[locale]/(public)/page.tsx`
- `app/[locale]/events/page.tsx`
- `app/[locale]/events/[id]/page.tsx`
- `app/[locale]/onboarding/page.tsx`
- `app/[locale]/student/page.tsx`
- `app/[locale]/student/events/page.tsx`
- `app/[locale]/student/profile/page.tsx`
- `app/[locale]/student/resume/page.tsx`
- `app/[locale]/student-redesign/page.tsx`

**Observed direction**

- The app already has a student redesign concept route, suggesting useful prior exploration.
- Basic onboarding is now decoupled from chapter membership and should remain a lightweight profile completion path.
- Event detail has meaningful registration/application state but needs stronger hierarchy around next action and status.

**Inconsistencies / risks**

- Student surfaces can feel split between operational forms and community mission.
- Event state language can compete with layout hierarchy.
- QR/status/check-in context needs to be obvious on mobile.
- Existing redesign concept may be more visually expressive than the final MVP needs; harvest the useful hierarchy, not necessarily all visual effects.

**Scope requirements**

- Public event discovery should make event type, chapter host, date/time, availability, and next action scannable.
- Event detail should clearly distinguish open registration vs application-required flows.
- Onboarding should feel like joining the LEAD community, not filling out a database record.
- Student event status should clearly show registered, pending review, rejected, attended, and cancelled states.
- QR/check-in state should be mobile-first and easy to present at the door.

### Events

**Representative routes/components**

- `app/[locale]/events/[id]/_components/EventContent.tsx`
- `components/events/event-registration-checkout.tsx`
- `components/events/apply-modal.tsx`
- `components/events/application-review-card.tsx`
- `app/[locale]/chapter/events/_components/event-form.tsx`
- `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx`

**Observed direction**

- Event foundations are now strong: application questions, answer review, event registration preflight, newsletter subscription, and check-in status have service coverage.
- UI needs to make the stronger model legible to non-technical users.

**Inconsistencies / risks**

- Event detail can visually emphasize cover media while burying state/action clarity.
- Application-based event flows need careful separation from instant registration flows.
- Editor application review can become dense; decision states and answer review should be clearer.

**Scope requirements**

- Primary CTA must reflect the actual user state.
- Event type/status should be visible near the action area.
- Newsletter opt-in should stay present but secondary.
- Application questions should feel native, not bolted on.
- Application review should let editors compare answers, identity/profile context, and decision status without losing event context.

### Chapter / Editor

**Representative routes**

- `app/[locale]/chapter/page.tsx`
- `app/[locale]/chapter/members/page.tsx`
- `app/[locale]/chapter/events/page.tsx`
- `app/[locale]/chapter/events/new/page.tsx`
- `app/[locale]/chapter/events/[id]/page.tsx`
- `app/[locale]/chapter/events/[id]/checkin/page.tsx`
- `app/[locale]/chapter-redesign/*`

**Observed direction**

- Chapter/editor flows now use `chapter_membership` and scoped editor permissions.
- There is a chapter redesign route area, so prior concepts should be reviewed before implementation stories are created.

**Inconsistencies / risks**

- Editor tools need dense management affordances, not student-facing visual drama.
- Roster, approvals, event creation, and check-in are distinct workflows that should not share the exact same layout treatment.
- Bulk approval/rejection and event application review need strong safety and status feedback.

**Scope requirements**

- Editor dashboards should prioritize pending work and next operational actions.
- Member roster should use table/list density with clear status tabs and safe bulk actions.
- Event creation/editing should use predictable sections, validation summaries, and preserved service behavior.
- Check-in should optimize for speed, status clarity, and error recovery.
- Multi-chapter collaboration should be visible on event management and review surfaces.

### Admin

**Representative routes**

- `app/[locale]/admin/page.tsx`
- `app/[locale]/admin/users/page.tsx`
- `app/[locale]/admin/users/[id]/page.tsx`
- `app/[locale]/admin/chapters/page.tsx`
- `app/[locale]/admin/events/page.tsx`
- `app/[locale]/admin/companies/page.tsx`
- `app/[locale]/admin/invites/page.tsx`

**Observed direction**

- Admin has many operational surfaces and should not be redesigned like a marketing dashboard.
- Identity, role, chapter, company, and invite management are now more stable, so visual work can focus on clarity.

**Inconsistencies / risks**

- Admin tables/forms need consistent filters, sorting, destructive-action guards, and status badges.
- Identity/role management can be confusing if public identity and app role are visually conflated.
- Dashboards risk becoming decorative rather than operational.

**Scope requirements**

- Admin should be dense, calm, and boring in the best sense.
- Tables should be scan-first and support filters/search/sort.
- Status badges should use consistent semantics.
- Destructive actions need confirmation and clear disabled states.
- User detail should separate account role, person profile, membership, identity, and company access concepts.

### Company Portal

**Representative routes**

- `app/[locale]/company/(protected)/dashboard/page.tsx`
- `app/[locale]/company/(protected)/browse/page.tsx`
- `app/[locale]/company/(protected)/saved/page.tsx`
- `app/[locale]/company/(protected)/students/[id]/page.tsx`
- `app/[locale]/company/onboard/page.tsx`
- `app/[locale]/recruiter/access/page.tsx`

**Observed direction**

- The portal now uses company representative language in user-facing copy.
- Access is invite-only and authorization is centralized.
- Talent visibility is intentionally conservative: visible profile plus approved chapter membership.

**Inconsistencies / risks**

- Company portal polish is important but should come after student/editor/event MVP UX.
- Internal recruiter terminology remains in code and should not leak back into visible copy.
- Saved/browse/profile flows should feel trustworthy without overbuilding a full CRM.

**Scope requirements**

- Keep language professional: company representative, company portal, saved talent, saved profiles.
- Browse and saved talent should prioritize scanability, profile trust, and clear save/unsave feedback.
- Access/help states should explain invite-only access without routing users into student onboarding.
- Company profile/settings should stay lightweight until the product needs deeper account management.

## Cross-Cutting Standards

### App Shell

- Define consistent role-aware navigation.
- Page header should include title, short context, and primary action.
- Avoid hero-scale typography inside operational panels.
- Keep action placement predictable across workflows.
- Preserve existing route structure unless a follow-up issue explicitly scopes route changes.

### Cards, Tables, And Lists

- Do not use floating page sections as cards.
- Do not nest cards inside cards.
- Use cards for repeated items, bounded tools, modals, and forms.
- Use tables or dense lists for admin/editor/company management workflows.
- Use richer event/student cards only when they improve scanning and decision-making.

### Forms

- Group fields by user intent, not database table.
- Use clear validation near fields and a summary when errors block submission.
- Keep required/optional states obvious.
- Preserve Zod/action/service boundaries.
- Avoid asking for chapter membership in basic onboarding.

### States

Every major redesign story should account for:

- loading
- empty
- error
- unauthorized/access missing
- success/confirmation
- destructive confirmation
- mobile overflow

### Accessibility

- Maintain visible focus states.
- Preserve keyboard navigation for forms, dialogs, tabs, menus, and tables.
- Use accessible labels for icon buttons.
- Keep contrast readable.
- Respect reduced motion where animations are used.

### Visual QA Expectations

Keep this lightweight:

- Major workflow redesigns should include desktop and relevant mobile screenshots or notes.
- Small polish tasks can include a short manual QA note instead.
- Functional validation matters more than screenshot ceremony.

## Redesign Roadmap

### Phase 1: Design Foundations

**Goal:** Create shared rules before page-level polish.

Candidate follow-up story:

- Define LEAD app shell, page anatomy, state patterns, and responsive rules.

Deliverables:

- Shared navigation/header/sidebar behavior.
- Page header/action pattern.
- Status badge taxonomy.
- Form/table/card usage rules.
- Empty/loading/error state patterns.

Validation:

- Review against at least one student page, one editor page, one admin page, and one company page.

### Phase 2: Student And Event MVP Experience

**Goal:** Make students confident about joining, registering, applying, and attending.

Candidate follow-up stories:

- Redesign public event discovery and event detail flow.
- Redesign basic onboarding/profile completion flow.
- Redesign student event registration/status/QR flow.

Validation:

- Mobile-first event discovery and detail review.
- New user can understand onboarding does not require chapter membership.
- Registered/applied/check-in status visible without reading long explanatory text.
- Existing registration/application/onboarding tests remain green.

### Phase 3: Chapter / Editor Operations

**Goal:** Help editors run chapters and events without global access or confusion.

Candidate follow-up stories:

- Redesign chapter editor dashboard and event management.
- Redesign event application review workflow.
- Redesign chapter member roster and approval workflow.
- Redesign event check-in operator flow.

Validation:

- Desktop scanability for roster/application/event tables.
- Same-chapter/editor permission boundaries preserved.
- Application review and check-in behavior tests remain green.
- Bulk actions keep clear success/error feedback.

### Phase 4: Admin Operations

**Goal:** Make back-office management fast, safe, and auditable.

Candidate follow-up stories:

- Redesign admin shell and overview.
- Redesign user detail, role, membership, and identity management.
- Redesign chapter/company/event management tables.

Validation:

- Admin can find user/chapter/company quickly.
- Role vs public identity remains visually distinct.
- Destructive actions have guards and disabled states.
- Desktop tables remain readable without horizontal chaos.

### Phase 5: Company Portal

**Goal:** Make invite-only company representative workflows polished after core student/editor/event UX.

Candidate follow-up stories:

- Redesign company browse/saved talent workflow.
- Redesign company profile detail and resume access.
- Redesign company access/help states.

Validation:

- Company representative copy remains user-facing.
- Internal recruiter schema/service/route names are not renamed accidentally.
- Access checks remain centralized and invite-only.
- Talent visibility remains conservative.

## Success Metrics

These can be manual/qualitative for now:

- A student can find an event and understand the next action in under 30 seconds.
- A new user can complete onboarding without wondering whether chapter membership is required.
- Registration, application, check-in, and attendance status are visible at a glance.
- An editor can review applications and approve/reject without leaving event context.
- An editor can check in attendees quickly and recover from invalid QR/status cases.
- An admin can find a user/chapter/company and understand status at a glance.
- Company representatives can browse/save visible talent without seeing internal recruiter terminology.
- Mobile event registration and QR status work at common phone widths.
- Desktop admin/editor tables are scannable without layout chaos.

## Follow-Up Issue Creation Rules

Create follow-up issues only after this scope is reviewed and accepted.

Each follow-up issue should include:

- workflow name
- target routes/components
- existing behavior to preserve
- relevant tests to keep green
- responsive expectations
- visual QA expectation level
- explicit out-of-scope backend/schema changes unless needed

Avoid component-only issues such as "redesign cards" or "redesign buttons." Prefer workflow issues that can be validated end-to-end.

## Acceptance Criteria Mapping

- [x] Student, chapter/editor, events, admin, and company UI inconsistencies are listed.
- [x] MVP priority puts student/editor/event UX before company polish.
- [x] Future stories are required to preserve existing behavior and validation.
- [x] Mobile and desktop verification expectations are included.

## Out Of Scope For LEAD-028

- UI code changes.
- Component refactors.
- Database/schema changes.
- Service/action behavior changes.
- Route renames.
- Creating follow-up issues before scope review.

## Recommended Next Step

Review this scope with the product owner. After approval, create focused follow-up issues from the roadmap, starting with Phase 1 design foundations and Phase 2 student/event MVP experience.

