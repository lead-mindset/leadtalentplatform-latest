import { FileText } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { getLocale } from 'next-intl/server'
import { termsContent } from '@/lib/legal/terms'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const c = termsContent[locale] ?? termsContent.en
  return { title: c.meta.title, description: c.meta.description }
}

export default async function TermsPage() {
  const locale = await getLocale()
  const c = termsContent[locale] ?? termsContent.en

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">

        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {c.badge}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{c.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{c.intro}</p>
        </div>

        <Separator className="mb-12" />

        <div className="space-y-10">
          {c.sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-3 text-xl font-semibold text-foreground">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
              {s.list && (
                <ul className="mt-3 space-y-2">
                  {s.list.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <Separator className="my-12" />
        <p className="text-center text-sm text-muted-foreground">
          LEAD Talent Platform · {c.badge}
        </p>
      </div>
    </main>
  )
}