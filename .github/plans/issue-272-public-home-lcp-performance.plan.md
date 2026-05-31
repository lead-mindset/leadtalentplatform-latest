# Issue 272: Public Home LCP Performance

## GitHub Issue
- #272: Performance: optimize public home LCP without regressing public event routes

## Goal
Bring the public marketing home page under the production readiness LCP budget while keeping the first screen visually clear, localized, and low-friction for visitors.

## Current Findings
- The public home page renders `Hero` as a client component.
- The hero waits for `useEffect` before assigning the background video URL, delaying meaningful first paint.
- The first viewport mounts WebGL (`Aurora`) and motion-driven animated gradient text, which adds JavaScript and rendering work to the LCP path.
- The page itself is otherwise mostly static and should be able to server-render its primary heading and calls to action.

## Implementation Plan
- [x] Convert the public hero to a server-rendered component by removing client-only locale, state, and effect dependencies.
- [x] Set the hero video source directly so the browser can discover it during initial render.
- [x] Replace first-viewport WebGL/motion decoration with static CSS treatment that preserves brand tone without blocking LCP.
- [x] Keep the public home navigation, localized copy, and CTA destinations unchanged.
- [ ] Run type, lint, and public performance validation.

## Validation
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm run lint -- --quiet`
- [x] `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 PERF_QA_SCOPE=public pnpm exec playwright test tests/e2e/production-readiness-performance.spec.ts --project=desktop-chromium --reporter=list`

## Results
- Public home: LCP 1848ms, CLS 0, no console errors, no failed responses.
- Public events: LCP 1596ms, CLS 0, no console errors, no failed responses.
- Public event detail: LCP 548ms, CLS 0, no console errors, no failed responses.

## Rollback
Revert the hero/page changes and this plan file if the public home loses expected localization, CTA behavior, or visual quality.
