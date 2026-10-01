import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { socials } from "@/lib/data/profile";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M5.04 15.3a2.53 2.53 0 1 1-5.04 0c0-1.4 1.13-2.53 2.52-2.53h2.52v2.53zm1.26 0a2.53 2.53 0 1 1 5.04 0v6.32a2.53 2.53 0 1 1-5.04 0v-6.32zM8.7 5.04a2.53 2.53 0 1 1 0-5.04c1.4 0 2.53 1.13 2.53 2.52v2.52H8.7zm0 1.26a2.53 2.53 0 1 1 0 5.04H2.38a2.53 2.53 0 1 1 0-5.04h6.32zM18.96 8.7a2.53 2.53 0 1 1 5.04 0 2.53 2.53 0 0 1-2.52 2.53h-2.52V8.7zm-1.26 0a2.53 2.53 0 1 1-5.04 0V2.38a2.53 2.53 0 1 1 5.04 0v6.32zM15.3 18.96a2.53 2.53 0 1 1 0 5.04c-1.4 0-2.53-1.13-2.53-2.52v-2.52h2.53zm0-1.26a2.53 2.53 0 1 1 0-5.04h6.32a2.53 2.53 0 1 1 0 5.04H15.3z" />
    </svg>
  );
}

const icons = [InstagramIcon, LinkedinIcon, SlackIcon];

export function SocialsCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 font-semibold">Síguenos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 p-(--card-spacing) pt-1">
        <p className="mb-3 text-small text-muted-foreground">
          Conecta con LEAD y entérate de oportunidades, eventos y comunidad.
        </p>
        {socials.map((social, i) => {
          const Icon = icons[i % icons.length];
          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-brand-purple group-hover:text-primary-foreground">
                <Icon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium leading-tight">{social.name}</span>
                <span className="block truncate text-small text-muted-foreground">{social.handle}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-purple-light" />
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}