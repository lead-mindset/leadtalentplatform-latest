import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicChapterProfile } from '@/lib/actions/chapters/get-public-chapter-data'
import { Navbar } from '../../_components/navbar'
import { ChapterPortalContent } from './_components/chapter-portal-content'

interface ChapterDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: ChapterDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getPublicChapterProfile(id)

  if (!profile) {
    return { title: 'Chapter Not Found' }
  }

  return {
    title: `${profile.chapter.name} - ${profile.chapter.university}`,
    description: `Discover ${profile.chapter.name} at ${profile.chapter.university}. View upcoming events and connect with the chapter community.`,
  }
}

export default async function ChapterDetailPage({ params }: ChapterDetailPageProps) {
  const { id } = await params
  const profile = await getPublicChapterProfile(id)

  if (!profile) {
    notFound()
  }

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <ChapterPortalContent profile={JSON.parse(JSON.stringify(profile))} />
    </>
  )
}
