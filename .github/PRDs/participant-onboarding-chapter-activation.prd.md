# Participant Onboarding and Chapter Activation PRD

## 1. Executive Summary

LEAD Talent Platform needs a clearer first-run experience for students who create an account. Most students expected to use the app first are already connected to a LEAD chapter, but the current onboarding flow only captures a reusable basic profile and newsletter preferences. It does not ask whether the student is already part of a chapter, wants to apply, or only wants to attend public events.

The MVP goal is to turn onboarding into a low-friction activation flow:

- collect reusable participant profile data once
- immediately capture chapter intent
- create pending chapter membership requests when appropriate
- route users to a minimal participant dashboard that explains their status and next step
- seed enough local published events to make local testing meaningful

This preserves the canonical account model: `user.role = member` remains the standard authenticated account lane, while official LEAD membership is represented by approved `chapter_membership` plus issued `lead_identity`.

## 2. Mission

Create a user-first onboarding and activation path that helps LEAD students understand where they stand, attend events immediately, and move toward official chapter membership without confusion or unnecessary friction.

Core principles:

- Keep onboarding lightweight because most users are already LEAD-affiliated students.
- Do not call users official members until chapter membership is approved.
- Make chapter application immediate, explicit, and reviewable.
- Keep `person_profile`, `chapter_membership`, `lead_identity`, and `event_registration` responsibilities separate.
- Encourage chapter joining without blocking public event participation.

## 3. Target Users

### Current LEAD Chapter Student

Pain points:

- They already belong to LEAD but the app does not ask that.
- They expect the platform to recognize their chapter path.
- They need a clear explanation that verification is pending before member ID issuance.

Needs:

- Fast onboarding
- Chapter selection
- Pending verification status
- Clear path to official member ID

### Prospective LEAD Applicant

Pain points:

- They want to join a chapter but may not know where to start.
- They should not need to find a separate chapter application flow after onboarding.

Needs:

- Simple "I want to apply" option
- Chapter selector
- Pending review status
- Ability to attend events while waiting

### Events-Only Participant

Pain points:

- They want to attend events without being forced into chapter membership.
- They should still be encouraged to join later.

Needs:

- Basic profile
- Event registration access
- Non-blocking chapter CTA

### Chapter Editor/Admin

Pain points:

- They need pending membership requests to appear in existing review queues.
- They should not manually reconstruct applicant context.

Needs:

- Pending `chapter_membership` rows
- Profile data available for review
- No auto-approval from self-claimed membership

## 4. MVP Scope

### In Scope

- [ ] Add chapter intent step to onboarding.
- [ ] Support three choices: already part of chapter, want to apply, events only.
- [ ] Require chapter selection only for the first two choices.
- [ ] Create `chapter_membership.status = pending` for chapter intent choices.
- [ ] Keep both "already part" and "want to apply" as the same pending backend state.
- [ ] Preselect selected chapter newsletter by default.
- [ ] Redirect completed onboarding to `/student`.
- [ ] Replace `/student` redirect with a minimal activation dashboard.
- [ ] Display participant/chapter status without confusing "member" language.
- [ ] Show member ID only for approved memberships.
- [ ] Add 15 published demo events to local seed data.
- [ ] Add focused service/action tests for onboarding chapter intent.

### Out of Scope

- [ ] Adding a new `participant` database role.
- [ ] Adding proof fields for existing chapter membership.
- [ ] Auto-approving claimed chapter members.
- [ ] Adding a new membership intent/source database column.
- [ ] Building a full analytics dashboard.
- [ ] Full redesign of all student routes.
- [ ] Production event campaign data.

## 5. User Stories

1. As a current LEAD chapter student, I want to identify my chapter during onboarding, so that my chapter team can verify my official membership.

2. As a prospective applicant, I want to apply to a chapter during onboarding, so that I do not need to find a separate application flow later.

3. As an events-only participant, I want to skip chapter application, so that I can attend public events without extra friction.

4. As a participant, I want a clear dashboard after onboarding, so that I understand whether I am a participant, pending applicant, approved member, or alumni.

