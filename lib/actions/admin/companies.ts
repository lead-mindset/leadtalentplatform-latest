'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import type { CompanyRow, RecruiterAccessRow, UserRow } from '@/lib/types'

export type CompanySortKey = 'name' | 'created_at' | 'active_recruiters' | 'pending_invites'
export type SortOrder = 'asc' | 'desc'

export type CompaniesFilters = {
  search?: string
}

export type CompaniesPagination = {
  page: number
  pageSize: 25 | 50 | 100
  sortBy?: CompanySortKey
  sortOrder?: SortOrder
}

export type CompanyListItem = {
  id: string
  name: string
  created_at: string
  created_by_name: string | null
  active_recruiters: number
  pending_invites: number
}

export type CompanyDetail = {
  id: string
  name: string
  created_at: string
  created_by_name: string | null
  recruiters: {
    id: string
    recruiter_email: string
    is_active: boolean
    invite_token: string
    invite_expires_at: string | null
    accepted_at: string | null
    accepted_by_user_id: string | null
    revoked_at: string | null
    granted_at: string
  }[]
}

type ActionResult = { success: true } | { success: false; error: string }
type InviteResult = ActionResult & { inviteLink?: string }

type CompanyListRow = Pick<CompanyRow, 'id' | 'name' | 'created_at' | 'created_by_id'> & {
  created_by: Pick<UserRow, 'name'> | Pick<UserRow, 'name'>[] | null
}
type CompanyAccessRow = Pick<
  RecruiterAccessRow,
  'id' | 'company_id' | 'is_active' | 'accepted_at' | 'revoked_at' | 'invite_expires_at'
>

const companyNameSchema = z.string().trim().min(2).max(160)
const inviteSchema = z.object({
  companyId: z.string().trim().min(1),
  recruiterEmail: z.string().trim().email(),
  expiresInDays: z.union([z.literal(7), z.literal(30), z.null()]),
})

function generateInviteLink(token: string): string {
  return `/recruiter/access?token=${token}`
}

function getExpiryDate(days: number | null): string | null {
  if (days === null) return null
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function sortRows(rows: CompanyListItem[], sortBy: CompanySortKey, sortOrder: SortOrder): CompanyListItem[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * direction
      case 'active_recruiters':
        return (a.active_recruiters - b.active_recruiters) * direction
      case 'pending_invites':
        return (a.pending_invites - b.pending_invites) * direction
      case 'created_at':
      default:
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction
    }
  })
}

export async function getCompaniesList(
  filters: CompaniesFilters,
  pagination: CompaniesPagination
) {
  const { supabase } = await requireAdmin()
  const now = new Date().toISOString()

  let query = supabase
    .from('company')
    .select('id, name, created_at, created_by_id, created_by:user!company_created_by_id_fkey(name)')

  const search = filters.search?.trim()
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: companies, error } = await query
  if (error || !companies) {
    console.error('[admin/companies] getCompaniesList error:', error)
    return { items: [], total: 0, page: 1, pageSize: pagination.pageSize }
  }

  const companyRows = companies as CompanyListRow[]
  const ids = companyRows.map((company: CompanyListRow) => company.id)
  const { data: accessRows } = await supabase
    .from('recruiter_access')
    .select('id, company_id, is_active, accepted_at, revoked_at, invite_expires_at')
    .in('company_id', ids)

  const recruiterAccessRows = (accessRows ?? []) as unknown as CompanyAccessRow[]

  const rows: CompanyListItem[] = companyRows.map((company: CompanyListRow) => {
    const companyAccess = recruiterAccessRows.filter((row: CompanyAccessRow) => row.company_id === company.id)
    const active_recruiters = companyAccess.filter((row: CompanyAccessRow) => row.is_active && !row.revoked_at).length
    const pending_invites = companyAccess.filter(
      (row: CompanyAccessRow) =>
        !row.accepted_at &&
        !row.revoked_at &&
        (row.invite_expires_at === null || row.invite_expires_at > now)
    ).length

    const createdBy = Array.isArray(company.created_by) ? company.created_by[0] : company.created_by
    return {
      id: company.id,
      name: company.name,
      created_at: company.created_at,
      created_by_name: createdBy?.name ?? null,
      active_recruiters,
      pending_invites,
    }
  })

  const sortBy = pagination.sortBy ?? 'created_at'
  const sortOrder = pagination.sortOrder ?? 'desc'
  const sorted = sortRows(rows, sortBy, sortOrder)
  const page = Math.max(1, pagination.page)
  const start = (page - 1) * pagination.pageSize
  const end = start + pagination.pageSize

  return {
    items: sorted.slice(start, end),
    total: sorted.length,
    page,
    pageSize: pagination.pageSize,
  }
}

