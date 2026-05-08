# Cohesive LEAD UI/UX System Visual Audit PRD

## 1. Executive Summary

LEAD Talent Platform has made strong progress on its account model, event workflows, chapter membership, admin tools, and company representative portal. The next product risk is visual and interaction drift: public, student, chapter editor, admin, and company screens increasingly feel like separate products because styles are being improved page by page instead of through a shared design system.

The MVP goal is to create one cohesive LEAD visual language by auditing every primary screen with Codex Desktop's visual loop, identifying repeated UX failures, then normalizing the global Tailwind tokens, Shadcn-style primitives, navigation shells, status semantics, and workflow patterns before doing any page-level polish.

This is a design-system-first initiative. It should not modify isolated components as one-off fixes. It should use screenshots, browser checks, and product judgment to make the rendered application clearer, calmer, more consistent, and easier for non-technical users to navigate.

## 2. Mission

Create a coherent, trustworthy, user-first LEAD interface that helps public participants, students, chapter editors, admins, and company representatives understand what they can do next without friction or visual confusion.

Core principles:

- One LEAD product system across all roles.
- Shared primitives before page-level customization.
- Workflow clarity over decoration.
- Mobile-first for public/student/event flows.
- Desktop-density-first for editor/admin/company operations.
- Preserve service, action, auth, and database behavior.
- Use real rendered screenshots to judge the UI, not code imagination.
- Do not commit visual-system changes until the product owner reviews the direction.

## 3. Target Users

### Public Participant

Pain points:

- Needs to understand events and registration without knowing LEAD internals.
- May be low technical comfort.
- Should not be confused by past events, application states, or chapter language.

Needs:

- Clear event discovery.
- Obvious next action.
- Friendly onboarding entry point.
- Mobile-readable pages.

### Student / Chapter Applicant / Member

Pain points:

- Needs to know whether they are a participant, pending applicant, official member, or alumni.
- Should not confuse event registration with chapter membership.
- Needs profile and event status to be easy to find.

Needs:

- Clear dashboard status.
- Simple profile/onboarding flow.
- Accessible event registration and QR/status surfaces.
- Encouragement to join a chapter without blocking event participation.

### Chapter Editor

Pain points:

- Repeated operational work can become slow if screens are too decorative.
- Needs pending approvals, events, applications, and check-in to be scannable.

Needs:

- Dense but readable management screens.
- Clear scoped permissions.
- Safe approval/rejection and bulk action states.
- Fast check-in operator UI.

### Admin

Pain points:

- Needs to manage users, chapters, companies, events, invites, roles, and identities without visual ambiguity.
- App role, public identity, chapter status, and company access can be confused if not visually separated.

Needs:

- Calm operational dashboard.
- Consistent tables, filters, badges, and destructive action guards.
- Fast search and scanability.

### Company Representative

Pain points:

- Needs invite-only access to feel professional and trustworthy.
- Should not see internal recruiter terminology in user-facing flows.

Needs:

- Clear company portal entry and access/help states.
- Scannable browse/saved talent workflows.
- Consistent profile detail and resume access surfaces.

## 4. MVP Scope

### In Scope

- [ ] Capture baseline desktop and mobile screenshots for all primary public, student, chapter, admin, and company routes.
- [ ] Produce a Vera-style UI/UX audit matrix with critical, major, minor, and positive findings.
- [ ] Identify repeated design-system problems before editing.
- [ ] Normalize global design tokens in `app/[locale]/globals.css`.
- [ ] Normalize Shadcn-style primitives in `components/ui`.
- [ ] Normalize public top navigation and authenticated sidebar shells.
- [ ] Preserve existing route structure unless a specific route is broken.
- [ ] Preserve service/action/auth behavior.
- [ ] Apply workflow-level UI refinements only after shared primitives are corrected.
- [ ] Re-screenshot affected workflows after changes.
- [ ] Click-test primary flows for every role.
- [ ] Run `pnpm test`, `pnpm lint`, and `pnpm build`.
- [ ] Leave changes uncommitted until product owner review.

### Out of Scope