5. As an approved LEAD member, I want to see my member ID only after approval, so that official membership status is not confused with account creation.

6. As a chapter editor, I want onboarding-created chapter requests to appear as pending memberships, so that I can review them using existing tools.

7. As a local tester, I want realistic published events in seed data, so that event browsing and registration flows can be tested immediately.

## 6. Core Architecture

### Current Relevant Files

- `app/[locale]/onboarding/page.tsx`
- `components/onboarding.tsx`
- `lib/actions/student/onboarding.ts`
- `lib/actions/student/onboarding.helpers.ts`
- `lib/memberschema.ts`
- `lib/services/person-profile.service.ts`
- `lib/services/chapter-membership.service.ts`
- `lib/services/newsletter-subscription.service.ts`
- `app/[locale]/student/page.tsx`
- `app/[locale]/student/layout.tsx`
- `app/[locale]/student/events/page.tsx`
- `supabase/seed.sql`
- `messages/en.json`
- `messages/es.json`

### Architecture Approach

Server Actions remain thin:

- authenticate user
- parse and validate form data
- delegate to helper/service functions
- revalidate paths and redirect

Services keep business and database logic:

- `PersonProfileService.upsertBasicProfile`
- `ChapterMembershipService.applyToChapter`
- `NewsletterSubscriptionService.subscribeGlobal`
- `NewsletterSubscriptionService.subscribeToChapters`

No new table is required for MVP.

### Data Model Responsibilities

- `public.user`: auth-linked app user, global access lane, name, email, phone
- `person_profile`: reusable participant profile fields and recruiter visibility preference
- `chapter_membership`: chapter application, pending/approved/rejected/alumni status, chapter position, member ID
- `lead_identity`: official display identity
- `event_registration`: event participation and attendance history

## 7. Tools and Features

### Feature: Chapter Intent Onboarding Step

Add a step after school/interests and before updates/visibility.

Choices:

- "I am already part of a LEAD chapter"
- "I want to apply to a LEAD chapter"
- "I only want to attend events for now"

Behavior:

- First two choices require `selectedChapterId`.
- Events-only choice does not create membership.
- First two choices call `ChapterMembershipService.applyToChapter()`.
- Both produce `chapter_membership.status = pending`.
- No proof fields are requested.

### Feature: Newsletter Default From Chapter Choice

If the user selects a chapter in the chapter intent step:

- include that chapter in `chapterNewsletterIds` by default
- allow the user to uncheck it in the updates step

### Feature: Minimal Participant Dashboard

Replace the current `/student` redirect with a real page.

Dashboard states:

- No chapter selected: "You are set up as a LEAD participant."
- Pending: "Your chapter membership is pending review."
- Approved: "You are an official LEAD member."
- Alumni: "You are listed as LEAD alumni."

Primary CTAs:

- Browse events
- Apply to a chapter
- Edit profile
- View my events
- View member ID only when approved

### Feature: Local Demo Events

Add 15 published events to `supabase/seed.sql`.

Event mix:

- open registration events
- application-based events
- online, in-person, and hybrid events
- varied chapters
- realistic future dates and capacities
- enough data to exercise `/events`, event detail, application, registration, and dashboard links

## 8. Technology Stack

- Framework: Next.js App Router
- Language: TypeScript
- UI: Tailwind CSS 4, Radix UI primitives, custom Shadcn-like components in `components/ui`
- Forms: React Hook Form and Zod
- Database/Auth: Supabase
- Types: `lib/database.generated.ts`
- Tests: Vitest
- Package manager: pnpm
- i18n: `next-intl`

## 9. Security and Configuration

### Auth

- Supabase Auth remains the source of authentication.
- `public.user` remains the app-level account record.
- Server routes use `requireUser`, `requireAdmin`, and chapter-scoped auth helpers.

### Membership Security

- Self-claimed existing chapter membership is never auto-approved.
- Both existing-member claims and new applications create pending membership rows.
- Member IDs are issued only during approval.
- Recruiter visibility remains ineffective until approved chapter membership, because company portal queries require approved membership.

