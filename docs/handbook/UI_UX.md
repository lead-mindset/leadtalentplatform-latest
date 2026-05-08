# UI/UX Handbook

This handbook is the canonical LEAD product UI/UX contract for the professional redesign work that follows LEAD-028.

The goal is one coherent LEAD application, not a collection of separately styled pages. Public, student, chapter editor, admin, and company representative surfaces should use the same product system, shared primitives, state language, and layout rules.

## Product System

LEAD should feel clear, credible, and organized. The product can be warm and community-oriented, but it should not become decorative at the expense of task clarity.

Use a Shadcn-style system:

- `components/ui` is the source of truth for reusable primitives.
- Page-level Tailwind is for layout and composition, not for inventing one-off component styles.
- Future redesign work should improve shared primitive variants centrally when repeated needs appear.
- Follow-up issues should remove visual inconsistency as they touch each workflow.

Canonical primitive families:

- `Button` for actions.
- `Card` for bounded repeated records, contained tools, forms, and modal content.
- `Badge` for status, role, count, and compact metadata.
- `Input`, `Form`, and validation primitives for field entry.
- `Table` for dense repeated operational records.
- `Tabs` for switching scoped views of the same object or queue.
- `Dialog` for confirmation, destructive actions, and focused interruptive flows.
- `Dropdown/Menu` for secondary row actions.
- `Sidebar` and navigation primitives for authenticated app shells.

Do not build custom visual systems inside individual pages unless the issue explicitly scopes a new reusable primitive.

## App Shell

### Public Shell

Public surfaces use top navigation.

Representative routes:

- `/`
- `/events`
- `/events/[id]`
- `/about`
- `/faq`
- `/partner-info`

Rules:

- Top navigation should expose public browsing, authentication, and key public destinations.
- Public pages may be more spacious and visual than operational app pages.
- Public pages still use the same buttons, badges, cards, forms, spacing rhythm, and state language as the rest of the app.
- Avoid disconnected hero or event-card treatments that feel like a separate product.

### Authenticated Shell

Authenticated app surfaces use sidebar-first layout.

Representative route groups:

- Student: `/student/*`
- Chapter editor: `/chapter/*`
- Admin: `/admin/*`
- Company representative: `/company/*`

Rules:

- Use `lib/nav-config.ts` as the canonical role navigation map.
- Use shared sidebar primitives from `components/ui/sidebar.tsx` and `components/ui/sidebars/*`.
- Mobile authenticated views use a compact header with a sidebar trigger.
- Do not create page-specific navigation unless the workflow truly needs a local sub-navigation.
- Role differences are information architecture differences, not separate visual directions.

### Role Navigation

Student navigation should prioritize:

- Browse events.
- My events/status/QR.
- Profile.
- Resume.

Chapter editor navigation should prioritize:

- Chapter overview.
- Events.
- Check-in.
- Members.
- Profile access.

Admin navigation should prioritize:

- Overview.
- Events.
- Chapters.
- Users.
- Companies.
- Invites.
- Activity.

Company representative navigation should prioritize:

- Dashboard.
- Browse talent.
- Saved talent.
- Company profile.

## Page Anatomy

Every redesigned page should follow a predictable structure.

### Page Header

Use a consistent page header at the top of the content area:

- Title: concrete object or workflow name.
- Context: one short sentence or metadata row.
- Primary action: one main action when the page has an obvious next step.
- Secondary actions: grouped as outline/ghost actions or menus.

Rules:

- One primary action per page header.
- Do not use hero-scale typography inside operational pages.
- Do not hide important status under decorative copy.
- Keep page titles stable and literal.

### Action Placement

Primary actions belong in one of three predictable places:

- Page header for page-level create/start actions.
- Object header for object-level update/review/check-in actions.
- Sticky/mobile bottom action area only when mobile completion depends on it.

Avoid scattering equivalent actions across multiple cards.

### Filters And Search

Filters and search belong above the list/table they affect.

Rules:

- Keep filter labels concrete.
- Preserve selected filters visibly.
- Use tabs for mutually exclusive workflow queues such as pending, approved, rejected, alumni.
- Use search for text lookup, not as a substitute for missing filters.

### Content Body

Use the simplest structure that supports the workflow:

