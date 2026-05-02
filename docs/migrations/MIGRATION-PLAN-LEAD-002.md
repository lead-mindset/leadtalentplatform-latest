# LEAD-002: Database Migration Plan for Foundation Schema

**Issue:** LEAD-002
**Status:** Production-Ready Review
**Priority:** High

---

## 0. Engineering Standards (Non-Negotiable)

> "Code is read more than written." - Every senior engineer at Google

### 0.1 Constraints & Uniqueness
- Every user reference MUST have uniqueness constraint
- One `person_profile` per user (not one per chapter)
- One `lead_identity` per user (global, not per-chapter)

### 0.2 Indexing Strategy
- All foreign keys MUST have indexes
- Compound indexes for common query patterns
- Add at table creation time, not after

### 0.3 Security (RLS)
- RLS policies MUST be in same migration as table creation
- No window of vulnerability between CREATE and ALTER for RLS

### 0.4 Data Integrity
- All data migrations MUST use transactions
- Pre-migration validation: verify source data exists
- Post-migration verification: row counts, referential integrity

### 0.5 Existing Data
- Must document what happens to: `event_registration`, `resume`, `saved_student`
- These reference `student_profile` - need FK updates or documentation

---

## 1. Current Schema (Existing Tables)

| Table | Purpose |
|-------|---------|
| `user` | Authentication, role |
| `chapter` | LEAD chapters |
| `event` | Events |
| `event_chapter` | Event-chapter collaboration (M:N) |
| `event_registration` | Event registrations |
| `student_profile` | **TO BE MIGRATED** - mixed basic profile + membership |
| `recruiter_access` | Recruiter invites |
| `company` | Companies |
| `resume` | Student resumes |
| `resume_download_log` | Download tracking |
| `saved_student` | Recruiter shortlists |

---

## 2. New Tables (Foundation Schema)

### 2.1 `person_profile`
Basic onboarding data - **NOT tied to chapter membership**

| Field | Type | Constraints | Source (from student_profile) |
|-------|------|-------------|--------------------------------|
| id | uuid | PK | NEW |
| user_id | uuid | **UNIQUE, NOT NULL, FK → user.id** | student_profile.user_id |
| university | text | | student_profile.major |
| major_or_interest | text | | student_profile.major |
| graduation_year | int4 | | student_profile.graduation_year |
| linkedin_url | text | | student_profile.linkedin_url |
| portfolio_url | text | | NEW (NULL for migration) |
| skills | text[] | | student_profile.skills |
| gender | text | | student_profile.gender |
| created_at | timestamptz | DEFAULT NOW() | NEW |
| updated_at | timestamptz | DEFAULT NOW() | NEW |

**Indexes:**
- `idx_person_profile_user_id` (UNIQUE, automatically created)

**RLS:** Enabled - users can read/write own profile

**Migration:** Copy universal fields from `student_profile`

> **Design Rationale:** UNIQUE constraint prevents multiple profiles per user. This is intentional - a user should have ONE onboarding record, then optionally MULTIPLE chapter memberships.

---

### 2.2 `chapter_membership`
Chapter membership with approval workflow - **ONE USER CAN HAVE MULTIPLE CHAPTER MEMBERSHIPS**

| Field | Type | Constraints | Source (from student_profile) |
|-------|------|-------------|--------------------------------|
| id | uuid | PK | NEW (PK) |
| user_id | uuid | NOT NULL, FK → user.id, INDEX | student_profile.user_id |
| chapter_id | uuid | NOT NULL, FK → chapter.id, INDEX | student_profile.chapter_id |
| status | enum | NOT NULL | student_profile.approval_status |
| position | text | | NEW (derived from role) |
| approved_by_id | uuid | FK → user.id | student_profile.approved_by_id |
| member_id | text | UNIQUE (across table) | student_profile.member_id |
| joined_at | timestamptz | | student_profile.created_at |
| created_at | timestamptz | DEFAULT NOW() | NEW |
| updated_at | timestamptz | DEFAULT NOW() | NEW |

