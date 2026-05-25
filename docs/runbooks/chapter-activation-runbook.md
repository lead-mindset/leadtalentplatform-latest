# Chapter Activation Runbook

This runbook supports the first controlled activation of LEAD Talent Platform with real chapter leaders. It is grounded in the current chapter-scoped model:

```text
approved chapter_membership
+ active chapter_role_assignment
+ active chapter_permission_grant
= chapter operations access
```

Do not make chapter leaders global admins. Most presidents, vice presidents, and e-board members should remain `public.user.role = 'member'`.

## Launch Roles

| Person | Operational responsibility |
| --- | --- |
| Christopher / chapter operations | Collect president, vice president, e-board, and member lists from chapter leaders. |
| Abigail / platform admin | Review lists, load preapprovals, train chapter leaders, and correct launch issues. |
| President / vice president | Activate their accounts, verify the chapter roster, manage applicants, create events, and assign regular e-board roles. |
| Official e-board | Help operate events and view approved member/alumni information according to granted permissions. |
| Founders / central team | Review readiness, blockers, and how this supports LEAD's broader operating system vision. |

## Data Rules

- Real chapter email lists must never be committed to migrations, seed files, PRDs, issues, screenshots, or docs.
- Keep real CSVs or SQL scratch files outside the repo, or use a protected Supabase SQL editor session.
- Preapproval is exact-email based. If a leader signs up with a different email, the platform should treat them as a normal user.
- `chapter_membership.position` should stay lifecycle/context data, usually `member`; official responsibility belongs in `chapter_role_assignment`.
- Product access belongs in `chapter_permission_grant`; do not grant access by changing `public.user.role` to `editor`.
- Default preapproval expiration is 6 months unless the insert explicitly sets another `expires_at`.

## Input Format From Chapters

Ask Christopher to collect one row per person. Use placeholders when documenting examples.

| Column | Required | Example | Notes |
| --- | --- | --- | --- |
| `email` | Yes | `leader@example.edu` | Must be the exact email the person will use to sign up. |
| `chapter_id` | Yes | `leaduni` | Confirm against `public.chapter.id`. |
| `preapproval_type` | Yes | `member` or `eboard` | Members auto-approve only; e-board also receives role and permissions. |
| `role_level` | E-board only | `president`, `vice_president`, `chief_of_staff`, `director`, `coordinator` | President/VP should be centrally verified. |
| `functional_area` | E-board only | `general_leadership`, `events_experience`, `marketing_communications` | Use the normalized taxonomy. |
| `display_title` | E-board only | `Presidenta`, `Directora de Marketing` | Human title shown in the product. |
| `raw_title` | Optional | `Marketing Coordinator` | Original imported title for review. |
| `notes` | Optional | `phase_1_activation` | Avoid personal/private notes. |

Recommended chapter pilot order: start with one organized chapter, complete the whole flow, then expand.

## Role And Area Taxonomy

Use these current values.

Role levels:

- `president`
- `vice_president`
- `chief_of_staff`
- `director`
- `coordinator`

Functional areas:

- `general_leadership`
- `strategy_operations`
- `marketing_communications`
- `events_experience`
- `finance_legal`
- `chapter_development`
- `academic_excellence`
- `professional_development`
- `leadership`
- `women_in_stem`
- `research`
- `projects`
- `partnerships_external_relations`
- `people_talent`
- `other`

## Preapproval Load Procedure

Use the protected database environment. Keep the real email list outside git.

1. Confirm the chapter IDs:

```sql
select id, name, university
from public.chapter
order by name;
```

2. Confirm the admin actor exists:

```sql
select id, email, role
from public."user"
where email = '<admin-email>'
  and role = 'admin';
```

3. Run a duplicate/ambiguity check before insert. Replace the placeholder `values` rows in the SQL editor only.

```sql
with incoming(email, chapter_id, preapproval_type, role_level, functional_area, display_title, raw_title, notes) as (
  values
    ('leader@example.edu', 'leaduni', 'eboard', 'president', 'general_leadership', 'Presidenta', 'Presidenta', 'pilot'),
    ('member@example.edu', 'leaduni', 'member', null, null, null, null, 'pilot')
),
normalized as (
  select
    email,
    lower(btrim(email)) as normalized_email,
    chapter_id,
    preapproval_type
  from incoming
)
select normalized_email, array_agg(distinct chapter_id) as chapters, count(*) as rows
from normalized
group by normalized_email
having count(*) > 1
   or count(distinct chapter_id) > 1;
```

Expected result: zero rows. If a person appears for more than one chapter, resolve it before loading. The current claim service activates the first matching active preapproval by email, so ambiguous emails are not safe for launch.

4. Check whether any incoming row already has an active preapproval.

