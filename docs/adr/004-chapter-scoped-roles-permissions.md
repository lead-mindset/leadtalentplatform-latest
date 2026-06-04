# ADR 004: Chapter-Scoped Roles And Permissions

## Status

Accepted (May 2026)

Amended (June 2026): clarified Staff/Admin separation and pilot chapter leadership taxonomy.

## Context

LEAD Talent Platform is moving from a small chapter-operator model to a chapter operating system that must support presidents, vice presidents, official e-board members, regular members, admins, company representatives, LEAD Spark, Impact Metrics, LEAD Pulse, and future LEAD Funding workflows.

The previous model treated chapter operators mostly as `public.user.role = 'editor'` users with an approved `chapter_membership`. That was enough for early event and roster management, but it creates long-term problems:

1. `public.user.role` is global, while chapter responsibilities are local to one chapter.
2. `chapter_membership.position` is useful chapter context, but it should not be overwritten just to grant product access.
3. Presidents, vice presidents, chief of staff, directors, coordinators, and pillar leads need clean reporting fields without becoming new global app roles.
4. Recruiter/company access must remain separate from chapter membership and chapter operations.
5. Sensitive changes such as applicant approval, membership removal, e-board assignment, and event archive actions need auditability.
6. Staff identity must not be confused with unrestricted system authority.

## Decision

We will separate chapter operations into four concerns:

1. **Membership lifecycle**: `chapter_membership` says whether a person belongs to a chapter and tracks application, approval, alumni, inactive, member ID, and basic chapter position state.
2. **Official responsibility**: `chapter_role_assignment` says what responsibility a person holds in a chapter, using normalized `role_level`, `functional_area`, and human-readable `display_title`.
3. **Product capability**: `chapter_permission_grant` says what chapter-scoped actions a person can perform in the product.
4. **Sensitive history**: `chapter_audit_log` records sensitive preapproval, membership, role, permission, and event lifecycle changes.

Official LEAD identity remains separate from app authorization. `lead_identity` records public/official LEAD status such as founder, staff, chapter member, chapter editor, or alumni. It does not grant admin authority by itself.

`public.user.role` remains a broad global app role:

| Global Role | Meaning |
| --- | --- |
| `member` | Default account role for participants, approved members, and most chapter e-board users. |
| `admin` | Central/platform operator with global override authority. |
| `recruiter` | Company representative; still authorized through active accepted `recruiter_access`. |
| `editor` | Legacy/backcompat role during migration, not the long-term chapter access primitive. |

Chapter dashboard access should resolve through:

```text
approved chapter_membership
+ active chapter_permission_grant
+ not revoked
= allowed
```

Admin bypass remains explicit through `public.user.role = 'admin'`. Staff identity does not imply admin bypass; staff users need explicit admin app role assignment or a future scoped staff permission tier. Recruiter/company access remains explicit through `public.user.role = 'recruiter'` plus active accepted `recruiter_access`.

## Launch Permission Model

The MVP uses service-owned role templates rather than an admin-configurable role-template table.

President and vice president grants:

- `chapter.dashboard.access`
- `chapter.members.view_approved`
- `chapter.members.view_alumni`
- `chapter.members.view_member_contact`
- `chapter.members.view_applicants`
- `chapter.members.view_rejected`
- `chapter.members.view_inactive`
- `chapter.members.manage_applications`
- `chapter.members.revoke`
- `chapter.roles.assign_eboard`
- `chapter.events.manage`
- `chapter.events.view_registrations`
- `chapter.events.check_in`
- `chapter.events.archive`

Chief of staff grants:

- Same member visibility and event operations as president/VP.
- Applicant management and event archive access.
- No active member revoke permission and no regular e-board assignment permission unless a future decision changes this.

Other official e-board grants:

- `chapter.dashboard.access`
- `chapter.members.view_approved`
- `chapter.members.view_alumni`
- `chapter.members.view_member_contact`
- `chapter.events.manage`
- `chapter.events.view_registrations`
- `chapter.events.check_in`

## Role Taxonomy

Do not create `pillar_lead` or similar chapter titles as global app roles. For chapter leadership reporting, store:

| Field | Purpose |
| --- | --- |
| `role_level` | Normalized seniority such as `president`, `vice_president`, `chief_of_staff`, `director`, `coordinator`, or `member`. |
| `functional_area` | Normalized responsibility area such as marketing, events, academic excellence, professional development, leadership, research, projects, partnerships, people/talent, or other. |
| `display_title` | Human-readable chapter title shown in the product. |
| `raw_title` | Optional imported source title for audit/review. |

President and vice president assignment is central/admin controlled for launch. Presidents and vice presidents may assign regular e-board roles only to approved members of their own chapter.

For the controlled pilot:

- President and Vice President are chapter leadership authorities for their own chapter.
- Chapter Editor is an operator role and not automatically a President/VP equivalent.
- Regular e-board roles are scoped helpers unless explicit permission grants expand their authority.
- Alumni and company representative workflows remain deferred from first-launch chapter operations.

## RLS And Services

Authorization must be enforced in services and server actions, not only through hidden UI buttons. RLS helpers should move toward a permission grant helper such as:

```sql
public.has_chapter_permission(check_chapter_id text, check_permission_key text)
```

Expected helper behavior:

- Admin bypass is allowed.
- Active permission grants are effective only with approved chapter membership.
- Revoked grants do not authorize actions.
- Recruiters do not receive chapter permissions.

Services should expose shared helpers such as:

- `hasChapterPermission(userId, chapterId, permissionKey)`
- `requireChapterPermission(permissionKey)`
- `getChapterPermissionSet(userId, chapterId)`

## Consequences

### Positive

- Chapter e-board users can remain global `member` accounts while accessing the chapter dashboard.
- Real chapter titles are preserved without forcing every title into `public.user.role`.
- President/VP, chief of staff, and regular e-board boundaries are explicit and testable.
- Recruiter and admin behavior stays separate from chapter operations.
- Staff identity and admin authority stay separate, reducing accidental over-permissioning.
- LEAD Pulse, LEAD Funding, Impact Metrics, and recognition workflows can add module-specific permissions later.

### Negative

- The model adds more tables and service logic than the legacy editor approach.
- Migration needs a compatibility period for existing `editor` users.
- Tests must cover service authorization, RLS helpers, and hidden-button/server-action alignment.

## Verification

This decision satisfies issue #193 by documenting:

- `public.user.role` as global app role, not chapter title.
- `chapter_membership` as membership lifecycle.
- `chapter_role_assignment` as official chapter responsibility.
- `chapter_permission_grant` as product capability.
- `lead_identity` as official public LEAD status/display.
- `recruiter_access` as company portal authorization.
- Legacy `editor` as backcompat only while guards migrate to permissions.
- Staff as identity/support status, not automatic admin authority.

## References

- Related: ADR 001 - Service Layer Pattern
- Related: ADR 002 - Automated Database Type Generation
- Related: `docs/handbook/PILOT_ROLE_PERMISSION_MATRIX.md`
- Related: `.github/PRDs/chapter-scoped-roles-permissions-and-preapproval.prd.md`
- Related: GitHub issue #193

