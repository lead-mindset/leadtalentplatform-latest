'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import z from 'zod'
import { submitOnboarding } from '@/lib/actions/student/onboarding'
import { createBasicOnboardingSchema } from '@/lib/memberschema'
import {
  useTranslatedChapters,
  useTranslatedGender,
  useTranslatedSkills,
} from '@/lib/use-translated-options'
import CareerCommandSelect from './ui/career-combobox'
import { SkillsCombobox } from './ui/skills-combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/ui/icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from '@/i18n/routing'
import { FormInput, FormStepper } from './ui/stepper'

type BasicOnboardingValues = z.input<ReturnType<typeof createBasicOnboardingSchema>>

type OnboardingProps = {
  initialValues?: Partial<BasicOnboardingValues>
}

export default function Onboarding({ initialValues }: OnboardingProps) {
  const t = useTranslations('onboarding')
  const tValidation = useTranslations()

  const translatedSkills = useTranslatedSkills()
  const translatedChapters = useTranslatedChapters()
  const translatedGender = useTranslatedGender()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const basicOnboardingSchema = createBasicOnboardingSchema(tValidation)

  const methods = useForm<BasicOnboardingValues>({
    resolver: zodResolver(basicOnboardingSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: initialValues?.full_name ?? '',
      phone: initialValues?.phone ?? '',
      university: initialValues?.university ?? '',
      career: initialValues?.career ?? '',
      graduation_year: initialValues?.graduation_year ?? 0,
      skills: initialValues?.skills ?? [],
      gender: initialValues?.gender,
      linkedin_url: initialValues?.linkedin_url ?? '',
      portfolio_url: initialValues?.portfolio_url ?? '',
      chapterNewsletterIds: initialValues?.chapterNewsletterIds ?? [],
      consentRecruiterVisibility: initialValues?.consentRecruiterVisibility ?? false,
      emailNotificationsEnabled: initialValues?.emailNotificationsEnabled ?? true,
      termsAccepted: initialValues?.termsAccepted,
    },
  })

  const {
    control,
    formState: { errors },
    getValues,
    trigger,
  } = methods

  const stepFields: Record<number, (keyof BasicOnboardingValues)[]> = {
    1: ['full_name', 'phone', 'gender'],
    2: ['university', 'career', 'graduation_year', 'skills', 'linkedin_url', 'portfolio_url'],
    3: ['consentRecruiterVisibility', 'emailNotificationsEnabled', 'chapterNewsletterIds'],
    4: ['termsAccepted'],
  }

  const validateCurrentStep = async (step: number) => trigger(stepFields[step])

  const handleComplete = async () => {
    const isValid = await trigger()
    if (!isValid) return

    const data = getValues()
    setIsSubmitting(true)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    })

    try {
      const result = await submitOnboarding(formData)
      if (result?.error) console.error(result.error, result.details)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
        <Icons.X className="h-3 w-3 shrink-0" />
        {message}
      </p>
    ) : null

  const StepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="space-y-1.5 border-b border-border pb-2">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )

  const PrefCard = ({
    checked,
    description,
    onCheckedChange,
    title,
  }: {
    checked: boolean
    description: string
    onCheckedChange: (value: boolean) => void
    title: ReactNode
  }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-0.5"
      />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  )

  return (
    <FormProvider {...methods}>
      <FormStepper validateStep={validateCurrentStep} onFinalStepCompleted={handleComplete}>
        <div className="space-y-6">
          <StepHeader title={t('step1Title')} subtitle={t('step1Subtitle')} />

          <div className="space-y-4">
            <FormInput
              label={t('fullName')}
              name="full_name"
              placeholder={t('fullNamePlaceholder')}
              error={errors.full_name?.message}
            />

            <FormInput
              label={t('phoneNumber')}
              name="phone"
              placeholder={t('phonePlaceholder')}
              error={errors.phone?.message}
            />

            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('genderLabel')}</label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      {translatedGender.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.gender?.message} />
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <StepHeader title={t('step2Title')} subtitle={t('step2Subtitle')} />

          <div className="space-y-4">
            <FormInput
              label={t('university')}
              name="university"
              placeholder={t('universityPlaceholder')}
              error={errors.university?.message}
            />

            <Controller
              control={control}
              name="career"
              render={({ field }) => (
                <CareerCommandSelect
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.career?.message}
                />
              )}
            />

            <FormInput
              label={t('expectedGradYear')}
              name="graduation_year"
              type="number"
              validation={{ valueAsNumber: true }}
              error={errors.graduation_year?.message}
            />

            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <SkillsCombobox
                  value={field.value}
                  onChange={field.onChange}
                  options={translatedSkills}
                  label={t('skillsExpertise')}
                  countLabel={t('selected')}
                  placeholder={t('selectSkills')}
                  searchPlaceholder={t('searchSkills')}
                  createLabel={(input) => t('createCustom', { value: input })}
                  noResultsLabel={t('noSkillFound')}
                  error={errors.skills?.message}
                />
              )}
            />

            <FormInput
              label={t('linkedinProfile')}
              name="linkedin_url"
              type="url"
              error={errors.linkedin_url?.message}
            />

            <FormInput
              label={t('portfolioUrl')}
              name="portfolio_url"
              type="url"
              placeholder={t('portfolioPlaceholder')}
              error={errors.portfolio_url?.message}
            />
          </div>
        </div>

        <div className="space-y-6">
          <StepHeader title={t('step3Title')} subtitle={t('step3Subtitle')} />

          <div className="space-y-3">
            <Controller
              control={control}
              name="consentRecruiterVisibility"
              render={({ field }) => (
                <PrefCard
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  title={t('makeProfileVisible')}
                  description={t('profileVisibilityDesc')}
                />
              )}
            />

            <Controller
              control={control}
              name="emailNotificationsEnabled"
              render={({ field }) => (
                <PrefCard
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  title={t('emailNotificationsLabel')}
                  description={t('emailNotificationsDesc')}
                />
              )}
            />

            <Controller
              control={control}
              name="chapterNewsletterIds"
              render={({ field }) => (
                <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('chapterNewsletterInterests')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('chapterNewsletterInterestsDesc')}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {translatedChapters.map((option) => {
                      const selectedChapterIds = field.value ?? []
                      const selected = selectedChapterIds.includes(option.value)
                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background"
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(value) => {
                              field.onChange(
                                value
                                  ? [...selectedChapterIds, option.value]
                                  : selectedChapterIds.filter((id) => id !== option.value)
                              )
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  <FieldError message={errors.chapterNewsletterIds?.message} />
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <StepHeader title={t('step4Title')} subtitle={t('step4Subtitle')} />

          <Controller
            control={control}
            name="termsAccepted"
            render={({ field }) => (
              <>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted ${
                    errors.termsAccepted
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-muted/40'
                  }`}
                >
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {t('termsLabel')}{' '}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
                      >
                        {t('termsLink')}
                      </Link>
                      {' '}and{' '}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
                      >
                        {t('privacyLink')}
                      </Link>
                    </p>
                    <p className="text-xs text-muted-foreground">{t('termsDesc')}</p>
                  </div>
                </label>
                <FieldError message={errors.termsAccepted?.message} />
              </>
            )}
          />

          {isSubmitting ? (
            <p className="text-sm text-muted-foreground">{t('saving')}</p>
          ) : null}
        </div>
      </FormStepper>
    </FormProvider>
  )
}
