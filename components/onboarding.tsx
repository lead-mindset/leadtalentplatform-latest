'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CalendarCheck, CheckCircle2, Mail, ShieldCheck, Upload, UserRound, UsersRound, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import z from 'zod'
import { submitOnboarding } from '@/lib/actions/student/onboarding'
import { createBasicOnboardingSchema } from '@/lib/memberschema'
import {
  useTranslatedCareers,
  useTranslatedChapters,
  useTranslatedGender,
  useTranslatedSkills,
} from '@/lib/use-translated-options'
import CareerCommandSelect from './ui/career-combobox'
import { SkillsCombobox } from './ui/skills-combobox'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

type PendingInviteInfo = {
  chapterId: string
  displayTitle: string
}

type OnboardingProps = {
  initialValues?: Partial<BasicOnboardingValues>
  nextPath?: string | null
  pendingInvite?: PendingInviteInfo | null
}

export default function Onboarding({ initialValues, nextPath, pendingInvite }: OnboardingProps) {
  const t = useTranslations('onboarding')
  const tCommon = useTranslations('common')
  const tValidation = useTranslations()

  const translatedSkills = useTranslatedSkills()
  const translatedChapters = useTranslatedChapters()
  const translatedGender = useTranslatedGender()
  const translatedCareers = useTranslatedCareers()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const resumeUploading = false
  const [resumeError, setResumeError] = useState<string | null>(null)

  const hasPendingInvite = !!pendingInvite

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
      chapterIntent: hasPendingInvite ? 'events_only' : (initialValues?.chapterIntent),
      selectedChapterId: hasPendingInvite ? '' : (initialValues?.selectedChapterId ?? ''),
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
  const chapterIntentHelper =
    chapterIntent === 'already_member'
      ? t('chapterIntentAlreadyMemberStatus')
      : chapterIntent === 'apply_to_chapter'
        ? t('chapterIntentApplyStatus')
        : chapterIntent === 'events_only'
          ? t('chapterIntentEventsOnlyStatus')
          : null

  const stepFields: Record<number, (keyof BasicOnboardingValues)[]> = {
    1: ['full_name', 'phone', 'gender', 'linkedin_url'],
    2: ['university', 'career', 'graduation_year', 'skills', 'portfolio_url'],
    3: ['chapterIntent', 'selectedChapterId'],
    4: ['consentRecruiterVisibility', 'emailNotificationsEnabled'],
    5: ['termsAccepted'],
  }

  const validateCurrentStep = async (step: number) => trigger(stepFields[step])

  const handleComplete = async () => {
    const isValid = await trigger()
    if (!isValid) return

    const data = getValues()
    setIsSubmitting(true)
    setSubmitError(null)

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
    if (resumeFile) formData.append('resume_pdf', resumeFile)

    try {
      const result = await submitOnboarding(formData)
      if (result?.error) {
        console.error(result.error, result.details)
        setSubmitError(t('saveError'))
      }
    } catch (error) {
      console.error(error)
      setSubmitError(t('saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
        <X className="h-3 w-3 shrink-0" />
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

  const ReviewRow = ({ label, value }: { label: string; value: unknown }) => (
    <div className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-foreground">{String(value ?? '') || '—'}</span>
    </div>
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
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-8 md:py-16 lg:px-8">
        <section className="space-y-5">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {t('pageTitle')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {t('pageSubtitle')}
              </p>
            </div>
          </div>

          <Card className="rounded-lg p-2 sm:p-4 md:p-6">
            <CardContent className="p-0">
              <FormStepper
                validateStep={validateCurrentStep}
                onFinalStepCompleted={handleComplete}
                onStepChange={(step) => setCurrentStep(step)}
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
                        required
                      />
                    </div>

                    <FormInput
                      label={t('phoneNumber')}
                      name="phone"
                      placeholder={t('phonePlaceholder')}
                      error={errors.phone?.message}
                      required
                    />

                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {t('genderLabel')}
                            <span className="text-destructive ml-0.5">*</span>
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

                    <div className="sm:col-span-2">
                      <FormInput
                        label={t('linkedinProfile')}
                        name="linkedin_url"
                        type="url"
                        error={errors.linkedin_url?.message}
                        required
                      />
                    </div>
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
                        required
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
                          required
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
                      label={t('portfolioUrl') + ' (opcional)'}
                      name="portfolio_url"
                      type="url"
                      error={errors.portfolio_url?.message}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <StepHeader title={t('step3Title')} subtitle={t('step3Subtitle')} />

                  {hasPendingInvite ? (
                    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm leading-6">
                      <p className="font-medium text-foreground">
                        {t('pendingInviteTitle')}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {t('pendingInviteDescription', {
                          role: pendingInvite!.displayTitle,
                        })}
                      </p>
                    </div>
                  ) : (
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
                          {chapterIntentHelper ? (
                            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-5 text-muted-foreground">
                              {chapterIntentHelper}
                            </div>
                          ) : null}
                        </div>
                      )}
                    />
                  )}

                  {!hasPendingInvite && needsChapterSelection ? (
                    <Controller
                      control={control}
                      name="selectedChapterId"
                      render={({ field }) => (
                        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                          <label className="text-sm font-medium text-foreground">
                            {t('chapterSelectionLabel')} (opcional)
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

                  <div className="space-y-4">
                    <p className="text-sm font-medium text-foreground">{t('resumePdf')}</p>
                    <p className="text-sm leading-5 text-muted-foreground">{t('resumeEncouraged')}</p>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60">
                        <Upload className="h-4 w-4" />
                        <span>{resumeFile ? t('readyToUpload') : t('clickToUpload')}</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          disabled={resumeUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.type !== 'application/pdf') {
                              setResumeError(tValidation('onlyPdfAllowed'))
                              return
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              setResumeError(tValidation('pdfMaxSize'))
                              return
                            }
                            setResumeError(null)
                            setResumeFile(file)
                          }}
                        />
                      </label>
                      {resumeUploading ? (
                        <span className="text-sm text-muted-foreground">{t('uploading')}</span>
                      ) : resumeFile ? (
                        <span className="text-sm text-muted-foreground">{resumeFile.name}</span>
                      ) : null}
                    </div>
                    <FieldError message={resumeError || undefined} />
                  </div>
                </div>

                <div className="space-y-6">
                  <StepHeader title={t('step4Title')} subtitle={t('step4Subtitle')} />

                  <div className="space-y-3">
                    {needsChapterSelection && (
                      <>
                        <Controller
                          control={control}
                          name="consentRecruiterVisibility"
                          render={({ field }) => (
                            <PrefCard
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              title={t('makeProfileVisible')}
                              description={
                                <>
                                  {t('profileVisibilityDesc')}
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {t('profileVisibilityCaveat')}
                                  </span>
                                </>
                              }
                            />
                          )}
                        />
                      </>
                    )}

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
                  </div>
                </div>

                <div className="space-y-6">
                  <StepHeader title={t('step5Title')} subtitle={t('step5Subtitle')} />

                  <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {t('reviewSummaryTitle')}
                    </p>
                    <div className="divide-y divide-border text-sm">
                      <ReviewRow label={t('fullName')} value={getValues('full_name')} />
                      <ReviewRow label={t('phoneNumber')} value={getValues('phone')} />
                      <ReviewRow
                        label={t('genderLabel')}
                        value={translatedGender.find(g => g.value === getValues('gender'))?.label ?? ''}
                      />
                      <ReviewRow label={t('linkedinProfile')} value={getValues('linkedin_url')} />
                      {getValues('university') ? (
                        <ReviewRow label={t('university')} value={getValues('university')!} />
                      ) : null}
                      {getValues('career') ? (
                        <ReviewRow label={t('majorCareerField')} value={translatedCareers.find(c => c.value === getValues('career'))?.label ?? getValues('career')!} />
                      ) : null}
                      {getValues('graduation_year') > 0 ? (
                        <ReviewRow label={t('expectedGradYear')} value={String(getValues('graduation_year'))} />
                      ) : null}
                      <ReviewRow
                        label={t('skillsExpertise')}
                        value={
                          getValues('skills')?.length
                            ? getValues('skills')!
                                .map(s => translatedSkills.find(sk => sk.value === s)?.label ?? s)
                                .join(', ')
                            : ''
                        }
                      />
                      <ReviewRow
                        label={t('leadChapter')}
                        value={
                          hasPendingInvite
                            ? pendingInvite!.displayTitle
                            : (() => {
                                const intent = getValues('chapterIntent')
                                let label: string
                                if (intent === 'already_member') label = t('chapterIntentAlreadyMemberTitle')
                                else if (intent === 'apply_to_chapter') label = t('chapterIntentApplyTitle')
                                else label = t('chapterIntentEventsOnlyTitle')
                                const chapter = needsChapterSelection && selectedChapterId
                                  ? translatedChapters.find(c => c.value === selectedChapterId)?.label
                                  : null
                                return chapter ? `${label} — ${chapter}` : label
                              })()
                        }
                      />
                      <ReviewRow label={t('resumePdf')} value={resumeFile?.name ?? ''} />
                      <ReviewRow
                        label={t('emailNotifications')}
                        value={getValues('emailNotificationsEnabled') ? t('yes') : t('no')}
                      />
                      {needsChapterSelection ? (
                        <ReviewRow
                          label={t('makeProfileVisible')}
                          value={getValues('consentRecruiterVisibility') ? t('yes') : t('no')}
                        />
                      ) : null}
                    </div>
                    <p className="pt-2 text-sm leading-5 text-muted-foreground">
                      {t('reviewMotivation')}
                    </p>
                  </div>

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

                  {submitError ? (
                    <Alert variant="destructive" id="onboarding-submit-error">
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
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
              <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                {t.rich('sideContact', {
                  contact: (chunks) => <a href="mailto:abriones@leadmindset.org" className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80">{chunks}</a>
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </FormProvider>
  )
}
