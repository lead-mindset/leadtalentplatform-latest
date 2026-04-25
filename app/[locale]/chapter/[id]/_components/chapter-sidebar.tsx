'use client'

import { useMemo } from 'react'

interface ChapterData {
  id: string
  name: string
  university: string
  city: string | null
  latitude: number | null
  longitude: number | null
}

function CalendarWidget() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1 // Monday-start

  const prevMonthDays = new Date(year, month, 0).getDate()
  const cells: { day: number; current: boolean }[] = []

  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true })
  }

  return (
    <div className="bg-card rounded-[2rem] p-6 sm:p-8 border border-border/20 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">{monthName}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">
        <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
        {cells.slice(0, 35).map((cell, i) => {
          const isToday = cell.current && cell.day === today
          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-full text-xs sm:text-sm ${
                !cell.current
                  ? 'text-muted-foreground/25'
                  : isToday
                  ? 'gradient-luminescent text-white font-black shadow-lg'
                  : 'text-foreground hover:bg-muted cursor-pointer'
              }`}
            >
              {cell.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatsWidget({
  memberCount,
  pastEventsCount,
  upcomingEventsCount,
}: {
  memberCount: number
  pastEventsCount: number
  upcomingEventsCount: number
}) {
  const stats = [
    { label: 'Members', value: memberCount, color: 'text-primary' },
    { label: 'Past Events', value: pastEventsCount, color: 'text-accent' },
    { label: 'Upcoming', value: upcomingEventsCount, color: 'text-[#00d4aa]' },
  ]

  return (
    <div className="bg-card rounded-[2rem] p-6 sm:p-8 border border-border/20 shadow-xl">
      <h3 className="text-lg font-bold mb-6">Chapter Stats</h3>
      <div className="space-y-5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LocationWidget({ chapter }: { chapter: ChapterData }) {
  return (
    <div className="bg-card rounded-[2rem] overflow-hidden border border-border/20 shadow-xl">
      <div className="p-6 sm:p-8 border-b border-border/15">
        <h3 className="text-lg font-bold mb-1">Location</h3>
        <p className="text-xs text-muted-foreground font-medium">{chapter.university}</p>
      </div>
      {/* Map placeholder */}
      <div className="h-48 relative bg-gradient-to-br from-muted to-card">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-4 h-4 bg-primary rounded-full relative z-10 shadow-[0_0_10px_var(--primary)]" />
            <div className="absolute inset-0 w-4 h-4 bg-primary rounded-full animate-ping opacity-75" />
          </div>
        </div>
        {chapter.city && (
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-md px-4 py-2 rounded-full border border-border/20 shadow-xl">
            <span className="text-[10px] font-bold text-foreground">{chapter.city}</span>
          </div>
        )}
      </div>
      {chapter.latitude && chapter.longitude && (
        <div className="p-6 sm:p-8">
          <a
            href={`https://www.google.com/maps?q=${chapter.latitude},${chapter.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-muted rounded-full border border-border/20 flex items-center justify-center gap-2 text-sm font-bold hover:bg-card transition-colors"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Get Directions
          </a>
        </div>
      )}
    </div>
  )
}

export function ChapterSidebar({
  chapter,
  memberCount,
  pastEventsCount,
  upcomingEventsCount,
}: {
  chapter: ChapterData
  memberCount: number
  pastEventsCount: number
  upcomingEventsCount: number
}) {
  return (
    <>
      <CalendarWidget />
      <StatsWidget
        memberCount={memberCount}
        pastEventsCount={pastEventsCount}
        upcomingEventsCount={upcomingEventsCount}
      />
      <LocationWidget chapter={chapter} />
    </>
  )
}
