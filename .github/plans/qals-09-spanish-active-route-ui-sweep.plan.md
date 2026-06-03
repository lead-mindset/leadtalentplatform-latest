# Plan

Consolidate the Spanish-first launch polish for active user routes by removing high-visibility English UI copy from event, chapter, auth, and workspace error states. The work stays scoped to visible labels and does not change service behavior, routing, or deferred company/recruiter flows.

## Scope
- In: Event detail labels, active route error states, public chapter footer labels, and signed-in auth greeting.
- Out: Full translation infrastructure, deferred recruiter/company launch flows, database or permission changes.

## Action items
[x] Scan active launch routes for visible English copy that QA users would encounter.
[x] Replace event detail labels and fallback states with Spanish-first copy.
[x] Replace public chapter footer support/resource labels with Spanish-first copy.
[x] Replace signed-in auth greeting with neutral Spanish-first copy.
[x] Replace active admin/chapter/student error states with Spanish-first retry language.
[x] Run TypeScript validation for the touched UI files.
[x] Re-scan the touched active routes for the corrected strings and remaining high-signal English leaks.

## Open questions
- None for this bounded launch polish slice.