**Indexes:**
- `idx_chapter_membership_user_id` on user_id
- `idx_chapter_membership_chapter_id` on chapter_id
- `idx_chapter_membership_member_id` (UNIQUE)
- `idx_chapter_membership_chapter_status` on (chapter_id, status) - **compound for approval queries**

**RLS:** Enabled - user can read own memberships; editors can manage their chapter's

**Migration:** Map approval_status → membership status, preserve member_id

> **Design Rationale:** Compound index on (chapter_id, status) enables efficient queries like "get all pending members for chapter X" - common for editor workflows.

---

### 2.3 `lead_identity`
Official LEAD IDs - independent of chapter membership - **ONE PER USER (global identity)**

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | **UNIQUE, NOT NULL, FK → user.id, INDEX** |
| identity_type | enum | (founder, staff, chapter_editor, chapter_member, alumni) |
| chapter_id | uuid | NULL for founder/staff, FK → chapter.id |
| is_primary | boolean | DEFAULT true |
| issued_by_id | uuid | FK → user.id |
| issued_at | timestamptz | DEFAULT NOW() |
| revoked_at | timestamptz | NULL = active |
| status | enum | (active, revoked), DEFAULT 'active' |
| created_at | timestamptz | DEFAULT NOW() |
| updated_at | timestamptz | DEFAULT NOW() |

**Indexes:**
- `idx_lead_identity_user_id` (UNIQUE, automatically created)

**RLS:** Enabled - user can read own identity; admin manages all

**Migration:** NEW - no existing data to migrate

> **Design Rationale:** UNIQUE on user_id ensures ONE primary identity per person. The `is_primary` field allows for future expansion if we want multiple identities, but for now we enforce one-per-user at DB level.

---

### 2.4 `newsletter_subscription`
Global and chapter subscriptions

| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| scope | enum | (global, chapter) |
| chapter_id | uuid | NULL if global |
| status | enum | (active, inactive, unsubscribed) |
| source | enum | (onboarding, event_registration, manual) |
| subscribed_at | timestamptz |
| unsubscribed_at | timestamptz |
| created_at | timestamptz |
| updated_at | timestamptz |

**Migration:** NEW - derive from student_profile.email_notifications_enabled

---

### 2.5 `event_application_question`
Custom questions for application-based events

| Field | Type |
|-------|------|
| id | uuid |
| event_id | uuid |
| question_type | enum | (short_text, long_text, single_select, checkbox, url) |
| question_text | text |
| options | text[] | for single_select, checkbox |
| is_required | boolean |
| order | int4 |
| created_at | timestamptz |
| updated_at | timestamptz |

**Migration:** NEW

---

### 2.6 `event_application_answer`
Applicant answers to event questions

| Field | Type |
|-------|------|
| id | uuid |
| registration_id | uuid | event_registration.id |
| question_id | uuid | event_application_question.id |
| answer_text | text |
| created_at | timestamptz |
| updated_at | timestamptz |

**Migration:** NEW

---

## 3. Migration Order (with Production Patterns)