```sql
with incoming(email, chapter_id, preapproval_type, role_level, functional_area, display_title, raw_title, notes) as (
  values
    ('leader@example.edu', 'leaduni', 'eboard', 'president', 'general_leadership', 'Presidenta', 'Presidenta', 'pilot'),
    ('member@example.edu', 'leaduni', 'member', null, null, null, null, 'pilot')
),
normalized as (
  select lower(btrim(email)) as normalized_email, chapter_id
  from incoming
)
select cp.id, cp.email, cp.chapter_id, cp.preapproval_type, cp.expires_at
from normalized n
join public.chapter_preapproval cp
  on cp.normalized_email = n.normalized_email
 and cp.chapter_id = n.chapter_id
where cp.consumed_at is null
  and cp.revoked_at is null;
```

Expected result: zero rows. If rows appear, decide whether to keep, revoke, or skip them.

5. Insert preapprovals in a transaction. This template uses placeholders only.

```sql
begin;

with actor as (
  select id
  from public."user"
  where email = '<admin-email>'
    and role = 'admin'
  limit 1
),
incoming(email, chapter_id, preapproval_type, role_level, functional_area, display_title, raw_title, notes) as (
  values
    ('leader@example.edu', 'leaduni', 'eboard', 'president', 'general_leadership', 'Presidenta', 'Presidenta', 'pilot'),
    ('member@example.edu', 'leaduni', 'member', null, null, null, null, 'pilot')
),
normalized as (
  select
    btrim(email) as email,
    lower(btrim(email)) as normalized_email,
    chapter_id,
    preapproval_type,
    role_level,
    functional_area,
    display_title,
    raw_title,
    notes
  from incoming
)
insert into public.chapter_preapproval (
  email,
  normalized_email,
  chapter_id,
  preapproval_type,
  role_level,
  functional_area,
  display_title,
  raw_title,
  created_by_id,
  source,
  notes
)
select
  n.email,
  n.normalized_email,
  n.chapter_id,
  n.preapproval_type,
  n.role_level,
  n.functional_area,
  n.display_title,
  n.raw_title,
  actor.id,
  'chapter_activation_phase_1',
  n.notes
from normalized n
cross join actor
where not exists (
  select 1
  from public.chapter_preapproval cp
  where cp.normalized_email = n.normalized_email
    and cp.chapter_id = n.chapter_id
    and cp.consumed_at is null
    and cp.revoked_at is null
);

commit;
```

6. Verify the load:

```sql
select chapter_id, preapproval_type, role_level, count(*) as rows
from public.chapter_preapproval
where source = 'chapter_activation_phase_1'
  and consumed_at is null
  and revoked_at is null
group by chapter_id, preapproval_type, role_level
order by chapter_id, preapproval_type, role_level;
```

## Activation Flow

1. Abigail sends invitation emails outside the repo using the exact preapproved emails.
2. The user creates an account with that same email.
3. The user completes onboarding/profile.
4. The preapproval claim service runs server-side:
   - `member` preapproval creates or updates approved `chapter_membership`.
   - `eboard` preapproval also creates active `chapter_role_assignment` and grants role-template permissions.
5. President/VP users land in the chapter dashboard.
6. Regular e-board users land in the chapter dashboard with narrower access.
7. Approved members without e-board grants land in the student/member dashboard.
8. Users without preapproval can still sign up normally and request chapter membership through the web app.

## Chapter Leader Training Flow

Use one call per chapter, then a short follow-up after the first event or applicant action.

Recommended agenda:

1. Explain the model in plain language: membership says who belongs, role says responsibility, permissions say what actions are allowed.
2. Have president/VP sign in with the preapproved email and complete onboarding.
3. Confirm they land in the chapter dashboard, not the student dashboard.
4. Review member tabs:
   - All official e-board can see approved members and alumni.
   - President/VP/chief of staff can also see pending, rejected, and inactive members.
5. Review applicant decisions:
   - President/VP/chief of staff can approve or reject applicants.
   - Regular e-board should not see or use those controls.
6. Review events:
   - All official e-board can create, edit, publish, view registrations, and check in attendees.
   - President/VP/chief of staff can archive/cancel when needed.
7. Review e-board assignment:
   - President/VP can assign regular e-board roles to approved members.
   - President/VP cannot assign or remove president/VP status.
   - Admin corrects president/VP status centrally.
8. Confirm support path:
   - Wrong email, chapter, role, missing member, or extra access goes to Abigail/admin.
9. End with one operating expectation:
   - The platform should become the chapter's working system for events, membership, and evidence, not only a signup form.

Suggested Spanish framing for the call:

```text
La plataforma separa tres cosas: membresia, rol y permisos.
Ser miembro significa pertenecer al chapter. Tener un rol e-board significa tener una responsabilidad oficial. Tener permisos significa poder operar ciertas partes del dashboard.
```

## Support And Rollback Cases

Prefer revocation/deactivation over deletion so the audit trail remains useful.

