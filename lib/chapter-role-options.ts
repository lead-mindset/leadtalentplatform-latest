import type {
  AssignableChapterRoleLevel,
  ChapterFunctionalArea,
} from '@/lib/services/chapter-role-assignment.service'

export const REGULAR_EBOARD_ROLE_LEVELS = [
  'chief_of_staff',
  'director',
  'coordinator',
] as const satisfies readonly AssignableChapterRoleLevel[]

export const ADMIN_ASSIGNABLE_CHAPTER_ROLE_LEVELS = [
  'president',
  'vice_president',
  ...REGULAR_EBOARD_ROLE_LEVELS,
] as const satisfies readonly AssignableChapterRoleLevel[]

export const CHAPTER_FUNCTIONAL_AREAS = [
  'general_leadership',
  'strategy_operations',
  'marketing_communications',
  'events_experience',
  'finance_legal',
  'chapter_development',
  'academic_excellence',
  'professional_development',
  'leadership',
  'women_in_stem',
  'research',
  'projects',
  'partnerships_external_relations',
  'people_talent',
  'other',
] as const satisfies readonly ChapterFunctionalArea[]

export type RegularEboardRoleLevel = (typeof REGULAR_EBOARD_ROLE_LEVELS)[number]

export const CHAPTER_ROLE_LEVEL_LABELS: Record<AssignableChapterRoleLevel, string> = {
  president: 'Presidencia',
  vice_president: 'Vicepresidencia',
  chief_of_staff: 'Jefe de staff',
  director: 'Direccion',
  coordinator: 'Coordinacion',
}

export const CHAPTER_FUNCTIONAL_AREA_LABELS: Record<ChapterFunctionalArea, string> = {
  general_leadership: 'Liderazgo general',
  strategy_operations: 'Estrategia y operaciones',
  marketing_communications: 'Marketing y comunicaciones',
  events_experience: 'Eventos y experiencia',
  finance_legal: 'Finanzas y legal',
  chapter_development: 'Chapter development',
  academic_excellence: 'Excelencia academica',
  professional_development: 'Desarrollo profesional',
  leadership: 'Pilar de liderazgo',
  women_in_stem: 'Excelencia femenina / Women in STEM',
  research: 'Investigacion',
  projects: 'Proyectos',
  partnerships_external_relations: 'Alianzas y relaciones externas',
  people_talent: 'People / talento',
  other: 'Otro',
}

export const REGULAR_EBOARD_ROLE_OPTIONS = REGULAR_EBOARD_ROLE_LEVELS.map((value) => ({
  value,
  label: CHAPTER_ROLE_LEVEL_LABELS[value],
}))

export const ADMIN_CHAPTER_ROLE_OPTIONS = ADMIN_ASSIGNABLE_CHAPTER_ROLE_LEVELS.map((value) => ({
  value,
  label: CHAPTER_ROLE_LEVEL_LABELS[value],
}))

export const CHAPTER_FUNCTIONAL_AREA_OPTIONS = CHAPTER_FUNCTIONAL_AREAS.map((value) => ({
  value,
  label: CHAPTER_FUNCTIONAL_AREA_LABELS[value],
}))
