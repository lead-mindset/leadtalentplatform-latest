alter table public.pathway_check_in
  add column if not exists growth_stage text null,
  add column if not exists primary_focus text null;

alter table public.pathway_check_in
  drop constraint if exists pathway_check_in_growth_stage_check,
  add constraint pathway_check_in_growth_stage_check
    check (
      growth_stage is null
      or growth_stage in ('explorer', 'builder', 'leader', 'candidate', 'emerging_professional')
    );

alter table public.pathway_check_in
  drop constraint if exists pathway_check_in_primary_focus_check,
  add constraint pathway_check_in_primary_focus_check
    check (
      primary_focus is null
      or primary_focus in (
        'career_exploration',
        'technical_experience',
        'opportunity_readiness',
        'community_mentorship',
        'leadership'
      )
    );
