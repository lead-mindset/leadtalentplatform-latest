'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { FormInput } from '@/components/ui/stepper'
import { createProfileUpdateSchema, ProfileData } from '@/lib/memberschema'
import { Button } from '@/components/ui/button'
import CareerCommandSelect from '@/components/ui/career-combobox'
import { useRouter } from 'next/navigation'
import { getResume } from '@/lib/actions/student/profile'
import { updateProfile } from '@/lib/actions/student/profile'
import { useTranslations } from 'next-intl'
import { useTranslatedSkills, useTranslatedChapters } from '@/lib/use-translated-options'
import type { SubmitHandler } from 'react-hook-form'
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProfileUpdateFormProps {
  initialData: ProfileData
}

export default function ProfileUpdateForm({ initialData }: ProfileUpdateFormProps) {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tOnboarding = useTranslations('onboarding')
  const tValidation = useTranslations()
  
  const translatedSkills = useTranslatedSkills()
  const translatedChapters = useTranslatedChapters()
  
  const [fileName, setFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const router = useRouter()

const profileUpdateSchema = createProfileUpdateSchema(tValidation)
  type OnboardingValues = z.infer<typeof profileUpdateSchema>

  useEffect(() => {
    async function fetchResume() {
      if (!initialData?.id) return

      const data = await getResume(initialData.id)

      if (data) {
        setResumeUrl(data.fileUrl)
        setFileName(data.fileName || '')
      }
    }

    fetchResume()
  }, [initialData?.id])

  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: initialData?.full_name || '',
      phone: initialData?.phone || '',
      career: initialData?.career || '',
      graduationYear: initialData?.graduationYear || 0,
      skills: initialData?.skills || [],
      lead_chapter: initialData?.lead_chapter || '',
      linkedin_url: initialData?.linkedin_url || '',
      resume_pdf: undefined,
      consentRecruiterVisibility: initialData?.consentRecruiterVisibility || false,
      emailNotificationsEnabled: initialData?.emailNotificationsEnabled ?? true,

    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = methods

const onSubmit: SubmitHandler<OnboardingValues> = async (data) => {
  setIsSaving(true)

  try {
    const formData = new FormData()

    formData.append("full_name", data.full_name)
    formData.append("phone", data.phone)
    formData.append("lead_chapter", data.lead_chapter || "")
    formData.append("career", data.career)
    formData.append("graduationYear", String(data.graduationYear || 0))
    formData.append("skills", JSON.stringify(data.skills))
    formData.append("linkedin_url", data.linkedin_url || "")
    formData.append("consentRecruiterVisibility", String(data.consentRecruiterVisibility))
    formData.append("emailNotificationsEnabled", String(data.emailNotificationsEnabled)) 

    if (data.resume_pdf) {
      formData.append("resume", data.resume_pdf)
    }

    const result = await updateProfile(formData)

    if (!result.success) {
      throw new Error(result.error ?? t('updateFailed'))
    }

    alert(t('updateSuccess'))
    router.refresh()
  } catch (err: any) {
    console.error(err)
    alert(t('updateError'))
  } finally {
    setIsSaving(false)
  }
}

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              👋 {t('personalInfo.title')}
            </h2>
            <p className="text-base text-muted-foreground">
              {t('personalInfo.subtitle')}
            </p>
          </div>
          <div className="space-y-4">
            <FormInput
              label={t('personalInfo.fullName')}
              name="full_name"
              placeholder="John Doe"
              error={errors.full_name?.message}
            />

            <FormInput
              label={t('personalInfo.phone')}
              name="phone"
              placeholder="+1 (555) 123-4567"
              error={errors.phone?.message}
            />

            <Controller
              control={control}
              name="lead_chapter"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('personalInfo.leadChapter')}
                  </label>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('personalInfo.selectChapter')} />
                    </SelectTrigger>

                    <SelectContent>
                      {translatedChapters.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {errors.lead_chapter && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />
                      {errors.lead_chapter.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              🎓 {t('academic.title')}
            </h2>
            <p className="text-base text-muted-foreground">
              {t('academic.subtitle')}
            </p>
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
              label={t('academic.graduationYear')}
              name="graduationYear"
              type="number"
              validation={{ valueAsNumber: true }}
              error={errors.graduationYear?.message}
            />

            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-foreground">
                      {t('academic.skills')}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {field.value.length} {t('academic.selected')}
                    </span>
                  </div>

                  <ToggleGroup
                    type="multiple"
                    value={field.value}
                    onValueChange={field.onChange}
                    variant="outline"
                    size="sm"
                    spacing={2}
                    className="grid grid-cols-2 w-full"
                  >
                    {translatedSkills.map((skill) => (
                      <ToggleGroupItem
                        key={skill.value}
                        value={skill.value}
                        aria-label={skill.value}
                        className="justify-start gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                      >
                        <span className="text-base">{skill.icon}</span>
                        <span className="flex-1 text-left">
                          {skill.label}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>

                  {errors.skills && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />
                      {errors.skills.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              💼 {t('professional.title')}
            </h2>
            <p className="text-base text-muted-foreground">
              {t('professional.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <FormInput
              label={t('professional.linkedin')}
              name="linkedin_url"
              type="url"
              error={errors.linkedin_url?.message}
            />

            <Controller
              control={control}
              name="consentRecruiterVisibility"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                        className="mt-0.5"
                      />

                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {t('professional.visibility')}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('professional.visibilityDesc')}
                        </p>
                      </div>
                    </label>
                  </div>

                  {errors.consentRecruiterVisibility && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />
                      {errors.consentRecruiterVisibility.message}
                    </p>
                  )}
                </div>
              )}
            />

              <Controller
              control={control}
              name="emailNotificationsEnabled"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                        className="mt-0.5"
                      />

                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {t('professional.emailNotificationsLabel')}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('professional.emailNotificationsDesc')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            />


          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-32"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon('loading')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {tCommon('save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}