'use client'

import { MainContainer } from "@/components/global/main-container"
import { Button } from "@/components/ui/button"

interface ChapterData {
  id: string
  name: string
  university: string
  city: string | null
  region: string | null
  instagram_url: string | null
}

export function ChapterHero({
  chapter,
  member_count,
}: {
  chapter: ChapterData
  member_count: number
}) {
  const initials = chapter.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="relative min-h-[50dvh] sm:min-h-[60dvh] lg:min-h-[70dvh] w-full overflow-hidden">
      {/* Background gradient instead of image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,100%,8%)] via-[hsl(260,80%,12%)] to-[hsl(340,60%,15%)]" />
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px] animate-pulse [animation-delay:1.5s]" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content */}
      <MainContainer className="absolute bottom-0 left-0 w-full p-6 sm:p-8 lg:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Chapter Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden border-4 border-background shadow-2xl shrink-0 gradient-luminescent flex items-center justify-center">
            <span className="fluid-h2 font-black text-white drop-shadow-lg">
              {initials}
            </span>
          </div>
          <div className="space-y-1.5">
            {/* Badge */}
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-primary/30">
                Official Chapter
              </span>
            </div>
            {/* Chapter Name */}
            <h1 className="fluid-h1 !font-extrabold tracking-tighter leading-none">
              {chapter.name}
            </h1>
            {/* Description */}
            <p className="fluid-caption text-muted-foreground max-w-lg leading-relaxed">
              {chapter.university}
              {chapter.city ? ` · ${chapter.city}` : ''}
              {chapter.region ? `, ${chapter.region}` : ''}
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-3 items-center">
              {chapter.instagram_url && (
                <a
                  href={chapter.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              <span className="text-xs text-muted-foreground/60">
                {member_count} member{member_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 shrink-0">
          <Button 
            size="lg"
            className="gradient-luminescent text-primary-foreground font-bold px-6 sm:px-8 py-3 rounded-full hover:shadow-[0_0_20px_rgba(255,139,154,0.4)] transition-all active:scale-95 flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Subscribe
          </Button>
          <Button 
            variant="outline"
            size="icon"
            className="bg-card/40 backdrop-blur-xl border border-border/30 text-foreground p-3 rounded-full hover:bg-card transition-colors"
            aria-label="Share"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </Button>
        </div>
      </MainContainer>
    </section>
  )
}
