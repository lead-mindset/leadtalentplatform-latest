'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Step, FormStepper, FormInput } from './ui/stepper'
import { fullMemberSchema } from '@/lib/memberschema'
import { ENGLISH_LEVEL_OPTIONS, LEAD_CHAPTER_OPTIONS, AVAILABILITY_OPTIONS } from '@/lib/options'
import z from "zod";

export type OnboardingValues = z.infer<typeof fullMemberSchema>

export default function Onboarding() {
  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(fullMemberSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      graduation_date: undefined,
      skills: [],
      lead_chapter: undefined,
      career: '',
      linkedin_url: '',
      resume_pdf: undefined,
    },
  })

  const {
    trigger,
    getValues,
    control,
    formState: { errors },
  } = methods

  const stepFields: Record<number, (keyof OnboardingValues)[]> = {
    1: ['full_name', 'email', 'phone'],
    2: ['career', 'graduation_date', 'lead_chapter'],
    3: ['skills', 'linkedin_url', 'resume_pdf'],
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
            <h2 className="text-2xl font-bold text-white mb-2">Welcome 👋</h2>
            <p className="text-neutral-400 mb-6">Información básica</p>

            <FormInput
              label="Nombre completo"
              name="full_name"
              error={errors.full_name?.message}
            />

            <FormInput
              label="Correo"
              name="email"
              type="email"
              error={errors.email?.message}
            />

            <FormInput
              label="Teléfono"
              name="phone"
              error={errors.phone?.message}
            />
          </Step>

          <Step>
            <h2 className="text-2xl font-bold text-white mb-2">Educación 🎓</h2>

            <FormInput
              label="Carrera"
              name="career"
              error={errors.career?.message}
            />

            <FormInput
              label="Fecha de graduación"
              name="graduation_date"
              type="date"
              error={errors.graduation_date?.message}
            />

            <Controller
              control={control}
              name="lead_chapter"
              render={({ field }) => (
                <select {...field} className="w-full">
                  <option value="">Selecciona tu capítulo</option>
                  {LEAD_CHAPTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.lead_chapter && (
              <p className="text-sm text-red-500">{errors.lead_chapter.message}</p>
            )}
          </Step>

          <Step>
            <h2 className="text-2xl font-bold text-white mb-2">Perfil profesional 💼</h2>

            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ENGLISH_LEVEL_OPTIONS.map((s) => {
                    const selected = field.value.includes(s.value)
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((v) => v !== s.value)
                              : [...field.value, s.value]
                          )
                        }
                        className={`px-3 py-1 rounded-full border text-sm transition ${
                          selected
                            ? 'bg-white text-black'
                            : 'border-neutral-600 text-neutral-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
            {errors.skills && (
              <p className="text-sm text-red-500 mt-2">{errors.skills.message}</p>
            )}

            <FormInput
              label="LinkedIn"
              name="linkedin_url"
              error={errors.linkedin_url?.message}
            />

            <Controller
              control={control}
              name="resume_pdf"
              render={({ field }) => (
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              )}
            />
            {errors.resume_pdf && (
              <p className="text-sm text-red-500">{errors.resume_pdf.message}</p>
            )}
          </Step>
        </FormStepper>
      </FormProvider>
    </div>
  )
}
