# Plan: STUDENT-01 Member States, Events, And Copy

GitHub issue: #297

## Problem

The QA register maps observations 39-62 and 64 to active student/member route polish. The code already separates public participant, pending applicant, approved member, and alumni states, but the launch UI still has mixed English labels, unclear Member ID/status copy, placeholder resume guidance, and event-card language that can confuse active Spanish users.

## Scope

In:

- Polish member dashboard copy and labels for Spanish-first launch routes.
- Keep Member ID visible only for approved members and keep pending/participant states explicit.
- Polish profile visibility copy to avoid implying deferred recruiter/company activation.
- Replace student-facing event-card English labels with Spanish-first labels.
- Clean resume page mojibake and clarify that placeholder resources are pending.
- Update register/issue notes for the subset handled in this slice.
- Add focused dashboard-state tests where useful.

Out:

- Alumni product buildout.
- Recruiter/company activation.
- New event filtering backend.
- Full visual QA across every member route.
- New cancellation/business policy beyond existing event registration lifecycle.

## Implementation Tasks

- [x] Add/confirm dashboard service tests for participant, pending, approved, and alumni state selection.
- [x] Polish student dashboard copy and labels.
- [x] Polish profile visibility and Member ID status copy.
- [x] Translate event card labels/status text to Spanish.
- [x] Clean resume page Spanish copy and pending-resource language.
- [x] Update QA register/grouped issue tracker for resolved vs remaining #297 observations.
- [ ] Run focused validation, typecheck, lint, and diff checks.

## Validation

- `pnpm exec vitest run lib/services/__tests__/student-dashboard.service.test.ts lib/events/__tests__/lifecycle.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `git diff --check`

## Risks

- Accidentally closing event filtering/history observations that need broader data work. Mitigation: mark only implemented copy/state items fixed and leave filter/history polish as active-route follow-up where incomplete.
- Reintroducing company/recruiter promises. Mitigation: use "oportunidades autorizadas" and "preferencia" language until company/recruiter scope is approved.
