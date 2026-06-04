# Issue Set: QA Observation Full Resolution

Parent: #282

This issue set turns the remaining QA observations into grouped, independently reviewable slices. It intentionally avoids 112 separate issues. Each issue records the related observation IDs and the expected resolution path.

## Created Issues

| Key | Issue | Title | Type | Blocked by | Observation IDs |
|---|---:|---|---|---|---|
| QA-REG-01 | #294 | Create 112-observation resolution register | AFK | None | 1-112 |
| AUTH-01 | #295 | Polish active Spanish auth, consent, and recovery states | AFK/HITL | #294 | 16-22, 25-33, 90 |
| ONBOARD-01 | #296 | Harden onboarding validation and data normalization | AFK/HITL | #294 | 34-38 |
| STUDENT-01 | #297 | Stabilize member dashboard, profile, event, and QR states | AFK | #294 | 39-62, 64 |
| CHAPTER-01 | #298 | Complete chapter operator active-route polish | AFK | #294 | 63, 65-77 |
| ADMIN-01 | #299 | Complete admin active-route operations polish | AFK/HITL | #294 | 78-89 |
| DESIGN-01 | #300 | Resolve active-route visual and i18n consistency debt | AFK | #294 | 1-14, 23-24, 27, 49-54, 76, 78-79 |
| COMPANY-DEF-01 | #301 | Define deferred company and recruiter recovery scope | HITL | #294 | 91-100, 102 |
| ALUMNI-DEF-01 | #302 | Define deferred Alumni product scope | HITL | #294 | 103-112 |

## Resolution Rules

- `fixed`: implemented and validated in the QALS rollout.
- `guarded-for-pilot`: not a full product implementation, but the risky launch behavior is blocked or safely redirected.
- `future-active-route-polish`: active route remains in scope for a later implementation slice.
- `future-design-system`: belongs to active-route visual/i18n/accessibility hardening.
- `needs-leadership-decision`: requires product, legal, provider, or operations decision before code.
- `deferred-company`: company/recruiter is intentionally out of first launch scope.
- `deferred-alumni`: Alumni is intentionally out of first launch scope.

## Notes

- #294 is the dependency for all other issues because it creates the source-of-truth register.
- #301 and #302 are definition issues only. They should not ship UI/product changes until leadership approves the scope.
- This issue set supports full accountability for the 112 observations without changing the controlled-pilot launch boundary.
- AUTH-01 implementation covers active auth metadata, app-controlled validation, visible loading/error states, and OAuth redirect/error guardrails. Consent, provider rate limiting, transactional email branding, federated recovery, and corporate/staff login differentiation remain decision items.
- ONBOARD-01 implementation covers phone normalization, shared onboarding validation, public participant/applicant/member-review copy, and visible save-error feedback. Country-specific E.164 inference, Alumni onboarding, and recruiter/company activation remain out of first-launch scope.
- STUDENT-01 implementation covers Spanish-first member dashboard/profile/event/CV/sidebar copy, Member ID state clarity, QR/date timezone copy, event-history grouping evidence, profile visibility copy, and desktop/mobile public-student launch QA. The only non-code remainder is a leadership/product decision on whether event application forms should auto-prefill reusable profile data beyond the current explicit-answer model.
- CHAPTER-01 validation covers President, VP, legacy editor, and regular e-board chapter dashboard, roster, event, application, and check-in routes on desktop/mobile with 0 findings. New event configuration options, general attendee tooling, and manual attendance registration remain product/operations decisions.
- ADMIN-01 validation covers Admin and Staff-admin dashboard, users, user detail, companies, invites, chapters, events, settings, and student-route boundary on desktop/mobile with 0 findings. Deactivate/archive/delete and revoke semantics remain explicit operations decisions; company/recruiter product scope remains in #301.
