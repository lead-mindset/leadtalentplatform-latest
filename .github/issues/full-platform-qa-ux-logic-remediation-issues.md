# Full Platform QA UX Logic Remediation Issues

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

GitHub integration status: created with `gh` CLI on branch `codex/full-role-playwright-production-qa`.

## Created GitHub Issues

| Audit ID | GitHub Issue | Title | URL |
| --- | --- | --- | --- |
| QA-001 | #309 | Stabilize protected-route browser exceptions | https://github.com/lead-mindset/leadtalentplatform-latest/issues/309 |
| QA-002 | #310 | Reproduce and fix participant onboarding timeout | https://github.com/lead-mindset/leadtalentplatform-latest/issues/310 |
| QA-003 | #311 | Make admin events mobile usable | https://github.com/lead-mindset/leadtalentplatform-latest/issues/311 |
| QA-004 | #312 | Make admin users mobile actions discoverable | https://github.com/lead-mindset/leadtalentplatform-latest/issues/312 |
| QA-005 | #313 | Fix student events mobile ticket and tab clipping | https://github.com/lead-mindset/leadtalentplatform-latest/issues/313 |
| QA-006 | #314 | Complete Spanish copy pass for active `/es` routes | https://github.com/lead-mindset/leadtalentplatform-latest/issues/314 |
| QA-007 | #315 | Decide and enforce company portal launch scope | https://github.com/lead-mindset/leadtalentplatform-latest/issues/315 |
| QA-008 | #316 | Reduce chapter members mobile density and clipping | https://github.com/lead-mindset/leadtalentplatform-latest/issues/316 |
| QA-009 | #317 | Redact auth and recruiter invite logs | https://github.com/lead-mindset/leadtalentplatform-latest/issues/317 |
| QA-010 | #318 | Distinguish service empty states from backend failures | https://github.com/lead-mindset/leadtalentplatform-latest/issues/318 |
| QA-011 | #319 | Move recruiter talent search toward scalable pagination | https://github.com/lead-mindset/leadtalentplatform-latest/issues/319 |
| QA-012 | #320 | Add chapter activation interest validation and safe errors | https://github.com/lead-mindset/leadtalentplatform-latest/issues/320 |
| QA-013 | #321 | Align chapter permission docs with code constants | https://github.com/lead-mindset/leadtalentplatform-latest/issues/321 |
| QA-014 | #322 | Split full Playwright QA into reliable role shards | https://github.com/lead-mindset/leadtalentplatform-latest/issues/322 |
| QA-015 | #323 | Localize admin mobile shell subtitle | https://github.com/lead-mindset/leadtalentplatform-latest/issues/323 |
| QA-016 | #324 | Clean unaccented Spanish in active launch surfaces | https://github.com/lead-mindset/leadtalentplatform-latest/issues/324 |
| QA-017 | #325 | Replace clipped mobile tab overflow with clearer filters | https://github.com/lead-mindset/leadtalentplatform-latest/issues/325 |
| QA-018 | #326 | Decide growth reflection launch state and localize if active | https://github.com/lead-mindset/leadtalentplatform-latest/issues/326 |
| QA-019 | #327 | Localize public FAQ on `/es/faq` | https://github.com/lead-mindset/leadtalentplatform-latest/issues/327 |
| QA-020 | #328 | Localize company resume access copy | https://github.com/lead-mindset/leadtalentplatform-latest/issues/328 |
| QA-021 | #329 | Decide resume-download behavior when audit logging fails | https://github.com/lead-mindset/leadtalentplatform-latest/issues/329 |
| QA-022 | #330 | Reduce route-sweep dev server instability noise | https://github.com/lead-mindset/leadtalentplatform-latest/issues/330 |
| QA-023 | #331 | Clean mojibake comments in company service | https://github.com/lead-mindset/leadtalentplatform-latest/issues/331 |
| QA-024 | #332 | De-emphasize raw event IDs in admin mobile scanning | https://github.com/lead-mindset/leadtalentplatform-latest/issues/332 |
| QA-025 | #333 | Manually verify heuristic unlabeled-input findings | https://github.com/lead-mindset/leadtalentplatform-latest/issues/333 |

## Proposed GitHub Issues