- Tables for dense operational records.
- Lists for medium-density repeated records.
- Cards for repeated records on mobile, bounded tools, forms, and small summaries.
- Detail layouts for one object with sections.

## Cards, Tables, And Lists

### Hard Rules

- Do not put cards inside cards.
- Do not style whole page sections as floating cards.
- Do not make card-heavy admin, editor, or company workflows.
- Do not use cards as decorative filler.

### Use Cards For

- Repeated records where card scanning helps, especially on mobile.
- Contained tools.
- Modal/dialog content.
- Forms with a clear boundary.
- Small summary metrics when they answer a real operational question.

### Use Tables For

- Admin users, chapters, companies, events, and invites.
- Chapter members and applications when repeated review/scanning matters.
- Company browse/saved talent when desktop scanability matters.

### Use Lists For

- Recent activity.
- Compact queues.
- Mobile alternatives to tables.
- Object-associated records that do not need full table controls.

## Forms

Forms should be grouped by user intent, not database table.

Rules:

- Keep required and optional fields obvious.
- Show field-level validation near the field.
- Show a short summary when submission is blocked by multiple errors.
- Use Zod validation at action boundaries.
- Preserve service-layer business rules.
- Do not ask for chapter membership in basic onboarding.
- Keep destructive or privileged changes behind confirmation.

Form sections should answer:

- What is being changed?
- Why is this field needed?
- What happens after submit?

## Status Semantics

Status badges must use consistent meaning across the app. Prefer domain-specific status components when repeated status logic appears.

### Badge Variant Semantics

| Variant | Use For | Avoid For |
|---------|---------|-----------|
| `success` | Completed, approved, attended, active accepted access | Generic positive decoration |
| `warning` | Needs attention, pending review, expiring soon, partial readiness | Errors or destructive states |
| `destructive` | Rejected, cancelled, revoked, failed, blocked | Soft warnings |
| `info` | Informational state, upcoming, application required, neutral guidance | Primary CTAs |
| `secondary` | Stable neutral metadata, registered, role labels | Critical status |
| `outline` | Low-emphasis labels, filters, secondary metadata | State that must stand out |
| `neutral` | Inactive/passive metadata | Success or failure |
| `live` | Happening now or actively open | Anything static |
| `count` | Navigation counts and compact numeric indicators | Semantic status |

### Event Status

Use consistent labels for:

- Draft.
- Published.
- Open registration.
- Application required.
- Full.
- Waitlist.
- Live.
- Past.
- Cancelled.

The primary CTA must reflect the current event and user state.

### Registration Status

Use consistent labels for:

- Registered.
- Pending review.
- Approved.
- Rejected.
- Waitlisted.
- Cancelled.
- Attended.
- Checked in.

QR surfaces must make valid, duplicate, invalid, cancelled, rejected, and pending states obvious to check-in operators.

### Chapter Membership Status

Use consistent labels for:

- Pending.
- Approved.
- Rejected.
- Alumni.

Show chapter and position separately. Position is not the same as global app role.

### LEAD Identity Status

Use consistent labels for:

- Active.
- Inactive.
- Primary.
- Member identity.
- Editor identity.
- Staff identity.
- Founder identity.
- Alumni identity.

Admin is an app role, not a public LEAD identity type.

### Newsletter Status

Use consistent labels for:

- Subscribed.
- Unsubscribed.
- Global.
- Chapter-specific.
- Source: onboarding, registration, manual/admin if surfaced.

Newsletter preferences must not be confused with chapter membership.

### Company Access Status

User-facing copy should say company representative, company access, company portal, saved talent, and saved profiles.

Use consistent labels for:

- Active.
- Pending invite.
- Accepted.
- Expired.
- Revoked.
- Inactive.
- Missing access.

Do not route company representatives into student onboarding when the problem is company access.

## Responsive Rules

The product uses one visual system with workflow-specific density.

### Mobile-First Workflows

Prioritize mobile for:

- Public event discovery.
- Event detail.
- Basic onboarding.
- Student event registration/status.
- QR display.
- Company invite access/help states opened from email links.

Mobile rules:

- Primary action remains visible or easy to reach.
- Text wraps cleanly without overlap.
- Cards/lists may replace tables.
- QR and status areas must be usable on common phone widths.
- Do not rely on hover-only disclosure.

### Desktop-Density Workflows

Prioritize desktop density for:

