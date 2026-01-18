'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { Upload, X, FileText, Loader2, Save } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { SKILL_OPTIONS } from '@/lib/options'
import { FormInput } from '@/components/ui/stepper'
import { fullMemberSchema2 } from '@/lib/memberschema'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
import { resume } from 'react-dom/server'

export type OnboardingValues = z.infer<typeof fullMemberSchema2>

async function getLeadChapterOptions() {
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

interface ProfileUpdateFormProps {
  initialData?: any
}

export default function ProfileUpdateForm({ initialData }: ProfileUpdateFormProps) {
  const [fileName, setFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [chapterOptions, setChapterOptions] = useState([])
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  console.log(initialData)
  const router = useRouter()

  useEffect(() => {
    getLeadChapterOptions().then(setChapterOptions);
    console.log('yay')
  }, []);

  useEffect(() => {
    async function fetchResume() {
      if (!initialData?.id) return

      const { data, error } = await supabase
        .from("Resume")
        .select("*")
        .eq("studentId", initialData.id)
        .order("uploadedAt", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("Error fetching resume:", error)
        return
      }

      if (data) {
        setResumeUrl(data.fileUrl)
        setFileName(data.fileName || '')
      }
    }

    fetchResume()
  }, [initialData?.id])



  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(fullMemberSchema2),
    mode: 'onChange',
    defaultValues: {
      full_name: initialData?.full_name || '',
      phone: initialData?.phone || '',
      career: initialData?.career || '',
      graduationYear: initialData?.graduationYear || undefined,
      skills: initialData?.skills || [],
      lead_chapter: initialData?.lead_chapter || undefined,
      linkedin_url: initialData?.linkedin_url || '',
      resume_pdf: undefined,
      consentRecruiterVisibility: initialData?.consentRecruiterVisibility || false,
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = methods

    const onSubmit = async (data: OnboardingValues) => {
    setIsSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error ?? 'Failed to update profile')
      }

      alert('Profile updated successfully!')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              👋 Personal Information
            </h2>
            <p className="text-base text-muted-foreground">
              Update your basic information
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
                      {chapterOptions.map((option: any) => (
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
              🎓 Academic Journey
            </h2>
            <p className="text-base text-muted-foreground">
              Update your studies and expertise
            </p>
          </div>

          <div className="space-y-4">
            <FormInput
              label="Major / Career Field"
              name="career"
              error={errors.career?.message}
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
                        className="justify-start gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
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
              Update your professional information
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
                  <label className="text-sm font-medium">Resume (PDF) - Optional</label>

                  {!fileName && !resumeUrl ? (
                    <label className="cursor-pointer">
                      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:bg-muted/50">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange(field.onChange)}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">
                            {isUploading ? 'Uploading...' : 'Click to upload new resume'}
                          </p>
                          <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <p className="text-sm font-medium text-foreground truncate">
                            {fileName || resumeUrl?.split('/').pop()}
                          </p>
                          {resumeUrl && !fileName && (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              View current resume
                            </a>
                          )}
                          {fileName && (
                            <p className="text-xs text-muted-foreground">Ready to upload</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeFile(field.onChange)
                            setResumeUrl(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
                          Connect with companies partnered with LEAD
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

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-32"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}