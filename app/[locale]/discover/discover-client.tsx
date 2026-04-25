"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { MapPin, Compass, Users, Sparkles } from "lucide-react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCardHorizontal } from "@/components/events/event-card-horizontal"
import { CategoryCard } from "@/components/events/category-card"
import { CalendarRow } from "@/components/events/calendar-row"
import { CityCard } from "@/components/events/city-card"
import { DiscoverSectionHeader } from "@/components/events/discover-section-header"
import { MobileFilters } from "@/components/events/mobile-filters"
import { cn } from "@/lib/utils"
import { MainContainer } from "@/components/global/main-container"

interface Event {
  id: string
  title: string
  description: string
  start_at: string
  end_at: string | null
  location_name: string | null
  location_city: string | null
  cover_image_url: string | null
  event_type: "in_person" | "online" | "hybrid"
  slug: string
  chapters: { name: string; slug: string }
  event_categories?: { categories: { name: string; slug: string } }[]
}

interface Category {
  id: string
  name: string
  slug: string
  iconUrl: string | null
  eventCount: number
}

interface Calendar {
  id: string
  name: string
  slug: string
  description: string
  avatarUrl: string | null
  location: string | null
  isSubscribed: boolean
}

interface City {
  name: string
  slug: string
  eventCount: number
}

interface DiscoverClientProps {
  locale: string
  initialEvents: Event[]
  categories: Category[]
  calendars: Calendar[]
  cities: City[]
  currentCity?: string
  currentCategory?: string
  user: User | null
}

// Region groupings for city tabs
const regions = {
  "North America": ["New York", "San Francisco", "Los Angeles", "Chicago", "Toronto", "Vancouver", "Washington, DC", "Boston", "Seattle", "Miami", "Austin", "Denver", "Atlanta"],
  "Latin America": ["Mexico City", "São Paulo", "Buenos Aires", "Lima", "Bogotá", "Santiago"],
  "Europe": ["London", "Paris", "Berlin", "Amsterdam", "Barcelona", "Madrid", "Lisbon", "Rome", "Vienna"],
  "Asia Pacific": ["Tokyo", "Singapore", "Sydney", "Melbourne", "Hong Kong", "Seoul", "Bangkok"],
}

