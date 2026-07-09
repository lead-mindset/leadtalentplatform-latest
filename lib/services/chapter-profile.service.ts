import { logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'

export type PublicChapterProfileEvent = {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  location: string | null
  location_name: string | null
  location_city: string | null
  cover_image: string | null
  event_type: Database['public']['Enums']['EventType']
  capacity: number | null
  registration_count: number
}

export type PublicChapterProfileMember = {
  user_id: string
  name: string
  major_or_interest: string | null
  chapter_position: string | null
  member_id: string | null
}

export type PublicChapterProfile = {
  chapter: {
    id: string
    name: string
    university: string
    city: string | null
    region: string | null
    instagram_url: string | null
    latitude: number | null
    longitude: number | null
  }
  events: PublicChapterProfileEvent[]
  teamPreview: PublicChapterProfileMember[]
  stats: {
    approvedMemberCount: number
    upcomingEventsCount: number
    pastEventsCount: number
  }
  emptyStates: {
    hasUpcomingEvents: boolean
    hasTeamPreview: boolean
  }
}

export type PublicChapterDirectoryItem = {
  id: string
  name: string
  university: string
  city: string | null
  region: string | null
  instagram_url: string | null
  approvedMemberCount: number
  upcomingEventsCount: number
  hasLocation: boolean
  hasActivity: boolean
}

export type PublicChapterDirectory = {
  chapters: PublicChapterDirectoryItem[]
  stats: {
    totalChapters: number
    totalApprovedMembers: number
    totalUpcomingEvents: number
  }
  emptyStates: {
    hasChapters: boolean
  }
}

type ChapterRow = Database['public']['Tables']['chapter']['Row']

type EventRow = Pick<
  Database['public']['Tables']['event']['Row'],
  | 'id'
  | 'title'
  | 'description'
  | 'start_at'
  | 'end_at'
  | 'location'
  | 'location_name'
  | 'location_city'
  | 'cover_image'
  | 'event_type'
  | 'capacity'
> & {
  event_registration?: { count: number }[] | null
}

type MembershipRow = {
  user_id: string
  member_id: string | null
  position: string | null
}

type ProfileRow = {
  user_id: string
  major_or_interest: string | null
}

type UserRow = {
  id: string
  name: string | null
}

const CHAPTER_SELECT = 'id, name, university, city, region, instagram_url, latitude, longitude'
const EVENT_SELECT = `
  id,
  title,
  description,
  start_at,
  end_at,
  location,
  location_name,
  location_city,
  cover_image,
  event_type,
  capacity,
  event_registration(count)
`

function getMemberName(user: UserRow | undefined): string {
  return user?.name?.trim() || 'LEAD member'
}

function mapEvent(event: EventRow): PublicChapterProfileEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start_at: event.start_at,
    end_at: event.end_at,
    location: event.location,
    location_name: event.location_name,
    location_city: event.location_city,
    cover_image: event.cover_image,
    event_type: event.event_type,
    capacity: event.capacity,
    registration_count: event.event_registration?.[0]?.count ?? 0,
  }
}

function mapChapter(chapter: ChapterRow): PublicChapterProfile['chapter'] {
  return {
    id: chapter.id,
    name: chapter.name,
    university: chapter.university,
    city: chapter.city,
    region: chapter.region,
    instagram_url: chapter.instagram_url,
    latitude: chapter.latitude,
    longitude: chapter.longitude,
  }
}

function countByChapterId(rows: Array<{ chapter_id: string | null }>): Map<string, number> {
  const counts = new Map<string, number>()

  for (const row of rows) {
    if (!row.chapter_id) continue
    counts.set(row.chapter_id, (counts.get(row.chapter_id) ?? 0) + 1)
  }

  return counts
}

