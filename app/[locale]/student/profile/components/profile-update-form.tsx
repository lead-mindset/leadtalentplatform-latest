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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-2xl">
                👋
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t('personalInfo.title')}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('personalInfo.subtitle')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-5 rounded-xl border border-border/60 bg-card/30 p-6 shadow-sm backdrop-blur-sm">
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
                  <label className="text-sm font-medium text-foreground">
                    {t('personalInfo.leadChapter')}
                  </label>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-11">
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
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <X className="h-3.5 w-3.5" />
                      {errors.lead_chapter.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-2xl">
                🎓
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t('academic.title')}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('academic.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 rounded-xl border border-border/60 bg-card/30 p-6 shadow-sm backdrop-blur-sm">
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      {t('academic.skills')}
                    </label>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
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
                    className="grid sm:grid-cols-2 gap-2.5 w-full"
                  >
                    {translatedSkills.map((skill) => (
                      <ToggleGroupItem
                        key={skill.value}
                        value={skill.value}
                        aria-label={skill.value}
                        className="h-auto justify-start gap-2.5 px-3.5 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:shadow-sm transition-all duration-200"
                      >
                        <span className="text-lg">{skill.icon}</span>
                        <span className="flex-1 text-left text-sm font-medium">
                          {skill.label}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>

                  {errors.skills && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <X className="h-3.5 w-3.5" />
                      {errors.skills.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-2xl">
                💼
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t('professional.title')}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('professional.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 rounded-xl border border-border/60 bg-card/30 p-6 shadow-sm backdrop-blur-sm">
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
                  <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
                    <label className="flex cursor-pointer items-start gap-3.5">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />

                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {t('professional.visibility')}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t('professional.visibilityDesc')}
                        </p>
                      </div>
                    </label>
                  </div>

                  {errors.consentRecruiterVisibility && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <X className="h-3.5 w-3.5" />
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
                  <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
                    <label className="flex cursor-pointer items-start gap-3.5">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />

                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {t('professional.emailNotificationsLabel')}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
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

        <div className="flex items-center justify-end gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-muted/20 to-transparent p-5 shadow-sm backdrop-blur-sm">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-32 shadow-sm"
            size="lg"
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