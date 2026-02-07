import { useTranslations } from 'next-intl'
import { SKILL_OPTIONS, LEAD_ROLE_VALUES, LEAD_CHAPTER_VALUES, AVAILABILITY_VALUES, CAREER_VALUES } from '@/lib/options'

export function useTranslatedSkills() {
  const t = useTranslations('skills')
  
  return SKILL_OPTIONS.map(skill => ({
    ...skill,
    label: t(skill.key)
  }))
}

export function useTranslatedRoles() {
  const t = useTranslations('roles')
  
  return LEAD_ROLE_VALUES.map(role => ({
    value: role,
    label: t(role)
  }))
}

export function useTranslatedChapters() {
  const t = useTranslations('chapters')
  
  return LEAD_CHAPTER_VALUES.map(chapter => ({
    value: chapter,
    label: t(chapter)
  }))
}

export function useTranslatedAvailability() {
  const t = useTranslations('availability')
  
  return AVAILABILITY_VALUES.map(availability => ({
    value: availability,
    label: t(availability)
  }))
}

export function useTranslatedCareers() {
  const t = useTranslations('careers')
  
  return CAREER_VALUES.map(career => ({
    value: career,
    label: t(career)
  }))
}