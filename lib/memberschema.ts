import { z } from 'zod'
import { LEAD_CHAPTER_VALUES } from './options'

export function createBaseProfileSchema(t: (key: string, values?: any) => string) {
  return z.object({
    full_name: z.string().min(1, t('validation.nameRequired')),
    phone: z.string().min(5, t('validation.phoneInvalid')),
    career: z.string().min(1, t('validation.careerRequired')),
    gender: z.enum(["man", "woman", "non_binary", "prefer_not_to_say"], {
      message: t('validation.selectGender')
    }),
    graduationYear: z.coerce
      .number({ message: t('validation.enterGraduationYear') })
      .refine(val => val !== 0, {
        message: t('validation.yearInvalid')
      })
      .refine(val => val >= 2000 && val <= new Date().getFullYear() + 6, {
        message: t('validation.yearRange', { maxYear: new Date().getFullYear() + 6 })
      }) as unknown as z.ZodNumber,

    skills: z.array(z.string()).min(1, t('validation.selectAtLeastOneSkill')),

    linkedin_url: z.string().url(t('validation.invalidUrl')).refine(
      val => val.includes("linkedin.com"),
      { message: t('validation.mustBeLinkedIn') }
    ),

    lead_chapter: z
      .string({ message: t('validation.selectYourChapter') })
      .min(1, t('validation.selectYourChapter'))
      .refine(
        (val) => LEAD_CHAPTER_VALUES.includes(val as any),
        { message: t('validation.selectValidChapter') }
      ),

    consentRecruiterVisibility: z.boolean({ message: t('validation.consentRequired') }),
    emailNotificationsEnabled: z.boolean(),
  })
}

export function createFullMemberSchemaFrontend(t: (key: string, values?: any) => string) {
  return createBaseProfileSchema(t).extend({
    resume_pdf: z
      .custom<File>((file) => file instanceof File, { message: t('validation.uploadPdfFile') })
      .refine(file => file.type === "application/pdf", t('validation.onlyPdfAllowed'))
      .refine(file => file.size <= 10 * 1024 * 1024, t('validation.pdfMaxSize')),
  })
}

export function createProfileUpdateSchema(t: (key: string, values?: any) => string) {
  return createBaseProfileSchema(t).extend({
    resume_pdf: z
      .custom<File>((file) => file instanceof File, { message: t('validation.uploadPdfFile') })
      .refine(file => file.type === "application/pdf", t('validation.onlyPdfAllowed'))
      .refine(file => file.size <= 10 * 1024 * 1024, t('validation.pdfMaxSize'))
      .optional(),
  })
}

export type ProfileData = {
  id: string
  full_name: string
  phone: string
  career: string
  graduationYear: number
  skills: string[]
  lead_chapter: string
  linkedin_url: string
  consentRecruiterVisibility: boolean
  emailNotificationsEnabled: boolean
}