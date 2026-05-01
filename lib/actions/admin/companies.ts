'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import { AdminService } from '@/lib/services/admin.service'

export {
  type CompanySortKey,
  type CompaniesFilters,
  type CompaniesPagination,
  type CompanyListItem,
  type CompanyDetail,
  type CompaniesListResponse,
  type SortOrder,
} from '@/lib/services/admin.service'

type ActionResult = { success: true } | { success: false; error: string }
type InviteResult = ActionResult & { inviteLink?: string }

const companyNameSchema = z.string().trim().min(2).max(160)
const inviteSchema = z.object({
  companyId: z.string().trim().min(1),
  recruiterEmail: z.string().trim().email(),
  expiresInDays: z.union([z.literal(7), z.literal(30), z.null()]),
})

export async function getCompaniesList(
  filters: Parameters<typeof AdminService.getCompaniesList>[1],
  pagination: Parameters<typeof AdminService.getCompaniesList>[2]
) {
  const { supabase } = await requireAdmin()
  return AdminService.getCompaniesList(supabase, filters, pagination)
}

export async function getCompanyById(id: string): Promise<
  | { id: string; name: string; created_at: string; created_by_name: string | null; recruiters: { id: string; recruiter_email: string; is_active: boolean; invite_token: string; invite_expires_at: string | null; accepted_at: string | null; accepted_by_user_id: string | null; revoked_at: string | null; granted_at: string }[] }
  | null
> {
  const { supabase } = await requireAdmin()
  return AdminService.getCompanyById(supabase, id)
}

export async function createCompany(name: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin()
    const parsedName = companyNameSchema.safeParse(name)
    if (!parsedName.success) {
      return { success: false, error: 'Company name must be at least 2 characters long.' }
    }

    const result = await AdminService.createCompany(supabase, {
      name: parsedName.data,
      createdById: user.id,
    })

    if (!result.success) {
      return result
    }

    revalidatePath('/admin/companies')
    return { success: true }
  } catch (error) {
    console.error('[admin/companies] createCompany unexpected:', error)
    return { success: false, error: 'Unexpected error creating company.' }
  }
}

export async function updateCompany(id: string, name: string): Promise<ActionResult> {
  const parsedName = companyNameSchema.safeParse(name)
  if (!parsedName.success) {
    return { success: false, error: 'Company name must be at least 2 characters long.' }
  }

  const { supabase } = await requireAdmin()
  const result = await AdminService.updateCompany(supabase, id, parsedName.data)
  if (!result.success) {
    return result
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${id}`)
  return { success: true }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const result = await AdminService.deleteCompany(supabase, id)
  if (!result.success) {
    return result
  }

  revalidatePath('/admin/companies')
  return { success: true }
}

export async function generateInviteToken(
  companyId: string,
  recruiterEmail: string,
  expiresInDays: 7 | 30 | null
): Promise<InviteResult> {
  const parsedInvite = inviteSchema.safeParse({ companyId, recruiterEmail, expiresInDays })
  if (!parsedInvite.success) {
    return { success: false, error: 'Enter a valid recruiter email.' }
  }

  const { supabase, user } = await requireAdmin()
  const result = await AdminService.generateInviteToken(
    supabase,
    user.id,
    parsedInvite.data.companyId,
    parsedInvite.data.recruiterEmail,
    parsedInvite.data.expiresInDays
  )

  if (result.success) {
    revalidatePath('/admin/companies')
    revalidatePath(`/admin/companies/${parsedInvite.data.companyId}`)
  }

  return result
}

export async function revokeAccess(accessId: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()
  const result = await AdminService.revokeAccess(supabase, user.id, accessId)
  if (result.success) {
    revalidatePath('/admin/companies')
  }
  return result
}

export async function resendInvite(accessId: string): Promise<InviteResult> {
  const { supabase } = await requireAdmin()
  const result = await AdminService.resendCompanyInvite(supabase, accessId)
  if (result.success) {
    revalidatePath('/admin/companies')
  }
  return result
}

export async function getCompanyStats(id: string) {
  const { supabase } = await requireAdmin()
  return AdminService.getCompanyStats(supabase, id)
}
