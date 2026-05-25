import type { SupabaseClient } from '@supabase/supabase-js'
import { resolvePostAuthRedirectPath } from '@/lib/auth-redirects'
import type { Database } from '@/lib/database.generated'

export type ResolvePostLoginRedirectResult =
  | { success: true; path: string }
  | { success: false; error: string; path?: string }

const LOGIN_REDIRECT_ERROR = 'We could not load your account destination. Please try signing in again.'

export const AuthRedirectService = {
  async resolvePostLoginRedirect(
    supabase: SupabaseClient<Database>
  ): Promise<ResolvePostLoginRedirectResult> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: LOGIN_REDIRECT_ERROR,
        path: '/auth/login',
      }
    }

    const [{ data: userData, error: userError }, { data: profile, error: profileError }] =
      await Promise.all([
        supabase.from('user').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('person_profile').select('user_id').eq('user_id', user.id).maybeSingle(),
      ])

    if (userError || profileError || !userData?.role) {
      return {
        success: false,
        error: LOGIN_REDIRECT_ERROR,
      }
    }

    const path = await resolvePostAuthRedirectPath(supabase, {
      userId: user.id,
      hasProfile: Boolean(profile),
      role: userData.role,
    })

    return { success: true, path }
  },
}