- Chapter roster and application review.
- Chapter event management.
- Admin users, chapters, companies, events, identities, and invites.
- Company browse and saved talent.

Desktop rules:

- Prefer tables or dense lists for repeated records.
- Keep filters and search close to the records they affect.
- Preserve row actions without horizontal chaos.
- Use detail panels or pages for complex object edits.

## Standard States

Every major redesign issue must account for the states below.

### Loading

- Use skeletons or stable layout placeholders.
- Do not cause large layout jumps.
- Keep loading labels short.

### Empty

- State what is missing.
- Offer the next useful action when one exists.
- Avoid over-explaining.

### Error

- State what failed.
- Offer retry, navigation, or support path where useful.
- Do not expose raw internal error details in user-facing copy.

### Unauthorized Or Missing Access

- Explain what access is missing.
- Distinguish unauthenticated, unauthorized, expired, revoked, and incomplete-profile cases.
- Route users to the correct recovery path.

### Success

- Confirm the completed action.
- Show the resulting state.
- Offer the next logical action.

### Destructive Confirmation

- Use dialogs for destructive or privileged actions.
- Say exactly what will change.
- Disable or guard actions that violate service-layer rules.

### Mobile Overflow

- Test long names, long emails, long chapter names, and long event titles.
- Text should truncate or wrap intentionally.
- Buttons must not overflow their containers.

## Accessibility

- Preserve visible focus states.
- Use accessible labels for icon-only buttons.
- Keep keyboard navigation for dialogs, menus, tabs, forms, and tables.
- Do not rely on color alone for status.
- Keep contrast readable.
- Respect reduced motion where animation is used.

## Visual Design Loop

Meaningful UI work should use Codex Desktop as a visual product builder, not only as a code editor. The loop is:

1. Build the smallest complete version of the changed screen or flow.
2. Run the app locally or against the QA preview.
3. Capture desktop and relevant mobile screenshots.
4. Inspect the rendered UI for hierarchy, spacing, contrast, text fit, responsive behavior, and empty/error states.
5. Click through the primary user flow.
6. Revise the implementation.
7. Recheck the changed screens before calling the work done.

Use this loop for:

- New pages and major page redesigns.
- Public event discovery, onboarding, registration, QR/check-in, admin, editor, and company workflows.
- Any change that introduces a new layout pattern, navigation pattern, form, table, or status-heavy screen.

Keep the loop light for:

- Copy-only changes.
- Backend-only changes.
- Small component fixes where static validation is enough.

Visual review should judge the actual rendered product, not just the code. Prioritize:

- Clear hierarchy: the next action is obvious.
- Consistent spacing: sections, controls, and records follow the same rhythm.
- Readability: labels, values, badges, and actions scan quickly.
- Responsive fit: mobile widths do not overflow, overlap, or hide required actions.
- Interaction clarity: hover, focus, disabled, loading, success, and error states feel intentional.
- Role clarity: student, chapter editor, admin, and company representative surfaces remain coherent without becoming separate visual products.

Use image generation only when a workflow needs source material such as event imagery, branded empty-state art, or a visual concept for a hero/marketing surface. Do not use generated assets to compensate for weak layout, unclear copy, or inconsistent components.

For larger redesigns, compare two or three layout variants when the direction is not obvious. Choose the variant that best supports readability, task completion, and consistency with this handbook.

## Redesign Issue Checklist

Every redesign issue should answer:

- Which workflow is being redesigned?
- Which routes/components are touched?
- Which service/action/auth behavior must be preserved?
- Which shared primitives are used?
- What is the page header and primary action?
- What statuses appear, and which badge semantics apply?
- Is the workflow mobile-first or desktop-density-first?
- What loading, empty, error, unauthorized, success, and destructive states exist?
- Are cards, tables, and lists used according to this handbook?
- What light visual QA is required?
- What screenshots or browser checks prove the visual design loop was completed?

## Validation For This Handbook

This handbook satisfies LEAD-074 when:

- Navigation/header/sidebar behavior is defined for student, editor, admin, and company contexts.
- Page-level redesign stories can reference a common page header/action pattern.
- Status badge semantics are documented.
- Form/table/card usage rules prevent nested-card and card-heavy operational layouts.
- Mobile-first vs desktop-density expectations are documented.

Runtime validation is not required for this document-only issue.
