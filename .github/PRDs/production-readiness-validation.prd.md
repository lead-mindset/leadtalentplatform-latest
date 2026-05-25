# PRD: Production Readiness Validation Gates

## 1. Executive Summary

LEAD Talent Platform is close enough for a controlled chapter pilot, but not yet proven ready for broad production launch. The previous launch QA work validated core seeded user flows and fixed several product issues; this PRD defines the remaining production-readiness gates that require real provider behavior, real browser evidence, and a training dry run with chapter leaders.

This is a validation and evidence package, not a feature expansion. The goal is to prove that the platform can reliably support public event promotion, chapter operations, member onboarding, recruiter access, and admin oversight before inviting real users at scale.

The required gates are:

- Real email delivery validation.
- Real image upload and storage behavior validation.
- Accessibility validation with axe and keyboard checks.
- Performance budget validation.
- Full chapter leader training dry run.

## 2. Mission

Create a repeatable launch-readiness process that gives founders and operators confidence that LEAD Talent Platform can be used by chapters without hidden operational, accessibility, security, or reliability failures.

The outcome should be a clear report that answers:

- Can users receive the emails required to join, recover access, and act on invitations?
- Can chapters create public-facing events with images that render reliably?
- Can members and recruiters use storage-backed profile and resume workflows without data leakage?
- Can the app be used with keyboard and assistive tooling across the main flows?
- Does the app meet acceptable performance thresholds on public and authenticated routes?
- Can chapter leaders understand and complete the launch workflows after training?

## 3. Target Users

- Founders and central LEAD leadership who need launch confidence.
- Abigail as platform owner, trainer, and release coordinator.
- Christopher and chapter operations owners who coordinate chapter lists and activation.
- Chapter presidents and vice presidents who manage rosters, events, and approvals.
- Official chapter e-board members who need operational dashboard access.
- Members and participants who register for events and manage profiles.
- Recruiters who browse visible student profiles and resumes.
- Engineering reviewers who need evidence before fixes or launch decisions.

## 4. MVP Scope

In scope:

- Validate real email delivery for authentication, approval, and invitation workflows.
- Validate Supabase Storage behavior for event cover images and resume files.
- Add or run axe-based accessibility checks on the launch matrix routes.
- Define and measure performance budgets for public, student, chapter, admin, and company routes.
- Run a chapter leader training dry run using the activation runbook.
- Produce a sanitized production-readiness report with screenshots, logs, repro steps, and launch recommendations.

Out of scope:

- Sending launch invitations to real members before the report is reviewed.
- Importing the real chapter roster into source-controlled fixtures.
- Implementing LEAD Pulse or LEAD Funding.
- Redesigning major product surfaces unless validation exposes a launch blocker.
- Changing public APIs or database schema unless a confirmed bug makes it necessary.
- Fixing every issue discovered during validation; fixes should become follow-up issues unless they block the dry run.

## 5. User Stories

1. As a founder, I want launch readiness evidence so I can decide whether to approve a broader rollout.
2. As Abigail, I want a repeatable validation process so I can train chapters and defend the launch plan with facts.
3. As Christopher, I want a safe activation process so chapter leaders can be onboarded without exposing private lists or confusing permissions.
4. As a chapter president or vice president, I want to sign in, land on the chapter dashboard, manage members, and publish events without needing engineering help.
5. As an official e-board member, I want to view approved member information and support chapter operations within my permissions.
6. As a member, I want emails, uploads, and event registration to work predictably.
7. As a recruiter, I want profile and resume access to be secure, performant, and limited to visible candidates.
8. As an engineer, I want automated accessibility and performance checks so launch quality can be revalidated after changes.

## 6. Core Architecture

The validation package should reuse the existing architecture:

- Next.js App Router routes under `app/[locale]/*`.
- Supabase Auth, database, and Storage.
- Service-layer business logic under `lib/services/`.
- Thin actions and routes under `lib/actions/` and `app/api/*`.
- Playwright for end-to-end browser validation.
- Existing seeded personas for baseline flows.

Recommended artifact structure:

- `.github/reports/production-readiness-validation-report.md`
- `docs/runbooks/production-readiness-validation.md`
- `tests/e2e/production-readiness/*.spec.ts`
- `tests/accessibility/*.spec.ts`
- `tests/performance/*.spec.ts` or Lighthouse CI configuration
- `test-results/production-readiness/` for local screenshots and traces

Validation must not store real chapter leader emails, real member lists, real resumes, or real personal screenshots in committed files.

## 7. Tools and Features

