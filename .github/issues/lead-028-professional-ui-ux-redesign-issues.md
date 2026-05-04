# LEAD-028 Professional UI/UX Redesign Follow-Up Issues

Source scope: `.github/plans/lead-028-professional-ui-ux-redesign-scope.plan.md`

Parent issue: #29 `LEAD-028: Create Professional UI/UX Redesign Scope`

## Creation Rules

- Create workflow-based issues, not component-only issues.
- Preserve existing routes, services, actions, auth guards, and validation unless the issue explicitly scopes a backend change.
- Keep student/event flows mobile-first.
- Keep editor/admin/company workflows desktop-density-first with acceptable mobile behavior.
- Use light visual QA for major workflow redesigns and functional validation as the primary completion bar.

## Issues

### 1. Task: Define LEAD app shell, page anatomy, and responsive state patterns

**Type:** Technical / Design Foundation
**Complexity:** Medium
**Labels:** `LEAD`, `design`, `frontend`, `architecture`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Define the shared UI rules that future redesign work should follow before page-level polish begins. This issue should establish the app shell, page anatomy, status/state patterns, and responsive expectations that apply across student, editor, admin, and company surfaces.

**Acceptance Criteria**

- [ ] Given the current role-based app, when shell guidance is complete, then navigation/header/sidebar behavior is defined for student, editor, admin, and company contexts.
- [ ] Given page-level redesign stories, when they start, then they can reference a common page header/action pattern.
- [ ] Given status-heavy workflows, when UI patterns are defined, then status badge semantics are documented.
- [ ] Given forms/tables/cards, when redesign stories start, then usage rules prevent nested-card and card-heavy operational layouts.
- [ ] Given responsive requirements, when patterns are complete, then mobile-first vs desktop-density expectations are documented.

**Dependencies**

- Blocked by: #29
- Blocks: student/event/editor/admin/company redesign implementation issues.

---

### 2. Task: Redesign public event discovery and event detail flow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `events`, `student`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign public event discovery and event detail so students quickly understand what an event is, who hosts it, whether they can register/apply, and what action to take next.

**Acceptance Criteria**

- [ ] Given public event discovery, when a student browses events, then event type, host chapter, date/time, availability, and next action are scannable.
- [ ] Given event detail, when a student views an event, then registration-open, application-required, live, and past states are visually clear.
- [ ] Given unauthenticated users, when they attempt to register/apply, then login routing behavior is preserved.
- [ ] Given authenticated users without a profile, when they attempt to register/apply, then onboarding routing remains intact.
- [ ] Given mobile widths, when event discovery/detail is reviewed, then the primary CTA and status remain visible without layout overlap.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns.
- Preserves behavior from #15.

---

### 3. Task: Redesign basic onboarding and profile completion flow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `onboarding`, `student`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign the basic onboarding flow so it feels like joining the LEAD community while preserving the current person_profile and newsletter-only foundation.

**Acceptance Criteria**

- [ ] Given a new main-login user, when onboarding starts, then the flow communicates basic profile completion without implying chapter membership is required.
- [ ] Given profile fields, when the user completes onboarding, then existing PersonProfileService and NewsletterSubscriptionService behavior is preserved.
- [ ] Given newsletter choices, when the user saves onboarding, then global and chapter-interest choices remain clear and secondary to profile completion.
- [ ] Given validation errors, when fields fail, then errors are visible near fields and do not obscure the stepper flow.
- [ ] Given mobile widths, when onboarding is reviewed, then form controls remain readable and tappable.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns.
- Preserves behavior from #14 and #59-#62.

---

### 4. Task: Redesign student event registration, status, and QR flow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `events`, `student`, `qr`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign the student-owned event journey after registration/application so status, QR/check-in state, and next steps are obvious on mobile.

**Acceptance Criteria**

- [ ] Given a registered student, when they view their event status, then registered, pending review, rejected, cancelled, attended, and checked-in states are clear.
- [ ] Given QR-enabled check-in, when the student needs to present a QR code, then it is easy to find and use on a phone.
- [ ] Given application-based events, when a student is pending or rejected, then status messaging explains what happened without long text.
- [ ] Given existing event registration/check-in services, when UI changes are complete, then behavior and tests remain unchanged.
- [ ] Given common phone widths, when visual QA runs, then status and QR content do not overlap or overflow.

**Dependencies**

- Blocked by: issue 2 event discovery/detail flow.
- Preserves behavior from event registration and check-in foundations.

---

### 5. Task: Redesign chapter editor dashboard and event management

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `chapter`, `editor`, `events`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign the chapter editor dashboard and event management surfaces around pending work, event operations, and scoped editor permissions.

**Acceptance Criteria**

