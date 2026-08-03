# Plan: Fix Admin RLS & Prevent Self-Role-Escalation

## Problem

### Issue 1: `is_admin()` RLS function is broken

The function `public.is_admin()` reads `current_setting('request.jwt.claims', true)::jsonb ->> 'role'`, which returns the Supabase database role, not the custom `public.user.role`. Since Supabase does not auto-inject the custom `user.role` into the JWT, `is_admin()` always returns `false`.

**Impact**: All RLS policies using `is_admin()` are dead: user_read_admin, user_update_admin, chapter_membership_admin_all, person_profile_admin_all, lead_identity_admin_all, chapter_permission_grant_admin_all, chapter_role_assignment_admin_all.

Admin operations via the regular authenticated client silently fail.

### Issue 2: Self-privilege escalation

The RLS policy `user_update_own` allows any authenticated user to update their own `public.user` row with no column restriction. A user can change their `role` to `admin` from browser dev tools.

**Combined risk**: Fixing `is_admin()` without fixing self-escalation means auto-escalated users gain real admin RLS privileges.

## Solution

### Fix 1: Replace `is_admin()` with SECURITY DEFINER

Rewrite `public.is_admin()` to directly query `public.user` with `SECURITY DEFINER`, bypassing RLS for this specific check. The function runs as the owner (superuser/service_role), so it can read `public.user` regardless of RLS.

### Fix 2: Add trigger to prevent self-role-change

A `BEFORE UPDATE OF role` trigger on `public.user` that fires only when:
- The `role` column is mentioned in the UPDATE SET clause
- AND the user is updating their own row (`auth.uid() = OLD.id`)

The trigger passes for: admin updates other users (auth.uid() != target), service role (null != any id), user updates own name/phone (role not mentioned). Only blocks when a user explicitly sets their own role.

## Files to modify

1. `supabase/migrations/20260728000000_fix_admin_rls_and_prevent_self_escalation.sql` (new migration)

## What does NOT change

No RLS policies modified, no existing functions removed, no tables altered, no server actions, no UI, no .env.

## Testing checklist

1. Auth regression: signup, login, onboarding still work
2. Profile update: user can still update name/phone
3. Self-escalation blocked: direct SQL UPDATE user SET role = admin WHERE id = self fails
4. Admin escalation works: service role can still change roles
5. is_admin() returns true for admin users, false for others
6. Admin UI operations (updateUserRole, deactivateUser) work correctly

## Rollback

Drop the trigger and function. Revert is_admin() to the original JWT-based version.

## Production Verification (2026-08-01)

All changes verified live against the production Supabase instance. No data mutated (all writes ran inside rollback transactions).

### Migrations applied
- `20260728000000_fix_admin_rls_and_prevent_self_escalation` ✓
- `20260729_add_lead_id_to_person_profile` ✓
- `20260729000001_backfill_lead_id` ✓
- `unify_lead_id_with_member_id` ✓

### Security behavior tests
| Test | Result |
| --- | --- |
| `is_admin()` for anon (no JWT) | `false` ✓ |
| `is_admin()` for admin user | `true` ✓ |
| `is_admin()` for member | `false` ✓ |
| Member updates own role | Blocked: `You cannot change your own role. Contact an admin.` ✓ |
| Admin updates another user | Allowed ✓ |
| Member updates another user (RLS) | Blocked (0 rows affected) ✓ |

### Data checks
- 49/49 prod `person_profile` rows have a `lead_id` (format `LEAD-XXXXXX`); 0 null, 0 bad format, 0 duplicates.
- 0 `lead_id` ↔ `member_id` mismatches among approved memberships.
- `is_admin()` live as `STABLE SECURITY DEFINER SET search_path TO 'public'`; trigger `trg_prevent_self_role_change` live and enabled.

### Lint status
- Branch introduced one WARN lint: `function_search_path_mutable` on `prevent_self_role_change()` (function is `SECURITY INVOKER`, so low risk; `is_admin()` is already hardened with `SET search_path`).
- All `security_definer_view`, `rls_disabled_in_public`, `anon/authenticated_security_definer_function_executable`, and extension lints are pre-existing and unrelated to this branch.

### Decision
Trigger function left as-is (low-risk WARN, `SECURITY INVOKER`). Optionally harden later with `SET search_path TO 'public'` + new migration if the lint needs to be cleared.
