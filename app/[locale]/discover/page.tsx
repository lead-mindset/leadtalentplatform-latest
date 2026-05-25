import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { DiscoverClient } from "./discover-client"
import { Navbar } from "../(public)/_components/navbar"

export const metadata = {
  title: "Discover LEAD",
  description: "Explore LEAD opportunities, events, chapters, and countries.",
}

interface DiscoverPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ 
    city?: string
    category?: string
    date?: string
  }>
}

export default async function DiscoverPage({
  params,
  searchParams,
}: DiscoverPageProps) {
  const { locale } = await params
  const { city } = await searchParams
  const supabase = await createClient()

  // Fetch upcoming events, filtered by city if provided.
  const today = new Date().toISOString()
  const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()

  let eventsQuery = supabase
    .from("event")
    .select(`
      id,
      title,
      description,
      start_at,
      end_at,
      location_name,
      location_city,
      cover_image,
      event_type,
      chapter(name)
    `)
    .eq("is_published", true)
    .gte("start_at", today)
    .lte("start_at", sixMonthsLater)
    .not("title", "ilike", "QA %")
    .order("start_at", { ascending: true })
    .limit(12)

  if (city) {
    eventsQuery = eventsQuery.eq("location_city", city)
  }

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError) {
    console.error("Error fetching events:", eventsError)
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapter")
    .select(`
      id,
      name,
      city,
      region,
      university
    `)
    .order("name")
    .limit(24)

  if (chaptersError) {
    console.error("Error fetching chapters:", chaptersError)
  }

  // Fetch cities with event counts
  const { data: cities, error: citiesError } = await supabase
    .from("event")
    .select("location_city, location_region")
    .not("location_city", "is", null)
    .eq("is_published", true)
    .gte("start_at", today)
    .not("title", "ilike", "QA %")

  if (citiesError) {
    console.error("Error fetching cities:", citiesError)
  }

  // Aggregate city counts
  const cityCounts = cities?.reduce((acc, event) => {
    const city = event.location_city
    if (city) {
      acc[city] = (acc[city] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>) || {}

  const citiesList = Object.entries(cityCounts)
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      eventCount: count,
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 24)

  const chapterRows = chapters || []
  const peruChapterCount = chapterRows.filter((chapter) => {
    const values = [chapter.city, chapter.region, chapter.university, chapter.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return (
      values.includes("lima") ||
      values.includes("peru") ||
      values.includes("peruana") ||
      values.includes("nacional") ||
      values.includes("arequipa") ||
      values.includes("trujillo")
    )
  }).length

  const countries = [
    {
      id: "peru",
      name: "LEAD Peru",
      chapterCount: peruChapterCount || chapterRows.length,
      eventCount: citiesList.reduce((count, city) => count + city.eventCount, 0),
      status: "active" as const,
    },
    {
      id: "colombia",
      name: "LEAD Colombia",
      chapterCount: 0,
      eventCount: 0,
      status: "growing" as const,
    },
    {
      id: "ecuador",
      name: "LEAD Ecuador",
      chapterCount: 0,
      eventCount: 0,
      status: "growing" as const,
    },
  ]

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <DiscoverClient
        locale={locale}
        initialEvents={(events || []).map(e => {
          const chapter = e.chapter as { name?: string } | { name?: string }[] | null

          return {
            id: e.id,
            title: e.title,
            description: e.description || "",
            start_at: e.start_at,
            end_at: e.end_at,
            location_name: e.location_name,
            location_city: e.location_city,
            cover_image_url: e.cover_image,
            event_type: e.event_type,
            chapterName: Array.isArray(chapter) ? chapter[0]?.name || "" : chapter?.name || "",
          }
        })}
        chapters={chapterRows.map(c => ({
          id: c.id,
          name: c.name,
          city: c.city,
          region: c.region,
          university: c.university,
        }))}
        countries={countries}
      />
    </>
  )
}
