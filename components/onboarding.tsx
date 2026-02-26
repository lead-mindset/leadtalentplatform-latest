'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { FormStepper, FormInput } from './ui/stepper'
import { createFullMemberSchemaFrontend } from '@/lib/memberschema'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import CareerCommandSelect from './ui/career-combobox'
import { submitOnboarding } from '@/lib/actions/student/onboarding'
import z from 'zod'
import { useTranslations } from 'next-intl'
import { useTranslatedSkills, useTranslatedChapters } from '@/lib/use-translated-options'
import { useTranslatedGender } from '@/lib/use-translated-options'
import { SkillsCombobox } from './ui/skills-combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)

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
    },
  })

  const {
    trigger,
    getValues,
    control,
    formState: { errors },
  } = methods

  const stepFields: Record<number, (keyof OnboardingValues)[]> = {
    1: ['full_name', 'phone', 'gender', 'lead_chapter'],
    2: ['career', 'graduationYear', 'skills'],
    3: ['linkedin_url', 'resume_pdf'],
    4: [],
  }

  const validateCurrentStep = async (step: number) => {
    return trigger(stepFields[step])
  }

  const handleComplete = async () => {
    if (!termsAccepted) {
      setTermsError(true)
      return
    }
    const isValid = await trigger()
    if (!isValid) return

    const data = getValues()
    setIsSubmitting(true)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'resume_pdf' && value instanceof File) {
          formData.append('resume', value)
        } else if (Array.isArray(value) || typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })

    const result = await submitOnboarding(formData)
    if (result?.error) {
      console.error(result.error)
      setIsSubmitting(false)
    }
  }

  const handleFileChange =
    (onChange: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <FormProvider {...methods}>
      <FormStepper
        validateStep={validateCurrentStep}
        onFinalStepCompleted={handleComplete}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t('step1Title')}</h2>
            <p className="text-base text-muted-foreground">{t('step1Subtitle')}</p>
          </div>
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
                    <SelectTrigger>
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
                  {errors.gender && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />{errors.gender.message}
                    </p>
                  )}
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
                    <SelectTrigger>
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
                  {errors.lead_chapter && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />{errors.lead_chapter.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t('step2Title')}</h2>
            <p className="text-base text-muted-foreground">{t('step2Subtitle')}</p>
          </div>
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

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t('step3Title')}</h2>
            <p className="text-base text-muted-foreground">{t('step3Subtitle')}</p>
          </div>
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
                    <label className="cursor-pointer">
                      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:bg-muted/50">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange(field.onChange)}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {isUploading
                            ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            : <Upload className="h-8 w-8 text-muted-foreground" />
                          }
                          <p className="text-sm font-medium">
                            {isUploading ? t('uploading') : t('clickToUpload')}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('pdfUpTo10MB')}</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground">{t('readyToUpload')}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove uploaded file"
                        onClick={() => removeFile(field.onChange)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {errors.resume_pdf && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />{errors.resume_pdf.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t('step4Title')}</h2>
            <p className="text-base text-muted-foreground">{t('step4Subtitle')}</p>
          </div>

          <div className="space-y-3">
            <Controller
              control={control}
              name="consentRecruiterVisibility"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 transition hover:bg-muted">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t('makeProfileVisible')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t('profileVisibilityDesc')}</p>
                  </div>
                </label>
              )}
            />

            <Controller
              control={control}
              name="emailNotificationsEnabled"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 transition hover:bg-muted">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t('emailNotificationsLabel')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t('emailNotificationsDesc')}</p>
                  </div>
                </label>
              )}
            />

            <div className="border-t border-border pt-3">
              <div className="space-y-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 transition hover:bg-muted">
                      <Checkbox
                        checked={termsAccepted}
                        onCheckedChange={(checked) => {
                          setTermsAccepted(Boolean(checked))
                          setTermsError(false)
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {t('termsLabel')}{' '}
                          <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                            {t('termsLink')}
                          </Link>
                          {' '}&amp;{' '}
                          <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                            {t('privacyLink')}
                          </Link>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t('termsDesc')}</p>
                      </div>
                    </label>
                    {termsError && (
                      <p className="flex items-center gap-1 text-sm text-destructive">
                        <X className="h-3 w-3" />{t('termsRequired')}
                      </p>
                    )}
                  </div>
            </div>
          </div>
        </div>
      </FormStepper>
    </FormProvider>
  )
}