export function DiscoverClient({
  locale,
  initialEvents,
  categories,
  calendars,
  cities,
  currentCity,
  currentCategory,
  user,
}: DiscoverClientProps) {
  const [selectedCity, setSelectedCity] = useState(currentCity || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    format: currentCategory ? [currentCategory] : [],
    date: [],
  })

  // Filter events based on search and filters
  const filteredEvents = initialEvents.filter((event) => {
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFormat = activeFilters.format.length === 0 || 
      activeFilters.format.includes(event.event_type)

    return matchesSearch && matchesFormat
  })

  const handleFilterChange = useCallback((groupId: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [groupId]: values,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setActiveFilters({
      format: [],
      date: [],
    })
  }, [])

  const handleSubscribe = async (calendarId: string) => {
    // TODO: Implement subscription logic
    console.log("Subscribe to calendar:", calendarId)
  }

  // Group cities by region
  const citiesByRegion = Object.entries(regions).map(([region, cityNames]) => ({
    region,
    cities: cities.filter((c) => cityNames.includes(c.name)),
  }))

  const filterGroups = [
    {
      id: "format",
      label: "Event Format",
      options: [
        { value: "in_person", label: "In Person", count: 156 },
        { value: "online", label: "Online", count: 89 },
        { value: "hybrid", label: "Hybrid", count: 34 },
      ],
    },
    {
      id: "date",
      label: "Date",
      options: [
        { value: "today", label: "Today", count: 12 },
        { value: "tomorrow", label: "Tomorrow", count: 18 },
        { value: "week", label: "This Week", count: 45 },
        { value: "weekend", label: "This Weekend", count: 23 },
        { value: "month", label: "This Month", count: 89 },
      ],
    },
  ]

  return (
    <MainContainer className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Discover amazing events</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Discover Events
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore popular events near you, browse by category, or check out featured calendars from the community.
            </p>

            {/* Search + Location Bar */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-4 pr-4 text-base"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="h-12 w-[180px]">
                    <MapPin className="mr-2 h-4 w-4 shrink-0" />
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cities</SelectItem>
                    {cities.slice(0, 10).map((city) => (
                      <SelectItem key={city.slug} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mobile Filters */}
                <MobileFilters
                  filterGroups={filterGroups}
                  activeFilters={activeFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  className="sm:hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left Column - Main Content */}
          <div className="space-y-12">
            {/* Popular Events Section */}
            <section>
              <DiscoverSectionHeader
                title={`Popular Events ${selectedCity ? `· ${selectedCity}` : ""}`}
                actionLabel="View All"
                actionHref={`/events?city=${selectedCity}`}
                className="mb-6"
              />

              {filteredEvents.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredEvents.slice(0, 6).map((event) => (
                    <EventCardHorizontal
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      startAt={new Date(event.start_at)}
                      locationName={event.location_name}
                      locationCity={event.location_city}
                      coverImage={event.cover_image_url}
                      category={event.event_categories?.[0]?.categories?.name}
                      isPast={new Date(event.start_at) < new Date()}
                      href={`/${locale}/events/${event.slug}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Compass className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No events found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your filters or search for something else.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("")
                      handleClearFilters()
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </section>

            {/* Browse by Category */}
            <section>
              <DiscoverSectionHeader
                title="Browse by Category"
                className="mb-6"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {categories.slice(0, 8).map((category) => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    slug={category.slug}
                    eventCount={category.eventCount}
                    iconUrl={category.iconUrl || undefined}
                  />
                ))}
              </div>
            </section>

            {/* Explore Local Events - City Tabs */}
            <section>
              <DiscoverSectionHeader
                title="Explore Local Events"
                className="mb-6"
              />
              <Tabs defaultValue="North America" className="w-full">
                <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                  {citiesByRegion.map(({ region }) => (
                    <TabsTrigger key={region} value={region} className="text-sm">
                      {region}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {citiesByRegion.map(({ region, cities: regionCities }) => (
                  <TabsContent key={region} value={region}>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {regionCities.length > 0 ? (
                        regionCities.map((city) => (
                          <CityCard
                            key={city.slug}
                            name={city.name}
                            slug={city.slug}
                            eventCount={city.eventCount}
                          />
                        ))
                      ) : (
                        <p className="col-span-full text-center text-muted-foreground py-8">
                          No upcoming events in {region} yet. Check back soon!
                        </p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
            {/* Featured Calendars */}
            <section>
              <DiscoverSectionHeader
                title="Featured Calendars"
                actionLabel="View All"
                actionHref="/calendars"
                className="mb-4"
              />
              <div className="space-y-3">
                {calendars.slice(0, 5).map((calendar) => (
                  <CalendarRow
                    key={calendar.id}
                    id={calendar.id}
                    name={calendar.name}
                    slug={calendar.slug}
                    description={calendar.description}
                    avatarUrl={calendar.avatarUrl}
                    location={calendar.location || undefined}
                    isSubscribed={calendar.isSubscribed}
                    onSubscribe={() => handleSubscribe(calendar.id)}
                  />
                ))}
              </div>
            </section>

            {/* Quick Links / CTA */}
            <section className="rounded-xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Host an Event</h3>
                  <p className="text-sm text-muted-foreground">Share your knowledge</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Create and manage events for your community. Free for organizers.
              </p>
              <Button className="w-full" asChild>
                <Link href={`/${locale}/admin/events/new`}>
                  Create Event
                </Link>
              </Button>
            </section>

            {/* Desktop Filters */}
            <section className="hidden lg:block">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-4">
                {filterGroups.map((group) => (
                  <div key={group.id}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {group.label}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isActive = activeFilters[group.id]?.includes(option.value)
                        return (
                          <Button
                            key={option.value}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const currentValues = activeFilters[group.id] || []
                              const newValues = isActive
                                ? currentValues.filter((v) => v !== option.value)
                                : [...currentValues, option.value]
                              handleFilterChange(group.id, newValues)
                            }}
                            className="h-7 text-xs"
                          >
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                {Object.values(activeFilters).some((v) => v.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleClearFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainContainer>
  )
}
