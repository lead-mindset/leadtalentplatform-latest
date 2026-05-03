import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.generated'
import type { NewsletterSubscriptionRow } from '@/lib/types'

type ActionResult = { success: true } | { success: false; error: string }
type SubscriptionSource = Database['public']['Enums']['subscription_source']
type NewsletterScope = Database['public']['Enums']['newsletter_scope']

type SubscriptionTarget = {
  userId: string
  scope: NewsletterScope
  chapterId?: string | null
}

type SubscribeParams = {
  userId: string
  source?: SubscriptionSource
}

type SubscribeChapterParams = SubscribeParams & {
  chapterId: string
}

type UnsubscribeParams = SubscriptionTarget

function subscriptionError(error: { message?: string } | null): string {
  return error?.message ?? 'Failed to update newsletter subscription.'
}

function dedupeChapterIds(chapterIds: Array<string | null | undefined>): string[] {
  return Array.from(new Set(chapterIds.filter((id): id is string => Boolean(id))))
}

export const NewsletterSubscriptionService = {
  async subscribeGlobal(
    supabase: SupabaseClient<Database>,
    params: SubscribeParams
  ): Promise<ActionResult> {
    return this.activateSubscription(supabase, {
      userId: params.userId,
      scope: 'global',
      chapterId: null,
      source: params.source ?? 'manual',
    })
  },

  async subscribeToChapter(
    supabase: SupabaseClient<Database>,
    params: SubscribeChapterParams
  ): Promise<ActionResult> {
    return this.activateSubscription(supabase, {
      userId: params.userId,
      scope: 'chapter',
      chapterId: params.chapterId,
      source: params.source ?? 'manual',
    })
  },

  async subscribeToChapters(
    supabase: SupabaseClient<Database>,
    params: SubscribeParams & { chapterIds: string[] }
  ): Promise<ActionResult> {
    for (const chapterId of dedupeChapterIds(params.chapterIds)) {
      const result = await this.subscribeToChapter(supabase, {
        userId: params.userId,
        chapterId,
        source: params.source,
      })

      if (!result.success) return result
    }

    return { success: true }
  },

  async unsubscribe(
    supabase: SupabaseClient<Database>,
    params: UnsubscribeParams
  ): Promise<ActionResult> {
    const now = new Date().toISOString()
    let query = supabase
      .from('newsletter_subscription')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: now,
        updated_at: now,
      })
      .eq('user_id', params.userId)
      .eq('scope', params.scope)

    query =
      params.scope === 'global'
        ? query.is('chapter_id', null)
        : query.eq('chapter_id', params.chapterId ?? '')

    const { error } = await query
    if (error) return { success: false, error: subscriptionError(error) }

    return { success: true }
  },

  async getUserSubscriptions(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<NewsletterSubscriptionRow[]> {
    const { data, error } = await supabase
      .from('newsletter_subscription')
      .select('*')
      .eq('user_id', userId)

    if (error) return []
    return data ?? []
  },

  async getEventChapterIds(
    supabase: SupabaseClient<Database>,
    eventId: string
  ): Promise<string[]> {
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, chapter_id')
      .eq('id', eventId)
      .maybeSingle<{ id: string; chapter_id: string | null }>()

    if (eventError || !event) return []

    const { data: collaborators, error: collaboratorsError } = await supabase
      .from('event_chapter')
      .select('chapter_id')
      .eq('event_id', eventId)

    if (collaboratorsError) {
      return dedupeChapterIds([event.chapter_id])
    }

    return dedupeChapterIds([
      event.chapter_id,
      ...((collaborators ?? []) as Array<{ chapter_id: string | null }>).map((row) => row.chapter_id),
    ])
  },

  async subscribeForEventRegistration(
    supabase: SupabaseClient<Database>,
    params: SubscribeParams & { eventId: string }
  ): Promise<ActionResult> {
    const chapterIds = await this.getEventChapterIds(supabase, params.eventId)
    if (chapterIds.length === 0) return { success: true }

    return this.subscribeToChapters(supabase, {
      userId: params.userId,
      chapterIds,
      source: params.source ?? 'event_registration',
    })
  },

  async activateSubscription(
    supabase: SupabaseClient<Database>,
    params: SubscriptionTarget & { source: SubscriptionSource }
  ): Promise<ActionResult> {
    const now = new Date().toISOString()
    const existing = await this.findSubscription(supabase, params)

    if (existing.error) {
      return { success: false, error: subscriptionError(existing.error) }
    }

    if (existing.data?.id) {
      const { error } = await supabase
        .from('newsletter_subscription')
        .update({
          status: 'active',
          source: params.source,
          subscribed_at: now,
          unsubscribed_at: null,
          updated_at: now,
        })
        .eq('id', existing.data.id)

      if (error) return { success: false, error: subscriptionError(error) }
      return { success: true }
    }

    const { error } = await supabase.from('newsletter_subscription').insert({
      user_id: params.userId,
      scope: params.scope,
      chapter_id: params.scope === 'chapter' ? params.chapterId : null,
      status: 'active',
      source: params.source,
      subscribed_at: now,
      unsubscribed_at: null,
      created_at: now,
      updated_at: now,
    })

    if (error) return { success: false, error: subscriptionError(error) }
    return { success: true }
  },

  async findSubscription(
    supabase: SupabaseClient<Database>,
    params: SubscriptionTarget
  ): Promise<{ data: Pick<NewsletterSubscriptionRow, 'id'> | null; error: { message?: string } | null }> {
    let query = supabase
      .from('newsletter_subscription')
      .select('id')
      .eq('user_id', params.userId)
      .eq('scope', params.scope)

    query =
      params.scope === 'global'
        ? query.is('chapter_id', null)
        : query.eq('chapter_id', params.chapterId ?? '')

    return query.maybeSingle<Pick<NewsletterSubscriptionRow, 'id'>>()
  },
}
