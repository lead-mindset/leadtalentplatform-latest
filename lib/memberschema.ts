import { z } from 'zod'
import { LEAD_CHAPTER_VALUES } from './options'
import type { Translator } from './types'

const MAX_YEAR = new Date().getFullYear() + 6

const optionalUrl = (t: Translator) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: t('validation.invalidUrl'),
    })

export function createBaseProfileSchema(t: Translator) {
  return z.object({
    full_name: z.string().min(1, t('validation.nameRequired')),

    phone: z.string().min(5, t('validation.phoneInvalid')),

    gender: z.enum(['man', 'woman', 'non_binary', 'prefer_not_to_say'], {
      message: t('validation.selectGender'),
    }),

    career: z.string().min(1, t('validation.careerRequired')),

    graduation_year: z.coerce
      .number({ message: t('validation.enterGraduationYear') })
      .refine((val) => val !== 0, { message: t('validation.yearInvalid') })
      .refine((val) => val >= 2000 && val <= MAX_YEAR, {
        message: t('validation.yearRange', { maxYear: MAX_YEAR }),
      }) as unknown as z.ZodNumber,

    skills: z.array(z.string()).min(1, t('validation.selectAtLeastOneSkill')),

    linkedin_url: z
      .string()
      .url(t('validation.invalidUrl'))
      .refine((val) => val.includes('linkedin.com'), {
        message: t('validation.mustBeLinkedIn'),
      }),

    consentRecruiterVisibility: z.boolean(),
    emailNotificationsEnabled: z.boolean(),
  })
}

export const createBasicPersonProfileSchema = createBaseProfileSchema

export function createBasicOnboardingSchema(t: Translator) {
  return createBaseProfileSchema(t).extend({
    university: z.string().trim().optional().default(''),
    portfolio_url: optionalUrl(t),
    chapterNewsletterIds: z
      .array(z.string())
      .default([])
      .refine(
        (values) => values.every((value) => (LEAD_CHAPTER_VALUES as readonly string[]).includes(value)),
        { message: t('validation.selectValidChapter') }
      ),
    termsAccepted: z.literal(true, {
      message: t('validation.termsRequired'),
    }),
  })
}

export function createMemberProfileSchema(t: Translator) {
  return createBaseProfileSchema(t).extend({
    lead_chapter: z
      .string({ message: t('validation.selectYourChapter') })
      .min(1, t('validation.selectYourChapter'))
      .refine(
        (val) => LEAD_CHAPTER_VALUES.some((chapter) => chapter === val),
        { message: t('validation.selectValidChapter') }
      ),
  })
}

const resumeSchema = (t: Translator) =>
  z
    .custom<File>((file) => file instanceof File, { message: t('validation.uploadPdfFile') })
    .refine((file) => file.type === 'application/pdf', t('validation.onlyPdfAllowed'))
    .refine((file) => file.size <= 10 * 1024 * 1024, t('validation.pdfMaxSize'))

export function createFullMemberSchemaFrontend(t: Translator) {
  return createMemberProfileSchema(t).extend({
    resume_pdf: resumeSchema(t),
    termsAccepted: z.literal(true, {
      message: t('validation.termsRequired'),
    }),
  })
}

export function createProfileUpdateSchema(t: Translator) {
  return createMemberProfileSchema(t).extend({
    resume_pdf: resumeSchema(t).optional(),

  })
}

export type BasicPersonProfileData = {
  full_name: string
  phone: string
  gender?: 'man' | 'woman' | 'non_binary' | 'prefer_not_to_say'
  university?: string
  career: string
  graduation_year: number
  skills: string[]
  linkedin_url: string
  portfolio_url?: string
  chapterNewsletterIds?: string[]
  consentRecruiterVisibility: boolean
  emailNotificationsEnabled: boolean
}

export type ProfileData = {
  id: string
  full_name: string
  phone: string
  gender?: 'man' | 'woman' | 'non_binary' | 'prefer_not_to_say'
  lead_chapter: string
  career: string
  graduation_year: number
  skills: string[]
  linkedin_url: string
  consentRecruiterVisibility: boolean
  emailNotificationsEnabled: boolean
  memberId?: string | null
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}
