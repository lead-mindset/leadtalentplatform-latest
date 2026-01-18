import { z } from 'zod'
import {
  LEAD_CHAPTER_OPTIONS,
} from './options'


const baseProfileSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(5, "Teléfono inválido"),
  career: z.string().min(1, "La carrera es requerida"),

  graduationYear: z.coerce
    .number({ message: 'Por favor ingresa tu año de graduación' })
    .refine(val => val !== 0, {
      message: 'Año inválido'
    })
    .refine(val => val >= 2000 && val <= new Date().getFullYear() + 6, {
      message: 'Año inválido'
    }) as unknown as z.ZodNumber,

  skills: z.array(z.string()).min(1, "Selecciona al menos una habilidad"),

  linkedin_url: z.string().url("URL inválida").refine(
    val => val.includes("linkedin.com"),
    { message: "Debe ser un perfil de LinkedIn" }
  ),

  lead_chapter: z
    .string({ message: 'Selecciona tu capítulo' })
    .min(1, 'Selecciona tu capítulo')
    .refine(
      (val) => LEAD_CHAPTER_OPTIONS.some((o) => o.value === val),
      { message: 'Selecciona un capítulo válido' }
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


export const profileUpdateSchema = baseProfileSchema.extend({
  resume_pdf: z
    .custom<File>((file) => file instanceof File, { message: "Debes subir un archivo PDF" })
    .refine(file => file.type === "application/pdf", "Solo se permite PDF")
    .refine(file => file.size <= 10 * 1024 * 1024, "PDF debe ser menor a 10MB")
    .optional(),
});

export type ProfileData = {
  id: string;
  full_name: string;
  phone: string;
  career: string;
  graduationYear: number;
  skills: string[];
  lead_chapter: string;
  linkedin_url: string;
  consentRecruiterVisibility: boolean;
};