| Audit ID | Title | Type | Priority | Complexity | Labels |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Stabilize protected-route browser exceptions | Bug / Routing | High | Medium | `LEAD`, `bug`, `routing`, `auth`, `playwright`, `phase:launch-stabilization` |
| QA-002 | Reproduce and fix participant onboarding timeout | Bug / Onboarding | High | Medium | `LEAD`, `bug`, `onboarding`, `student`, `performance`, `phase:launch-stabilization` |
| QA-003 | Make admin events mobile usable | Bug / Frontend | High | Medium | `LEAD`, `bug`, `admin`, `events`, `frontend`, `ui`, `phase:launch-stabilization` |
| QA-004 | Make admin users mobile actions discoverable | Bug / Frontend | High | Medium | `LEAD`, `bug`, `admin`, `frontend`, `ui`, `phase:launch-stabilization` |
| QA-005 | Fix student events mobile ticket and tab clipping | Bug / Frontend | High | Medium | `LEAD`, `bug`, `student`, `events`, `qr`, `frontend`, `ui`, `phase:launch-stabilization` |
| QA-006 | Complete Spanish copy pass for active `/es` routes | Bug / Copy | High | Large | `LEAD`, `bug`, `frontend`, `ui`, `phase:launch-stabilization` |
| QA-007 | Decide and enforce company portal launch scope | Product / Scope | High | Medium | `LEAD`, `product`, `company`, `recruiter`, `phase:launch-stabilization` |
| QA-008 | Reduce chapter members mobile density and clipping | Bug / Frontend | High | Medium | `LEAD`, `bug`, `chapter`, `members`, `frontend`, `ui`, `phase:launch-stabilization` |
| QA-009 | Redact auth and recruiter invite logs | Bug / Security | High | Medium | `LEAD`, `bug`, `security`, `auth`, `recruiter`, `phase:launch-stabilization` |
| QA-010 | Distinguish service empty states from backend failures | Technical / Services | High | Large | `LEAD`, `services`, `backend`, `architecture`, `phase:launch-stabilization` |
| QA-011 | Move recruiter talent search toward scalable pagination | Technical / Services | High | Large | `LEAD`, `services`, `backend`, `company`, `recruiter`, `performance` |
| QA-012 | Add chapter activation interest validation and safe errors | Bug / Services | High | Medium | `LEAD`, `bug`, `services`, `student`, `chapter`, `security` |
| QA-013 | Align chapter permission docs with code constants | Documentation / Permissions | High | Small | `LEAD`, `documentation`, `permissions`, `chapter`, `phase:system-evolution` |
| QA-014 | Split full Playwright QA into reliable role shards | Technical / Testing | High | Medium | `LEAD`, `testing`, `playwright`, `qa`, `phase:launch-stabilization` |
| QA-015 | Localize admin mobile shell subtitle | Bug / Copy | Medium | Small | `LEAD`, `bug`, `admin`, `frontend`, `ui` |
| QA-016 | Clean unaccented Spanish in active launch surfaces | Bug / Copy | Medium | Medium | `LEAD`, `bug`, `frontend`, `ui`, `student`, `admin`, `chapter` |
| QA-017 | Replace clipped mobile tab overflow with clearer filters | Enhancement / UX | Medium | Medium | `LEAD`, `enhancement`, `frontend`, `ui`, `accessibility` |
| QA-018 | Decide growth reflection launch state and localize if active | Product / Scope | Medium | Small | `LEAD`, `product`, `student`, `frontend`, `ui` |
| QA-019 | Localize public FAQ on `/es/faq` | Bug / Public Copy | Medium | Medium | `LEAD`, `bug`, `public-pages`, `frontend`, `ui` |
| QA-020 | Localize company resume access copy | Bug / Company Copy | Medium | Small | `LEAD`, `bug`, `company`, `recruiter`, `frontend`, `resumes` |
| QA-021 | Decide resume-download behavior when audit logging fails | Product / Security | Medium | Small | `LEAD`, `product`, `security`, `company`, `recruiter`, `resumes` |
| QA-022 | Reduce route-sweep dev server instability noise | Technical / QA | Medium | Medium | `LEAD`, `testing`, `qa`, `playwright`, `process` |
| QA-023 | Clean mojibake comments in company service | Maintenance | Low | Small | `LEAD`, `backend`, `services`, `docs` |
| QA-024 | De-emphasize raw event IDs in admin mobile scanning | Enhancement / UX | Low | Small | `LEAD`, `enhancement`, `admin`, `events`, `frontend`, `ui` |
| QA-025 | Manually verify heuristic unlabeled-input findings | Technical / Accessibility | Low | Small | `LEAD`, `testing`, `accessibility`, `axe`, `frontend` |

## Shared Acceptance Criteria

Every issue created from this list should include:

- [ ] Link to the source QA report.
- [ ] Evidence path or file references from the source observation.
- [ ] Role(s) affected.
- [ ] Clear expected behavior.
- [ ] Validation command or screenshot requirement.

## Implementation Priority

1. QA-001 through QA-005: launch blockers and primary mobile workflow friction.
2. QA-006 through QA-014: copy, security, services, permissions, and automation reliability.
3. QA-015 through QA-025: medium/minor polish and follow-up hardening.