### Local Configuration

Local `.env.local` must point to the active Docker Supabase instance.

Relevant variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_FRONTEND_URL`

## 10. API Specification

No public REST API is required for MVP. Existing server actions and services are used.

### Server Action: `submitOnboarding(formData)`

Location:

- `lib/actions/student/onboarding.ts`

Input form fields:

- `full_name`
- `phone`
- `gender`
- `university`
- `career`
- `graduation_year`
- `skills`
- `linkedin_url`
- `portfolio_url`
- `chapterIntent`
- `selectedChapterId`
- `chapterNewsletterIds`
- `consentRecruiterVisibility`
- `emailNotificationsEnabled`
- `termsAccepted`

Expected behavior:

```ts
type ChapterIntent = 'already_member' | 'apply_to_chapter' | 'events_only'
```

Success:

- upsert user/profile
- optionally create pending chapter membership
- optionally subscribe newsletters
- revalidate relevant paths
- redirect to `/student`

Failure:

```ts
type OnboardingError = {
  error: string
  details?: unknown
}
```

### Service: `ChapterMembershipService.applyToChapter`

Existing method.

Input:

```ts
{
  userId: string
  chapterId: string
  position?: 'member'
}
```

Output:

```ts
{ success: true } | { success: false; error: string }
```

## 11. Success Criteria

MVP is successful when:

- A new authenticated user can complete onboarding and land on `/student`.
- Onboarding asks chapter status clearly.
- Choosing existing chapter membership creates a pending `chapter_membership`.
- Choosing chapter application creates a pending `chapter_membership`.
- Choosing events-only creates no `chapter_membership`.
- Selected chapter newsletter is preselected by default.
- Dashboard clearly labels non-approved users as participants or pending applicants, not official members.
- Approved users see member ID.
- Local events page shows 15 published events after seed reset.
- `pnpm test`, `pnpm lint`, and `pnpm build` pass.

## 12. Implementation Phases

### Phase 1: Plan and Safety Check

Deliverables:

- create implementation plan
- confirm protected participant route access
- confirm current seed and DB assumptions

### Phase 2: Onboarding Chapter Intent

Deliverables:

- extend Zod schema
- update onboarding UI with chapter intent card group
- parse new form fields
- call `ChapterMembershipService.applyToChapter`
- update translations
- update onboarding helper tests

### Phase 3: Participant Dashboard

Deliverables:

- replace `/student` redirect
- query profile and membership state
- render minimal activation dashboard states
- ensure approved-only member ID display

### Phase 4: Local Event Seed and Validation

Deliverables:

- add 15 published events
- optional application questions for application-based seed events
- run local seed reset when Docker is available
- run validation commands

## 13. Future Considerations

- Add `chapter_membership.application_intent` if operational teams need to distinguish existing-member claims from new applicants.
- Add richer dashboard modules: past events, recommendations, chapter announcements, and profile completeness.
- Add chapter-specific onboarding copy or landing pages.
- Add admin/editor verification notes.
- Add analytics on onboarding conversion from participant to applicant to approved member.
- Add email notifications for pending, approved, and rejected membership states.

## 14. Risks and Mitigations

### Risk: Confusing `user.role = member` With Official Membership

Mitigation:

- use "Participant" in UI before approval
- show "Official LEAD member" only for approved chapter membership
- do not issue/show member ID until approval

### Risk: Onboarding Becomes Too Heavy

Mitigation:

- use one simple card group
- no proof fields
- allow events-only path
- keep chapter selection conditional

### Risk: Self-Claimed Members Appear Official

Mitigation:

- self-claims create pending rows only
- approval remains editor/admin controlled
- member ID generated only on approval

### Risk: Recruiter Visibility Privacy Mistake

Mitigation:

- keep company portal requirement for approved membership
- explain visibility preference in onboarding
- allow preference to be saved early but not effective until approval

### Risk: Demo Event Seed Diverges From Real Schema

Mitigation:

- seed only columns present in generated types/migrations
- validate with Docker Supabase reset when available
- keep event seed data realistic but minimal
