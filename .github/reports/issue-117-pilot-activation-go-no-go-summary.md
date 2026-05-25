# Issue #117 - Pilot Activation Go/No-Go Summary

## Current Recommendation

Request fixes before pilot invitations.

The support, rollback, and go/no-go framework is now prepared, but this is not a full launch approval. Real member invitations should wait until the pending human review/import and production auth/data blockers are resolved or explicitly accepted by executive leadership.

## Decision Options

| Option | Meaning | Current Fit |
| --- | --- | --- |
| Approve controlled pilot | Invite a small wave of real users with support and rollback ready. | Not yet. |
| Pause | Do not invite users until blockers are resolved. | Recommended current state. |
| Request fixes | Assign owners to clear blockers, then revisit decision. | Recommended next action. |

## Passed / Ready Items

| Item | Status | Evidence |
| --- | --- | --- |
| Event operations local readiness | Passed | #132 closed; `pnpm event-ops:readiness` passed 8/8 flows. |
| Support categories | Prepared | `docs/handbook/PILOT-ACTIVATION-SUPPORT-AND-ROLLBACK.md` |
| Rollback options | Prepared | `docs/handbook/PILOT-ACTIVATION-SUPPORT-AND-ROLLBACK.md` |
| Member visibility draft copy | Prepared | Handbook plus `messages/es.json` and `messages/en.json` copy update. |
| Public support path | Prepared | Help page copy clarified. |
| Executive decision structure | Prepared | This report. |

## Blockers / Not Ready Yet

| Blocker | Tracking | Owner / Proposed Owner | Why it matters |
| --- | --- | --- | --- |
| Human review of e-board import artifact pending | #131 | Christopher / Nikole / Abigail | Real import should not happen until rows are reviewed and approved. |
| Actual local Docker member import not done | #134 | Abigail | Need to prove approved rows import safely before QA/production rehearsal. |
| Production Google OAuth issue | #119 | Abigail / platform owner | Real users need reliable production auth. |
| Controlled production auth smoke accounts/inboxes pending | #120 | Abigail / ops | Password reset/email auth cannot be fully verified without controlled accounts. |
| Production schema drift for recruiter visibility | #121 | Abigail | Company visibility controls must match current schema before production activation. |
| Active production test user data needs review/isolation | #123 | Abigail | Production data should be clean enough before real activation. |

## Accepted Risks

None accepted yet.

Leadership can explicitly accept a risk only if:

- The risk is documented.
- The owner is named.
- The mitigation or rollback is clear.
- The decision is recorded in the issue or meeting notes.

## Proposed Owners To Confirm

| Area | Proposed Owner |
| --- | --- |
| Technical rollback | Abigail |
| Executive go/no-go | Luis, Antonny, Nicole, Abigail |
| Data/import | Nikole |
| Chapter validation/support | Christopher |
| Member consent language | Xiomara |
| Communications/support instructions | Kiara |
| QA support/reproduction | Angela |

## Go Criteria For Pilot Invitations

- [ ] Production auth principal is verified.
- [ ] Approved import artifact exists.
- [ ] Local Docker import passes with approved rows.
- [ ] Company visibility defaults to off.
- [ ] Company portal remains invite-only.
- [ ] Support path is visible in activation instructions.
- [ ] Rollback owner is confirmed.
- [ ] No unresolved P0 exists unless executive leadership explicitly accepts it.

## No-Go Conditions

Do not invite real members if any of these are true:

- Production auth is broken for the primary sign-in path.
- Imported members become company-visible by default.
- Company portal exposes public participants, alumni, or unapproved members.
- Chapter editors can access wrong chapter data.
- Admin/technical owner cannot correct common mistakes.
- There is no confirmed support owner or rollback owner.

## Executive Decision Box

| Decision | Selected |
| --- | --- |
| Approve controlled pilot |  |
| Pause |  |
| Request fixes and revisit |  |

Decision notes:

```text
Decision:
Date:
Approvers:
Accepted risks:
Required fixes before next review:
```

## Recommended Next Actions

1. Finish #131 human review and approved import artifact.
2. Implement #134 actual local Docker import and login activation validation.
3. Resolve or explicitly disposition #119, #120, #121, and #123 before production invitations.
4. Confirm support/rollback owners.
5. Revisit this go/no-go summary before the first pilot wave.
