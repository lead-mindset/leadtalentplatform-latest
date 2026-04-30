import { Suspense } from 'react'
import { Calendar, Compass, ArrowRight, Clock } from 'lucide-react'
import { getPublishedEvents } from '@/lib/actions/events/get-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/routing'
import { Navbar } from '../(public)/_components/navbar'
import { MainContainer } from '@/components/global/main-container'
import { SectionLabel } from '@/components/ui/section-label'
import type { EventWithDetails } from '@/lib/types'

export const metadata = {
  title: 'Events',
  description: 'Browse upcoming LEAD events and register online.',
}

function getMonthAbbr(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
}

function getDayNumber(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { day: '2-digit' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  })
}

async function EventsContent() {
  const events: EventWithDetails[] = await getPublishedEvents()

  return (
    <main className="min-h-screen bg-background flex-1 overflow-x-hidden">
      <MainContainer className="space-y-12 pb-24 py-4 md:py-8 lg:py-12">
        {/* Branding Header */}
        <div className="flex justify-center mb-8">
          <span className="fluid-h2 font-bold tracking-tighter text-foreground">
            LEAD Frontier
          </span>
        </div>

        {/* Hero Section */}
        <section className="relative min-h-[50dvh] sm:min-h-[60dvh] rounded-3xl overflow-hidden shadow-xl border">
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Hero background" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJoN_KSwpfvQSRl3-2jBNZsC_BrOzZEuAU5CFvtZFMN-h7BJLDW-oIA8MwrT8aSqxMfHZ0orVyHdxPCl-Vx7QJ5Jgf39tYM7eVmA5cZbGqsJD5hSIfNbXc_Be19QTLihhUYdJeeHa0nRT0tunNifWDbZXeoRdolPRmqLd6jxaYTDeZKr_YnWdg4ZqHUZUNj8Fov1DMPSv1XcsBkRcYPakSCAnA8OA_YOhHxTKEQ775ZksLYDmAKAPDnwDbFQU4co9kqjIn8_HjlnG7" 
            loading="eager"
            width={1200}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
            <SectionLabel variant="primary">FOR OUR COMMUNITY</SectionLabel>
            <h1 className="fluid-h1 text-foreground tracking-tighter mb-8 max-w-2xl">
              LEAD Events
            </h1>
            
            {/* Search Bar matching the Subscribe button style area */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg w-full">
              <Input
                type="text"
                placeholder="Search events..."
                className="h-14 px-6 rounded-full bg-background/50 backdrop-blur-sm border-primary/20 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-lg"
              />
              <Button size="lg" className="h-14 px-8 rounded-full font-bold shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:scale-105 transition-transform duration-200">
                Search
              </Button>
            </div>
          </div>
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Events List Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Upcoming Summits</h2>
              <Button variant="ghost" className="text-primary font-semibold hover:text-primary/80 transition-all text-sm flex items-center gap-2">
                <span>Full Calendar</span>
                <Calendar className="w-4 h-4" />
              </Button>
            </div>

            {/* Event Cards */}
            <div className="space-y-6">
              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center bg-card/40 backdrop-blur-sm">
                  <Compass className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No events found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check back soon for upcoming events in your area.
                  </p>
                </div>
              ) : (
                events.map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id} className="block group">
                    <div className="bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 border border-border shadow-sm group relative overflow-hidden">
                      
                      {/* Date Block */}
                      <div className="flex flex-col items-center justify-center bg-background rounded-2xl min-w-[100px] h-[100px] border shadow-md shrink-0">
                        <span className="text-primary font-bold text-xl uppercase">
                          {getMonthAbbr(event.start_at)}
                        </span>
                        <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                          {getDayNumber(event.start_at)}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                          <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(event.start_at)}
                          </span>
                          <span className="text-muted-foreground hidden sm:inline">•</span>
                          {event.chapter?.name && (
                            <span className="text-primary text-[10px] font-black px-2.5 py-1 bg-primary/10 rounded uppercase tracking-tighter truncate max-w-[150px]">
                              {event.chapter.name}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {event.title}
                        </h3>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                              {event.location?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <span className="text-muted-foreground text-sm truncate max-w-[150px] sm:max-w-xs">
                              Location <strong className="text-foreground font-medium">{event.location}</strong>
                            </span>
                          </div>
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center text-muted-foreground shrink-0">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Widgets Column */}
          <div className="space-y-8">
            {/* Calendar Widget (Static mock for design) */}
            <div className="bg-card/40 backdrop-blur-md rounded-2xl p-6 lg:p-8 border shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">This Month</h3>
                <Calendar className="text-primary w-5 h-5" />
              </div>
              <div className="grid grid-cols-7 gap-1 mb-6 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground font-bold py-2">{day}</div>
                ))}
                {/* Previous month filler */}
                {[28, 29, 30, 31].map((date) => (
                  <div key={`prev-${date}`} className="h-8 lg:h-10 flex items-center justify-center text-muted-foreground/50 text-xs lg:text-sm">{date}</div>
                ))}
                {/* Current month days */}
                {[...Array(10)].map((_, i) => (
                  <div key={`curr-${i+1}`} className={`h-8 lg:h-10 flex items-center justify-center text-xs lg:text-sm rounded-lg ${i + 1 === 7 ? 'text-primary-foreground font-bold bg-primary shadow-md' : i + 1 === 1 ? 'text-secondary-foreground font-bold bg-secondary' : 'text-foreground'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <p className="text-xs text-muted-foreground font-medium">19:00 — Chapter Mixer</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <p className="text-xs text-muted-foreground font-medium">15:00 — Resume Review</p>
                </div>
              </div>
            </div>

            {/* Map Widget */}
            <div className="bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden border shadow-lg">
              <div className="p-5 lg:p-6 bg-muted/50 border-b flex justify-between items-center">
                <h3 className="text-sm font-bold text-foreground">Global Presence</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full">
                  12 Chapters
                </span>
              </div>
              <div className="h-48 lg:h-56 relative bg-secondary/20">
                <img 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity dark:mix-blend-plus-lighter" 
                  alt="Chapter locations map" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuArIRLeyxI5WvcXCLKPAoww9_4m1oPZgt3ZpSexwiWclOTEHx8X9oraOuagjkTwY27NF_BkYdR40_Qb4HQk8mWMzUOAyD7BrLi9AKwRbyJb36HyBIhi9AZRrC0qrRjltYQriAT8voFEjiJ35nM5GedFpX-ai1LoHLZOaiUYp13emKCyRbABnp-ItYaXfBNHwapW6VLDsj-kDmREh9-Bt1pHPnCo6qrCpaN4Lifhiov71HHCzEF-2cVroyNVKGnMVixf7DYz5xvIGwCS" 
                />
                <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"></div>
                <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_rgba(var(--secondary),0.8)]"></div>
                <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"></div>
              </div>
              <div className="p-5 lg:p-6 space-y-4">
                <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-bold transition-all">
                  Find your local hub
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainContainer>
    </main>
  )
}

export default function EventsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading events...</div>}>
        <EventsContent />
      </Suspense>
    </div>
  )
}
