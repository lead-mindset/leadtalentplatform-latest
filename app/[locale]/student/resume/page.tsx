import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'
import Link from 'next/link'
import { Icons } from '@/components/ui/icons'
import { MainContainer } from '@/components/global/main-container'

export default async function StudentResumePage() {
  const resume = await getCurrentUserResume()

  return (
    <main className="flex-1 min-h-screen">
      <div className="relative border-b border-border bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <MainContainer className="py-10 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                  <Icons.FileText className="h-3.5 w-3.5" />
                  Resume Center
                </span>
              </div>
              <h1 className="fluid-h1 text-foreground">
                Resume Management
              </h1>
              <p className="fluid-body text-muted-foreground max-w-2xl">
                Showcase your potential to partner companies with your latest professional profile.
              </p>
            </div>

            {resume && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 w-fit shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Resume Live
                </span>
              </div>
            )}
          </div>
        </MainContainer>
      </div>

      <MainContainer className="py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 xl:items-start">

          <div className="xl:col-span-8">
            <ResumeClient resume={resume} onUpload={uploadResume} />
          </div>

          <aside className="xl:col-span-4 xl:sticky xl:top-6 space-y-5">

            <div className="rounded-2xl border border-primary/20 bg-card shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Icons.Crown className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">Pro-Tips</h3>
                </div>
                <ul className="space-y-3.5">
                  {[
                    'Use strong action verbs to lead your bullet points.',
                    'Keep your layout clean and limited to 1 page.',
                    'Quantify your impact with metrics and percentages.',
                    'Tailor your skills section to specific job descriptions.',
                  ].map((tip) => (
                    <li key={tip} className="flex gap-3">
                      <Icons.CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Icons.BookOpen className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="font-bold text-base text-foreground">Quick Resources</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'STEM Resume Template', icon: 'FileText' as const },
                  { label: 'Action Verbs Guide', icon: 'BookOpen' as const },
                ].map(({ label, icon }) => {
                  const IconComponent = Icons[icon]
                  return (
                    <Link
                      key={label}
                      href="#"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <Icons.ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-6 text-white shadow-lg shadow-primary/25 overflow-hidden relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                    <Icons.TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-0.5">Boost Your Reach</h4>
                    <p className="text-xs text-white/70">Keep your profile fresh</p>
                  </div>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  A fresh resume increases your profile visibility by{' '}
                  <span className="font-bold text-white">40%</span>. Update yours today to stay
                  ahead of the competition.
                </p>
              </div>
            </div>

          </aside>
        </div>
      </MainContainer>
    </main>
  )
}
