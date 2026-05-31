'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CalendarCheck, CheckCircle2, Mail, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  nextPath?: string | null
}

export default function Onboarding({ initialValues, nextPath }: OnboardingProps) {
  const t = useTranslations('onboarding')
  const tCommon = useTranslations('common')
  const tValidation = useTranslations()

  const translatedSkills = useTranslatedSkills()
  const translatedChapters = useTranslatedChapters()
  const translatedGender = useTranslatedGender()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastAutoNewsletterChapterId, setLastAutoNewsletterChapterId] = useState<string | null>(null)

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
      chapterIntent: initialValues?.chapterIntent,
      selectedChapterId: initialValues?.selectedChapterId ?? '',
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
    setValue,
    trigger,
  } = methods

  const chapterIntent = useWatch({ control, name: 'chapterIntent' })
  const selectedChapterId = useWatch({ control, name: 'selectedChapterId' })
  const needsChapterSelection =
    chapterIntent === 'already_member' || chapterIntent === 'apply_to_chapter'

  const stepFields: Record<number, (keyof BasicOnboardingValues)[]> = {
    1: ['full_name', 'phone', 'gender'],
    2: ['university', 'career', 'graduation_year', 'skills', 'linkedin_url', 'portfolio_url'],
    3: ['chapterIntent', 'selectedChapterId'],
    4: ['consentRecruiterVisibility', 'emailNotificationsEnabled', 'chapterNewsletterIds'],
    5: ['termsAccepted'],
  }

  useEffect(() => {
    if (!needsChapterSelection || !selectedChapterId) {
      setLastAutoNewsletterChapterId(null)
      return
    }

    if (lastAutoNewsletterChapterId === selectedChapterId) return

    const selectedChapterIds = getValues('chapterNewsletterIds') ?? []
    if (!selectedChapterIds.includes(selectedChapterId)) {
      setValue('chapterNewsletterIds', [...selectedChapterIds, selectedChapterId], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    setLastAutoNewsletterChapterId(selectedChapterId)
  }, [
    getValues,
    lastAutoNewsletterChapterId,
    needsChapterSelection,
    selectedChapterId,
    setValue,
  ])

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
    if (nextPath) formData.append('next', nextPath)

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
      <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
        <Icons.X className="h-3 w-3 shrink-0" />
        {message}
      </div>
    ) : null

  const StepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="space-y-2 border-b border-border pb-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
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
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/60">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </label>
  )

  const ChapterIntentCard = ({
    description,
    icon,
    onSelect,
    selected,
    title,
  }: {
    description: string
    icon: ReactNode
    onSelect: () => void
    selected: boolean
    title: string
  }) => (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-32 w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/5 text-foreground shadow-sm'
          : 'border-border bg-card text-foreground hover:bg-muted/60'
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-semibold leading-5">{title}</span>
        <span className="block text-sm leading-5 text-muted-foreground">{description}</span>
      </span>
    </button>
  )

  const ContextItem = ({
    icon,
    text,
  }: {
    icon: ReactNode
    text: string
  }) => (
    <li className="flex gap-3 text-sm leading-6 text-muted-foreground">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span>{text}</span>
    </li>
  )

  return (
    <FormProvider {...methods}>
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-8 md:py-12 lg:px-8">
        <section className="space-y-5">
          <div className="space-y-3">
            <Badge variant="outline">{t('profileOnlyBadge')}</Badge>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {t('pageTitle')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {t('pageSubtitle')}
              </p>
            </div>
          </div>

          <Card className="rounded-lg">
            <CardContent className="p-0">
              <FormStepper
                validateStep={validateCurrentStep}
                onFinalStepCompleted={handleComplete}
                className="min-h-0 p-0 sm:aspect-auto md:aspect-auto"
                stepCircleContainerClassName="max-w-none p-0 shadow-none"
                stepContainerClassName="px-4 py-4 sm:px-6 sm:py-5"
                contentClassName="px-4 sm:px-6"
                footerClassName="px-4 pb-4 sm:px-6 sm:pb-6"
                completeButtonText={t('saveProfile')}
                backButtonText={tCommon('back')}
                nextButtonText={tCommon('next')}
                nextButtonProps={{ disabled: isSubmitting }}
              >
                <div className="space-y-6">
                  <StepHeader title={t('step1Title')} subtitle={t('step1Subtitle')} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FormInput
                        label={t('fullName')}
                        name="full_name"
                        placeholder={t('fullNamePlaceholder')}
                        error={errors.full_name?.message}
                      />
                    </div>

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
                          <label className="text-sm font-medium text-foreground">
                            {t('genderLabel')}
                          </label>
                          <Select value={field.value ?? ''} onValueChange={field.onChange}>
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

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormInput
                        label={t('expectedGradYear')}
                        name="graduation_year"
                        type="number"
                        validation={{ valueAsNumber: true }}
                        error={errors.graduation_year?.message}
                      />

                      <FormInput
                        label={t('linkedinProfile')}
                        name="linkedin_url"
                        type="url"
                        error={errors.linkedin_url?.message}
                      />
                    </div>

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

                  <Controller
                    control={control}
                    name="chapterIntent"
                    render={({ field }) => (
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <ChapterIntentCard
                            selected={field.value === 'already_member'}
                            onSelect={() => field.onChange('already_member')}
                            icon={<UsersRound className="h-4 w-4" />}
                            title={t('chapterIntentAlreadyMemberTitle')}
                            description={t('chapterIntentAlreadyMemberDesc')}
                          />
                          <ChapterIntentCard
                            selected={field.value === 'apply_to_chapter'}
                            onSelect={() => field.onChange('apply_to_chapter')}
                            icon={<Building2 className="h-4 w-4" />}
                            title={t('chapterIntentApplyTitle')}
                            description={t('chapterIntentApplyDesc')}
                          />
                          <ChapterIntentCard
                            selected={field.value === 'events_only'}
                            onSelect={() => {
                              field.onChange('events_only')
                              setValue('selectedChapterId', '', {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }}
                            icon={<CalendarCheck className="h-4 w-4" />}
                            title={t('chapterIntentEventsOnlyTitle')}
                            description={t('chapterIntentEventsOnlyDesc')}
                          />
                        </div>
                        <FieldError message={errors.chapterIntent?.message} />
                      </div>
                    )}
                  />

                  {needsChapterSelection ? (
                    <Controller
                      control={control}
                      name="selectedChapterId"
                      render={({ field }) => (
                        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                          <label className="text-sm font-medium text-foreground">
                            {t('chapterSelectionLabel')}
                          </label>
                          <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('selectChapter')} />
                            </SelectTrigger>
                            <SelectContent>
                              {translatedChapters.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm leading-5 text-muted-foreground">
                            {t('chapterSelectionHelper')}
                          </p>
                          <FieldError message={errors.selectedChapterId?.message} />
                        </div>
                      )}
                    />
                  ) : null}
                </div>

                <div className="space-y-6">
                  <StepHeader title={t('step4Title')} subtitle={t('step4Subtitle')} />

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
                        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {t('chapterNewsletterInterests')}
                            </p>
                            <p className="text-sm leading-5 text-muted-foreground">
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
                                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm hover:border-border hover:bg-muted/60"
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
                  <StepHeader title={t('step5Title')} subtitle={t('step5Subtitle')} />

                  <Controller
                    control={control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted ${
                            errors.termsAccepted
                              ? 'border-destructive bg-destructive/5'
                              : 'border-border bg-card'
                          }`}
                        >
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true ? true : undefined)
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-snug text-foreground">
                              {t('termsLabel')}{' '}
                              <Link
                                href="/terms"
                                target="_blank"
                                className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
                              >
                                {t('termsLink')}
                              </Link>
                              {' '}{t('and')}{' '}
                              <Link
                                href="/privacy"
                                target="_blank"
                                className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
                              >
                                {t('privacyLink')}
                              </Link>
                            </p>
                            <p className="text-sm leading-5 text-muted-foreground">
                              {t('termsDesc')}
                            </p>
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
            </CardContent>
          </Card>
        </section>

        <aside className="md:pt-24">
          <Card className="sticky top-6 rounded-lg">
            <CardHeader>
              <CardTitle>{t('sideTitle')}</CardTitle>
              <CardDescription>{t('sideSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <ContextItem icon={<UserRound className="h-4 w-4" />} text={t('sideProfile')} />
                <ContextItem icon={<Mail className="h-4 w-4" />} text={t('sideNewsletter')} />
                <ContextItem icon={<ShieldCheck className="h-4 w-4" />} text={t('sideVisibility')} />
                <ContextItem icon={<CheckCircle2 className="h-4 w-4" />} text={t('sideMembership')} />
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </FormProvider>
  )
}
