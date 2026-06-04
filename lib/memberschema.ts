import { z } from 'zod'
import { LEAD_CHAPTER_VALUES } from './options'
import type { Translator } from './types'

const MAX_YEAR = new Date().getFullYear() + 6
export const CHAPTER_INTENT_VALUES = ['already_member', 'apply_to_chapter', 'events_only'] as const
export type ChapterIntent = (typeof CHAPTER_INTENT_VALUES)[number]

const URL_SCHEME = /^[a-z][a-z\d+\-.]*:/i
const HTTP_URL_SCHEME = /^https?:\/\//i
const PROFILE_PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/

export function normalizeOptionalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  return URL_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`
}

const optionalUrl = (t: Translator) =>
  z.preprocess(
    normalizeOptionalUrl,
    z
      .string()
      .url(t('validation.invalidUrl'))
      .refine((val) => HTTP_URL_SCHEME.test(val), {
        message: t('validation.invalidUrl'),
      })
      .nullable()
  ).refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: t('validation.invalidUrl'),
    })

export function normalizeProfilePhone(value: unknown): string {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  const startsWithPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')

  return startsWithPlus ? `+${digits}` : digits
}

export function isValidProfilePhone(value: string): boolean {
  return PROFILE_PHONE_PATTERN.test(value)
}

export function createBaseProfileSchema(t: Translator) {
  return z.object({
    full_name: z.string().min(1, t('validation.nameRequired')),

    phone: z.preprocess(
      normalizeProfilePhone,
      z.string().refine(isValidProfilePhone, {
        message: t('validation.phoneInvalid'),
      })
    ),

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

export function createBasicPersonProfileSchema(t: Translator) {
  return createBaseProfileSchema(t).extend({
    portfolio_url: optionalUrl(t).optional(),
  })
}

export function createBasicOnboardingSchema(t: Translator) {
  return createBaseProfileSchema(t).extend({
    university: z.string().trim().optional().default(''),
    portfolio_url: optionalUrl(t),
    chapterIntent: z.enum(CHAPTER_INTENT_VALUES, {
      message: t('validation.selectChapterIntent'),
    }),
    selectedChapterId: z.string().trim().optional().default(''),
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
  }).superRefine((data, ctx) => {
    const hasChapterIntent =
      data.chapterIntent === 'already_member' || data.chapterIntent === 'apply_to_chapter'

    if (!data.selectedChapterId) {
      if (hasChapterIntent) {
        ctx.addIssue({
          code: 'custom',
          path: ['selectedChapterId'],
          message: t('validation.selectYourChapter'),
        })
      }

      return
    }

    if (!(LEAD_CHAPTER_VALUES as readonly string[]).includes(data.selectedChapterId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['selectedChapterId'],
        message: t('validation.selectValidChapter'),
      })
    }
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
  return createBaseProfileSchema(t).extend({
    portfolio_url: optionalUrl(t).optional(),
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
  portfolio_url?: string | null
  chapterIntent?: ChapterIntent
  selectedChapterId?: string
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
  portfolio_url?: string | null
  consentRecruiterVisibility: boolean
  emailNotificationsEnabled: boolean
  memberId?: string | null
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'alumni' | 'inactive'
}
