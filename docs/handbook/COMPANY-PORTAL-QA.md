# Company Portal Manual QA Checklist

Manual QA checklist for invite-only company representative flows. Use this after company portal, invite, route, or talent visibility changes. Keep the evidence outcome-based; screenshots are optional and should not be required.

## Scope

This checklist validates:

- Company representative invite creation and acceptance.
- Active, missing, inactive, revoked, and expired access states.
- Canonical `/company/*` portal routes.
- Legacy invite/help compatibility.
- Talent browse, saved profiles, profile detail, save/unsave, and resume download authorization.
- Visibility rules for approved and hidden/unapproved talent.

This checklist does not replace service tests. It is a smoke-level manual pass over the user-visible flows.

## Automated Local Readiness

Before manual QA, run the local readiness harness:

```bash
pnpm company-portal:readiness
```

Expected result:

- Company visibility returns only approved opted-in talent.
- Hidden, public participant/no-membership, pending, rejected, and alumni-only users stay hidden.
- Active accepted company representative access is allowed.
- Missing, inactive, revoked, and expired access states are denied.
- Disposable local rows are cleaned up after the run.

This harness is local Docker only. It must not be pointed at QA or production.

## Prerequisites

- Run against local or staging unless a dedicated production QA company and test users exist.
- Production validation must use a dedicated production QA company and controlled test accounts only, not real candidates.
- Use a fresh browser profile or incognito window for invite acceptance and email mismatch checks.
- Start from seeded local Supabase data or equivalent staging fixtures.
- Confirm an admin account can access invite/company management.
- Create or identify one company and one company representative invite.
- Create or identify one visible approved candidate:
  - `person_profile.is_recruiter_visible = true`
  - approved `chapter_membership`
  - resume attached if testing download
- Create or identify one hidden/unavailable candidate:
  - `person_profile.is_recruiter_visible = false`, or
  - pending/rejected/no approved `chapter_membership`
- Do destructive access-state checks only in local or staging.

## Invite Creation

- [ ] From admin invite UI, create a company representative invite for a test email.
  - Expected: invite is created for the selected company.
  - Expected: invite URL uses `/recruiter/access?token=...`.
- [ ] Open the invite link while signed out.
  - Expected: page asks the invited user to sign in before accepting.
- [ ] Sign in with a different email than the invite email.
  - Expected: access is denied with an email mismatch outcome.
  - Expected: `recruiter_access` is not accepted by the wrong account.
- [ ] Sign in with the invited email.
  - Expected: invite is accepted.
  - Expected: `public.user.role = 'recruiter'`.
  - Expected: `recruiter_access.accepted_at` and `accepted_by_user_id` are set.
  - Expected: user lands on `/company/dashboard`.

## Legacy Invite Compatibility

- [ ] Open `/company/onboard?inviteToken=<valid-token>` for an unaccepted invite.
  - Expected: page shows a compatibility/help state.
  - Expected: primary action points to `/recruiter/access?token=...`.
  - Expected: access is not activated from `/company/onboard`.
- [ ] Open `/company/onboard` without a token.
  - Expected: page shows company access/help state.
  - Expected: user is not routed to student onboarding.
- [ ] Open `/company/onboard?inviteToken=<invalid-token>`.
  - Expected: page shows invite/help issue state.
  - Expected: access is not activated.

## Company Login And Access States

- [ ] Sign in as a company representative with active accepted access.
  - Expected: login succeeds and reaches `/company/dashboard`.
- [ ] Sign in as a company representative test user without active accepted `recruiter_access`.
  - Expected: user lands on `/company/onboard?access=missing` or equivalent company access/help state.
  - Expected: user is not routed to `/onboarding`.
- [ ] Local/staging only: set accepted access `is_active = false`, then sign in.
  - Expected: company portal access is denied.
  - Expected: user lands on company access/help state.
- [ ] Local/staging only: set `revoked_at` on accepted access, then sign in.
  - Expected: company portal access is denied.
  - Expected: user lands on company access/help state.
- [ ] Local/staging only: set invite `invite_expires_at` to a past timestamp before acceptance.
  - Expected: invite cannot be accepted.
  - Expected: invite/help state explains the access issue.

## Canonical Route Compatibility

- [ ] Visit `/company/dashboard` as an active company representative.
  - Expected: dashboard loads.
- [ ] Visit `/company/browse`.
  - Expected: canonical browse page loads.
- [ ] Visit `/company/saved`.
  - Expected: canonical saved profiles page loads.
- [ ] Visit `/company/students/<visible-candidate-id>`.
  - Expected: canonical profile detail page loads for visible approved talent.
- [ ] Visit `/recruiter/browse`.
  - Expected: redirects to `/company/browse`.
- [ ] Visit `/recruiter/saved`.
  - Expected: redirects to `/company/saved`.
- [ ] Visit `/recruiter/<visible-candidate-id>`.
  - Expected: redirects to `/company/students/<visible-candidate-id>`.
- [ ] Visit `/recruiter/access?token=<valid-token>`.
  - Expected: invite acceptance route remains functional and does not redirect to a company browse/saved route.

## Talent Visibility

- [ ] Browse talent as an active company representative.
  - Expected: visible approved candidate appears.
  - Expected: hidden/unavailable candidate does not appear.
- [ ] Search/filter for the hidden/unavailable candidate by name, chapter, or known field.
  - Expected: hidden/unavailable candidate still does not appear.
- [ ] Open direct URL `/company/students/<hidden-candidate-id>`.
  - Expected: profile is denied, missing, or unavailable.
- [ ] Confirm public participants without approved chapter membership are absent from company talent surfaces.
  - Expected: no public participant appears in browse/search/saved/profile.

## Saved Profiles

- [ ] Save a visible approved candidate from browse or profile.
  - Expected: save action succeeds.
  - Expected: candidate appears in `/company/saved`.
- [ ] Unsave the candidate.
  - Expected: unsave action succeeds.
  - Expected: candidate no longer appears in `/company/saved`.
- [ ] Local/staging only: save a visible candidate, then make them hidden or remove approved membership.
  - Expected: saved row may remain in the database.
  - Expected: hidden candidate no longer appears in saved profiles.
  - Expected: direct profile and resume access are denied.

## Resume Download

- [ ] For a visible approved candidate with a resume, click download.
  - Expected: download URL is generated only after current company access and talent visibility checks.
  - Expected: `resume_download_log` records the download if log inspection is available.
- [ ] For a hidden/unavailable candidate with a resume, try direct profile or download access.
  - Expected: download is denied.
  - Expected: no signed URL is shown.
  - Expected: no successful download log is created.
- [ ] Local/staging only: revoke company access, then retry resume download for a previously visible candidate.
  - Expected: download is denied after revocation.

## Completion Evidence

Record:

- Environment: local or staging.
- Date and tester.
- Company/invite identifier used.
- Visible candidate identifier.
- Hidden/unavailable candidate identifier.
- Any failed checklist item with issue link or follow-up note.

Do not include real candidate personal data in public issue comments or screenshots.
