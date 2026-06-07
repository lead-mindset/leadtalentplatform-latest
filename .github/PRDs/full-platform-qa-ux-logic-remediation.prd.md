# Full Platform QA UX Logic Remediation PRD

Source audit: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## 1. Executive Summary

The LEAD Talent Platform needs a focused remediation program for the findings surfaced in the June 7, 2026 full-role QA audit. The platform is close enough for a controlled Spanish-first pilot to be worth stabilizing, but not ready for a broad all-role launch because several routes are visually inconsistent, some protected-route checks emit browser exceptions, mobile operational views are difficult to use, Spanish copy is uneven, and service-layer error semantics can hide backend failures behind normal empty states.

The MVP goal is to convert every QA observation into a tracked issue, fix the launch-blocking slices first, and validate each slice with role-based screenshots, automated checks, and service-level tests where needed.

## 2. Mission

Make LEAD feel like one trustworthy product across public, student, chapter, admin, company, and alumni role surfaces while preserving strict authorization boundaries and service-layer architecture.

Core principles:

- Guard user trust before visual novelty.
- Fix source-of-truth patterns, not just one visible page.
- Keep role logic explicit and testable.
- Treat Spanish-first launch copy as product behavior.
- Prefer small, validated issues over broad cosmetic churn.

## 3. Target Users

- Public visitors need credible Spanish-first public information and clear login boundaries.
- Participants need onboarding and event flows that load reliably and explain what happens next.
- Members need event tickets, QR guidance, and profile surfaces that work cleanly on mobile.
- Chapter leaders need dense but usable roster, applications, event, and check-in operations.
- Admin and staff users need safe, scannable management tools with obvious actions.
- Company representatives need an intentionally scoped company portal or clear deferred access behavior.
- Alumni need a clear identity state if they are included in launch scope.
- Internal operators need validation artifacts, issue traceability, and screenshots to make release decisions.

## 4. MVP Scope

In scope:

- [ ] Create one GitHub issue for each `QA-001` through `QA-025` audit observation.
- [ ] Stabilize protected-route runtime errors.
- [ ] Reproduce and fix participant onboarding timeout.
- [ ] Improve mobile operational UX for admin events, admin users, student event tickets, and chapter members.
- [ ] Run a Spanish-first copy pass for active `/es` routes named in the audit.
- [ ] Redact sensitive logs in auth and invite flows.
- [ ] Harden service-layer result semantics for empty/error/unavailable states.
- [ ] Align permission documentation with code constants.
- [ ] Split QA automation into reliable role shards.
- [ ] Capture before/after screenshots for UI fixes.

Out of scope:

- [ ] A full visual redesign unrelated to the audit findings.
- [ ] New product features unrelated to launch stabilization.
- [ ] Production data migration unless a specific issue requires it.
- [ ] Reworking company/alumni strategy before product scope is answered.

## 5. User Stories

1. As a participant, I want onboarding to load quickly and reliably so that I can complete my profile and join the right LEAD path.
2. As a member, I want my event ticket and QR code to fit my phone so that live check-in is low-stress.
3. As a chapter leader, I want roster actions to be readable and reachable on mobile so that I can manage members without guessing.
4. As an admin, I want users and events to be scannable on mobile so that I can safely review and act on records.
5. As a Spanish-speaking user, I want `/es` routes to use consistent Spanish copy so that the platform feels official and finished.
6. As an operator, I want protected-route checks to be clean of browser exceptions so that QA signals are trustworthy.
7. As a security reviewer, I want auth and invite logs redacted so that sensitive data does not leak into process logs.
8. As an engineer, I want services to distinguish empty from unavailable so that bugs and outages are not hidden.

## 6. Core Architecture

Follow the existing service-layer pattern:

- Business and data rules live in `lib/services/`.
- Server actions in `lib/actions/` stay thin.
- UI state remains in route components and client components.
- Role boundaries stay in `lib/auth.ts`, `lib/auth-redirects.ts`, and route layouts.
- Product copy should move toward centralized `next-intl` message ownership where the surface is active launch scope.

Relevant directories:

- `app/[locale]/*`
- `components/*`
- `components/ui/*`
- `lib/auth.ts`
- `lib/auth-redirects.ts`
- `lib/services/*`
- `lib/actions/*`
- `tests/e2e/*`
- `docs/handbook/*`
- `.github/plans/*`
- `.github/reports/*`

