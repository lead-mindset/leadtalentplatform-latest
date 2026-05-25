'use server'

import { AuthRedirectService } from '@/lib/services/auth-redirect.service'
import { createClient } from '@/lib/supabase/server'
import type { ResolvePostLoginRedirectResult } from '@/lib/services/auth-redirect.service'

export async function resolvePostLoginRedirect(): Promise<ResolvePostLoginRedirectResult> {
  const supabase = await createClient()
  return AuthRedirectService.resolvePostLoginRedirect(supabase)
}
