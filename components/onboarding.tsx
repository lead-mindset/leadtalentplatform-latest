'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Check, Upload, X, FileText, Loader2 } from 'lucide-react'
import { SKILL_OPTIONS } from '@/lib/options'
import { FormStepper, FormInput } from './ui/stepper'
import { fullMemberSchema } from '@/lib/memberschema'
import { LEAD_CHAPTER_OPTIONS } from '@/lib/options'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type OnboardingValues = z.infer<typeof fullMemberSchema>

export default function Onboarding() {
  const [fileName, setFileName] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(fullMemberSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      career: '',
      graduationYear: undefined,
      skills: [],
      lead_chapter: undefined,
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

  const selectedSkills = watch('skills')

  const stepFields: Record<number, (keyof OnboardingValues)[]> = {
    1: ['full_name', 'phone', 'lead_chapter'],
    2: ['career', 'graduationYear', 'skills'],
    3: ['linkedin_url', 'resume_pdf', 'consentRecruiterVisibility'],
  }

  const validateCurrentStep = async (step: number) => {
    return trigger(stepFields[step])
  }

  const handleComplete = () => {
    const data = getValues()
    console.log('FINAL PAYLOAD (schema-safe):', data)
  }

  const handleFileChange = (onChange: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setTimeout(() => {
        setFileName(file.name)
        onChange(file)
        setIsUploading(false)
      }, 500)
    }
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
          stepCircleContainerClassName="bg-neutral-900/50 backdrop-blur-sm"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                👋 Welcome to LEAD
              </h2>
              <p className="text-neutral-400 text-base">
                Let's start by getting to know you better
              </p>
            </div>

            <div className="space-y-4">
              <FormInput
                label="Full Name"
                name="full_name"
                placeholder="John Doe"
                error={errors.full_name?.message}
                autoComplete="name"
              />

              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                error={errors.phone?.message}
                autoComplete="tel"
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {errors.lead_chapter && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <X className="w-3 h-3" />
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
              <h2 className="text-3xl font-bold text-white">
                🎓 Your Academic Journey
              </h2>
              <p className="text-neutral-400 text-base">
                Tell us about your studies and expertise
              </p>
            </div>

            <div className="space-y-4">
              <FormInput
                label="Major / Career Field"
                name="career"
                placeholder="e.g. Computer Science, Business Administration"
                error={errors.career?.message}
              />

              <FormInput
                label="Expected Graduation Year"
                name="graduationYear"
                type="number"
                placeholder="2026"
                validation={{ valueAsNumber: true }}
                error={errors.graduationYear?.message}
              />

              <Controller
                control={control}
                name="skills"
                render={({ field }) => (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-neutral-300">
                        Skills & Expertise
                      </label>
                      <span className="text-xs text-neutral-500">
                        {selectedSkills.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {SKILL_OPTIONS.map((skill) => {
                        const isSelected = field.value.includes(skill.value)
                        return (
                          <button
                            key={skill.value}
                            type="button"
                            onClick={() =>
                              field.onChange(
                                isSelected
                                  ? field.value.filter((v) => v !== skill.value)
                                  : [...field.value, skill.value]
                              )
                            }
                            className={`group relative px-3 py-1 rounded-full border text-sm font-medium transition-all duration-200 ${isSelected
                                ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20'
                                : 'border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/50'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{skill.icon}</span>
                              <span className="text-left flex-1">{skill.value}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 animate-in zoom-in duration-200" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {errors.skills && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" />
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
              <h2 className="text-3xl font-bold text-white">
                💼 Professional Profile
              </h2>
              <p className="text-neutral-400 text-base">
                Help recruiters discover your potential
              </p>
            </div>

            <div className="space-y-4">
              <FormInput
                label="LinkedIn Profile (Optional)"
                name="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/johndoe"
                error={errors.linkedin_url?.message}
              />

              <Controller
                control={control}
                name="resume_pdf"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-300">
                      Resume (PDF)
                    </label>

                    {!fileName ? (
                      <label className="group cursor-pointer">
                        <div className={`border-2 border-dashed ${errors.resume_pdf ? 'border-red-500' : 'border-neutral-700'
                          } rounded-lg p-6 text-center hover:border-neutral-600 hover:bg-neutral-800/30 transition-all`}>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFileChange(field.onChange)}
                          />
                          <div className="flex flex-col items-center gap-2">
                            {isUploading ? (
                              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            ) : (
                              <Upload className="w-8 h-8 text-neutral-400 group-hover:text-green-500 transition-colors" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-neutral-300">
                                {isUploading ? 'Uploading...' : 'Click to upload'}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">
                                PDF up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-neutral-500">Ready to upload</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(field.onChange)}
                          className="flex-shrink-0 p-1 hover:bg-neutral-700 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    )}

                    {errors.resume_pdf && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" />
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
                    <div className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 border-2 border-neutral-600 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                            {field.value && (
                              <Check className="w-3 h-3 text-white animate-in zoom-in duration-200" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">
                            Make my profile visible to recruiters
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Connect with companies partnered with LEAD. You can change this anytime in settings.
                          </p>
                        </div>
                      </label>
                    </div>

                    {errors.consentRecruiterVisibility && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" />
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