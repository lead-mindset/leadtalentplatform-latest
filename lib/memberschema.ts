import { z } from 'zod'
import {
  LEAD_CHAPTER_OPTIONS,
  AVAILABILITY_OPTIONS,
} from './options'

export const fullMemberSchema = z.object({
  full_name: z
    .string({
      required_error: 'El nombre es requerido',
    })
    .min(1, 'El nombre es requerido'),

  email: z
    .string({
      required_error: 'El correo es requerido',
    })
    .email('Correo inválido'),

  phone: z
    .string({
      required_error: 'El teléfono es requerido',
    })
    .min(5, 'Teléfono inválido'),
  career: z
    .string({
      required_error: 'La carrera es requerida',
    })
    .min(1, 'La carrera es requerida'),

  graduation_date: z
    .string({
      required_error: 'La fecha de graduación es requerida',
    })
    .refine(
      (date) => !Number.isNaN(Date.parse(date)),
      'Fecha inválida'
    ),

  skills: z
    .array(z.string(), {
      required_error: 'Selecciona al menos una habilidad',
    })
    .min(1, 'Selecciona al menos una habilidad'),

  linkedin_url: z
    .string({
      required_error: 'El LinkedIn es requerido',
    })
    .url('URL inválida')
    .includes('linkedin.com', {
      message: 'Debe ser un perfil de LinkedIn',
    }),
  lead_chapter: z
  .enum(
    LEAD_CHAPTER_OPTIONS.map(o => o.value) as [string, ...string[]]
  , {
    required_error: 'Selecciona tu capítulo',
  },
),
  resume_pdf: z
    .instanceof(File, {
      message: 'Debes subir un archivo PDF',
    })
    .refine(
      (file) => file.type === 'application/pdf',
      'Solo se permite PDF'
    ),
  graduationYear: z
  .number({
    required_error: 'El año de graduación es requerido',
  })
  .int('Debe ser un año válido')
  .min(2000, 'Año inválido')
  .max(new Date().getFullYear() + 6, 'Año inválido'),

consentRecruiterVisibility: z.boolean({
  required_error: 'Debes indicar tu consentimiento',
}),

})
