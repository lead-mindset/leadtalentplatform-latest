import Image from "next/image";
import { useTranslations } from 'next-intl';

export default function MaintenancePage() {
  const t = useTranslations('common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-5%,oklch(0.59_0.22_1_/_0.14),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_110%,oklch(0.59_0.22_1_/_0.05),transparent_70%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.18] dark:opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" className="text-border" />
            </pattern>
            <radialGradient id="fade" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridmask">
              <rect width="100%" height="100%" fill="url(#fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridmask)" />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="flex h-[80px] w-[80px] items-center justify-center rounded-[20px] border border-border/50 bg-card/60 shadow-xl shadow-black/8 backdrop-blur-sm">
            <Image
              src="/leadl2.svg"
              alt="LEAD Americas"
              width={52}
              height={52}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <h1 className="mb-6 text-[3rem] sm:text-[4rem] font-bold tracking-[-0.03em] text-foreground">
          We're Building{' '}
          <span className="bg-gradient-to-b from-primary to-primary/50 bg-clip-text text-transparent">
            Something Amazing
          </span>
        </h1>

        <p className="mb-4 text-lg text-muted-foreground max-w-md mx-auto">
          LEAD Frontier is getting a major upgrade. We'll be back soon with an even better experience.
        </p>

        <p className="text-sm text-muted-foreground/70">
          Estamos trabajando en algo increíble. Volvemos pronto con una experiencia aún mejor.
        </p>

        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Under Construction</span>
          </div>
        </div>
      </div>
    </main>
  );
}
