# Plan: LEAD-026 Newsletter Campaign Architecture

## Summary

Document the newsletter campaign architecture that sits above the existing `newsletter_subscription` consent model. This plan should produce an ADR that separates consent from audience segmentation, defines admin/editor campaign permissions, sketches future campaign/send tables, and links the decision back into the product specification. Campaign UI, sending, and migrations are explicitly out of scope for this issue.

## User Story

As an admin or editor,
I want newsletter campaign architecture documented,
So that future global, chapter, and demographic messaging can be implemented without mixing subscriptions and membership.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #27 |
| Type | Documentation |
| Complexity | Small |
| Systems Affected | Docs, ADRs, PRD, newsletter architecture |
| Dependencies | LEAD-001, LEAD-008 |
| Blocks | None |

## Problem

LEAD-008 created `newsletter_subscription` as the consent/preference source of truth, but future campaign planning still needs a written architecture boundary. Without that boundary, future work could accidentally treat chapter membership as newsletter consent, let editors target users outside their chapter, or bake demographic targeting into ad hoc queries. The documentation should define how campaign audiences are derived while keeping subscription status, membership, profile data, and event attendance as separate concerns.

## Patterns To Follow

### Product Architecture

Source: `docs/PRODUCT-SPECIFICATION.md`

The PRD already states that membership and subscription are separate: `chapter_membership` means application/approval, while `newsletter_subscription` means communication consent. LEAD-026 should extend that distinction into campaign planning without adding runtime behavior.

### Existing Newsletter Foundation

Source: `supabase/migrations/20260503003000_newsletter_subscription_foundation.sql`

The subscription table enforces one logical global row per user and one logical chapter row per user/chapter. Campaign architecture must query this table for consent and status; it should not create replacement preference fields on `person_profile`, `chapter_membership`, or `user`.

### Service Layer Boundary

Source: `docs/adr/001-service-layer-pattern.md`

Future campaign implementation should keep audience resolution, send creation, and unsubscribe handling in services. Server actions and routes should only authenticate, validate, and delegate.

### Existing Newsletter Service

Source: `lib/services/newsletter-subscription.service.ts`

`NewsletterSubscriptionService` owns subscribe/reactivate/unsubscribe behavior. Future campaign services should consume subscription state instead of mutating consent implicitly during campaign creation.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `docs/adr/003-newsletter-campaign-architecture.md` | Create | Record architecture rules for campaigns, audiences, permissions, future tables, and non-goals |
| `docs/PRODUCT-SPECIFICATION.md` | Update | Link the newsletter campaign ADR from the communication/newsletter section |
| `.github/plans/lead-026-newsletter-campaign-architecture.plan.md` | Create | Track execution plan and validation evidence |

## Dependency Order

1. Draft the ADR around consent, audience segments, permissions, future tables, and non-goals.
2. Link the ADR from the product specification so future PIVs can discover it.
3. Validate markdown/docs changes and comment evidence on #27.

## Tasks

## Progress

- [x] Task 1: Create Newsletter Campaign ADR
- [x] Task 2: Link ADR From Product Specification
- [x] Task 3: Validate And Update GitHub

### Task 1: Create Newsletter Campaign ADR

- **File**: `docs/adr/003-newsletter-campaign-architecture.md`
- **Action**: Create
- **Implement**:
  - Define `newsletter_subscription` as consent source of truth.
  - Define audience segments as derived queries, not consent records.
  - Document admin permission to create global, chapter, and demographic campaigns.
  - Document editor permission limited to approved chapter membership and campaigns for their chapter.
  - Define future tables such as `newsletter_campaign` and `newsletter_send` at the conceptual level.
  - Define demographic filters that may reference `person_profile`, `chapter_membership`, and event attendance.
  - Explicitly exclude campaign sending, templates, delivery provider integration, and UI implementation.
- **Mirror**: `docs/adr/001-service-layer-pattern.md`
- **Validate**: `git diff --check`

### Task 2: Link ADR From Product Specification

- **File**: `docs/PRODUCT-SPECIFICATION.md`
- **Action**: Update
- **Implement**: Add a short reference under the newsletter/communications planning area that points future campaign work to ADR 003. Keep the PRD high-level; do not duplicate the ADR.
- **Mirror**: existing PRD domain model and out-of-scope newsletter language.
- **Validate**: `rg -n "ADR 003|newsletter campaign" docs/PRODUCT-SPECIFICATION.md docs/adr/003-newsletter-campaign-architecture.md`

### Task 3: Validate And Update GitHub

- **Files**: all changed docs
- **Action**: Validate and update issue
- **Implement**:
  - Run documentation-safe validation.
  - Comment on #27 with the plan path and validation results.
  - Add or keep the `has-plan` label.
  - Move #27 forward only after implementation evidence is present.
- **Validate**:

```bash
git diff --check
rg -n "ADR 003|newsletter campaign|newsletter_subscription" docs
```

## Acceptance Criteria Mapping

- [x] Subscription consent is distinguished from campaign audience segments.
- [x] Editor campaign permissions are scoped to the editor's approved chapter.
- [x] Admin campaign permissions include global, chapter, and demographic campaigns.
- [x] Future demographic filters reference `person_profile`, `chapter_membership`, and event attendance.
- [x] Campaign sending and UI remain out of scope.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Campaign docs accidentally redefine consent | Make `newsletter_subscription` the only consent source of truth |
| Editors get global targeting in future implementation | Document chapter-scoped editor campaigns and admin-only global/demographic campaigns |
| Demographic filters become hard-coded tables too early | Treat filters as derived audience criteria and defer physical schema until campaign implementation |
| Docs become too broad | Keep this issue to architecture decisions, future table sketches, and PRD linkage |

## Out Of Scope

- Campaign builder UI
- Email sending or provider integration
- Supabase migrations for campaign tables
- Preference center UX
- Analytics dashboards
- Background jobs or queues
