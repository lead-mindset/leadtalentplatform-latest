'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { SKILL_OPTIONS, LEAD_CHAPTER_OPTIONS } from '@/lib/options'
import { FormStepper, FormInput } from './ui/stepper'
import { fullMemberSchemaFrontend } from '@/lib/memberschema'
import { Button } from './ui/button'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CareerCommandSelect from './ui/career-combobox'
import { submitOnboarding } from '@/app/onboarding/actions'
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

export function validateResume(file: File | null) {
  if (!file) return "Debes subir un archivo PDF";
  if (file.type !== "application/pdf") return "Solo se permite PDF";
  if (file.size > 10 * 1024 * 1024) return "El PDF debe ser menor a 10MB";
  return null;
}

export async function getLeadChapterOptions() {

  const { data, error } = await supabase
    .from("Chapter")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }

  return data.map((chapter) => ({
    label: chapter.name,
    value: chapter.id,
  }));
}

export type OnboardingValues = z.infer<typeof fullMemberSchemaFrontend>

export default function Onboarding() {
  const router = useRouter();

  const [fileName, setFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chapterOptions, setChapterOptions] = useState<{ label: string; value: string }[]>([]);
  
  useEffect(() => {
    getLeadChapterOptions().then(setChapterOptions);
  }, []);

  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(fullMemberSchemaFrontend),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      career: '',
      graduationYear: 0,
      skills: [],
      lead_chapter: '',
      linkedin_url: '',
      resume_pdf: undefined,
      consentRecruiterVisibility: false,
    },
  })

  const {
    trigger,
    getValues,
    control,
    watch,
    formState: { errors },
  } = methods

  const stepFields: Record<number, (keyof OnboardingValues)[]> = {
    1: ['full_name', 'phone', 'lead_chapter'],
    2: ['career', 'graduationYear', 'skills'],
    3: ['linkedin_url', 'resume_pdf', 'consentRecruiterVisibility'],
  }

  const validateCurrentStep = async (step: number) => {
    return trigger(stepFields[step])
  }

const handleComplete = async () => {
  const isValid = await trigger();
  if (!isValid) return;

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

  // Don't wrap in try-catch since redirect() throws NEXT_REDIRECT
  const result = await submitOnboarding(formData)

  // Only handle actual errors (redirect will never reach here)
  if (result?.error) {
    console.error(result.error)
    setIsSubmitting(false)
    // Optionally show error toast here
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
            <h2 className="text-3xl font-bold text-foreground">
              👋 Welcome to LEAD
            </h2>
            <p className="text-base text-muted-foreground">
              Let's start by getting to know you better
            </p>
          </div>

          <div className="space-y-4">
            <FormInput
              label="Full Name"
              name="full_name"
              placeholder="John Doe"
              error={errors.full_name?.message}
            />

            <FormInput
              label="Phone Number"
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
                    LEAD Chapter
                  </label>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your chapter" />
                    </SelectTrigger>

                    <SelectContent>
                      {LEAD_CHAPTER_OPTIONS.map((option) => (
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
              🎓 Your Academic Journey
            </h2>
            <p className="text-base text-muted-foreground">
              Tell us about your studies and expertise
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
              label="Expected Graduation Year"
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
                      Skills & Expertise
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {field.value.length} selected
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
                    {SKILL_OPTIONS.map((skill) => (
                      <ToggleGroupItem
                        key={skill.value}
                        value={skill.value}
                        aria-label={skill.value}
                        className=" 
        justify-start gap-2
        data-[state=on]:bg-primary
        data-[state=on]:text-primary-foreground
        data-[state=on]:border-primary
      "
                      >
                        <span className="text-base">{skill.icon}</span>
                        <span className="flex-1 text-left">
                          {skill.value}
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
              💼 Professional Profile
            </h2>
            <p className="text-base text-muted-foreground">
              Help recruiters discover your potential
            </p>
          </div>

          <div className="space-y-4">
            <FormInput
              label="LinkedIn Profile"
              name="linkedin_url"
              type="url"
              error={errors.linkedin_url?.message}
            />

            <Controller
              control={control}
              name="resume_pdf"

              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Resume (PDF)
                  </label>

                  {!fileName ? (
                    <label className="cursor-pointer">
                      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:bg-muted/50">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange(
                            field.onChange
                          )}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">
                            {isUploading
                              ? 'Uploading...'
                              : 'Click to upload'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF up to 10MB
                          </p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ready to upload
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove uploaded file"
                        onClick={() => removeFile(field.onChange)}
                      >
                        <X className="h-4 w-4" />
                      </Button></div>
                  )}
                  {errors.resume_pdf && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <X className="h-3 w-3" />
                      {errors.resume_pdf.message}
                    </p>
                  )}
                </div>
              )}
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
                          Make my profile visible to recruiters
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Connect with companies partnered with LEAD. You can change this anytime in settings.
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

          </div>
        </div>
      </FormStepper>
    </FormProvider>
  )
}