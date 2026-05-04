import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '../../(public)/_components/navbar'
import { ChapterPortalContent } from './_components/chapter-portal-content'
import type { Metadata } from 'next'

interface ChapterDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: ChapterDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapter')
    .select('name, university, city')
    .eq('id', id)
    .maybeSingle()

  if (!chapter) {
    return { title: 'Chapter Not Found' }
  }

  return {
    title: `${chapter.name} — ${chapter.university}`,
    description: `Discover ${chapter.name} at ${chapter.university}. View upcoming events, meet the team, and join the community.`,
  }
}

export default async function ChapterDetailPage({ params }: ChapterDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // ── Fetch chapter data ──
  const { data: chapter, error: chapterError } = await supabase
    .from('chapter')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (chapterError || !chapter) {
    notFound()
  }

  // ── Fetch upcoming events for this chapter ──
  const now = new Date().toISOString()
  const { data: events } = await supabase
    .from('event')
    .select(`
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
    `)
    .eq('chapter_id', chapter.id)
    .eq('is_published', true)
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(6)

  // ── Fetch chapter members (e-board / approved) ──
  const { data: memberships } = await supabase
    .from('chapter_membership')
    .select(`
      user_id,
      member_id,
      user:user_id ( name, email )
    `)
    .eq('chapter_id', chapter.id)
    .eq('status', 'approved')
    .limit(50)

  const membershipRows = memberships ?? []
  const memberUserIds = membershipRows.map((member) => member.user_id)
  const { data: profiles } = memberUserIds.length > 0
    ? await supabase
        .from('person_profile')
        .select('user_id, major_or_interest')
        .in('user_id', memberUserIds)
    : { data: [] }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile])
  )

  const members = membershipRows.map((member) => ({
    ...member,
    major: profileByUserId.get(member.user_id)?.major_or_interest ?? 'Member',
  }))

  // ── Fetch member count ──
  const { count: member_count } = await supabase
    .from('chapter_membership')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter.id)
    .eq('status', 'approved')

  // ── Fetch past events count ──
  const { count: pastEventsCount } = await supabase
    .from('event')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter.id)
    .eq('is_published', true)
    .lt('end_at', now)

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <ChapterPortalContent
        chapter={JSON.parse(JSON.stringify(chapter))}
        events={JSON.parse(JSON.stringify(events || []))}
        members={JSON.parse(JSON.stringify(members))}
        member_count={member_count ?? 0}
        pastEventsCount={pastEventsCount ?? 0}
      />
    </>
  )
}
