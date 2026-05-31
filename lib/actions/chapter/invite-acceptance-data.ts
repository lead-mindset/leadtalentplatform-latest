import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server-service'
import { ChapterInviteService, type ChapterInvite } from '@/lib/services/chapter-invite.service'
import { PersonProfileService } from '@/lib/services/person-profile.service'

type AcceptanceState =
  | { state: 'invalid'; error: string }
  | { state: 'signed_out'; invite: ChapterInvite }
  | { state: 'expired' | 'revoked' | 'accepted'; invite: ChapterInvite }
  | { state: 'email_mismatch'; invite: ChapterInvite; signedInEmail: string }
  | { state: 'profile_required'; invite: ChapterInvite }
  | { state: 'ready'; invite: ChapterInvite }

export async function getChapterInviteAcceptanceState(token: string): Promise<AcceptanceState> {
  const serviceSupabase = createServiceClient()
  const validation = await ChapterInviteService.validateToken(serviceSupabase, token)

  if (!validation.success) {
    return { state: 'invalid', error: validation.error }
  }

  if (validation.state !== 'pending') {
    return { state: validation.state, invite: validation.invite }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  if (!user?.id || !user.email) {
    return { state: 'signed_out', invite: validation.invite }
  }

  if (user.email.toLowerCase() !== validation.invite.email.toLowerCase()) {
    return {
      state: 'email_mismatch',
      invite: validation.invite,
      signedInEmail: user.email,
    }
  }

  const profile = await PersonProfileService.getBasicProfile(supabase, user.id)
  if (!profile) {
    return { state: 'profile_required', invite: validation.invite }
  }

  return { state: 'ready', invite: validation.invite }
}
