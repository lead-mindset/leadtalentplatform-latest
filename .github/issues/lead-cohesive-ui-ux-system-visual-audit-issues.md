# Issues: Cohesive LEAD UI/UX System Visual Audit

Source PRD: `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md`

This issue set intentionally starts with audit and design-system foundations before page-level implementation. The goal is one cohesive LEAD visual language across public, student, chapter editor, admin, and company surfaces.

## Issue Summary

| Proposed Title | Type | Complexity | Dependencies |
|----------------|------|------------|--------------|
| Audit primary LEAD screens with Codex visual loop | Spike | Medium | None |
| Define cohesive LEAD design system decisions | Planning | Medium | Visual audit |
| Normalize global UI tokens and Shadcn primitives | Technical / Enhancement | Large | Design decisions |
| Unify public and authenticated app shells | Enhancement | Medium | Tokens/primitives |
| Apply cohesive workflow refinements across core routes | Enhancement | Large | Tokens/primitives, shells |
| Run accessibility, mobile overflow, and browser QA pass | Testing | Medium | Workflow refinements |
| Document final LEAD visual system and future guardrails | Documentation / Architecture | Small | QA pass |

---

## 1. Audit primary LEAD screens with Codex visual loop

### Description

Capture baseline desktop and mobile screenshots for all primary public, student, chapter editor, admin, and company representative routes. Use the Codex Desktop visual loop and Vera-style UX audit rubric to identify systemic UI/UX issues before changing the design system.

### Acceptance Criteria

- [ ] Given the local or QA app is running, when the audit runs, then desktop and mobile screenshots are captured for primary public, student, chapter, admin, and company routes.
- [ ] Given auth-only screens, when screenshots are captured, then seeded personas are used for participant/member/editor/admin/company contexts.
- [ ] Given every representative screen, when reviewed, then it is scored for primary action clarity, cognitive load, spacing, component consistency, accessibility, mobile fit, status clarity, and role clarity.
- [ ] Given findings are complete, when summarized, then critical, major, minor, and positive observations are separated.
- [ ] Given temporary screenshots are generated, when the issue is complete, then they remain local unless intentionally attached or committed.

### Complexity

Medium

### Labels

`LEAD`, `design`, `frontend`, `testing`, `phase:active-piv-loop`

### Dependencies

None.

---

## 2. Define cohesive LEAD design system decisions

### Description

Turn the visual audit into explicit design-system decisions before implementation. Define the LEAD radius scale, typography usage, surface hierarchy, button variants, badge semantics, card/table/form density, page header anatomy, and shell behavior.

### Acceptance Criteria

- [ ] Given the visual audit findings, when decisions are made, then repeated system-level problems are separated from page-specific problems.
- [ ] Given shared primitives exist, when the design decision pass is complete, then final rules are defined for buttons, badges, cards, tables, inputs, forms, page headers, and app shells.
- [ ] Given the LEAD UI handbook, when rules are clarified, then `docs/handbook/UI_UX.md` is updated only where it improves future implementation.
- [ ] Given the product direction, when decisions are complete, then public/student warmth and admin/editor/company density remain one visual language, not separate products.
- [ ] Given implementation has not started, when this issue closes, then no route-level polish has been applied prematurely.

### Complexity

Medium

### Labels

`LEAD`, `design`, `frontend`, `architecture`, `phase:active-piv-loop`

### Dependencies

Depends on: Audit primary LEAD screens with Codex visual loop.

---

## 3. Normalize global UI tokens and Shadcn primitives

### Description

Update global Tailwind/CSS tokens and shared Shadcn-style primitives so the app has one consistent foundation. This should normalize radius, typography, surfaces, focus states, button variants, badge semantics, cards, inputs, and tables before page-level route refinements.

### Acceptance Criteria

- [ ] Given `app/[locale]/globals.css`, when tokens are updated, then typography, surfaces, borders, radius, focus, and semantic colors are coherent and accessible.
- [ ] Given `components/ui/button.tsx`, when button variants are normalized, then primary, secondary, outline, ghost, destructive, success, warning, and info states behave consistently without one-off page workarounds.
- [ ] Given `components/ui/badge.tsx`, when badge variants are normalized, then status semantics match `docs/handbook/UI_UX.md`.
- [ ] Given `components/ui/card.tsx`, `input.tsx`, and `table.tsx`, when primitives are updated, then operational and public workflows use consistent spacing, density, and focus behavior.
- [ ] Given shared primitives affect many routes, when changes are complete, then representative public, student, admin, chapter, and company screenshots are reviewed before page-specific edits.

### Complexity

Large

### Labels

`LEAD`, `design`, `frontend`, `architecture`, `phase:active-piv-loop`

