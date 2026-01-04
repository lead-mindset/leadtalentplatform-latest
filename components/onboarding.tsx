'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Step, FormStepper, FormInput } from './ui/stepper'
import { fullMemberSchema } from '@/lib/memberschema'
import { LEAD_CHAPTER_OPTIONS } from '@/lib/options'
import { z } from 'zod'

export type OnboardingValues = z.infer<typeof fullMemberSchema>

export default function Onboarding() {
  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(fullMemberSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
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

  const handleComplete = () => {
    const data = getValues()
    console.log('FINAL PAYLOAD (schema-safe):', data)
  }

  return (
    <div className="min-h-screen w-full">
      <FormProvider {...methods}>
        <FormStepper
          validateStep={validateCurrentStep}
          onFinalStepCompleted={handleComplete}
        >
          <Step>
            <h2 className="text-2xl font-bold text-white mb-2">
              👋 Let’s get to know you
            </h2>
            <p className="text-neutral-400 mb-6">
              This helps us create your LEAD profile.
            </p>

            <FormInput
              label="Full name"
              name="full_name"
              error={errors.full_name?.message}
            />

            <FormInput
              label="Phone"
              name="phone"
              error={errors.phone?.message}
            />

            <Controller
              control={control}
              name="lead_chapter"
              render={({ field }) => (
                <div>
                  <label className="block mb-1">LEAD Chapter</label>
                  <select {...field} className="w-full">
                    <option value="">Select your chapter</option>
                    {LEAD_CHAPTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {errors.lead_chapter && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.lead_chapter.message}
                    </p>
                  )}
                </div>
              )}
            />
          </Step>

          <Step>
            <h2 className="text-2xl font-bold text-white mb-2">
              🎓 Your academic journey
            </h2>
            <p className="text-neutral-400 mb-6">
              Tell us what you’re studying and what you’re good at.
            </p>

            <FormInput
              label="Career / Major"
              name="career"
              error={errors.career?.message}
            />

            <FormInput
              label="Graduation year"
              name="graduationYear"
              type="number"
              placeholder="e.g. 2026"
                validation={{ valueAsNumber: true }}

              error={errors.graduationYear?.message}
            />

            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <div>
                  <label className="block mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'JavaScript',
                      'Python',
                      'Data Analysis',
                      'UX/UI',
                      'AI',
                      'Leadership',
                    ].map((skill) => {
                      const selected = field.value.includes(skill)
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              selected
                                ? field.value.filter((v) => v !== skill)
                                : [...field.value, skill]
                            )
                          }
                          className={`px-3 py-1 rounded-full border text-sm transition ${
                            selected
                              ? 'bg-white text-black'
                              : 'border-neutral-600 text-neutral-300'
                          }`}
                        >
                          {skill}
                        </button>
                      )
                    })}
                  </div>

                  {errors.skills && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.skills.message}
                    </p>
                  )}
                </div>
              )}
            />
          </Step>

          <Step>
            <h2 className="text-2xl font-bold text-white mb-2">
              💼 Your professional profile
            </h2>
            <p className="text-neutral-400 mb-6">
              This helps recruiters understand your experience.
            </p>

            <FormInput
              label="LinkedIn profile"
              name="linkedin_url"
              placeholder="https://linkedin.com/in/username"
              error={errors.linkedin_url?.message}
            />

            <Controller
              control={control}
              name="resume_pdf"
              render={({ field }) => (
                <div>
                  <label className="block mb-1">Resume (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      field.onChange(e.target.files?.[0])
                    }
                  />
                  {errors.resume_pdf && (
                    <p className="text-sm text-red-500 mt-1">
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
                <div className="mt-6">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.checked)
                      }
                    />
                    <span>
                      I agree to make my profile visible to recruiters
                      partnered with LEAD.
                    </span>
                  </label>
                  <p className="text-sm text-neutral-400 mt-1">
                    This is optional. You can change this anytime.
                  </p>

                  {errors.consentRecruiterVisibility && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.consentRecruiterVisibility.message}
                    </p>
                  )}
                </div>
              )}
            />
          </Step>
        </FormStepper>
      </FormProvider>
    </div>
  )
}
