# Deferred Alumni Scope

Date: 2026-06-04

Related issue: #302

## Decision

Alumni is deferred from the current Spanish-first launch as a full product experience. For launch purposes, Alumni should be treated as a historical membership state, not as an active member workspace, active chapter leadership role, company-discovery profile type, or dedicated dashboard.

## Launch Eligibility Defaults

Until Alumni scope is approved:

- Public events: Alumni may follow the same public-event path as any eligible public participant when the event is open to public/basic-profile registration.
- Member-only or active-member-only events: Alumni are not eligible by default unless leadership later defines an explicit Alumni exception.
- Alumni-only events: not implemented in the current launch.
- Chapter events and chapter operations: Alumni do not receive active chapter operator access, roster permissions, check-in permissions, or chapter-management privileges.

These defaults preserve the current active launch boundary and prevent Alumni from inheriting active-member permissions by label alone.

## Historical Affiliation And Member ID

Historical chapter affiliation should be preserved as membership history, not editable profile data. The preferred data model remains `chapter_membership` for chapter state and `lead_identity` for official identity display where applicable.

Member ID behavior:

- Existing Member IDs should remain historically associated with the person.
- Alumni should not self-edit Member ID, chapter affiliation, or chapter position.
- If displayed, copy should communicate historical status instead of pending active-member activation.

## Deferred Alumni Product Areas

The following areas are intentionally deferred:

- Dedicated Alumni dashboard.
- Alumni profile copy, navigation, and identity badges.
- Attendance history and event participation timeline.
- Professional trajectory or journey content.
- Alumni re-engagement workflows.
- Alumni-only events.
- Alumni visibility in company/recruiter discovery.

## Company Visibility

Alumni visibility to companies is explicitly deferred. Default future behavior should be no Alumni-specific visibility in company discovery until both Alumni scope and company/recruiter scope are approved together.

## Follow-Up Rule

Create implementation issues only after leadership approves the Alumni scope. Each follow-up issue should define the product rule, service-layer authorization, UI states, tests, and any audit or consent requirement before implementation.
