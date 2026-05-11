alter table public.growth_reflection
  add column if not exists event_id uuid null references public.event(id) on delete set null;
