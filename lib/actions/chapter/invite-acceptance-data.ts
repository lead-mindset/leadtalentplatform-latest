import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server-service'
import { ChapterInviteService, type ChapterInvite } from '@/lib/services/chapter-invite.service'
import { ChapterService } from '@/lib/services/chapter.service'
import { PersonProfileService } from '@/lib/services/person-profile.service'

type AcceptanceState =
  | { state: 'invalid'; error: string }
  | { state: 'signed_out'; invite: ChapterInvite; chapterName: string }
  | { state: 'expired' | 'revoked' | 'accepted'; invite: ChapterInvite; chapterName: string }
  | { state: 'email_mismatch'; invite: ChapterInvite; chapterName: string; signedInEmail: string }
  | { state: 'profile_required'; invite: ChapterInvite; chapterName: string }
  | { state: 'ready'; invite: ChapterInvite; chapterName: string }

async function getChapterName(chapterId: string) {
  const chapterName = await ChapterService.getChapterName(createServiceClient(), chapterId)
  return chapterName ?? chapterId
}

export async function getChapterInviteAcceptanceState(token: string): Promise<AcceptanceState> {
  const serviceSupabase = createServiceClient()
  const validation = await ChapterInviteService.validateToken(serviceSupabase, token)

  if (!validation.success) {
    return { state: 'invalid', error: validation.error }
  }

  const chapterName = await getChapterName(validation.invite.chapter_id)

  if (validation.state !== 'pending') {
    return { state: validation.state, invite: validation.invite, chapterName }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  if (!user?.id || !user.email) {
    return { state: 'signed_out', invite: validation.invite, chapterName }
  }

  if (user.email.toLowerCase() !== validation.invite.email.toLowerCase()) {
    return {
      state: 'email_mismatch',
      invite: validation.invite,
      chapterName,
      signedInEmail: user.email,
    }
  }

  const profile = await PersonProfileService.getBasicProfile(supabase, user.id)
  if (!profile) {
    return { state: 'profile_required', invite: validation.invite, chapterName }
  }

  return { state: 'ready', invite: validation.invite, chapterName }
}