### Email Delivery Gate

Validate all required delivery paths in local and staging-like environments:

- Supabase sign-up confirmation or invite flow.
- Password reset and password update flow.
- Member approval notification email.
- Recruiter invitation email.
- Auth hook email endpoint, if enabled.

Checks:

- Email is delivered to controlled test inboxes.
- Sender, subject, and body are correct for Spanish-first product expectations.
- Links resolve to the expected localized route.
- Expired or reused links fail safely.
- Delivery failures produce actionable logs.
- No real member or chapter leader personal data is committed.

### Storage and Upload Gate

Validate Supabase Storage behavior for:

- Event cover images.
- Resume uploads and downloads.
- Public rendering of published event images.
- Recruiter access to visible resume/profile data.

Checks:

- Accepted file types and size limits are enforced.
- Upload, replace, delete, and failed-upload states are understandable.
- Event images render on public event detail pages.
- Unauthorized users cannot read private resumes.
- Recruiters only access profiles and resumes allowed by visibility rules.
- Storage policies protect cross-user and cross-chapter access.

### Accessibility Gate

Use axe and keyboard testing on representative routes:

- Public home page.
- Public events list and event detail.
- Login, sign-up, and onboarding.
- Student dashboard and profile.
- Chapter dashboard, members, event creation, event detail, applications, and check-in.
- Company dashboard, browse, saved candidates, and student detail.
- Admin dashboard, users, companies, chapters, events, invites, and settings.

Checks:

- Zero critical axe violations.
- Zero serious axe violations unless explicitly waived with documented reason.
- Keyboard-only flow works for login, registration, member approval, member rejection, event creation, event publishing, recruiter save/unsave, and logout.
- Focus states are visible.
- Form errors are announced clearly.
- Mobile layouts avoid overflow, clipped buttons, and unreadable controls.

### Performance Budget Gate

Measure public and authenticated route performance with repeatable tooling.

Recommended budgets:

- Public pages: LCP at or below 2.5 seconds, CLS at or below 0.1.
- Authenticated operational pages: LCP at or below 3.5 seconds, CLS at or below 0.1.
- No uncaught JavaScript errors during page load.
- No unexpected 5xx requests.
- No route should load obviously unnecessary assets for the current user role.

Routes:

- `/en`
- `/en/events`
- `/en/events/[slug]`
- `/en/student`
- `/en/chapter`
- `/en/chapter/members`
- `/en/chapter/events`
- `/en/chapter/events/new`
- `/en/company`
- `/en/company/browse`
- `/en/admin`
- `/en/admin/users`

### Chapter Leader Training Dry Run

Run one controlled dry run before broad chapter activation.

Participants:

- Abigail as trainer and platform owner.
- Christopher or chapter operations owner.
- At least one president or vice president from a pilot chapter.
- Optional observer from founders or central leadership.

Training tasks:

- Sign in with a preapproved chapter leader account.
- Confirm correct chapter dashboard landing.
- Review chapter members and applicants.
- Approve and reject test applicants.
- Add or update an official e-board position where permitted.
- Create, publish, and share an event.
- Register as a participant from a separate account.
- Review applications or registrations.
- Use check-in behavior if the event supports it.
- Confirm support path for blockers.

Evidence:

- Sanitized screenshots.
- Time-to-complete notes.
- Questions asked by chapter leaders.
- Confusing labels or permission boundaries.
- Launch blockers and non-blocking training improvements.

## 8. Technology Stack

- Next.js 15 with App Router and React 19.
- Supabase Auth, Postgres, and Storage.
- Tailwind CSS 4 and local Shadcn-like UI components.
- `next-intl` for locale-based routing.
- Playwright for browser automation.
- `@axe-core/playwright` or equivalent axe integration.
- Lighthouse CI or Playwright performance tracing for budgets.
- Resend, SMTP, Supabase email hooks, or configured production provider for real email checks.
- Mailpit or equivalent local mailbox for local-only email assertions.
- pnpm for package management and validation commands.

## 9. Security and Configuration

Requirements:

- Do not commit real chapter rosters, leader emails, member emails, resumes, or production screenshots containing personal data.
- Use controlled test inboxes and staging-safe email aliases.
- Validate that production secrets are managed outside the repository.
- Confirm email providers are configured with correct sender identity, domain verification, and failure logging.
- Validate Supabase Storage RLS policies for event images and resumes.
- Confirm public event images are intentionally public and private resumes remain private.
- Redact tokens, signed URLs, auth links, and personal identifiers from reports.
- Keep report screenshots sanitized when they show users, emails, resumes, or admin data.

