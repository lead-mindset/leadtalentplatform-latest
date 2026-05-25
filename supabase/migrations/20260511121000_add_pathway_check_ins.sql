create table if not exists public.pathway_check_in (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  chapter_id text null references public.chapter(id) on delete set null,
  status text not null default 'not_started',
  looking_for text null,
  current_blocker text null,
  study_interest text null,
  confidence_level integer null,
  monthly_time_commitment text null,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pathway_check_in_status_check
    check (status in ('not_started', 'in_progress', 'completed')),
  constraint pathway_check_in_confidence_level_check
    check (confidence_level is null or confidence_level between 1 and 5),
  constraint pathway_check_in_monthly_time_commitment_check
    check (
      monthly_time_commitment is null
      or monthly_time_commitment in ('one_hour', 'two_to_four_hours', 'five_plus_hours')
    )
);

create unique index if not exists pathway_check_in_user_unique
  on public.pathway_check_in (user_id);

alter table public.pathway_check_in enable row level security;

drop policy if exists "pathway_check_in_admin_all" on public.pathway_check_in;
create policy "pathway_check_in_admin_all"
  on public.pathway_check_in
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pathway_check_in_student_select_own" on public.pathway_check_in;
create policy "pathway_check_in_student_select_own"
  on public.pathway_check_in
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pathway_check_in_student_insert_own" on public.pathway_check_in;
create policy "pathway_check_in_student_insert_own"
  on public.pathway_check_in
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pathway_check_in_student_update_own" on public.pathway_check_in;
create policy "pathway_check_in_student_update_own"
  on public.pathway_check_in
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pathway_check_in_service_read" on public.pathway_check_in;
create policy "pathway_check_in_service_read"
  on public.pathway_check_in
  for select
  to service_role
  using (true);
