create table if not exists public.growth_reflection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  recommendation_id uuid null references public.pathway_recommendation(id) on delete set null,
  status text not null default 'draft',
  visibility text not null default 'private',
  participated_in text not null,
  learned text not null,
  skill_or_mindset text not null,
  goal_connection text not null,
  next_move text not null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_reflection_status_check
    check (status in ('draft', 'completed', 'transformed')),
  constraint growth_reflection_visibility_check
    check (visibility in ('private', 'student_selected_for_profile', 'recruiter_visible', 'archived'))
);

alter table public.growth_reflection enable row level security;

drop policy if exists "growth_reflection_admin_all" on public.growth_reflection;
create policy "growth_reflection_admin_all"
  on public.growth_reflection
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "growth_reflection_student_select_own" on public.growth_reflection;
create policy "growth_reflection_student_select_own"
  on public.growth_reflection
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "growth_reflection_student_insert_own" on public.growth_reflection;
create policy "growth_reflection_student_insert_own"
  on public.growth_reflection
  for insert
  to authenticated
  with check (user_id = auth.uid() and visibility = 'private');

drop policy if exists "growth_reflection_student_update_own_private" on public.growth_reflection;
create policy "growth_reflection_student_update_own_private"
  on public.growth_reflection
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