### Dependencies

Depends on: Define cohesive LEAD design system decisions.

---

## 4. Unify public and authenticated app shells

### Description

Align the public top navigation and authenticated sidebar-first shells so the application feels like one LEAD product. Keep role-specific information architecture from `lib/nav-config.ts`, but normalize layout rhythm, active states, mobile menu behavior, and header/sidebar affordances.

### Acceptance Criteria

- [ ] Given public routes, when the shell renders, then top navigation exposes public browsing, authentication, and company access with consistent spacing and mobile behavior.
- [ ] Given authenticated student, chapter, admin, and company routes, when the shell renders, then sidebars use shared primitives and consistent active/hover/focus states.
- [ ] Given mobile authenticated views, when users open navigation, then the menu is easy to understand and does not create horizontal overflow.
- [ ] Given role navigation, when the implementation is complete, then `lib/nav-config.ts` remains the canonical source for role nav items.
- [ ] Given primary role navigation links, when browser QA runs, then public, student, admin, chapter, and company navigation click-through works.

### Complexity

Medium

### Labels

`LEAD`, `design`, `frontend`, `routing`, `phase:active-piv-loop`

### Dependencies

Depends on: Normalize global UI tokens and Shadcn primitives.

---

## 5. Apply cohesive workflow refinements across core routes

### Description

After shared primitives and shells are normalized, refine core workflows only where route-level layout is still inconsistent. Focus on public event discovery/detail, onboarding/student dashboard, student event status/QR, chapter editor operations, admin management, and company representative flows.

### Acceptance Criteria

- [ ] Given public event routes, when refined, then event type, date, chapter, availability, and primary action are scannable on desktop and mobile.
- [ ] Given onboarding and student routes, when refined, then profile, event, and chapter status are visually distinct and easy to understand.
- [ ] Given chapter editor routes, when refined, then dashboards, events, members, applications, and check-in prioritize operational scanability.
- [ ] Given admin routes, when refined, then tables, filters, statuses, and destructive actions are calm, dense, and consistent.
- [ ] Given company representative routes, when refined, then browse, saved talent, profile, and access/help states use professional company language and consistent layouts.

### Complexity

Large

### Labels

`LEAD`, `design`, `frontend`, `events`, `student`, `chapter`, `admin`, `recruiter`, `phase:active-piv-loop`

### Dependencies

Depends on: Normalize global UI tokens and Shadcn primitives; Unify public and authenticated app shells.

---

## 6. Run accessibility, mobile overflow, and browser QA pass

### Description

Verify the redesigned system with accessibility checks, mobile overflow checks, role-based click-throughs, and validation commands. This issue is the quality gate before the cohesive UI/UX system is considered ready for team testing.

### Acceptance Criteria

- [ ] Given mobile screenshots, when reviewed, then there are no visible broken primary actions, overlap, or unintentional horizontal pressure.
- [ ] Given interactive controls, when checked, then focus states, labels, target sizes, and keyboard behavior are acceptable for buttons, links, forms, dialogs, menus, tabs, and tables.
- [ ] Given role-based workflows, when browser QA runs, then public visitor, participant/student, chapter editor, admin, and company representative primary paths can be clicked through.
- [ ] Given validation runs, when the issue is complete, then `pnpm test`, `pnpm lint`, and `pnpm build` pass or any blocker is explicitly diagnosed.
- [ ] Given screenshots are used as evidence, when shared, then real personal data and secrets are not exposed.

### Complexity

Medium

### Labels

`LEAD`, `design`, `frontend`, `testing`, `validation`, `phase:active-piv-loop`

### Dependencies

Depends on: Apply cohesive workflow refinements across core routes.

---

## 7. Document final LEAD visual system and future guardrails

### Description

After the visual system is verified, update the UI/UX handbook and planning docs with final design rules, screenshots/evidence summary, and follow-up guardrails to prevent future isolated visual drift.

### Acceptance Criteria

- [ ] Given the final design pass, when documentation is updated, then `docs/handbook/UI_UX.md` reflects the actual system decisions.
- [ ] Given before/after evidence, when summarized, then the team can understand what changed and why without reading implementation diffs.
- [ ] Given future work, when guidance is complete, then it clearly says shared primitives come before isolated page polish.
- [ ] Given potential future tooling, when documented, then Storybook/component gallery, visual regression, or architecture guardrails are listed as follow-up options.
- [ ] Given temporary screenshot artifacts, when the issue closes, then the team decides what to keep, attach, or discard.

### Complexity

Small

### Labels

`LEAD`, `docs`, `design`, `architecture`, `phase:active-piv-loop`

### Dependencies

Depends on: Run accessibility, mobile overflow, and browser QA pass.