- [ ] Given an editor with approved chapter membership, when they open chapter tools, then pending approvals, upcoming events, applications, and check-in needs are prioritized.
- [ ] Given event list/create/edit workflows, when redesign is complete, then editor-scoped permissions and collaboration behavior are preserved.
- [ ] Given dense event management data, when viewed on desktop, then filters, statuses, and primary actions are scannable.
- [ ] Given validation errors in event forms, when save fails, then field-level and summary feedback are clear.
- [ ] Given mobile access, when editor pages are viewed, then critical actions remain usable even if desktop is the primary target.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns.
- Preserves behavior from editor scoping and event foundations.

---

### 6. Task: Redesign event application review workflow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `events`, `editor`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign event application review so editors can compare applicant context, answers, and decision state without leaving event context.

**Acceptance Criteria**

- [ ] Given an application-based event, when an editor opens review, then pending, approved, and rejected queues are clearly separated.
- [ ] Given application answers, when an editor reviews a candidate, then profile context and answers are readable without excessive scrolling.
- [ ] Given approve/reject actions, when an editor acts, then success/error feedback is clear and existing service behavior is preserved.
- [ ] Given bulk actions, when available, then selected counts and destructive/irreversible implications are obvious.
- [ ] Given desktop review, when visual QA runs, then application cards/tables remain scannable.

**Dependencies**

- Blocked by: issue 5 editor event management.
- Preserves behavior from event application foundations.

---

### 7. Task: Redesign chapter member roster and approval workflow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `chapter`, `editor`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign the chapter roster and approval workflow around chapter_membership status, member position, bulk approval, rejection, and safe status feedback.

**Acceptance Criteria**

- [ ] Given pending applicants, when an editor opens the roster, then pending, approved, rejected, and alumni states are easy to distinguish.
- [ ] Given approved members, when roster rows are shown, then chapter, position, member ID, and profile summary are clear.
- [ ] Given approval/rejection actions, when an editor acts, then same-chapter authorization behavior is preserved.
- [ ] Given bulk approval, when multiple applicants are selected, then selected count and skipped/failure states are visible.
- [ ] Given desktop density, when the roster is reviewed, then the table/list does not become a card-heavy layout.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns.
- Preserves behavior from chapter membership foundations.

---

### 8. Task: Redesign event check-in operator flow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `events`, `editor`, `qr`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign the editor check-in workflow for fast scanning, attendee status clarity, and recovery from invalid QR or invalid registration state.

**Acceptance Criteria**

- [ ] Given an editor opens check-in, when the event is active, then scanning/manual lookup paths are obvious.
- [ ] Given valid QR codes, when scanned, then success feedback and attendee status update are immediate and clear.
- [ ] Given invalid, duplicate, rejected, cancelled, or pending-review registrations, when scanned, then the error state explains the problem.
- [ ] Given check-in stats, when operating at the door, then registered/attended counts are visible without clutter.
- [ ] Given mobile/tablet use, when visual QA runs, then the operator flow remains usable at common device widths.

**Dependencies**

- Blocked by: issue 5 editor event management.
- Preserves behavior from LEAD-020 check-in stabilization.

---

### 9. Task: Redesign admin shell and overview

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `admin`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign the admin shell and overview as a calm operational back-office surface focused on status, queues, and safe navigation.

**Acceptance Criteria**

- [ ] Given an admin opens the dashboard, when data loads, then pending invites, pending approvals, users, chapters, companies, and events are understandable at a glance.
- [ ] Given admin navigation, when moving between management sections, then the shell and page headers remain consistent.
- [ ] Given operational stats, when displayed, then they avoid decorative dashboard noise.
- [ ] Given loading/error states, when admin data fails, then recovery paths are clear.
- [ ] Given desktop use, when visual QA runs, then overview density supports scanning without card clutter.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns.

---

### 10. Task: Redesign admin user detail, role, membership, and identity management

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `admin`, `identity`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign admin user detail so account role, person profile, chapter membership, LEAD identity, and company access remain visually distinct.

**Acceptance Criteria**

- [ ] Given an admin views a user, when profile data loads, then account role, person profile, chapter membership, and LEAD identity are clearly separated.
- [ ] Given identity issuance, revocation, and primary selection, when admin acts, then existing identity service behavior is preserved.
- [ ] Given role changes, when admin edits a role, then editor eligibility requirements remain clear and enforced.
- [ ] Given missing person_profile or chapter_membership, when displayed, then empty states are explicit and non-alarming.
- [ ] Given destructive or privileged actions, when triggered, then confirmation and feedback are clear.

**Dependencies**

- Blocked by: issue 9 admin shell and overview.
- Preserves behavior from LEAD-017 and LEAD-021.

