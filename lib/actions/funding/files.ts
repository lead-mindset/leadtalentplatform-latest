'use server'

import { revalidatePath } from 'next/cache'
import { requireChapterMember, requireUser } from '@/lib/auth'
import { FundingService, type FundingFileType } from '@/lib/services/funding.service'
import {
  FundingFileLinkSchema,
  FundingFileSignedUrlSchema,
} from '@/lib/actions/funding/schemas'

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

type FundingFileActionResult =
  | { success: true; fileId: string }
  | { success: false; error: string }

type FundingFileUrlResult =
  | { success: true; url: string }
  | { success: false; error: string }

function revalidateFundingPaths(requestId?: string) {
  revalidatePath('/chapter/funding')
  revalidatePath('/admin/funding')
  if (requestId) {
    revalidatePath(`/chapter/funding/${requestId}`)
    revalidatePath(`/admin/funding/${requestId}`)
  }
}

function isFundingFileType(value: FormDataEntryValue | null): value is FundingFileType {
  return value === 'supporting_material' || value === 'receipt' || value === 'evidence'
}

export async function uploadFundingFile(formData: FormData): Promise<FundingFileActionResult> {
  const requestId = formData.get('requestId')
  const fileType = formData.get('fileType')
  const notes = formData.get('notes')
  const file = formData.get('file')

  if (typeof requestId !== 'string') return { success: false, error: 'Solicitud invalida.' }
  if (!isFundingFileType(fileType)) return { success: false, error: 'Tipo de archivo invalido.' }
  if (!(file instanceof File)) return { success: false, error: 'Archivo requerido.' }
  if (file.size > MAX_UPLOAD_SIZE) return { success: false, error: 'El archivo debe pesar 10MB o menos.' }

  const { supabase, user } = await requireChapterMember()
  const result = await FundingService.uploadFundingFile(supabase, {
    actorUserId: user.id,
    requestId,
    fileType,
    file,
    notes: typeof notes === 'string' ? notes : null,
  })

  if (!result.success) return result

  revalidateFundingPaths(requestId)
  return { success: true, fileId: result.data.id }
}

export async function addFundingFileLink(input: unknown): Promise<FundingFileActionResult> {
  const parsed = FundingFileLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Link invalido.' }
  }

  const { supabase, user } = await requireChapterMember()
  const result = await FundingService.addFundingFileLink(supabase, {
    ...parsed.data,
    actorUserId: user.id,
  })

  if (!result.success) return result

  revalidateFundingPaths(parsed.data.requestId)
  return { success: true, fileId: result.data.id }
}

export async function getFundingFileAccessUrl(input: unknown): Promise<FundingFileUrlResult> {
  const parsed = FundingFileSignedUrlSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Archivo invalido.' }
  }

  const { supabase, user } = await requireUser()
  const result = await FundingService.createFundingFileAccessUrl(supabase, {
    actorUserId: user.id,
    fileId: parsed.data.fileId,
  })

  if (!result.success) return result
  return { success: true, url: result.data.url }
}
