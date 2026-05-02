# Plan: Phase 2 Foundation Validation & Service Layer Recovery

## Issue
- **GitHub:** #4 - Phase 2: Account, Identity, and Membership Foundation
- **Type:** Feature Implementation
- **Priority:** Critical
- **Phase:** Phase 2 - Foundation Recovery
- **Status:** 🔄 IN PROGRESS

## Problem
Database migrations for the foundation schema (person_profile, chapter_membership, lead_identity) have been created but not validated. Services have been partially updated but need comprehensive validation to ensure the layered account model works correctly across all user roles.

## User Story
As an engineer, I want to validate that the foundation schema migrations work correctly and that all services properly use the new layered account model, so that we can safely proceed to Phase 3 with confidence.

## Acceptance Criteria
- [ ] All 11 migrations run successfully on local Supabase
- [ ] Database types regenerated and match new schema
- [ ] Service layer tests pass for all user role states
- [ ] Auth routing matrix validated
- [ ] Manual smoke tests pass for each role
- [ ] RLS policies verified for new tables

## Implementation Plan

### Phase 2.1: Migration Execution (Critical Path)

#### Task 1: Pre-Migration Backup
**Priority:** Critical | **Time:** 15 min
- Backup database: `pnpm supabase db dump -f backup-pre-phase2.sql`
- Document row counts for verification

#### Task 2: Execute Migrations
**Priority:** Critical | **Time:** 30 min
- Reset: `pnpm supabase db reset`
- Verify: `pnpm supabase migration list`
- Check logs for errors

#### Task 3: Regenerate Types
**Priority:** Critical | **Time:** 10 min
- Generate: `pnpm run types:generate`
- Verify: `pnpm tsc --noEmit`

#### Task 4: Verify RLS Policies
**Priority:** High | **Time:** 20 min
- Check RLS enabled on all new tables
- Verify policies exist
- Manual policy testing

### Phase 2.2: Service Layer Recovery

#### Task 5: Update Student Service
**Priority:** High | **Time:** 1 hour
**File:** `lib/services/student.service.ts`
- Add error handling for missing person_profile
- Review chapter_membership upsert logic
- Update JSDoc comments

#### Task 6: Add Event Application Methods
**Priority:** High | **Time:** 2 hours
**File:** `lib/services/event.service.ts`
**New Methods:**
- createApplicationQuestion
- getApplicationQuestions
- submitEventApplication
- getApplicationAnswers
- approveEventApplication
- rejectEventApplication

#### Task 7: Update Service Tests
**Priority:** High | **Time:** 2 hours
- Update student.service.test.ts for new schema
- Add event application tests
- Maintain 80%+ coverage
- Run: `pnpm test`

### Phase 2.3: Auth & Routing

#### Task 8: Update Auth Guards
**Priority:** High | **Time:** 1 hour
**File:** `lib/auth.ts`
- Update requireEditor to check chapter_membership
- Update canUserAccessChapter
- Remove student_profile dependencies

**Test Matrix:**
| User Type | Role | person_profile | chapter_membership | Route |
|-----------|------|----------------|-------------------|-------|
| Public | member | ✅ | ❌ | /student |
| Applicant | member | ✅ | pending | /student |
| Member | member | ✅ | approved | /student |
| Editor | editor | ✅ | approved+editor | /chapter |
| Admin | admin | ❌ | ❌ | /admin |
| Recruiter | recruiter | ❌ | ❌ | /company |

### Phase 2.4: Manual Validation

#### Task 9: Smoke Test - Public Participant (30 min)
1. Create account → Complete onboarding
2. Register for open event
3. Verify: person_profile created, no chapter_membership

#### Task 10: Smoke Test - Chapter Member (30 min)
1. Apply to chapter → Editor approves
2. Verify: chapter_membership (pending → approved), member_id generated

#### Task 11: Smoke Test - Editor (30 min)
1. Admin promotes to editor
2. Create event, approve member, check in attendee
3. Verify: Can access /chapter, manage events/members

#### Task 12: Smoke Test - Admin (20 min)
1. Admin login → Route to /admin
2. Manage users, issue LEAD identity
3. Verify: Works without person_profile

## Dependency Graph
```
Task 1 → Task 2 → Task 3 → Task 4
                      ↓
              Task 5-6 (parallel)
                      ↓
                  Task 7
                      ↓
                  Task 8
                      ↓
              Task 9-12 (parallel)
```

## Timeline
| Phase | Tasks | Time |
|-------|-------|------|
| 2.1 Migration | 1-4 | 1.5h |
| 2.2 Services | 5-6 | 3h |
| 2.3 Tests | 7 | 2h |
| 2.4 Auth | 8 | 1h |
| 2.5 Smoke | 9-12 | 2h |
| **Total** | **12** | **9.5h** |

**Realistic:** 1.5-2 days with debugging

## Files Modified
- lib/services/student.service.ts
- lib/services/event.service.ts
- lib/services/__tests__/student.service.test.ts
- lib/services/__tests__/event.service.test.ts
- lib/auth.ts
- lib/database.types.ts (regenerated)

## Success Criteria
- [ ] All migrations applied
- [ ] Types regenerated
- [ ] Tests pass
- [ ] All smoke tests pass

**Created:** 2026-05-02
**Status:** Ready for Execution
