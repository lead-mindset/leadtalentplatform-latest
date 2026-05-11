create table if not exists public.pathway_recommendation (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.pathway_check_in(id) on delete cascade,
  user_id uuid not null references public."user"(id) on delete cascade,
  category text not null,
  status text not null default 'active',
  title text not null,
  body text not null,
  reason text not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pathway_recommendation_category_check
    check (category in ('learn', 'connect', 'prove')),
  constraint pathway_recommendation_status_check
    check (status in ('active', 'started', 'completed', 'dismissed'))
);

create unique index if not exists pathway_recommendation_check_in_category_unique
  on public.pathway_recommendation (check_in_id, category);

alter table public.pathway_recommendation enable row level security;

drop policy if exists "pathway_recommendation_admin_all" on public.pathway_recommendation;
create policy "pathway_recommendation_admin_all"
  on public.pathway_recommendation
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pathway_recommendation_student_select_own" on public.pathway_recommendation;
create policy "pathway_recommendation_student_select_own"
  on public.pathway_recommendation
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pathway_recommendation_student_update_own" on public.pathway_recommendation;
create policy "pathway_recommendation_student_update_own"
  on public.pathway_recommendation
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pathway_recommendation_service_read" on public.pathway_recommendation;
create policy "pathway_recommendation_service_read"
  on public.pathway_recommendation
  for select
  to service_role
  using (true);
