import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'

export type BasicProfile = {
  userId: string
  email: string
  fullName: string
  phone: string | null
  leadId: string | null
  university: string | null
  majorOrInterest: string | null
  graduationYear: number | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  skills: string[]
  gender: string | null
  isRecruiterVisible: boolean
}

export type UpsertBasicProfileParams = {
  userId: string
  email: string
  fullName: string
  phone?: string | null
  university: string
  majorOrInterest?: string | null
  graduationYear?: number | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  skills?: string[]
  gender?: string | null
  isRecruiterVisible?: boolean
}

export type BasicProfileActionData = {
  id: string
  lead_id: string | null
}

export type ProfileActionResult =
  | { success: true; data: BasicProfileActionData }
  | { success: false; error: string }

const PROFILE_SELECT = `
  user_id,
  lead_id,
  university,
  major_or_interest,
  graduation_year,
  linkedin_url,
  portfolio_url,
  skills,
  gender,
  is_recruiter_visible
`

export type IssueLeadIdResult =
  | { success: true; data: string }
  | { success: false; error: string }

export const PersonProfileService = {
  async getBasicProfile(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<BasicProfile | null> {
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, email, name, phone')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) return null

    const { data: profile, error: profileError } = await supabase
      .from('person_profile')
      .select(PROFILE_SELECT)
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) return null

    return {
      userId: profile.user_id,
      email: user.email,
      fullName: user.name ?? '',
      phone: user.phone,
      leadId: profile.lead_id,
      university: profile.university,
      majorOrInterest: profile.major_or_interest,
      graduationYear: profile.graduation_year,
      linkedinUrl: profile.linkedin_url,
      portfolioUrl: profile.portfolio_url,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      gender: profile.gender,
      isRecruiterVisible: profile.is_recruiter_visible ?? false,
    }
  },

  async upsertBasicProfile(
    supabase: SupabaseClient<Database>,
    params: UpsertBasicProfileParams
  ): Promise<ProfileActionResult> {
    const now = new Date().toISOString()

    const { error: userError } = await supabase
      .from('user')
      .upsert(
        {
          id: params.userId,
          email: params.email,
          name: params.fullName,
          phone: params.phone ?? null,
          updated_at: now,
        },
        { onConflict: 'id' }
      )
      .eq('id', params.userId)

    if (userError) {
      return { success: false, error: userError.message }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('person_profile')
      .upsert(
        {
          user_id: params.userId,
          university: params.university,
          major_or_interest: params.majorOrInterest ?? null,
          graduation_year: params.graduationYear ?? null,
          linkedin_url: params.linkedinUrl ?? null,
          portfolio_url: params.portfolioUrl ?? null,
          skills: params.skills ?? [],
          gender: params.gender ?? null,
          is_recruiter_visible: params.isRecruiterVisible ?? false,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )
      .select('id, lead_id')
      .single()

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    return {
      success: true,
      data: { id: profileData.id, lead_id: profileData.lead_id },
    }
  },

  async issueLeadId(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<IssueLeadIdResult> {
    const { data: profile, error: profileError } = await supabase
      .from('person_profile')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: profileError?.message ?? 'Profile not found' }
    }

    const { data, error } = await supabase.rpc('issue_lead_id', {
      p_person_id: profile.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as string }
  },
}
