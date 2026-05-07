# Issue #91: Minimal Participant Activation Dashboard

GitHub: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/91

## Summary

Replace the current `/student` redirect with a minimal activation dashboard that tells an authenticated participant where they stand: participant, pending chapter review, official member, or alumni. The page should encourage chapter application without blocking event participation, and it must reserve official member language plus member IDs for approved memberships only.

This is a narrow activation slice, not a full student dashboard redesign.

## Context

- Source PRD: `.github/PRDs/participant-onboarding-chapter-activation.prd.md`
- Issue spec: `.github/issues/participant-onboarding-chapter-activation-issues.md`
- Dependencies already handled:
  - #88 stabilized participant protected route access.
  - #90 persists onboarding chapter intent as pending membership.
- Current `/student` page only redirects to `/student/profile`.
- Current `/student` layout already allows authenticated participants and only uses approved `chapter_membership` for member ID/sidebar chapter state.

## Product Decisions

- A user without chapter membership is a participant, not an official member.
- A pending membership means "pending review"; it should not show member ID or official member copy.
- Approved membership is the only dashboard state that can show official LEAD member copy and `member_id`.
- Alumni should see alumni status and event/profile CTAs, without being pushed to apply again.
- If the dashboard shows an "apply to chapter" CTA, it should lead to a real application path. Because the existing `/onboarding` flow redirects completed profiles away, the implementation should use a small dashboard application card with the existing `applyToChapter` action rather than linking to a dead path.

## Relevant Files

- `app/[locale]/student/page.tsx` currently redirects and should become the dashboard server component.
- `app/[locale]/student/layout.tsx` should remain mostly unchanged unless a tiny sidebar/status adjustment is required.
- `lib/services/person-profile.service.ts` already owns reusable profile reads.
- `lib/services/chapter-membership.service.ts` already owns membership/application rules.
- `lib/actions/chapter/apply.ts` already exposes the thin applicant-facing action.
- `app/[locale]/student/events/page.tsx` is the closest UI mirror for cards, badges, buttons, and student route layout.
- `components/global/main-container.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, and `components/ui/badge.tsx` should be reused.

## Out Of Scope

- Analytics, recommendations, stats, or full dashboard widgets.
- New database columns for chapter intent/source.
- New public role names or changing `user.role`.
- Full profile redesign.
- Member ID issuance changes.
- Event registration changes.

## Implementation Tasks

- [x] Create `lib/services/student-dashboard.service.ts`.
  - Add a service method such as `getActivationDashboard(supabase, userId)`.
  - Read the user's `person_profile`.
  - Read chapter memberships with chapter display data.
  - Choose the dashboard state with this priority: approved, pending, alumni, participant.
  - Treat rejected-only membership as participant with the normal apply path.
  - Return a small view model with `status`, `profile`, `membership`, and display-ready chapter/member fields.

- [x] Add `lib/services/__tests__/student-dashboard.service.test.ts`.
  - Cover no membership -> participant.
  - Cover pending -> pending review.
  - Cover approved -> official member and member ID available.
  - Cover alumni -> alumni state without application push.
  - Cover mixed rows so approved wins over pending/rejected, and pending wins over rejected.
  - Keep tests mocked at the Supabase query boundary, matching existing service test patterns.

- [x] Replace `app/[locale]/student/page.tsx` redirect with a server-rendered dashboard.
  - Use `requireUser()`.
  - Call `StudentDashboardService.getActivationDashboard`.
  - Render responsive cards with the existing UI primitives.
  - Show primary CTAs:
    - participant: apply to chapter, browse events, edit profile
    - pending: browse events, my events, edit profile
    - approved: my events, edit profile, member ID/chapter details
    - alumni: browse events, my events, edit profile
  - Never show member ID unless the chosen state is approved and `member_id` exists.

- [x] Add a tiny chapter application CTA component only if needed.
  - Prefer a small client component under the student dashboard slice.
  - Fetch active chapter options in the server page and pass them down.
  - Use the existing `applyToChapter` action.
  - Keep it as one simple chapter selector plus submit button; no proof fields or extra workflow.

- [x] Keep copy crisp and non-confusing.
  - Use "participant" for no chapter state.
  - Use "pending review" for pending membership.
  - Use "official LEAD member" only for approved membership.
  - Use "alumni" for alumni membership.

- [x] Validate.
  - `pnpm vitest run lib/services/__tests__/student-dashboard.service.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`
  - Browser smoke on `/en/student` for at least participant and pending states.

Validation results:

- `pnpm vitest run lib/services/__tests__/student-dashboard.service.test.ts` passed: 1 file, 9 tests.
- `pnpm test` passed: 16 files, 259 tests.
- `pnpm lint` passed with 89 existing warnings and 0 errors.
- `pnpm build` passed.
- Unauthenticated `/en/student` smoke returned a 307 protected-route redirect as expected. Authenticated visual smoke remains for the local browser QA pass.

- [x] Update GitHub.
  - Comment on #91 with the plan path, implemented behavior, and validation results.
  - Keep/add `has-plan`.
  - Create follow-up issues only if testing exposes unrelated legacy dashboard/profile problems.

## Risks And Mitigations

- Risk: "Apply to chapter" becomes a fake CTA.
  - Mitigation: Use the existing `applyToChapter` action from the dashboard if no valid route already exists.

- Risk: Membership display accidentally treats pending users as official members.
  - Mitigation: Centralize state mapping in `StudentDashboardService` and test status priority.

- Risk: Dashboard starts accumulating unrelated widgets.
  - Mitigation: Keep #91 to status, next actions, and membership/profile readiness only.

- Risk: Multiple historical membership rows produce confusing status.
  - Mitigation: Use explicit priority order and prefer approved membership where present.

## Done Criteria

- `/student` no longer redirects directly to profile.
- Participant, pending, approved, and alumni states render with correct copy and CTAs.
- Approved membership is the only state that exposes member ID.
- Service tests cover dashboard state mapping.
- Full validation is recorded on #91.