- [ ] Schema changes.
- [ ] Service-layer rewrites.
- [ ] Server action behavior changes.
- [ ] Renaming internal recruiter/company database or service names.
- [ ] Decorative image generation before the UI system is coherent.
- [ ] Full marketing art direction.
- [ ] New feature development unrelated to UI/UX coherence.
- [ ] Committing without explicit approval.

## 5. User Stories

1. As a public participant, I want event pages to be clear and mobile-readable, so that I can quickly understand whether to register, apply, or browse more events.

2. As a new student, I want onboarding and dashboard screens to use consistent language and visual hierarchy, so that I understand my profile, event, and chapter status.

3. As a chapter editor, I want operational screens to be dense but consistent, so that I can review members, events, applications, and check-ins without visual noise.

4. As an admin, I want management screens to use consistent tables, badges, and action placement, so that I can operate safely and quickly.

5. As a company representative, I want the portal to feel professional and coherent with the rest of LEAD, so that talent browsing and saved profiles feel trustworthy.

6. As the product owner, I want design decisions encoded in shared primitives and docs, so that future features do not create inconsistent UI again.

7. As an engineer, I want browser screenshots and click-through checks before final approval, so that visual quality is based on evidence.

## 6. Core Architecture

The UI/UX system should follow the existing Next.js App Router architecture:

```text
app/[locale]/
  (public)/
    _components/
  events/
  onboarding/
  student/
  chapter/
  admin/
  company/

components/
  ui/
    button.tsx
    badge.tsx
    card.tsx
    input.tsx
    table.tsx
    sidebar.tsx
    sidebars/
  events/
  global/
  navigation/

lib/
  nav-config.ts
  actions/
  services/
```

Design responsibilities:

- `app/[locale]/globals.css`: global tokens, typography, surfaces, colors, focus behavior, base radius.
- `components/ui/*`: reusable primitives and variants.
- `components/ui/sidebars/*`: authenticated shell primitives.
- `app/[locale]/(public)/_components/*`: public shell primitives.
- Workflow routes: layout and data presentation only, not independent visual systems.

Business responsibilities remain unchanged:

- Services stay in `lib/services`.
- Server actions stay thin in `lib/actions`.
- Auth behavior remains in `lib/auth` and Supabase helpers.
- Generated Supabase types remain canonical.

## 7. Tools / Features

### Visual Audit Matrix

Each route should be scored on:

- primary action clarity
- cognitive load
- spacing and grouping
- component consistency
- accessibility risk
- mobile fit
- status clarity
- role clarity

Severity levels:

- Critical: blocks task completion or access.
- Major: causes confusion, friction, or serious inconsistency.
- Minor: polish or visual refinement.
- Positive: keep and reuse.

### Codex Desktop Visual Loop

Required loop:

1. Run the app locally or against QA.
2. Capture desktop and mobile screenshots.
3. Inspect visual hierarchy, spacing, contrast, text fit, responsive behavior, and states.
4. Click through primary user flows.
5. Revise shared primitives or workflow layouts.
6. Re-screenshot and compare.

### Design System Normalization

Normalize:

- radius scale
- button variants and sizing
- badge semantics
- card usage and density
- table density
- input/form rhythm
- focus states
- navigation shells
- page header/action placement

### Workflow Refinement

After shared primitives are corrected, apply selective workflow refinements to:

- public event discovery and detail
- onboarding and student dashboard
- student event status and QR
- chapter editor dashboard, events, members, applications, check-in
- admin overview and management tables
- company dashboard, browse, saved, profile, access/help states

## 8. Technology Stack

- Framework: Next.js 15 App Router
- UI runtime: React 19
- Styling: Tailwind CSS 4 with `@tailwindcss/postcss`
- UI primitives: Radix UI plus custom Shadcn-style components in `components/ui`
- Icons: lucide-react and existing local icon wrappers
- Auth/database: Supabase
- Types: `lib/database.generated.ts`
- i18n: `next-intl` with locale routes
- Testing: Vitest
- Visual/browser checks: Codex Desktop browser tooling and/or Playwright
- Package manager: pnpm

## 9. Security & Configuration

This UI/UX system pass must not change security behavior.

