# Launch UI Standard

Status: Controlled rollout standard
Applies to: QA Launch Readiness Controlled Rollout

This document is the launch-specific UI and product contract for the next controlled LEAD Talent Platform rollout. It does not replace `docs/handbook/UI_UX.md`, `app/brand.md`, `app/[locale]/globals.css`, or `components/ui`. Those remain the design-system foundation.

The missing launch layer is usage discipline: which routes are active, which roles are in scope, which copy language is allowed, and how shared primitives should be applied during QA stabilization.

## Launch Scope

### Active roles

- Public Participant
- Member
- Chapter Editor
- President / Vice President
- Admin
- Staff with explicit or restricted operational access

### Deferred roles

- Recruiter/company representative workflows
- Alumni-specific workflows

Deferred roles may receive safe route handling and non-destructive guardrails, but they should not drive first-launch scope.

### Active Spanish routes

- Public landing
- Auth: login, register, forgot password, recovery, confirmation, error states
- Onboarding
- Participant/member dashboard
- Events and member event status
- Chapter dashboard and chapter event management
- Admin/staff console

English locale polish is deferred. This rollout is Spanish-first.

## Spanish-First Copy Rule

Every visible user-facing string in active Spanish routes should be Spanish unless it is a proper noun, brand name, email address, URL, or unavoidable browser/native validation copy.

Required:

- Page titles, descriptions, labels, buttons, tabs, filters, table headers, empty states, loading states, errors, success messages, and tooltips use Spanish.
- Auth metadata visible to users should avoid English on Spanish routes.
- Operational words should be consistent: use `capitulo`, `miembro`, `participante`, `administracion`, `eventos`, `usuarios`, and `empresas` consistently.
- Placeholder text should sound like product copy, not an implementation note.

Avoid:

- Mixed labels such as `Admin Overview`, `Needs review`, `Search by name or email`, `Export CSV`, `Resume Management`, or `Quick Resources` on active Spanish routes.
- Raw asset references or file paths in visible UI.
- Copy that implies Alumni or Recruiter workflows are launch-ready.

## Design-System Base

Use the existing system:

- `app/[locale]/globals.css` for tokens and theme variables.
- `components/ui` for buttons, cards, tables, forms, dialogs, badges, inputs, tabs, sidebars, and tooltips.
- `docs/handbook/UI_UX.md` for broad product-system rules.
- `app/brand.md` for brand identity and token rationale.

Page-level Tailwind is for layout, spacing, and responsive composition. It should not create a new button, table, modal, card, or form system.

## Button Contract

Use one primary action per page or object context.

Allowed launch usage:

- Primary action: `Button` default or established primary treatment.
- Secondary action: `secondary` or `outline`.
- Low-emphasis utility: `ghost`.
- Destructive action: `destructive` plus confirmation when the action changes access, registration, membership, or publication state.
- Inline navigation: `link`.

Avoid:

- Creating button-like `div` or `a` elements without the shared `Button` behavior.
- Gradients or full-pill treatments in admin, chapter, or dense operational workflows unless the route is explicitly a public/student hero moment.
- Multiple visually competing primary buttons in the same header or form footer.
- Icon-only controls without accessible labels and tooltips when the icon is not obvious.

## Page Header Contract

Operational pages should use a compact, scannable header:

- Concrete title.
- One short context sentence or metadata row.
- One primary page-level action when there is an obvious next step.
- Secondary actions grouped with outline/ghost buttons or menus.

Avoid hero-scale type inside admin, chapter, tables, filters, sidebars, forms, and dense dashboard panels.

## Form Contract

Forms should make user intent and system state obvious.

Required:

- Required fields are visibly marked.
- Field-level validation appears near the field.
- Submission has loading and disabled states.
- Success and error feedback is visible in Spanish.
- Privileged or destructive changes use confirmation.
- Zod/server-action validation remains the boundary for trusted input.

Launch-specific rules:

- Basic onboarding must not require chapter membership.
- Contact/organization forms must include required return email and may include optional phone/WhatsApp.
- Password creation must show and enforce the launch password rule unless the configured Auth provider policy is stronger.
- Profile forms must not let users mutate official chapter affiliation.

## Table And List Contract

Tables are appropriate for admin and chapter operations, but primary actions must not be hidden behind horizontal scroll.

Required:

- Primary row action stays visible on desktop.
- Secondary row actions may move into a menu.
- Search and filters sit directly above the records they affect.
- Empty state distinguishes real empty data from failed loading.
- Error state explains what failed and offers retry or recovery where useful.
- Mobile/narrow layouts use a card/list alternative when table columns cannot fit.

Avoid:

- Requiring horizontal scroll to find critical actions.
- Showing `No users found` when a query failed or filters silently excluded known records.
- Unlabeled icon-only row actions.

## Modal And Destructive Action Contract

Use dialogs for actions that revoke access, cancel registrations, change membership, assign leadership, publish events, or delete/disable records.

Required:

- Title states the action.
- Body states exactly what will change.
- Primary/destructive action label is specific.
- Cancel action is available.
- Loading and error states are handled.
- Service-layer rules still enforce the final decision.

## Standard States

Every active launch route should define:

- Loading: stable skeleton or short loading label.
- Empty: what is missing and the next useful action.
- Error: what failed and how to retry or recover.
- Unauthorized: distinguish unauthenticated from unauthorized.
- Success: what changed and the next logical action.
- Disabled: why the action is unavailable.

## Mobile And Overflow Rules

At common phone widths, active launch routes must not overlap, clip required content, or hide primary actions.

Check:

- Long names.
- Long emails.
- Long chapter names.
- Long event titles.
- Translated Spanish labels.
- Sidebar/mobile header fit.
- Button labels inside fixed-width controls.
- Tables and action rows.

## Accessibility Rules

Required:

- Visible focus states.
- Keyboard-reachable dialogs, menus, tabs, and forms.
- Accessible labels for icon-only controls.
- Partner/logo images have meaningful alt text when they convey a real organization.
- Links must have text, destination, and purpose.
- Status does not rely on color alone.

## Visual QA Checklist

For launch UI issues, capture or manually verify:

- Desktop route renders without obvious layout breakage.
- Mobile/narrow route renders without overflow or overlap.
- Primary action is obvious.
- Loading, empty, error, success, unauthorized, and disabled states are covered when relevant.
- Spanish copy is consistent on active routes.
- Tables keep critical row actions visible.
- Forms show validation and post-submit feedback.
- Destructive actions require confirmation.
- No Recruiter/company or Alumni surface is treated as launch-ready unless the issue explicitly scopes safe guardrails only.

## Validation Evidence

Each implementation issue should report:

- Which active roles/routes were checked.
- Which seeded persona was used when applicable.
- Which service/action behavior was preserved.
- Which screenshots or browser checks support the visual result.
- Which validation commands passed or failed.

Docs-only changes to this standard do not require runtime validation.
