# ADR 003: Newsletter Campaign Architecture

## Status

Accepted (May 2026)

## Context

LEAD Frontier now has a layered account model where account identity, reusable profile data, chapter membership, official LEAD identity, event attendance, and communication consent are separate records. LEAD-008 established `newsletter_subscription` as the consent and preference source of truth for global and chapter communications.

Future newsletter campaigns need to support global announcements, chapter communications, and demographic audience planning. If the campaign model is not documented, future work could accidentally treat chapter membership as consent, give editors global targeting access, or duplicate subscription state in profile tables.

## Decision

We will separate newsletter campaign architecture into four concerns:

1. **Consent**: `newsletter_subscription` is the only source of truth for whether a user may receive global or chapter newsletters.
2. **Audience segments**: Campaign audiences are derived query criteria. They are not consent records and must be intersected with active subscriptions before sending.
3. **Campaign intent**: A campaign stores who created the message, what scope it targets, and which segment definition was selected.
4. **Send history**: A send record stores the resolved recipient, delivery state, provider metadata, and unsubscribe-safe audit history.

## Permission Model

Admins may create:

- Global campaigns for users with active global subscriptions.
- Chapter campaigns for users with active subscriptions to selected chapters.
- Demographic campaigns based on allowed profile, membership, and event attendance filters.

Editors may create:

- Chapter campaigns only for the chapter where they have approved editor membership.
- Campaigns for collaborating event audiences only when their chapter owns or collaborates on the event.

Editors must not create global campaigns or demographic campaigns that target users outside their chapter scope. Admin bypass follows the existing app-role authorization model, but campaign audience resolution still respects subscription consent.

## Audience Rules

Audience segments are derived from existing canonical tables:

| Data Source | Allowed Campaign Use |
|-------------|----------------------|
| `newsletter_subscription` | Consent, scope, active/unsubscribed status |
| `person_profile` | Reusable profile filters such as university, major or interest, graduation year, skills, gender |
| `chapter_membership` | Approved chapter membership, alumni status, chapter position |
| `event_registration` | Event attendance, application status, check-in status |
| `event_chapter` | Host and collaborator chapter ownership |

Derived audiences must be resolved through service-layer logic before send creation. A user can only enter the final send set when the selected campaign scope matches an active subscription row.

Examples:

- A global leadership update targets active global subscribers.
- A LEAD UNI event recap targets active subscribers for `leaduni`.
- An admin demographic campaign for graduating seniors filters `person_profile.graduation_year`, then intersects with active global or chosen chapter subscriptions.
- A post-event message filters `event_registration` attendance, then intersects with the event host/collaborator chapter subscriptions unless the campaign is admin-global.

## Future Tables

The first campaign implementation should consider tables shaped like this:

```text
newsletter_campaign
  id
  created_by_user_id
  scope: global | chapter | demographic | event
  chapter_id nullable
  event_id nullable
  title
  subject
  body_template
  segment_definition jsonb
  status: draft | scheduled | sending | sent | cancelled
  scheduled_at nullable
  created_at
  updated_at

newsletter_send
  id
  campaign_id
  user_id
  subscription_id
  status: queued | sent | bounced | failed | skipped_unsubscribed
  provider_message_id nullable
  sent_at nullable
  error_message nullable
  created_at
  updated_at
```

The exact schema can evolve during the campaign implementation PIV, but it must preserve the consent/audience/send-history separation.

## Service Layer Expectations

Future implementation should add campaign services under `lib/services/`, such as:

- `NewsletterCampaignService` for campaign creation, permission checks, and lifecycle transitions.
- `NewsletterAudienceService` for audience resolution and consent intersection.
- `NewsletterSendService` for send record creation and delivery-state updates.

Server actions, API routes, and background jobs should authenticate, validate input, and delegate to these services. They should not embed audience SQL or permission rules directly.

## Non-Goals

This ADR does not implement:

- Campaign builder UI.
- Email sending or provider integration.
- Background queues or cron jobs.
- Migration files for campaign tables.
- Template rendering.
- Preference center UX.
- Analytics dashboards.

## Consequences

### Positive

- Prevents membership from being treated as newsletter consent.
- Gives future campaign work a clear permission model before UI design begins.
- Keeps unsubscribe and consent behavior queryable and auditable.
- Makes demographic targeting explicit without prematurely locking a physical schema.

### Negative

- Future campaign implementation needs a dedicated audience-resolution service rather than simple one-off queries.
- Admin and editor campaign flows will need separate validation paths.
- Segment definitions require careful review before they become persisted data.

## Verification

This decision satisfies LEAD-026 by documenting:

- Subscription consent versus campaign audience segments.
- Editor campaigns scoped to approved chapter membership.
- Admin ability to create global, chapter, and demographic campaigns.
- Future demographic filters based on `person_profile`, `chapter_membership`, and event attendance.
- Campaign sending and UI as explicit non-goals.

## References

- Related: ADR 001 - Service Layer Pattern
- Related: LEAD-008 Newsletter Subscription Foundation
- Related: LEAD-026 Document Newsletter Campaign Architecture