export const ChapterProfileService = {
  async getPublicChapterDirectory(
    supabase: SupabaseClient<Database>
  ): Promise<PublicChapterDirectory> {
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapter')
      .select('id, name, university, city, region, instagram_url')
      .order('name', { ascending: true })

    if (chaptersError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterDirectory.chapters', error: chaptersError }, 'Error')
      return {
        chapters: [],
        stats: {
          totalChapters: 0,
          totalApprovedMembers: 0,
          totalUpcomingEvents: 0,
        },
        emptyStates: {
          hasChapters: false,
        },
      }
    }

    const chapterRows = (chapters ?? []) as Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region' | 'instagram_url'>[]
    const chapterIds = chapterRows.map((chapter) => chapter.id)

    if (chapterIds.length === 0) {
      return {
        chapters: [],
        stats: {
          totalChapters: 0,
          totalApprovedMembers: 0,
          totalUpcomingEvents: 0,
        },
        emptyStates: {
          hasChapters: false,
        },
      }
    }

    const now = new Date().toISOString()
    const [membershipsResult, eventsResult] = await Promise.all([
      supabase
        .from('chapter_membership')
        .select('chapter_id')
        .eq('status', 'approved')
        .in('chapter_id', chapterIds),
      supabase
        .from('event')
        .select('chapter_id')
        .eq('is_published', true)
        .gte('start_at', now)
        .in('chapter_id', chapterIds),
    ])

    if (membershipsResult.error) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterDirectory.memberships', error: membershipsResult.error }, 'Error')
    }

    if (eventsResult.error) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterDirectory.events', error: eventsResult.error }, 'Error')
    }

    const approvedMemberCounts = countByChapterId(
      (membershipsResult.data ?? []) as Array<{ chapter_id: string | null }>
    )
    const upcomingEventCounts = countByChapterId(
      (eventsResult.data ?? []) as Array<{ chapter_id: string | null }>
    )

    const directoryChapters = chapterRows.map((chapter) => {
      const approvedMemberCount = approvedMemberCounts.get(chapter.id) ?? 0
      const upcomingEventsCount = upcomingEventCounts.get(chapter.id) ?? 0

      return {
        id: chapter.id,
        name: chapter.name,
        university: chapter.university,
        city: chapter.city,
        region: chapter.region,
        instagram_url: chapter.instagram_url,
        approvedMemberCount,
        upcomingEventsCount,
        hasLocation: Boolean(chapter.city || chapter.region),
        hasActivity: approvedMemberCount > 0 || upcomingEventsCount > 0,
      }
    })

    return {
      chapters: directoryChapters,
      stats: {
        totalChapters: directoryChapters.length,
        totalApprovedMembers: directoryChapters.reduce(
          (total, chapter) => total + chapter.approvedMemberCount,
          0
        ),
        totalUpcomingEvents: directoryChapters.reduce(
          (total, chapter) => total + chapter.upcomingEventsCount,
          0
        ),
      },
      emptyStates: {
        hasChapters: directoryChapters.length > 0,
      },
    }
  },

  async getPublicChapterProfile(
    supabase: SupabaseClient<Database>,
    chapterId: string
  ): Promise<PublicChapterProfile | null> {
    const { data: chapter, error: chapterError } = await supabase
      .from('chapter')
      .select(CHAPTER_SELECT)
      .eq('id', chapterId)
      .maybeSingle()

    if (chapterError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.chapter', error: chapterError }, 'Error')
      return null
    }

    if (!chapter) return null

    const now = new Date().toISOString()

    const { data: events, error: eventsError } = await supabase
      .from('event')
      .select(EVENT_SELECT)
      .eq('chapter_id', chapter.id)
      .eq('is_published', true)
      .gte('start_at', now)
      .order('start_at', { ascending: true })
      .limit(6)

    if (eventsError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.events', error: eventsError }, 'Error')
    }

    const { count: approvedMemberCount, error: memberCountError } = await supabase
      .from('chapter_membership')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id)
      .eq('status', 'approved')

    if (memberCountError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.memberCount', error: memberCountError }, 'Error')
    }

    const { count: pastEventsCount, error: pastEventsError } = await supabase
      .from('event')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id)
      .eq('is_published', true)
      .lt('end_at', now)

    if (pastEventsError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.pastEvents', error: pastEventsError }, 'Error')
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('chapter_membership')
      .select(`
        user_id,
        member_id,
        position
      `)
      .eq('chapter_id', chapter.id)
      .eq('status', 'approved')
      .limit(8)

    if (membershipsError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.memberships', error: membershipsError }, 'Error')
    }

    const membershipRows = (memberships ?? []) as unknown as MembershipRow[]
    const memberUserIds = membershipRows.map((member) => member.user_id)
    const [{ data: profiles, error: profilesError }, { data: users, error: usersError }] = memberUserIds.length > 0
      ? await Promise.all([
          supabase
            .from('person_profile')
            .select('user_id, major_or_interest')
            .in('user_id', memberUserIds),
          supabase
            .from('user')
            .select('id, name')
            .in('id', memberUserIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }]

    if (profilesError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.profiles', error: profilesError }, 'Error')
    }

    if (usersError) {
      logger.error({ context: 'ChapterProfileService.getPublicChapterProfile.users', error: usersError }, 'Error')
    }

    const profileByUserId = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.user_id, profile])
    )
    const userById = new Map(
      ((users ?? []) as UserRow[]).map((user) => [user.id, user])
    )

    const teamPreview = membershipRows.map((member) => ({
      user_id: member.user_id,
      name: getMemberName(userById.get(member.user_id)),
      major_or_interest: profileByUserId.get(member.user_id)?.major_or_interest ?? null,
      chapter_position: member.position,
      member_id: member.member_id,
    }))

    const publicEvents = ((events ?? []) as unknown as EventRow[]).map(mapEvent)

    return {
      chapter: mapChapter(chapter as ChapterRow),
      events: publicEvents,
      teamPreview,
      stats: {
        approvedMemberCount: approvedMemberCount ?? 0,
        upcomingEventsCount: publicEvents.length,
        pastEventsCount: pastEventsCount ?? 0,
      },
      emptyStates: {
        hasUpcomingEvents: publicEvents.length > 0,
        hasTeamPreview: teamPreview.length > 0,
      },
    }
  },
}