Auth constraints:

- Public pages remain accessible without login.
- Student routes require authenticated user access.
- Chapter editor routes remain scoped by approved chapter membership unless admin bypass applies.
- Admin routes remain admin-only.
- Company representative routes remain invite/company-access gated.

Configuration:

- Do not change Supabase environment variables.
- Do not change service role usage.
- Do not expose internal secrets in screenshots, docs, or issue comments.
- Do not commit temporary screenshots unless explicitly requested.

Privacy:

- Use seeded QA/local personas for screenshots.
- Avoid showing real personal data in screenshots.
- Redact any sensitive data before sharing visual evidence.

## 10. API Specification

No new API endpoints are required for the MVP.

Existing route behavior must be preserved:

| Area | Existing Contract |
|------|-------------------|
| Public events | Users can browse events and open detail pages |
| Onboarding | Authenticated users can create/update `person_profile` and chapter intent where applicable |
| Student dashboard | Authenticated users see profile, event, and chapter status |
| Chapter editor | Approved editors manage scoped chapter workflows |
| Admin | Admins manage users, chapters, events, companies, invites, and activity |
| Company portal | Company representatives browse and save visible talent |

UI request/response behavior should not change unless an existing visual bug requires a thin action adjustment. Any backend change must become a separate scoped issue.

## 11. Success Criteria

MVP success means:

- Every primary route has desktop and mobile baseline screenshots.
- Every primary workflow has a Vera audit entry.
- Shared primitives are updated before route-level polish.
- Public, student, chapter, admin, and company surfaces feel like one product.
- Status badges use consistent semantics.
- Primary actions are visible and predictable.
- Mobile screens have no obvious overlap or broken primary actions.
- Operational screens are scan-friendly and not overly decorative.
- Public/student screens are warmer without becoming marketing-only.
- `pnpm test` passes.
- `pnpm lint` passes or warnings are documented.
- `pnpm build` passes or any blocker is explicitly diagnosed.
- Product owner reviews screenshots before commit.

## 12. Implementation Phases

### Phase 1: Baseline And Audit

Deliverables:

- Current git state reviewed.
- Decision on current uncommitted event-page patch.
- Desktop and mobile screenshot matrix.
- Vera audit matrix.
- System-level findings separated from page-specific findings.

### Phase 2: Shared System Decisions

Deliverables:

- Final token/radius/typography/surface direction.
- Button, badge, card, table, input, form, and shell rules.
- UI handbook updates if needed.
- No route-level implementation before decisions are clear.

### Phase 3: Global Tokens And Primitives

Deliverables:

- Updated global CSS tokens.
- Updated Shadcn-style primitives.
- Updated public/authenticated shell primitives.
- Representative screenshots after primitive changes.
- Tests/lint after shared-system changes.

### Phase 4: Workflow Refinement And Verification

Deliverables:

- Workflow-level UI cleanup only where shared primitives are insufficient.
- Before/after screenshots.
- Browser click-through for primary flows.
- Accessibility and overflow pass.
- Final validation summary.

## 13. Future Considerations

- Add a lightweight Storybook or local component gallery for core primitives.
- Add visual regression snapshots for key pages once the design system stabilizes.
- Add explicit page-header and empty-state primitives if repeated patterns remain.
- Use image generation later for public/community imagery after layout coherence is solved.
- Create an internal LEAD design bible from final screenshots.
- Add architecture tests or lint rules to discourage page-level one-off component systems.

## 14. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Shared primitive changes affect many screens at once | Capture baseline screenshots first and validate representative workflows after each primitive update |
| The app becomes too uniform and loses role context | Keep one visual system, but vary density and information architecture by role |
| Design work breaks service or auth behavior | Preserve existing actions/services and run role-based click-through checks |
| Screenshot work becomes too heavy | Capture only representative desktop/mobile states and use notes for low-risk polish |
| Existing build timeout hides real issues | Diagnose build separately and do not claim full readiness until build passes or blocker is documented |
| Temporary visual artifacts pollute the repo | Keep screenshots under `tmp/visual-audit` and do not commit unless explicitly requested |