| Case | Before activation | After activation |
| --- | --- | --- |
| Wrong email | Revoke the unclaimed preapproval and insert a new one for the correct email. | Verify the user account email. If the wrong person activated, revoke grants, deactivate role, and escalate before touching membership. |
| Wrong chapter | Revoke the unclaimed preapproval and insert a new one for the correct chapter. | Escalate. Deactivate wrong chapter role/grants and mark wrong membership inactive only after confirming no event ownership or chapter data must be preserved. |
| Wrong role | Revoke and reinsert if unclaimed. | Use admin correction UI for president/VP or protected roles. President/VP can adjust regular e-board roles from the roster. |
| Missing member | Add a `member` preapproval if the person belongs to the verified list, or let them apply normally through the web app. | If already signed up normally, insert/claim path may not run again automatically; handle through admin support or approve their pending membership. |
| Duplicate email | Resolve before insert. One active email across multiple chapters is unsafe for launch. | Escalate. Confirm intended chapter, then revoke/deactivate the unintended access path. |
| Extra access | Revoke the unclaimed e-board preapproval or replace it with `member`. | Deactivate the role assignment and revoke linked permission grants. Keep membership approved unless membership itself is wrong. |

### Revoke Unclaimed Preapproval

```sql
update public.chapter_preapproval cp
set revoked_at = now(),
    revoked_by_id = actor.id,
    updated_at = now(),
    notes = concat_ws(' | ', cp.notes, 'revoked: wrong launch data')
from (
  select id
  from public."user"
  where email = '<admin-email>'
    and role = 'admin'
  limit 1
) actor
where cp.normalized_email = lower(btrim('leader@example.edu'))
  and cp.chapter_id = 'leaduni'
  and cp.consumed_at is null
  and cp.revoked_at is null;
```

### Remove Extra E-board Access

Use the admin UI when possible. If a direct database correction is required, keep it transaction-scoped and record a clear reason.

```sql
begin;

with actor as (
  select id
  from public."user"
  where email = '<admin-email>'
    and role = 'admin'
  limit 1
),
target_user as (
  select id
  from public."user"
  where email = 'leader@example.edu'
  limit 1
),
target_assignment as (
  update public.chapter_role_assignment cra
  set status = 'inactive',
      ends_at = now(),
      updated_at = now()
  from target_user
  where cra.user_id = target_user.id
    and cra.chapter_id = 'leaduni'
    and cra.status = 'active'
  returning cra.id, cra.user_id, cra.chapter_id
)
update public.chapter_permission_grant cpg
set revoked_at = now(),
    revoked_by_id = actor.id,
    revoke_reason = 'Incorrect launch e-board access'
from target_assignment, actor
where cpg.user_id = target_assignment.user_id
  and cpg.chapter_id = target_assignment.chapter_id
  and cpg.source_role_assignment_id = target_assignment.id
  and cpg.revoked_at is null;

commit;
```

## Pilot Chapter Readiness Checklist

Complete this for the first pilot chapter before expanding.

- [ ] Chapter ID confirmed.
- [ ] President and vice president emails verified.
- [ ] E-board/member list checked for duplicate emails and ambiguous chapters.
- [ ] Preapprovals inserted with no real data committed to git.
- [ ] President signs up, completes onboarding, and lands in chapter dashboard.
- [ ] Vice president signs up, completes onboarding, and lands in chapter dashboard.
- [ ] One regular e-board member can access the dashboard and create/edit event drafts.
- [ ] One approved member without e-board grants lands in the student/member dashboard.
- [ ] President/VP can see approved members, applicants, inactive/rejected tabs, and e-board assignment controls.
- [ ] Regular e-board can see approved member info but not applicant/revoke/role controls.
- [ ] One event is created, published, and checked for registration/check-in readiness.
- [ ] Evidence captured: screenshots, blocking issues, support cases, and next steps.

## Founder Summary

LEAD Talent Platform is becoming the operating layer for chapter work, not only a member directory or event form. The current model separates identity, membership, official responsibility, and product permissions so chapters can operate with autonomy while central LEAD keeps accountability and auditability.

This supports controlled activation: chapters can start using the platform for their own events and member workflows, while LEAD Spark can become a larger catalyst built on the same foundation. The same architecture prepares the platform for three measurement layers:

- Activity Metrics: events, registrations, attendance, check-ins, and participation.
- Impact Metrics: purpose, target audience, outcomes, partners, learnings, and contribution to organizational goals.
- Pulse Metrics: belonging, motivation, leadership clarity, communication, member experience, and action plans.

LEAD Pulse can later connect as a module tied to users, chapters, and memberships while preserving anonymity rules. LEAD Funding can use the same chapter-scoped permission model for funding requests, review, and accountability. Over time, chapter recognition and LEAD GALA awards can be based on a healthier mix of activity, impact, growth, innovation, organizational health, and contribution to LEAD's mission.

The immediate founder feedback needed is simple:

- Which chapters should pilot first?
- What minimum evidence proves a chapter is ready to scale?
- Which operational decisions should remain central for launch?
- Which metrics should matter most in the first Impact Metrics report?