## 10. API Specification

No new public API is required by default.

Existing flows under validation:

- Supabase Auth sign-up, password reset, and password update.
- `/api/auth/hooks/send-email`
- Member approval email action and service path.
- Admin recruiter invitation action.
- Event create/update action and event cover image path.
- Resume upload, profile visibility, and recruiter download path.
- Role-guarded dashboard routes for student, chapter, company, and admin users.

Optional internal artifact outputs:

```json
{
  "gate": "email-delivery",
  "environment": "staging",
  "persona": "president@test.com",
  "flow": "password-reset",
  "status": "pass",
  "evidencePath": "test-results/production-readiness/email/password-reset.png",
  "notes": "Reset link opened localized update-password route."
}
```

Report outputs should be human-readable Markdown plus machine-readable JSON where useful.

## 11. Success Criteria

Overall readiness is `pass`, `pass with issues`, or `blocked`.

Pass requires:

- Baseline seeded Playwright launch matrix passes.
- Production build succeeds.
- Email delivery succeeds for all in-scope test flows within two minutes.
- Email links resolve to the expected localized route and fail safely when invalid.
- Event image upload renders on public pages and handles invalid files cleanly.
- Resume upload and recruiter access follow visibility and authorization rules.
- Unauthorized storage reads are blocked.
- Axe reports zero critical and zero unwaived serious violations on scoped routes.
- Keyboard-only users can complete the critical launch flows.
- Performance budgets pass on scoped public and authenticated routes.
- Chapter leader training dry run completes with no unowned launch blockers.
- Final report includes repro steps, evidence, severity, owner, and recommendation for every issue.

`Pass with issues` is acceptable only when remaining issues are documented, non-blocking for a controlled pilot, and have owners.

`Blocked` applies if any of these occur:

- Real email delivery cannot be proven.
- Storage policies allow unauthorized resume or member data access.
- Chapter leaders cannot complete the basic dashboard/event/member workflow.
- Critical accessibility failures block login, registration, member approval, event creation, or recruiter browse.
- Performance failures make public event promotion unreliable.

## 12. Implementation Phases

### Phase 1: Validation Harness

- Confirm local and staging-like environment requirements.
- Add or document required test inboxes, storage buckets, and test accounts.
- Create the production-readiness report template.
- Confirm screenshot and trace locations are ignored when they contain sensitive data.

### Phase 2: Email and Storage Validation

- Validate real provider email delivery with controlled test inboxes.
- Validate local email behavior through Mailpit or equivalent.
- Validate event cover image uploads and public rendering.
- Validate resume upload, visibility, and unauthorized access behavior.
- Record provider logs, browser screenshots, and failures.

### Phase 3: Accessibility and Performance Validation

- Add axe checks for the launch matrix.
- Run keyboard-only critical path checks.
- Add or run Lighthouse/performance budget checks.
- Record mobile and desktop evidence.
- Triage violations into launch blockers, pilot warnings, and future improvements.

### Phase 4: Chapter Leader Dry Run

- Use the chapter activation runbook.
- Run the training dry run with pilot chapter leaders.
- Capture questions, blockers, time-to-task, and support needs.
- Produce founder-ready launch recommendation.

## 13. Future Considerations

- Add accessibility and performance gates to CI after thresholds stabilize.
- Add production monitoring for email failures, storage errors, and auth redirects.
- Add analytics for event share links, registration conversion, and dashboard task completion.
- Turn chapter leader dry run results into a repeatable onboarding package.
- Expand validation to LEAD Pulse and LEAD Funding when those modules become active.
- Add periodic chapter health checks after launch.

## 14. Risks and Mitigations

| Risk | Mitigation |
| :--- | :--- |
| Real personal data leaks into reports or git | Use test accounts, sanitize screenshots, and keep sensitive artifacts out of commits. |
| Staging email differs from production delivery | Validate provider configuration and sender domains in the same provider intended for launch. |
| Storage policies pass locally but fail in deployed environment | Validate both local reset state and staging Supabase project policies. |
| Performance results are noisy | Run repeated measurements, record median values, and isolate obvious local machine noise. |
| Axe reports noisy issues in third-party widgets | Waive only documented false positives; do not waive app-owned critical or serious issues. |
| Training exposes product confusion late | Treat confusion as launch evidence; convert blockers into issues before broad activation. |
| Validation slows pilot momentum | Separate launch blockers from pilot warnings and keep the controlled pilot path explicit. |