```
1. 001_add_person_profile.sql
    - Create person_profile table WITH:
      - UNIQUE constraint on user_id
      - Index on user_id
      - RLS policies (same migration)
    - No data migration (first step)

2. 002_add_chapter_membership.sql
    - Create chapter_membership table WITH:
      - Indexes on user_id, chapter_id, member_id
      - Composite index on (chapter_id, status) for approval queries
      - RLS policies (same migration)

3. 003_add_lead_identity.sql
    - Create lead_identity table WITH:
      - UNIQUE constraint on user_id
      - Index on user_id
      - RLS policies

4. 004_add_newsletter_subscription.sql
    - Create newsletter_subscription table WITH:
      - Indexes on user_id, status
      - RLS policies

5. 005_add_event_application_tables.sql
    - Create event_application_question WITH:
      - Index on event_id
      - RLS policies
    - Create event_application_answer WITH:
      - Index on registration_id, question_id
      - RLS policies

6. 005_migrate_student_profile_to_person_profile.sql
    - TRANSACTION wrapper (mandatory)
    - Pre-validation: SELECT COUNT(*) FROM student_profile
    - COPY universal fields to person_profile
    - Post-validation: verify row counts match
    - FOREIGN KEY constraint to user.id

7. 006_migrate_student_profile_to_chapter_membership.sql
    - TRANSACTION wrapper (mandatory)
    - Pre-validation: SELECT COUNT(DISTINCT chapter_id) FROM student_profile
    - COPY membership data to chapter_membership
    - Post-validation: verify chapter_id references valid chapters
    - FOREIGN KEY constraint to chapter.id

8. 007_migrate_student_profile_to_lead_identity.sql
    - TRANSACTION wrapper
    - Create identities for members where approval_status = 'approved'
    - Post-validation: verify all approved members have identity

9. 008_migrate_email_subscriptions.sql
    - TRANSACTION wrapper
    - CREATE newsletter_subscriptions from student_profile.email_notifications_enabled
    - Handle existing event_registrations as subscription source

10. 009_update_event_registration_foreign_keys.sql
    - Update event_registration to reference person_profile (not student_profile)
    - Update resume.user_id references if needed
    - Update saved_student references

11. 010_deprecate_student_profile.sql
    - Add RLS to block new inserts
    - Mark as deprecated in docs
    - Keep for rollback capability (DO NOT DROP)
```

### Migration Template Pattern

Every data migration file MUST follow this template:

```sql
-- Migration: 005_migrate_student_profile_to_person_profile.sql
-- Purpose: Copy basic profile data to new person_profile table
-- Pre-validation: SELECT COUNT(*) FROM student_profile;
-- Post-validation: SELECT COUNT(*) FROM person_profile;

BEGIN;

-- PRE-VALIDATION
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM student_profile) = 0 THEN
    RAISE EXCEPTION 'No source data in student_profile';
  END IF;
END $$;

-- MAIN MIGRATION
INSERT INTO person_profile (id, user_id, university, major_or_interest, graduation_year, linkedin_url, skills, gender, created_at, updated_at)
SELECT
  gen_random_uuid(),
  user_id,
  major,           -- maps to university
  major,           -- maps to major_or_interest
  graduation_year,
  linkedin_url,
  skills,
  gender,
  created_at,
  NOW()
FROM student_profile
ON CONFLICT (user_id) DO NOTHING;

-- POST-VALIDATION
DO $$
DECLARE source_count INTEGER;
DECLARE target_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO source_count FROM student_profile;
  SELECT COUNT(*) INTO target_count FROM person_profile;

  IF target_count < source_count THEN
    RAISE EXCEPTION 'Data loss detected: source=% target=%', source_count, target_count;
  END IF;

  RAISE NOTICE 'Migration verified: % rows copied', target_count;
END $$;

COMMIT;
```

---

## 3.1 Existing Data References (CRITICAL)

Before migration, document what happens to tables that reference `student_profile`:

### event_registration
```
Current: event_registration.student_profile_id → student_profile.id
After:   event_registration.user_id → user.id (via person_profile)
```

**Action:** Migration 009 updates FK reference. Verify:
- All event_registrations have valid user_id
- If student_profile was soft-deleted, preserve registration history

### resume
```
Current: resume.student_profile_id → student_profile.id
After:   resume.user_id → user.id
```

**Action:** Add user_id column to resume, populate from student_profile.user_id, drop student_profile_id

### saved_student
```
Current: saved_student.student_profile_id → student_profile.id
After:   saved_student.user_id → user.id
```

**Action:** Add user_id column to saved_student, populate from student_profile.user_id, drop student_profile_id

