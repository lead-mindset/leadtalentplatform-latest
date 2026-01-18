import { z } from 'zod'
import {
  LEAD_CHAPTER_OPTIONS,
  AVAILABILITY_OPTIONS,
} from './options'


const baseProfileSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(5, "Teléfono inválido"),
  career: z.string().min(1, "La carrera es requerida"),

  graduationYear: z.preprocess(
    (val) => {
      if (val === undefined || val === '' || val === null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({ message: 'Por favor ingresa tu año de graduación' })
      .int('Debe ser un año válido')
      .min(2000, 'Año inválido')
      .max(new Date().getFullYear() + 6, 'Año inválido')
  ),

  skills: z.array(z.string()).min(1, "Selecciona al menos una habilidad"),

  linkedin_url: z.string().url("URL inválida").refine(
    val => val.includes("linkedin.com"),
    { message: "Debe ser un perfil de LinkedIn" }
  ),

  lead_chapter: z.preprocess(
    (val) => (val === undefined || val === '' ? null : val),
    z.union([z.string(), z.null()])
      .refine(val => val !== null, {
        message: 'Selecciona tu capítulo'
      })
      .refine(
        (val) => val && LEAD_CHAPTER_OPTIONS.some((o) => o.value === val),
        { message: 'Selecciona un capítulo válido' }
      )
  ),

  consentRecruiterVisibility: z.boolean({ message: "Debes indicar tu consentimiento" }),
});

export const fullMemberSchemaFrontend = baseProfileSchema.extend({
  resume_pdf: z
    .custom<File>((file) => file instanceof File, { message: "Debes subir un archivo PDF" })
    .refine(file => file.type === "application/pdf", "Solo se permite PDF")
    .refine(file => file.size <= 10 * 1024 * 1024, "PDF debe ser menor a 10MB"),
});

export const fullMemberSchemaBackend = baseProfileSchema;



export const fullMemberSchema2 = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(5, 'Teléfono inválido'),
  career: z.string().min(1, 'La carrera es requerida'),

  graduationYear: z
    .number({ message: 'El año de graduación es requerido' })
    .int('Debe ser un año válido')
    .min(2000, 'Año inválido')
    .max(new Date().getFullYear() + 6, 'Año inválido'),

  skills: z.array(z.string()).min(1, 'Selecciona al menos una habilidad'),

  linkedin_url: z
    .string()
    .url('URL inválida')
    .refine((val) => val.includes('linkedin.com'), 'Debe ser un perfil de LinkedIn'),

  lead_chapter: z.enum(
    LEAD_CHAPTER_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ),

  resume_pdf: z
    .instanceof(File)
    .optional(),

  consentRecruiterVisibility: z.boolean(),
});