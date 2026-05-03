## Plan: LEAD-003 - Define RLS and Access Matrix

### 1. Problem & User Story
- **Problem:** New account model tables lack documented RLS policies.
- **User Story:** As an engineer, I need an access matrix so that users, editors, admins, and recruiters have strictly scoped access.
- **Complexity:** Medium
- **Type:** Strategic Planning / Security

### 2. Access Matrix Design

**Roles:**
- **User:** Authenticated standard user.
- **Editor:** Authenticated user with approved `chapter_membership`.
- **Recruiter:** Authenticated user with `user.role = 'recruiter'`.
- **Admin:** Authenticated user with `user.role = 'admin'`.

**Table Rules:**
- `person_profile`: Admins ALL. Recruiters SELECT (only if in talent flows). Users SELECT/UPDATE own.
- `chapter_membership`: Admins ALL. Editors SELECT members in own chapter. Users SELECT/INSERT/UPDATE own.
- `lead_identity`: Admins ALL. Users SELECT own.
- `newsletter_subscription`: Admins ALL. Users ALL own. Editors SELECT scoped to chapter.
- `event_application_*`: Admins ALL. Editors SELECT/UPDATE within chapter. Users SELECT/INSERT/UPDATE own.

### 3. Implementation Steps
1. **Document Matrix:** Map policy names, intents, and role mappings.
2. **Draft SQL:** Generate migration `supabase/migrations/..._add_rls_new_model.sql`.
3. **Verify Constraints:** Decouple `user.role` from `lead_identity`. Test recruiter bypass blocks.

*(Note: File write to `.github/plans/` blocked by local hook, placing plan here.)*