### recruiter_access
```
Current: recruiter_access.student_profile_id → student_profile.id
After:   recruiter_access.user_id → user.id
```

**Action:** Same pattern as above

> **Principle:** Always maintain audit trail. Never lose historical data. FK updates preserve the relationship, just pointing to the new model.

---

## 4. Data Migration Mapping

### student_profile → person_profile

| student_profile field | person_profile field |
|----------------------|---------------------|
| user_id | user_id |
| major | university, major_or_interest |
| graduation_year | graduation_year |
| linkedin_url | linkedin_url |
| skills | skills |
| gender | gender |
| - | portfolio_url (NULL) |

### student_profile → chapter_membership

| student_profile field | chapter_membership field |
|----------------------|--------------------------|
| user_id | user_id |
| chapter_id | chapter_id |
| approval_status | status |
| approved_by_id | approved_by_id |
| member_id | member_id |
| created_at | joined_at |

---

## 5. Rollback Plan

Each migration file must have corresponding DOWN:

```sql
-- Example rollback pattern
DROP TABLE IF EXISTS person_profile;
DROP TABLE IF EXISTS chapter_membership;
-- etc.
```

**Verification queries:**
- Count new table rows = expected
- Count old student_profile rows preserved
- Foreign key relationships valid

---

## 6. Type Regeneration

After all migrations:

```bash
pnpm run types:generate
```

Expected changes to `lib/database.types.ts`:
- New Tables section entries for all 6 new tables
- New Enums for: identity_type, newsletter_scope, newsletter_status, question_type, application_answer_status

---

## 7. RLS Policies

Need RLS for:
- `person_profile`: user owns their own
- `chapter_membership`: user + editor of their chapter + admin
- `lead_identity`: user + admin
- `newsletter_subscription`: user + admin
- `event_application_question`: editor for event's chapter
- `event_application_answer`: user (for own registration) + editor

---

## 8. Testing Strategy

1. Run each migration in isolation on local Docker Supabase
2. Run verification queries after each
3. Run full test suite after types regenerated
4. Manual testing: create user, complete onboarding, register for event

---

## 9. Dependencies Unblocked

After this migration plan is complete and executed:
- LEAD-005: Person Profile Foundation ✅
- LEAD-006: Chapter Membership Foundation ✅
- LEAD-007: LEAD Identity Foundation ✅
- LEAD-008: Newsletter Subscription Foundation ✅
- LEAD-009: Event Application Question Foundation ✅

---

## 10. Production Readiness Summary

### What's Different from "Quick Website" Approach

| Aspect | Quick Fix | This Plan (Google Standard) |
|--------|-----------|------------------------------|
| **User ID** | Just a column | UNIQUE constraint - prevents data corruption |
| **Indexes** | Add later (forgot) | At table creation - prevents slow queries at scale |
| **RLS** | Add after CREATE | In same migration - no security gap |
| **Data Moves** | COPY and hope | Transaction + validation - detects failures fast |
| **Existing Data** | Ignore it | Document every FK reference update |
| **Rollback** | "We'll figure it out" | Each migration has explicit DOWN |

### Why This Matters for Long-Term Growth

1. **Uniqueness constraints** - When you have 10,000 users and someone tries to create a second profile, you catch it at DB level, not in debugging session at 2am

2. **Compound indexes** - "Get all pending members for chapter" query goes from 500ms to 5ms when you have chapters with 1000+ members

3. **RLS in same migration** - No window where a bug could expose data before you remember to add security policy

4. **Transaction wrappers** - If any step fails, entire migration rolls back. No partial data, no manual cleanup

5. **Existing data documentation** - When you need to debug why event_registration shows wrong user in 6 months, you know exactly what changed and why

### Migration Count: 11 (was 10)

Added migration 009 to handle existing data FK updates explicitly.

---

**Plan ready for implementation?** ✅ Production-grade patterns applied.