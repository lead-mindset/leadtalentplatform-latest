'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Icons } from '@/components/ui/icons'
import { Checkbox } from '@/components/ui/checkbox'
import { FormStepper, FormInput } from './ui/stepper'
import { createFullMemberSchemaFrontend } from '@/lib/memberschema'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import CareerCommandSelect from './ui/career-combobox'
import { submitOnboarding } from '@/lib/actions/student/onboarding'
import z from 'zod'
import { useTranslations } from 'next-intl'
import { useTranslatedSkills, useTranslatedChapters, useTranslatedGender } from '@/lib/use-translated-options'
import { SkillsCombobox } from './ui/skills-combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from '@/i18n/routing'

export default function Onboarding() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const tValidation = useTranslations()

  const translatedSkills = useTranslatedSkills()
  const translatedChapters = useTranslatedChapters()
  const translatedGender = useTranslatedGender()

  const [fileName, setFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fullMemberSchema = createFullMemberSchemaFrontend(tValidation)
  type OnboardingValues = z.infer<typeof fullMemberSchema>

  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(fullMemberSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      career: '',
      graduationYear: 0,
      skills: [],
      gender: undefined,
      lead_chapter: '',
      linkedin_url: '',
      resume_pdf: undefined,
      consentRecruiterVisibility: false,
      emailNotificationsEnabled: true,
      termsAccepted: undefined,
    },
  })

  const { trigger, getValues, control, formState: { errors } } = methods

  const stepFields: Record<number, (keyof OnboardingValues)[]> = {
    1: ['full_name', 'phone', 'gender', 'lead_chapter'],
    2: ['career', 'graduationYear', 'skills'],
    3: ['linkedin_url', 'resume_pdf'],
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
      if (key === 'resume_pdf' && value instanceof File) {
        formData.append('resume', value)
      } else if (key === 'termsAccepted') {

      } else if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    })

    const result = await submitOnboarding(formData)
    if (result?.error) {
      console.error(result.error)
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (onChange: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setTimeout(() => {
      setFileName(file.name)
      onChange(file)
      setIsUploading(false)
    }, 500)
  }

  const removeFile = (onChange: any) => {
    setFileName('')
    onChange(undefined)
  }
  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <p className="flex items-center gap-1 text-sm text-destructive mt-1">
        <Icons.X className="h-3 w-3 shrink-0" />
        {message}
      </p>
    ) : null
  const StepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="space-y-1.5 pb-2 border-b border-border">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
  const PrefCard = ({
    checked,
    onCheckedChange,
    title,
    description,
  }: {
    checked: boolean
    onCheckedChange: (v: boolean) => void
    title: React.ReactNode
    description: string
  }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        className="mt-0.5"
      />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  )

  return (
    <FormProvider {...methods}>
      <FormStepper validateStep={validateCurrentStep} onFinalStepCompleted={handleComplete}>

        {}
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
                      {translatedGender.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.gender?.message} />
                </div>
              )}
            />

            <Controller
              control={control}
              name="lead_chapter"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('leadChapter')}</label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('selectChapter')} />
                    </SelectTrigger>
                    <SelectContent>
                      {translatedChapters.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.lead_chapter?.message} />
                </div>
              )}
            />
          </div>
        </div>

        {}
        <div className="space-y-6">
          <StepHeader title={t('step2Title')} subtitle={t('step2Subtitle')} />

          <div className="space-y-4">
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
              name="graduationYear"
              type="number"
              validation={{ valueAsNumber: true }}
              error={errors.graduationYear?.message}
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
          </div>
        </div>

        {}
        <div className="space-y-6">
          <StepHeader title={t('step3Title')} subtitle={t('step3Subtitle')} />

          <div className="space-y-4">
            <FormInput
              label={t('linkedinProfile')}
              name="linkedin_url"
              type="url"
              error={errors.linkedin_url?.message}
            />

            <Controller
              control={control}
              name="resume_pdf"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('resumePdf')}</label>

                  {!fileName ? (
                    <label className="cursor-pointer block">
                      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange(field.onChange)}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {isUploading
                            ? <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                            : <Icons.Upload className="h-4 w-4 mr-2" />
                          }
                          <p className="text-sm font-medium text-foreground">
                            {isUploading ? t('uploading') : t('clickToUpload')}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('pdfUpTo10MB')}</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icons.FileText className="h-4 w-4 mr-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground">{t('readyToUpload')}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove file"
                        onClick={() => removeFile(field.onChange)}
                      >
                        <Icons.X className="h-4 w-4 mr-2" />
                      </Button>
                    </div>
                  )}

                  <FieldError message={errors.resume_pdf?.message} />
                </div>
              )}
            />
          </div>
        </div>

        {}
        <div className="space-y-6">
          <StepHeader title={t('step4Title')} subtitle={t('step4Subtitle')} />

          <div className="space-y-3">
            {}
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

            <div className="pt-3 border-t border-border space-y-2">
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
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true ? true : undefined)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {t('termsLabel')}{' '}
                          <Link
                            href="/terms"
                            target="_blank"
                            className="text-primary underline hover:opacity-80 transition-opacity underline-offset-2"
                          >
                            {t('termsLink')}
                          </Link>
                          {' '}&amp;{' '}
                          <Link
                            href="/privacy"
                            target="_blank"
                            className="text-primary underline hover:opacity-80 transition-opacity underline-offset-2"
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
            </div>
          </div>
        </div>

      </FormStepper>
    </FormProvider>
  )
}