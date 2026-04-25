import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DiscoverClient } from "./discover-client"

export const metadata = {
  title: "Discover Events",
  description: "Discover popular events in your city and featured calendars from the community.",
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
  const { city, category } = await searchParams
  const supabase = await createClient()

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch popular events (next 30 days, filtered by city if provided)
  const today = new Date().toISOString()
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

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
      slug,
      chapter!inner(name, slug)
    `)
    .eq("is_published", true)
    .gte("start_at", today)
    .lte("start_at", thirtyDaysLater)
    .order("start_at", { ascending: true })
    .limit(12)

  if (city) {
    eventsQuery = eventsQuery.eq("location_city", city)
  }

  // Category filtering removed - categories table does not exist in schema

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError) {
    console.error("Error fetching events:", eventsError)
  }

  // Categories table does not exist in schema - returning empty array

  // Fetch featured calendars (using chapter table)
  const { data: calendars, error: calendarsError } = await supabase
    .from("chapter")
    .select(`
      id,
      name,
      slug,
      city,
      event(count)
    `)
    .order("name")
    .limit(10)

  if (calendarsError) {
    console.error("Error fetching calendars:", calendarsError)
  }

  // Fetch cities with event counts
  const { data: cities, error: citiesError } = await supabase
    .from("event")
    .select("location_city, location_region")
    .not("location_city", "is", null)
    .eq("is_published", true)
    .gte("start_at", today)

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

  return (
    <DiscoverClient
      locale={locale}
      initialEvents={(events || []).map(e => ({
        id: e.id,
        title: e.title,
        description: e.description || "",
        start_at: e.start_at,
        end_at: e.end_at,
        location_name: e.location_name,
        location_city: e.location_city,
        cover_image_url: e.cover_image,
        event_type: e.event_type,
        slug: e.slug,
        chapters: e.chapter?.[0] || { name: "", slug: "" },
      }))}
      categories={[]}
      calendars={(calendars || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: "",
        avatarUrl: null,
        location: c.city,
        isSubscribed: false,
      }))}
      cities={citiesList}
      currentCity={city}
      currentCategory={category}
      user={user}
    />
  )
}
