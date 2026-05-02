# Plan: LEAD-002 Database Migration Plan for Foundation Schema

## Issue
- **GitHub:** #3 - LEAD-002: Create Database Migration Plan for Foundation Schema
- **Type:** Technical Spike
- **Priority:** High
- **Phase:** Implementation Complete

## Status: ✅ IMPLEMENTED
All 11 migration scripts created in `supabase/migrations/`

## Problem
The platform needs a migration plan for the foundation schema that decouples authenticated identity from student/chapter membership. Current `student_profile` table mixes basic profile data with chapter membership - needs to be split into layered model.

## User Story
As an engineer, I want a database migration plan for the foundation schema, so that bold database changes can be made safely while the platform is in maintenance mode.

## Acceptance Criteria
- [x] List all new tables, relationships, indexes, migration order
- [x] Map existing student_profile fields to target destinations
- [x] Document rollback and verification steps
- [x] Identify type regeneration commands
- [x] **IMPLEMENTED** - All 11 migration scripts created

## Implementation Plan

### Phase 1: Schema Analysis (1 task)
1. **Audit current schema** - Analyze `lib/database.types.ts` and existing migrations in `supabase/migrations/`

### Phase 2: Migration Scripts (11 tasks) - ✅ COMPLETE

| # | File | Status |
|---|------|--------|
| 1 | 001_add_person_profile.sql | ✅ Created |
| 2 | 002_add_chapter_membership.sql | ✅ Created |
| 3 | 003_add_lead_identity.sql | ✅ Created |
| 4 | 004_add_newsletter_subscription.sql | ✅ Created |
| 5 | 005_add_event_application_tables.sql | ✅ Created |
| 6 | 006_migrate_to_person_profile.sql | ✅ Created |
| 7 | 007_migrate_to_chapter_membership.sql | ✅ Created |
| 8 | 008_migrate_to_lead_identity.sql | ✅ Created |
| 9 | 009_migrate_email_subscriptions.sql | ✅ Created |
| 10 | 010_update_foreign_keys.sql | ✅ Created |
| 11 | 011_deprecate_student_profile.sql | ✅ Created |

### Phase 3: Type Generation (1 task)
1. **Run types:generate** - Update lib/database.types.ts with new tables

### Phase 4: RLS Policies (1 task)
1. **Add RLS policies** - For all 6 new tables

### Phase 5: Verification (2 tasks)
1. **Run verification queries** - Validate row counts and FK relationships
2. **Run test suite** - Ensure all 140+ tests pass

## Files to Create

### Migration Files (supabase/migrations/)
- `001_add_person_profile.sql`
- `002_add_chapter_membership.sql`
- `003_add_lead_identity.sql`
- `004_add_newsletter_subscription.sql`
- `005_migrate_student_profile_to_person_profile.sql`
- `006_migrate_student_profile_to_chapter_membership.sql`
- `007_migrate_student_profile_to_lead_identity.sql`
- `008_migrate_email_subscriptions.sql`
- `009_add_event_application_tables.sql`
- `010_deprecate_student_profile.sql`

### Documentation
- `docs/migrations/MIGRATION-PLAN-LEAD-002.md` (this plan - already created)

## Dependencies
- Blocked by: LEAD-001 ✅ (PRD approved)
- Unblocks: LEAD-005, LEAD-006, LEAD-007, LEAD-008, LEAD-009

## Risks
1. **Data loss** - Must preserve all student_profile data during migration
2. **Downtime** - Platform in maintenance mode during migration
3. **Type drift** - Must regenerate types immediately after migrations
4. **RLS gaps** - Missing policies could expose data

## Complexity: Medium
- 11 migration files
- Multi-table relationships
- Data transformation logic
- RLS policy design

## Estimated Time
- Migration scripts: 2-3 hours
- Type generation + testing: 1 hour
- RLS policies: 1-2 hours
- **Total: ~4-6 hours**

---

## ✅ COMPLETED - Next Steps

### Immediate Actions Required

1. **Run migrations on staging**
   ```bash
   pnpm supabase db push
   # or: supabase migrations deploy
   ```

2. **Generate types**
   ```bash
   pnpm run types:generate
   ```

3. **Run test suite**
   ```bash
   pnpm test
   ```

4. **Update service layer**
   - Modify services in `lib/services/` to use new tables
   - person_profile instead of student_profile for basic info
   - chapter_membership for chapter relationships

5. **Update UI components**
   - Create person_profile on signup instead of student_profile
   - Update profile forms

6. **Update issue labels**
   - Label issue #3 as completed

### Files Created

```
supabase/migrations/
├── 001_add_person_profile.sql
├── 002_add_chapter_membership.sql
├── 003_add_lead_identity.sql
├── 004_add_newsletter_subscription.sql
├── 005_add_event_application_tables.sql
├── 006_migrate_to_person_profile.sql
├── 007_migrate_to_chapter_membership.sql
├── 008_migrate_to_lead_identity.sql
├── 009_migrate_email_subscriptions.sql
├── 010_update_foreign_keys.sql
└── 011_deprecate_student_profile.sql
```