## 7. Tools And Features

Remediation work is grouped into eight toolable slices:

1. Route guard stabilization:
   - Reproduce `performance.measure` exceptions.
   - Add regression coverage for protected redirects.
2. Onboarding reliability:
   - Reproduce participant timeout.
   - Add loading/error states or data-fetch fixes.
3. Mobile operational UX:
   - Admin events mobile record pattern.
   - Admin users mobile record pattern.
   - Student events mobile ticket/tabs.
   - Chapter members mobile tabs/actions.
4. Spanish-first copy:
   - FAQ.
   - Admin shell and admin management.
   - Student events and growth reflection.
   - Company pages if company remains reachable.
5. Security logging:
   - Auth confirm route.
   - Recruiter invite audit flow.
6. Service semantics:
   - Student dashboard.
   - Chapter permissions.
   - Company/recruiter talent surfaces.
7. Permission documentation:
   - Align docs with `CHAPTER_PERMISSION_KEYS`.
8. QA automation:
   - Split Playwright role shards.
   - Preserve screenshot artifacts.
   - Document validation commands and evidence.

## 8. Technology Stack

- Next.js 15 App Router
- React 19
- Supabase
- Tailwind CSS 4
- Radix UI and custom Shadcn-like components
- `next-intl`
- pnpm
- Vitest
- Playwright
- GitHub Issues, PRDs, plans, reports

## 9. Security And Configuration

Security-sensitive requirements:

- No raw token hashes in logs.
- No invite emails, invite IDs, or recruiter identifiers in unredacted console output.
- Resume access remains gated by current company visibility.
- Route guards remain fail-closed for authorization.
- UI data services must expose recoverable error states without leaking database internals.

Environment:

- Local validation target: `http://localhost:3104`
- Seeded QA accounts from `docs/handbook/TESTING.md`
- Production validation must run separately before launch.

## 10. API And Service Specification

No new public API surface is required for the initial remediation program. Service-level changes may introduce internal result types such as:

```ts
type ServiceLoadResult<T> =
  | { status: 'success'; data: T }
  | { status: 'empty'; data: T }
  | { status: 'unavailable'; error: string }
```

Any such type must preserve existing authorization behavior and be introduced only where UI needs to distinguish empty from failed loads.

## 11. Success Criteria

The remediation program is successful when:

- Every `QA-001` through `QA-025` observation has a GitHub issue.
- P1 route guard and onboarding issues are fixed or explicitly downgraded with evidence.
- Mobile screenshots show no clipped primary controls for student events, admin users, admin events, and chapter members.
- Active Spanish routes named in the audit no longer have visible English leaks.
- Auth/invite logs are redacted or moved to structured logging.
- Service tests cover empty vs error semantics for changed services.
- Playwright QA is sharded enough to complete reliably.
- Validation results and screenshots are linked from issue comments or reports.

## 12. Implementation Phases

### Phase 1 - Tracking And Launch Blockers

- Create issues for all audit observations.
- Fix protected-route exceptions.
- Reproduce/fix onboarding timeout.
- Add initial screenshots and validation report.

### Phase 2 - Mobile Operational UX

- Fix student events ticket/tabs.
- Fix admin users/events mobile views.
- Fix chapter members mobile tab/action density.
- Capture before/after screenshots.

### Phase 3 - Copy, Security, And Service Semantics

- Complete Spanish-first copy pass.
- Redact sensitive logs.
- Harden service result semantics.
- Align permission docs.

### Phase 4 - QA Automation And Release Evidence

- Split Playwright QA into role shards.
- Add screenshot artifact guidance.
- Publish validation report.
- Update PR/issue evidence links.

## 13. Future Considerations

- Decide whether company and alumni are first-launch roles or explicitly deferred.
- Consider a generated copy registry for launch-critical Spanish routes.
- Consider docs/code validation for permission constants.
- Add visual regression thresholds once the UI stabilizes.

## 14. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Too many observations get bundled into one risky PR | Keep one issue per observation and one focused implementation slice at a time. |
| UI fixes regress role authorization | Include seeded role checks and route-guard tests in validation. |
| Copy fixes stay local to one page | Move active copy toward `next-intl` ownership where practical. |
| Service error states weaken fail-closed behavior | Keep authorization fail-closed; only improve user-facing load states. |
| QA suite remains too slow to run | Shard by role and preserve artifacts per shard. |