export async function getCompanyById(id: string): Promise<CompanyDetail | null> {
  const { supabase } = await requireAdmin()

  const { data: company, error } = await supabase
    .from('company')
    .select('id, name, created_at, created_by_id, created_by:user!company_created_by_id_fkey(name)')
    .eq('id', id)
    .maybeSingle()

  if (error || !company) {
    console.error('[admin/companies] getCompanyById company error:', error)
    return null
  }

  const { data: recruiters, error: recruitersError } = await supabase
    .from('recruiter_access')
    .select('id, recruiter_email, is_active, invite_token, invite_expires_at, accepted_at, accepted_by_user_id, revoked_at, granted_at')
    .eq('company_id', id)
    .order('granted_at', { ascending: false })

  if (recruitersError) {
    console.error('[admin/companies] getCompanyById recruiters error:', recruitersError)
  }

  const createdBy = Array.isArray(company.created_by) ? company.created_by[0] : company.created_by
  return {
    id: company.id,
    name: company.name,
    created_at: company.created_at,
    created_by_name: createdBy?.name ?? null,
    recruiters: recruiters ?? [],
  }
}

export async function createCompany(name: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin()
    const parsedName = companyNameSchema.safeParse(name)
    if (!parsedName.success) {
      return { success: false, error: 'Company name must be at least 2 characters long.' }
    }

    const { error } = await supabase
      .from('company')
      .insert({ name: parsedName.data, created_by_id: user.id })

    if (error) {
      if (error.code === '23505') return { success: false, error: 'Company name must be unique.' }
      console.error('[admin/companies] createCompany error:', error)
      return { success: false, error: 'Failed to create company.' }
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
  const { error } = await supabase.from('company').update({ name: parsedName.data }).eq('id', id)
  if (error) {
    console.error('[admin/companies] updateCompany error:', error)
    return { success: false, error: 'Failed to update company.' }
  }
  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${id}`)
  return { success: true }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const now = new Date().toISOString()

  const { count } = await supabase
    .from('recruiter_access')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', id)
    .or(`is_active.eq.true,and(accepted_at.is.null,revoked_at.is.null,invite_expires_at.is.null),and(accepted_at.is.null,revoked_at.is.null,invite_expires_at.gt.${now})`)

  if ((count ?? 0) > 0) {
    return { success: false, error: 'Cannot delete company with active recruiters or pending invites.' }
  }

  const { error } = await supabase.from('company').delete().eq('id', id)
  if (error) {
    console.error('[admin/companies] deleteCompany error:', error)
    return { success: false, error: 'Failed to delete company.' }
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
  const token = crypto.randomUUID()
  const { error } = await supabase.from('recruiter_access').insert({
    company_id: parsedInvite.data.company_id,
    recruiter_email: parsedInvite.data.recruiter_email,
    granted_by_id: user.id,
    invite_token: token,
    invite_expires_at: getExpiryDate(parsedInvite.data.expiresInDays),
    is_active: false,
  })

  if (error) {
    console.error('[admin/companies] generateInviteToken error:', error)
    return { success: false, error: 'Failed to create invite token.' }
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${parsedInvite.data.company_id}`)
  return { success: true, inviteLink: generateInviteLink(token) }
}

export async function revokeAccess(accessId: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()
  const { error } = await supabase
    .from('recruiter_access')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by_id: user.id,
      is_active: false,
    })
    .eq('id', accessId)

  if (error) {
    console.error('[admin/companies] revokeAccess error:', error)
    return { success: false, error: 'Failed to revoke access.' }
  }
  revalidatePath('/admin/companies')
  return { success: true }
}

export async function resendInvite(accessId: string): Promise<InviteResult> {
  const { supabase } = await requireAdmin()

  const { data: access } = await supabase
    .from('recruiter_access')
    .select('id, company_id, invite_token, accepted_at, revoked_at')
    .eq('id', accessId)
    .maybeSingle()

  if (!access) return { success: false, error: 'Invite not found.' }
  if (access.accepted_at) return { success: false, error: 'Invite already accepted.' }
  if (access.revoked_at) return { success: false, error: 'Invite already revoked.' }

  const token = crypto.randomUUID()
  const { error } = await supabase
    .from('recruiter_access')
    .update({
      invite_token: token,
      invite_expires_at: getExpiryDate(7),
    })
    .eq('id', accessId)

  if (error) {
    console.error('[admin/companies] resendInvite error:', error)
    return { success: false, error: 'Failed to regenerate invite token.' }
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${access.company_id}`)
  return { success: true, inviteLink: generateInviteLink(token) }
}

export async function getCompanyStats(id: string) {
  const { supabase } = await requireAdmin()
  const now = new Date().toISOString()
  const [{ count: active_recruiters }, { count: pending_invites }] = await Promise.all([
    supabase
      .from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', id)
      .eq('is_active', true)
      .is('revoked_at', null),
    supabase
      .from('recruiter_access')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', id)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .or(`invite_expires_at.is.null,invite_expires_at.gt.${now}`),
  ])

  return {
    active_recruiters: active_recruiters ?? 0,
    pending_invites: pending_invites ?? 0,
    totalViews: 0,
    totalDownloads: 0,
  }
}
