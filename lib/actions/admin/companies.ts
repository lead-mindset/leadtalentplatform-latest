'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import type { CompanyRow, RecruiterAccessRow, UserRow } from '@/lib/types'

export type CompanySortKey = 'name' | 'createdat' | 'activeRecruiters' | 'pendingInvites'
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
  createdat: string
  createdByName: string | null
  activeRecruiters: number
  pendingInvites: number
}

export type CompanyDetail = {
  id: string
  name: string
  createdat: string
  createdByName: string | null
  recruiters: {
    id: string
    recruiterEmail: string
    isActive: boolean
    inviteToken: string
    inviteExpiresAt: string | null
    acceptedAt: string | null
    acceptedByUserId: string | null
    revokedAt: string | null
    grantedAt: string
  }[]
}

type ActionResult = { success: true } | { success: false; error: string }
type InviteResult = ActionResult & { inviteLink?: string }

type CompanyListRow = Pick<CompanyRow, 'id' | 'name' | 'createdat' | 'createdbyid'> & {
  CreatedBy: Pick<UserRow, 'name'> | Pick<UserRow, 'name'>[] | null
}
type CompanyAccessRow = Pick<
  RecruiterAccessRow,
  'id' | 'companyId' | 'isActive' | 'acceptedAt' | 'revokedAt' | 'inviteExpiresAt'
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
      case 'activeRecruiters':
        return (a.activeRecruiters - b.activeRecruiters) * direction
      case 'pendingInvites':
        return (a.pendingInvites - b.pendingInvites) * direction
      case 'createdat':
      default:
        return (new Date(a.createdat).getTime() - new Date(b.createdat).getTime()) * direction
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
    .from('Company')
    .select('id, name, createdat, createdbyid, CreatedBy:User!Company_createdbyid_fkey(name)')

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
    .from('RecruiterAccess')
    .select('id, companyId, isActive, acceptedAt, revokedAt, inviteExpiresAt')
    .in('companyId', ids)

  const recruiterAccessRows = (accessRows ?? []) as CompanyAccessRow[]

  const rows: CompanyListItem[] = companyRows.map((company: CompanyListRow) => {
    const companyAccess = recruiterAccessRows.filter((row: CompanyAccessRow) => row.companyId === company.id)
    const activeRecruiters = companyAccess.filter((row: CompanyAccessRow) => row.isActive && !row.revokedAt).length
    const pendingInvites = companyAccess.filter(
      (row: CompanyAccessRow) =>
        !row.acceptedAt &&
        !row.revokedAt &&
        (row.inviteExpiresAt === null || row.inviteExpiresAt > now)
    ).length

    const createdBy = Array.isArray(company.CreatedBy) ? company.CreatedBy[0] : company.CreatedBy
    return {
      id: company.id,
      name: company.name,
      createdat: company.createdat,
      createdByName: createdBy?.name ?? null,
      activeRecruiters,
      pendingInvites,
    }
  })

  const sortBy = pagination.sortBy ?? 'createdat'
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
    .from('Company')
    .select('id, name, createdat, createdbyid, CreatedBy:User!Company_createdbyid_fkey(name)')
    .eq('id', id)
    .maybeSingle()

  if (error || !company) {
    console.error('[admin/companies] getCompanyById company error:', error)
    return null
  }

  const { data: recruiters, error: recruitersError } = await supabase
    .from('RecruiterAccess')
    .select('id, recruiterEmail, isActive, inviteToken, inviteExpiresAt, acceptedAt, acceptedByUserId, revokedAt, grantedAt')
    .eq('companyId', id)
    .order('grantedAt', { ascending: false })

  if (recruitersError) {
    console.error('[admin/companies] getCompanyById recruiters error:', recruitersError)
  }

  const createdBy = Array.isArray(company.CreatedBy) ? company.CreatedBy[0] : company.CreatedBy
  return {
    id: company.id,
    name: company.name,
    createdat: company.createdat,
    createdByName: createdBy?.name ?? null,
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
      .from('Company')
      .insert({ name: parsedName.data, createdbyid: user.id })

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
  const { error } = await supabase.from('Company').update({ name: parsedName.data }).eq('id', id)
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
    .from('RecruiterAccess')
    .select('id', { count: 'exact', head: true })
    .eq('companyId', id)
    .or(`isActive.eq.true,and(acceptedAt.is.null,revokedAt.is.null,inviteExpiresAt.is.null),and(acceptedAt.is.null,revokedAt.is.null,inviteExpiresAt.gt.${now})`)

  if ((count ?? 0) > 0) {
    return { success: false, error: 'Cannot delete company with active recruiters or pending invites.' }
  }

  const { error } = await supabase.from('Company').delete().eq('id', id)
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
  const { error } = await supabase.from('RecruiterAccess').insert({
    companyId: parsedInvite.data.companyId,
    recruiterEmail: parsedInvite.data.recruiterEmail,
    grantedById: user.id,
    inviteToken: token,
    inviteExpiresAt: getExpiryDate(parsedInvite.data.expiresInDays),
    isActive: false,
  })

  if (error) {
    console.error('[admin/companies] generateInviteToken error:', error)
    return { success: false, error: 'Failed to create invite token.' }
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${parsedInvite.data.companyId}`)
  return { success: true, inviteLink: generateInviteLink(token) }
}

export async function revokeAccess(accessId: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin()
  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      revokedAt: new Date().toISOString(),
      revokedById: user.id,
      isActive: false,
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
    .from('RecruiterAccess')
    .select('id, companyId, inviteToken, acceptedAt, revokedAt')
    .eq('id', accessId)
    .maybeSingle()

  if (!access) return { success: false, error: 'Invite not found.' }
  if (access.acceptedAt) return { success: false, error: 'Invite already accepted.' }
  if (access.revokedAt) return { success: false, error: 'Invite already revoked.' }

  const token = crypto.randomUUID()
  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      inviteToken: token,
      inviteExpiresAt: getExpiryDate(7),
    })
    .eq('id', accessId)

  if (error) {
    console.error('[admin/companies] resendInvite error:', error)
    return { success: false, error: 'Failed to regenerate invite token.' }
  }

  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${access.companyId}`)
  return { success: true, inviteLink: generateInviteLink(token) }
}

export async function getCompanyStats(id: string) {
  const { supabase } = await requireAdmin()
  const now = new Date().toISOString()
  const [{ count: activeRecruiters }, { count: pendingInvites }] = await Promise.all([
    supabase
      .from('RecruiterAccess')
      .select('id', { count: 'exact', head: true })
      .eq('companyId', id)
      .eq('isActive', true)
      .is('revokedAt', null),
    supabase
      .from('RecruiterAccess')
      .select('id', { count: 'exact', head: true })
      .eq('companyId', id)
      .is('acceptedAt', null)
      .is('revokedAt', null)
      .or(`inviteExpiresAt.is.null,inviteExpiresAt.gt.${now}`),
  ])

  return {
    activeRecruiters: activeRecruiters ?? 0,
    pendingInvites: pendingInvites ?? 0,
    totalViews: 0,
    totalDownloads: 0,
  }
}