---

### 11. Task: Redesign admin chapter, company, and event management tables

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `admin`, `chapter`, `events`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign admin management tables for chapters, companies, and events with consistent filters, sorting, status badges, safe deletion states, and clear row actions.

**Acceptance Criteria**

- [ ] Given admin table pages, when loaded, then filters/search/sort controls follow a consistent layout.
- [ ] Given row actions, when admin edits/deletes/manages related records, then disabled and destructive states are clear.
- [ ] Given chapter/company/event statuses, when shown, then badge language and color semantics are consistent.
- [ ] Given empty states, when no records match filters, then the path to create or clear filters is obvious.
- [ ] Given desktop tables, when visual QA runs, then columns remain readable without horizontal chaos.

**Dependencies**

- Blocked by: issue 9 admin shell and overview.

---

### 12. Task: Redesign company browse and saved talent workflow

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `recruiter`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign company representative browse and saved talent workflows after core student/editor/event redesign work, preserving invite-only access and conservative talent visibility.

**Acceptance Criteria**

- [ ] Given a company representative opens browse, when profiles load, then visible talent is scannable by profile, chapter, skills, and graduation year.
- [ ] Given saved talent, when profiles are saved or unsaved, then feedback is clear and existing save behavior is preserved.
- [ ] Given ineligible or invisible profiles, when browsing, then they do not appear.
- [ ] Given user-facing copy, when redesign is complete, then visible language says company representative/company portal/saved talent rather than recruiter.
- [ ] Given desktop use, when visual QA runs, then list/table density supports repeated browsing.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns and recommended after student/editor/event MVP redesign.
- Preserves company access behavior from LEAD-027 recovery.

---

### 13. Task: Redesign company profile detail and resume access

**Type:** Enhancement
**Complexity:** Medium
**Labels:** `LEAD`, `frontend`, `design`, `recruiter`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign company representative profile detail so profile trust, resume access, chapter context, and save state are clear without turning the portal into a full CRM.

**Acceptance Criteria**

- [ ] Given a company representative opens a profile, when data loads, then profile summary, chapter membership context, skills, links, and resume availability are clear.
- [ ] Given resume access, when downloading or opening a resume, then existing authorization and signed URL behavior are preserved.
- [ ] Given save/unsave state, when viewed on detail, then the state is visible and consistent with browse/saved lists.
- [ ] Given invisible or unauthorized profiles, when accessed directly, then existing access-denied behavior is preserved.
- [ ] Given user-facing copy, when redesign is complete, then internal recruiter terminology does not leak.

**Dependencies**

- Blocked by: issue 12 company browse and saved talent workflow.

---

### 14. Task: Redesign company access and invite help states

**Type:** Enhancement
**Complexity:** Small
**Labels:** `LEAD`, `frontend`, `design`, `recruiter`, `routing`, `phase:active-piv-loop`, `piv-status:plan-ready`

**Description**

Redesign company access, invite acceptance, and missing-access help states so company representatives understand invite-only access without being routed into student onboarding.

**Acceptance Criteria**

- [ ] Given missing, inactive, revoked, or expired access, when a signed-in company representative reaches company routes, then the help state explains the issue clearly.
- [ ] Given invite acceptance, when a representative uses `/recruiter/access?token=...`, then visible copy says company access and existing route behavior is preserved.
- [ ] Given legacy company onboarding paths, when reached, then they remain compatibility/help states rather than duplicate mutation paths.
- [ ] Given user-facing copy, when redesign is complete, then company representative terminology is used consistently.
- [ ] Given mobile widths, when help states are reviewed, then support/action content remains readable.

**Dependencies**

- Blocked by: issue 1 app shell/design patterns.
- Preserves company access behavior from LEAD-027 recovery.

## Created Issues

| Issue | Title |
|-------|-------|
| #74 | Task: Define LEAD app shell, page anatomy, and responsive state patterns |
| #75 | Task: Redesign public event discovery and event detail flow |
| #76 | Task: Redesign basic onboarding and profile completion flow |
| #77 | Task: Redesign student event registration, status, and QR flow |
| #78 | Task: Redesign chapter editor dashboard and event management |
| #79 | Task: Redesign event application review workflow |
| #80 | Task: Redesign chapter member roster and approval workflow |
| #81 | Task: Redesign event check-in operator flow |
| #82 | Task: Redesign admin shell and overview |
| #83 | Task: Redesign admin user detail, role, membership, and identity management |
| #84 | Task: Redesign admin chapter, company, and event management tables |
| #85 | Task: Redesign company browse and saved talent workflow |
| #86 | Task: Redesign company profile detail and resume access |
| #87 | Task: Redesign company access and invite help states |
