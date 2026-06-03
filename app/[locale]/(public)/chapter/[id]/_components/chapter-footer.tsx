'use client'

import Link from 'next/link'

interface ChapterData {
  name: string
  university: string
  instagram_url: string | null
}

export function ChapterFooter({ chapter }: { chapter: ChapterData }) {
  return (
    <footer className="bg-background w-full py-12 sm:py-16 px-6 sm:px-8 border-t border-border/15">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="space-y-3">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tighter">
            {chapter.name}
          </span>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {chapter.university}
          </p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm font-medium">
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
              Recursos
            </p>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Politica de privacidad
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terminos de servicio
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">
              Soporte
            </p>
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Contactanos
            </Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
        </div>

        <div className="flex gap-4">
          {chapter.instagram_url && (
            <a
              href={chapter.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-card flex items-center justify-center hover:bg-primary/20 transition-all text-muted-foreground hover:text-primary border border-border/15"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          )}
          <a
            href={`mailto:contact@${chapter.name.toLowerCase().replace(/\s+/g, '')}.org`}
            className="w-12 h-12 rounded-full bg-card flex items-center justify-center hover:bg-accent/20 transition-all text-muted-foreground hover:text-accent border border-border/15"
            aria-label="Email"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 sm:mt-16 pt-8 border-t border-border/5 text-center text-xs text-muted-foreground/40 font-medium">
        © {new Date().getFullYear()} {chapter.name}. Empowering Leadership Excellence.
      </div>
    </footer>
  )
}
